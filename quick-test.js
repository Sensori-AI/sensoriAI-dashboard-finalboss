// quick-test.js
const key = process.env.OPENROUTER_API_KEY;
(async () => {
  try {
    console.log("OPENROUTER_API_KEY present?", !!key);
    const res = await fetch("https://api.openrouter.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key || "NO_KEY"}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
      }),
    });
    console.log("status", res.status);
    const txt = await res.text();
    console.log("body (first 1000 chars):", txt.slice(0, 1000));
  } catch (err) {
    console.error("fetch error (quick-test):", err && err.stack ? err.stack : err);
  }
})();
