// exemplo: src/lib/api.ts
export async function sendChat(messages: Array<{ role: string; content: string }>) {
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ message: await resp.text() }));
    throw new Error(err?.error || err?.message || 'API error');
  }

  return resp.json();
}
