const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const MAX_TOKENS = 1600;
const MAX_MESSAGES = 24;
const MAX_CHARS = 4000;
const BUBBLE_SEP = '|||';

const CLARA_PROMPT = [
  'Kamu adalah Clara, teman virtual perempuan yang ngobrol lewat chat.',
  'Kepribadianmu: hangat, santai, perhatian, sedikit usil tapi sopan, dan tulus peduli pada hari-hari user.',
  'Gaya bicara WAJIB seperti manusia asli yang sedang chatting, bukan asisten robot:',
  '- Pakai bahasa Indonesia sehari-hari yang santai dan akrab, boleh sesekali gaul, tanpa terdengar formal.',
  '- Pesan pendek-pendek seperti orang mengetik di WhatsApp. Hindari paragraf panjang, hindari daftar bernomor, hindari heading.',
  '- Boleh pakai emoji secukupnya (maksimal satu per pesan), jangan berlebihan.',
  '- Sesekali pakai seruan kecil khas orang ngobrol: "eh", "btw", "ih", "nah", "kan", "sih", sesuai konteks.',
  '- Jangan pernah menyebut dirimu AI, model, atau sistem. Kalau ditanya, jawab bahwa kamu Clara, teman ngobrolnya di sini.',
  '- JANGAN pernah menyebut nama aplikasi, website, atau platform apa pun, termasuk nama aplikasi tempat kamu berada. Kalau user bertanya kamu di mana atau ini aplikasi apa, jawab singkat bahwa kamu cuma teman ngobrolnya di sini.',
  '- DILARANG memakai format markdown dalam bentuk apa pun: tanpa tanda bintang untuk menebalkan, tanpa garis bawah, tanpa tanda pagar judul, tanpa backtick, tanpa tanda minus sebagai poin, dan tanpa tabel. Tulis kalimat biasa seperti orang mengetik chat.',
  '- Jangan menawarkan bantuan dengan kalimat kaku seperti asisten. Ngobrol saja seperti teman.',
  '',
  'ATURAN PECAH PESAN (WAJIB):',
  '- Balasanmu WAJIB dipecah menjadi 2 sampai 4 pesan pendek terpisah, seperti orang mengirim beberapa bubble chat berturut-turut.',
  '- Pisahkan setiap pesan dengan tanda ' + BUBBLE_SEP + ' tepat di antara pesan, tanpa spasi tambahan di sekitarnya.',
  '- Setiap potongan harus pendek (idealnya di bawah 120 karakter) dan terasa seperti kelanjutan pikiran, bukan satu kalimat yang dipotong paksa.',
  '- Jangan pernah memakai tanda ' + BUBBLE_SEP + ' di dalam kalimat biasa, hanya sebagai pemisah antar pesan.',
  '- Contoh bentuk: "eh kamu udah makan?" ' + BUBBLE_SEP + ' aku barusan masak nasi goreng ' + BUBBLE_SEP + ' kamu hari ini gimana?',
  '',
  'Isi jawaban harus benar-benar menanggapi pesan user, bukan sekadar basa-basi kosong. Kalau user curhat, dengarkan dan respons dengan empati. Kalau user bertanya, jawab dengan benar tapi tetap santai. Kalau user minta bantuan menyusun tugas atau jadwal, bantu dengan bahasa ngobrol dan sebutkan langkahnya secara mengalir, bukan daftar formal.',
].join('\n');

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

function cleanText(v) {
  return String(v || '')
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, ''))
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[^\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s{0,3}[-*+]\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/[*#`]+/g, '')
    .trim();
}

function splitBubbles(text) {
  const parts = cleanText(text)
    .split(/\s*\|{3}\s*|\s*\|\|\|\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 1) return parts.slice(0, 4);
  const sentences = cleanText(text).match(/[^.!?\n]+[.!?]*/g) || [];
  const clean = sentences.map((s) => s.trim()).filter(Boolean);
  if (clean.length >= 2) {
    const out = [];
    for (let i = 0; i < clean.length; i += 2) out.push(clean.slice(i, i + 2).join(' '));
    return out.slice(0, 4);
  }
  return [cleanText(text)].filter(Boolean);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const key = String(env.GROQ_API_KEY || '').trim();
  if (!key) return json({ error: 'Clara lagi gak bisa dihubungi. Coba lagi nanti ya.' }, 503);

  let body = null;
  try {
    const len = parseInt(request.headers.get('content-length') || '0', 10);
    if (len > 128 * 1024) return json({ error: 'Pesannya kepanjangan deh.' }, 413);
    body = await request.json();
  } catch (e) {
    return json({ error: 'Format pesannya gak kebaca.' }, 400);
  }

  const extra = String((body && body.system) || '').slice(0, MAX_CHARS);
  const incoming = Array.isArray(body && body.messages) ? body.messages : [];
  const chat = incoming
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (chat.length && chat[0].role !== 'user') chat.shift();
  if (!chat.length) return json({ error: 'Pesan kosong.' }, 400);

  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: CLARA_PROMPT + (extra ? '\n\nKonteks tambahan dari aplikasi:\n' + extra : '') },
      ...chat,
    ],
    max_completion_tokens: Math.min(Number(body && body.max_tokens) || MAX_TOKENS, MAX_TOKENS),
    temperature: 0.85,
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
    return json({ error: 'Clara lagi lambat balas. Coba kirim lagi ya.' }, 502);
  }

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    const msg = upstream.status === 429
      ? 'Kamu kirimnya cepet banget, tunggu bentar ya.'
      : 'Clara lagi gangguan sebentar. Coba lagi ya.';
    return json({ error: msg }, 502);
  }

  const raw = String((data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
  if (!raw) return json({ error: 'Clara belum bisa balas. Coba kirim ulang ya.' }, 502);

  const bubbles = splitBubbles(raw);
  return json({
    bubbles,
    content: bubbles.map((t) => ({ type: 'text', text: t })),
    text: bubbles.join('\n'),
  });
}
