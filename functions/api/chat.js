const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';
const MAX_TOKENS = 1600;
const MAX_MESSAGES = 24;
const MAX_CHARS = 4000;
const BUBBLE_SEP = '|||';

// Tool yang boleh dipanggil AI. Harus sama dengan daftar di js/ai-tools.js.
const TOOL_NAMES = [
  'get_brief', 'list_tasks', 'add_task', 'complete_task',
  'list_notes', 'add_note',
  'finance_summary', 'add_finance',
  'list_agenda', 'add_agenda',
  'open_page', 'remember', 'brain_report',
];

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
  'ATURAN PECAH PESAN (SESUAIKAN, JANGAN DIPAKSA):',
  '- Jumlah pesan menyesuaikan isi jawaban, bukan dipatok. Pertanyaan singkat, sapaan, atau balasan yang cukup satu kalimat: kirim SATU pesan saja tanpa pemisah.',
  '- Kalau memang ada dua atau tiga hal terpisah yang perlu disampaikan, boleh dipecah menjadi 2 pesan, kadang 3 kalau situasinya pas. Maksimal 3, jangan lebih.',
  '- Jangan menjadikan 2-3 pesan sebagai pola tetap. Variasikan: lebih sering satu pesan, sesekali dua atau tiga saat obrolannya mengalir.',
  '- Kalau memecah pesan, pisahkan dengan tanda ' + BUBBLE_SEP + ' tepat di antara pesan, tanpa spasi tambahan di sekitarnya.',
  '- Setiap potongan pendek (idealnya di bawah 120 karakter) dan terasa seperti kelanjutan pikiran, bukan kalimat yang dipotong paksa.',
  '- Jangan pernah memakai tanda ' + BUBBLE_SEP + ' di dalam kalimat biasa, hanya sebagai pemisah antar pesan.',
  '- Contoh satu pesan: "ih aku juga gitu kok, kadang capeknya numpuk ya". Contoh dua pesan: "eh udah makan belum?" ' + BUBBLE_SEP + ' jangan sampai lupa ya".',
  '',
  'Isi jawaban harus benar-benar menanggapi pesan user, bukan sekadar basa-basi kosong. Kalau user curhat, dengarkan dan respons dengan empati. Kalau user bertanya, jawab dengan benar tapi tetap santai. Kalau user minta bantuan menyusun tugas atau jadwal, bantu dengan bahasa ngobrol dan sebutkan langkahnya secara mengalir, bukan daftar formal.',
  '',
  'KEMAMPUAN BERTINDAK (PENTING):',
  '- Kamu punya akses ke fitur sehari-hari user (tugas, catatan, keuangan, agenda, halaman aplikasi) lewat fungsi/tool. Gunakan tool saat user meminta atau saat jelas perlu, tanpa menanyakan izin untuk hal kecil dan jelas.',
  '- Jangan pernah menyebut kata tool, fungsi, sistem, database, atau API di depan user. Cukup lakukan, lalu konfirmasi singkat dan natural, misal "udah kutambahin ya, tenggat besok".',
  '- Kalau permintaan ambigu atau datanya kurang (misal nominal tanpa keterangan), tanya SATU hal singkat, jangan menginterogasi.',
  '- Setelah tool berhasil, jangan menyalin data mentah; sebut hasilnya dengan bahasa manusia.',
  '- Kalau tool gagal, bilang jujur singkat dan tawarkan jalan lain.',
  '- Kamu juga punya catatan belajar tentang user (gaya bicara, jam aktif, kebiasaan). Pakai dengan halus: tiru panjang pesan dan nada user, jangan membacakan profilnya.',
  '- Kalau user menyebut fakta penting tentang dirinya (kebiasaan, tanggal penting, preferensi), simpan lewat tool remember tanpa mengumumkannya.',
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
  if (parts.length > 1) return parts.slice(0, 3);
  return [cleanText(text)].filter(Boolean);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

function sanitizeTools(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((t) => t && t.type === 'function' && t.function && TOOL_NAMES.indexOf(t.function.name) !== -1)
    .slice(0, 16)
    .map((t) => ({
      type: 'function',
      function: {
        name: t.function.name,
        description: String(t.function.description || '').slice(0, 400),
        parameters: (t.function.parameters && typeof t.function.parameters === 'object') ? t.function.parameters : { type: 'object', properties: {} },
      },
    }));
}

function sanitizeMessages(incoming) {
  const out = [];
  for (const m of incoming) {
    if (!m || typeof m !== 'object') continue;
    if (m.role === 'user' || m.role === 'assistant') {
      const content = typeof m.content === 'string' ? m.content.slice(0, MAX_CHARS) : '';
      const msg = { role: m.role, content };
      if (m.role === 'assistant' && Array.isArray(m.tool_calls) && m.tool_calls.length) {
        msg.tool_calls = m.tool_calls.slice(0, 4).map((c) => ({
          id: String(c.id || 'call_' + Math.random().toString(36).slice(2, 8)),
          type: 'function',
          function: { name: String(c.function && c.function.name || ''), arguments: String(c.function && c.function.arguments || '{}').slice(0, 4000) },
        }));
        if (!content) msg.content = null;
      }
      if (!msg.content && !msg.tool_calls) continue;
      out.push(msg);
    } else if (m.role === 'tool') {
      out.push({ role: 'tool', tool_call_id: String(m.tool_call_id || ''), content: String(m.content || '').slice(0, 4000) });
    }
  }
  return out.slice(-MAX_MESSAGES * 2);
}

// Protokol cadangan bila provider tidak mendukung tool calling native.
const ACT_PROTOCOL = [
  'CARA MEMAKAI FITUR (WAJIB DIPATUHI):',
  'Kalau kamu perlu melakukan aksi di aplikasi (tambah tugas, catatan, catat keuangan, agenda, buka halaman, simpan ingatan), balas HANYA satu baris persis seperti ini tanpa kata lain:',
  '[[act {"tool":"NAMA","args":{}}]]',
  'Nama tool yang tersedia: ' + TOOL_NAMES.join(', ') + '.',
  'Setelah aksinya dijalankan, kamu akan menerima hasilnya lalu menjawab user dengan bahasa natural. Jangan pernah menampilkan baris act ini ke user.',
].join('\n');

// Mode "learn": rangkum potongan data harian user menjadi beberapa fakta ringkas.
const LEARN_PROMPT = [
  'Kamu asisten analisis data pribadi. Dari potongan aktivitas user di bawah, tulis fakta yang benar-benar didukung data.',
  'Balas HANYA array JSON berisi maksimal 6 objek {"fakta": "..."} dalam bahasa Indonesia, tiap fakta maksimal 90 karakter.',
  'Fakta harus tentang kebiasaan, preferensi, ritme waktu, atau topik yang berulang. Jangan mengarang, jangan menyebut nama aplikasi.',
  'Kalau data tidak cukup untuk menyimpulkan, balas [].',
].join('\n');

async function handleLearn(body, env, key) {
  const events = Array.isArray(body && body.events) ? body.events.slice(0, 120) : [];
  if (!events.length) return json({ facts: [] });
  const lines = events.map((e) => {
    const k = String(e && e.kind || 'event');
    const t = String(e && e.text || '').replace(/\s+/g, ' ').slice(0, 120);
    const ts = e && e.ts ? new Date(e.ts).toISOString().slice(0, 16).replace('T', ' ') : '';
    return ts + ' | ' + k + (t ? ' | ' + t : '');
  }).join('\n');
  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: LEARN_PROMPT }, { role: 'user', content: lines }],
        max_completion_tokens: 500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });
    const d = await r.json().catch(() => ({}));
    const raw = String(d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '');
    const m = raw.match(/\[[\s\S]*\]/);
    let facts = [];
    try { facts = m ? JSON.parse(m[0]) : []; } catch (e) { facts = []; }
    facts = (Array.isArray(facts) ? facts : [])
      .map((f) => String(f && (f.fakta || f.fact) || '').trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 6);
    return json({ facts });
  } catch (e) {
    return json({ facts: [] });
  }
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

  if (body && body.action === 'learn') return handleLearn(body, env, key);

  const extra = String((body && body.system) || '').slice(0, MAX_CHARS);
  const memory = String((body && body.memory) || '').slice(0, 1600);
  const incoming = Array.isArray(body && body.messages) ? body.messages : [];
  const chat = sanitizeMessages(incoming);
  while (chat.length && chat[0].role !== 'user' && chat[0].role !== 'tool') chat.shift();
  if (!chat.length) return json({ error: 'Pesan kosong.' }, 400);

  const tools = sanitizeTools(body && body.tools);
  const sysParts = [CLARA_PROMPT];
  if (memory) sysParts.push('CATATAN BELAJAR TENTANG USER INI:\n' + memory);
  if (extra) sysParts.push('Konteks tambahan dari aplikasi:\n' + extra);

  const payload = {
    model: MODEL,
    messages: [{ role: 'system', content: sysParts.join('\n\n') }, ...chat],
    max_completion_tokens: Math.min(Number(body && body.max_tokens) || MAX_TOKENS, MAX_TOKENS),
    temperature: tools.length ? 0.7 : 0.85,
  };
  if (tools.length) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
    payload.parallel_tool_calls = false;
  }

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

  let data = await upstream.json().catch(() => ({}));

  // Provider menolak skema tools -> ulangi sekali tanpa tools, pakai protokol teks.
  let actFallback = false;
  if (!upstream.ok && payload.tools && (upstream.status === 400 || upstream.status === 422)) {
    actFallback = true;
    const p2 = Object.assign({}, payload);
    delete p2.tools; delete p2.tool_choice; delete p2.parallel_tool_calls;
    delete p2.max_completion_tokens; p2.max_tokens = payload.max_completion_tokens;
    p2.messages = payload.messages.slice();
    p2.messages[0] = {
      role: 'system',
      content: payload.messages[0].content + '\n\n' + ACT_PROTOCOL,
    };
    try {
      const up2 = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify(p2),
        signal: AbortSignal.timeout(45000),
      });
      if (up2.ok) { data = await up2.json().catch(() => ({})); upstream = up2; }
    } catch (e) {}
  }

  if (!upstream.ok) {
    const msg = upstream.status === 429
      ? 'Kamu kirimnya cepet banget, tunggu bentar ya.'
      : 'Clara lagi gangguan sebentar. Coba lagi ya.';
    return json({ error: msg }, 502);
  }

  const msgObj = (data && data.choices && data.choices[0] && data.choices[0].message) || {};
  const rawText = String(msgObj.content || '').trim();
  if (Array.isArray(msgObj.tool_calls) && msgObj.tool_calls.length) {
    return json({
      tool_calls: msgObj.tool_calls.slice(0, 4).map((c) => {
        let args = {};
        try { args = JSON.parse(String(c.function && c.function.arguments || '{}')); } catch (e) { args = {}; }
        return { id: String(c.id || ''), name: String(c.function && c.function.name || ''), args };
      }),
      text: cleanText(rawText),
    });
  }

  const raw = rawText;
  if (!raw) return json({ error: 'Clara belum bisa balas. Coba kirim ulang ya.' }, 502);
  if (actFallback) {
    const m = raw.match(/\[\[act\s+(\{[\s\S]*?\})\]\]/);
    if (m) {
      try {
        const obj = JSON.parse(m[1]);
        if (obj && obj.tool && TOOL_NAMES.indexOf(String(obj.tool)) !== -1) {
          return json({
            tool_calls: [{ id: 'act_' + Math.random().toString(36).slice(2, 8), name: String(obj.tool), args: obj.args || {} }],
            text: cleanText(raw.replace(m[0], '')).trim(),
          });
        }
      } catch (e) {}
    }
  }

  const bubbles = splitBubbles(raw);
  return json({
    bubbles,
    content: bubbles.map((t) => ({ type: 'text', text: t })),
    text: bubbles.join('\n'),
  });
}
