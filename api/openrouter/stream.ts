// api/openrouter/stream.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const OPENROUTER_URL = "https://api.openrouter.ai/v1/chat/completions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OPENROUTER_API_KEY not set");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    // basic validation
    const body = req.body ?? {};
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: "messages (array) required in body" });
    }

    // Ensure the upstream receives a streaming instruction
    const upstreamPayload = {
      ...body,
      stream: true, // request streaming from upstream
    };

    // Forward request to OpenRouter
    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamPayload),
    });

    // If upstream returned non-2xx, forward the message
    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("Upstream error:", upstream.status, text);
      return res.status(upstream.status).send(text);
    }

    // Stream response to client as-is (text/event-stream)
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    // optional: allow CORS for your frontend domain(s) if needed
    // res.setHeader("Access-Control-Allow-Origin", "*");

    const reader = upstream.body?.getReader();
    if (!reader) {
      // fallback: send full response
      const txt = await upstream.text();
      res.write(txt);
      return res.end();
    }

    const decoder = new TextDecoder();
    let finished = false;

    // Helper to flush chunk to client
    const flushChunk = (chunkStr: string) => {
      // write raw chunk; client extractor is robust
      try {
        res.write(chunkStr);
      } catch (e) {
        // ignore write errors (client disconnected)
      }
    };

    while (!finished) {
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
        break;
      }
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        // forward chunk exactly (OpenRouter often sends SSE-like lines or JSON fragments)
        flushChunk(chunk);
      }
    }

    // Close connection cleanly
    try { res.end(); } catch {}
  } catch (err: any) {
    console.error("Error in /api/openrouter/stream:", err);
    try {
      res.status(500).json({ error: "Internal server error" });
    } catch {}
  }
}
