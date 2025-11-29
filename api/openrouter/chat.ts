// api/openrouter/chat.ts
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

    const body = req.body ?? {};
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: "messages (array) required in body" });
    }

    // Ensure we do NOT request streaming here
    const upstreamPayload = {
      ...body,
      stream: false,
    };

    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamPayload),
    });

    const text = await upstream.text();

    // Try to parse JSON, otherwise return raw text
    try {
      const json = JSON.parse(text);
      return res.status(upstream.status).json(json);
    } catch {
      return res.status(upstream.status).send(text);
    }
  } catch (err: any) {
    console.error("Error in /api/openrouter/chat:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
