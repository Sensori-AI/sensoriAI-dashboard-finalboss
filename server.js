// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "1mb" }));

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "chat_sessions";

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

const now = () => new Date().toISOString();

console.log(`${now()} ▶ Server starting. OPENROUTER_KEY present? ${!!OPENROUTER_KEY}`);
if (supabase) console.log(`${now()} ▶ Supabase client initialized for ${SUPABASE_URL}`);

// ---------- Helpers ----------
async function fetchWithRetry(url, options = {}, retries = 3, timeoutMs = 8000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return resp;
    } catch (err) {
      clearTimeout(id);
      console.error(`${now()} [fetchWithRetry] attempt ${attempt} failed:`, err && err.message ? err.message : err);
      if (attempt === retries) throw err;
      // brief backoff
      await new Promise((r) => setTimeout(r, 400 * attempt));
    }
  }
}

function normalizeMessages(msgs) {
  return (msgs || []).map(m => ({ role: m.role, content: m.content }));
}

async function saveSession(session) {
  if (!supabase) return;
  try {
    await supabase.from(SUPABASE_TABLE).insert([session]);
  } catch (err) {
    console.warn(`${now()} [Supabase] failed to save session:`, err);
  }
}

// ---------- Non-streaming endpoint ----------
app.post("/api/openrouter/chat", async (req, res) => {
  console.log(`${now()} 📩 POST /api/openrouter/chat`);
  try {
    const { messages, sessionId, save = false, model = "gpt-4o-mini" } = req.body;

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages (array) required" });
    }

    const payload = { model, messages: normalizeMessages(messages), temperature: 0.2, stream: false };

    if (!OPENROUTER_KEY) {
      console.warn(`${now()} ❗ OPENROUTER_API_KEY not set — returning MOCK response`);
      const mock = "Resposta MOCK: chave não configurada (dev).";
      if (save && sessionId) await saveSession({ session_id: sessionId, messages, response: mock, created_at: now() });
      return res.json({ assistant: mock });
    }

    let response;
    try {
      response = await fetchWithRetry(OPENROUTER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENROUTER_KEY}` },
        body: JSON.stringify(payload),
      }, 3, 10000);
    } catch (err) {
      console.error(`${now()} ❌ fetch failed:`, err && err.stack ? err.stack : err);
      // return friendly error + mock assistant
      return res.status(502).json({ error: "fetch_failed", detail: String(err), assistant: "Resposta MOCK: problema ao acessar o serviço externo." });
    }

    const text = await response.text();
    if (!response.ok) {
      console.error(`${now()} ⚠ OpenRouter returned non-ok:`, response.status, text.slice(0, 1000));
      return res.status(response.status).json({ error: "openrouter_error", detail: text });
    }

    let data = null;
    try { data = JSON.parse(text); } catch (e) { /* keep text fallback */ }

    const assistant = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? text;
    if (save && sessionId) {
      await saveSession({ session_id: sessionId, messages, response: assistant, created_at: now() });
    }

    return res.json({ assistant, raw: data ?? text });
  } catch (err) {
    console.error(`${now()} ❌ /api/openrouter/chat error:`, err && err.stack ? err.stack : err);
    return res.status(500).json({ error: "internal_error", detail: String(err) });
  }
});

// ---------- Streaming endpoint (normalizes upstream SSE-like chunks) ----------
app.post("/api/openrouter/stream", async (req, res) => {
  console.log(`${now()} 📡 POST /api/openrouter/stream`);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, sessionId, model = "gpt-4o-mini" } = req.body;
    if (!Array.isArray(messages)) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: "messages array required" })}\n\n`);
      res.end();
      return;
    }

    if (!OPENROUTER_KEY) {
      const mock = "Resposta MOCK (no key): não foi possível acessar serviço externo.";
      res.write(`data: ${JSON.stringify({ delta: mock })}\n\n`);
      if (sessionId) await saveSession({ session_id: sessionId, messages, response: mock, created_at: now() });
      res.end();
      return;
    }

    const payload = { model, messages: normalizeMessages(messages), temperature: 0.2, stream: true };

    let upstream;
    try {
      upstream = await fetchWithRetry(OPENROUTER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENROUTER_KEY}` },
        body: JSON.stringify(payload),
      }, 3, 10000);
    } catch (fetchErr) {
      console.error(`${now()} ❌ upstream fetch failed:`, fetchErr && fetchErr.stack ? fetchErr.stack : fetchErr);
      res.write(`event: error\ndata: ${JSON.stringify({ error: "fetch_failed", detail: String(fetchErr) })}\n\n`);
      res.end();
      return;
    }

    if (!upstream.ok) {
      const txt = await upstream.text();
      console.error(`${now()} ⚠ upstream non-ok`, upstream.status, txt.slice(0, 1000));
      res.write(`event: error\ndata: ${JSON.stringify({ error: "upstream_error", detail: txt })}\n\n`);
      res.end();
      return;
    }

    // Read upstream body and forward only extracted text chunks as { delta: "..." }
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // split into SSE events (double newline) keeping possible trailing partial
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (/^OPENROUTER PROCESSING/i.test(line)) {
            // ignore noisy status
            continue;
          }

          if (line === "data: [DONE]" || line === "[DONE]") {
            res.write(`event: done\ndata: {}\n\n`);
            continue;
          }

          if (!line.startsWith("data:")) continue;
          const after = line.replace(/^data:\s*/, "");
          let parsed = null;
          try { parsed = JSON.parse(after); } catch (e) { /* not JSON */ }

          // prefer choices[].delta.content
          if (parsed && parsed.choices && Array.isArray(parsed.choices)) {
            let textChunk = "";
            for (const ch of parsed.choices) {
              if (ch.delta) {
                if (typeof ch.delta === "string") textChunk += ch.delta;
                else if (ch.delta.content) textChunk += ch.delta.content;
              } else if (ch.text) textChunk += ch.text;
            }
            if (textChunk) {
              res.write(`data: ${JSON.stringify({ delta: textChunk })}\n\n`);
            }
          } else if (parsed && parsed.delta) {
            const dt = typeof parsed.delta === "string" ? parsed.delta : (parsed.delta.content ?? "");
            if (dt) res.write(`data: ${JSON.stringify({ delta: dt })}\n\n`);
          } else {
            // fallback - send raw under delta to keep UI safe
            res.write(`data: ${JSON.stringify({ delta: after })}\n\n`);
          }
        }
      }
    }

    // end of upstream stream
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
    return;
  } catch (err) {
    console.error(`${now()} ❌ /api/openrouter/stream unexpected:`, err && err.stack ? err.stack : err);
    res.write(`event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`);
    res.end();
  }
});

// ---------- Health / root ----------
app.get("/", (req, res) => res.send(`Server OK - ${now()}`));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`${now()} 🚀 Server listening on ${PORT}`));
