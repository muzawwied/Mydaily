// Proxy chat AI untuk My Daily (Cloudflare Pages Function).
// Kunci API disimpan sebagai environment variable di project Pages,
// TIDAK pernah dikirim ke browser. Browser hanya bicara ke endpoint ini.

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const MAX_TOKENS = 1400;
const MAX_MESSAGES = 24;
const MAX_CHARS = 4000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const key = String(env.GROQ_API_KEY || '').trim();
  if (!key) return json({ error: 'Layanan chat belum siap. Coba lagi nanti.' }, 503);

  let body = null;
  try {
    const len = parseInt(request.headers.get('content-length') || '0', 10);
    if (len > 128 * 1024) return json({ error: 'Pesan terlalu panjang.' }, 413);
    body = await request.json();
  } catch (e) {
    return json({ error: 'Format permintaan tidak valid.' }, 400);
  }

  const system = String(body && body.system ? body.system : '').slice(0, MAX_CHARS);
  const incoming = Array.isArray(body && body.messages) ? body.messages : [];
  const chat = incoming
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (chat.length && chat[0].role !== 'user') chat.shift();
  if (!chat.length) return json({ error: 'Pesan kosong.' }, 400);

  const payload = {
    model: MODEL,
    messages: system ? [{ role: 'system', content: system }, ...chat] : chat,
    max_completion_tokens: Math.min(Number(body && body.max_tokens) || MAX_TOKENS, MAX_TOKENS),
    temperature: 0.7,
  };

  let upstream = null;
  try {
    upstream = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45000),
    });
  } catch (e) {
    return json({ error: 'Chat sedang tidak bisa dihubungi. Coba lagi sebentar.' }, 502);
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const msg = upstream.status === 429
      ? 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'
      : 'Chat sedang gangguan. Coba lagi sebentar.';
    return json({ error: msg }, 502);
  }

  const text = String((data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
  if (!text) return json({ error: 'Balasan kosong. Coba kirim ulang.' }, 502);

  // Format respons mengikuti yang sudah dibaca klien (blok content).
  return json({ content: [{ type: 'text', text }], text });
}
