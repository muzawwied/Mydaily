/* =====================================================================
   ai-tools.js — Jembatan AI ke fitur My Daily
   ---------------------------------------------------------------------
   Mendefinisikan "tool" yang boleh dipanggil Clara (tugas, catatan,
   keuangan, agenda, buka halaman, ingat fakta) lengkap dengan eksekutor
   yang bekerja pada data aplikasi yang sama (localStorage).

   Catatan penting: modul-modul app menyimpan salinan data di memori,
   jadi setiap tool yang MENULIS menandai needsReload; chat client akan
   memuat ulang halaman sekali di akhir giliran agar semua layar ikut
   memperlihatkan perubahan (tanpa risiko data tertimpa versi lama).
   ===================================================================== */
(function () {
  'use strict';

  var needsReload = false;

  function lsGet(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }
  function uid() { return (Math.random().toString(36) + '000000').slice(2, 9); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseDate(s) {
    if (!s) return today();
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
    if (m) return s.trim();
    var d = new Date(s);
    return isNaN(d) ? today() : dayKey(d);
  }
  function rp(n) { return 'Rp' + Math.round(+n || 0).toLocaleString('id-ID'); }
  function norm(s) { return String(s || '').toLowerCase(); }

  var TASKS = 'tugas', NOTES = 'catatan', FIN = 'keuangan', AGENDA = 'agenda', FEED = 'feed';

  /* ------------------------------ TOOLS ---------------------------- */
  var DEFS = [
    {
      type: 'function',
      function: {
        name: 'get_brief',
        description: 'Ringkasan cepat kondisi user hari ini: tugas terbuka & jatuh tempo, agenda hari ini, keuangan hari ini, jumlah catatan.',
        parameters: { type: 'object', properties: {}, required: [] }
      }
    },
    {
      type: 'function',
      function: {
        name: 'list_tasks',
        description: 'Lihat daftar tugas user.',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['terbuka', 'selesai', 'semua'], description: 'Default terbuka.' },
            limit: { type: 'integer', description: 'Maksimal item (default 12).' }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_task',
        description: 'Tambahkan tugas baru untuk user.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Judul tugas, singkat dan jelas.' },
            note: { type: 'string', description: 'Catatan tambahan (opsional).' },
            priority: { type: 'string', enum: ['tinggi', 'sedang', 'rendah'], description: 'Default sedang.' },
            due: { type: 'string', description: 'Tenggat format YYYY-MM-DD (opsional).' }
          },
          required: ['title']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'complete_task',
        description: 'Tandai tugas selesai berdasarkan potongan judulnya.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string', description: 'Potongan judul tugas yang dicari.' } },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'list_notes',
        description: 'Cari atau lihat catatan user.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Kata kunci (opsional).' },
            limit: { type: 'integer', description: 'Default 8.' }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_note',
        description: 'Simpan catatan baru untuk user.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Judul catatan (opsional).' },
            body: { type: 'string', description: 'Isi catatan.' }
          },
          required: ['body']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'finance_summary',
        description: 'Ringkasan pemasukan dan pengeluaran user pada suatu periode.',
        parameters: {
          type: 'object',
          properties: { period: { type: 'string', enum: ['hari_ini', 'minggu_ini', 'bulan_ini'], description: 'Default hari_ini.' } },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_finance',
        description: 'Catat pemasukan atau pengeluaran.',
        parameters: {
          type: 'object',
          properties: {
            dir: { type: 'string', enum: ['masuk', 'keluar'], description: 'Jenis transaksi.' },
            amount: { type: 'number', description: 'Nominal rupiah, angka saja.' },
            title: { type: 'string', description: 'Keterangan singkat, misal "makan siang".' },
            date: { type: 'string', description: 'Tanggal YYYY-MM-DD (opsional, default hari ini).' }
          },
          required: ['dir', 'amount', 'title']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'list_agenda',
        description: 'Lihat agenda pada tanggal tertentu (default hari ini).',
        parameters: {
          type: 'object',
          properties: { date: { type: 'string', description: 'YYYY-MM-DD, atau "besok".' } },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'add_agenda',
        description: 'Tambahkan agenda/acara ke kalender user.',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'YYYY-MM-DD atau "besok".' },
            time: { type: 'string', description: 'Jam HH:MM (opsional).' },
            title: { type: 'string', description: 'Nama acara.' }
          },
          required: ['title']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'open_page',
        description: 'Buka salah satu halaman aplikasi untuk user.',
        parameters: {
          type: 'object',
          properties: { page: { type: 'string', enum: ['beranda', 'kalender', 'tugas', 'catatan', 'keuangan', 'jam', 'feed', 'profil'] } },
          required: ['page']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'remember',
        description: 'Simpan fakta penting tentang user agar diingat di percakapan berikutnya (kebiasaan, preferensi, tanggal penting).',
        parameters: {
          type: 'object',
          properties: { fact: { type: 'string', description: 'Fakta singkat, satu kalimat.' } },
          required: ['fact']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'brain_report',
        description: 'Lihat apa yang sudah dipelajari aplikasi tentang user (gaya bahasa, jam aktif, kebiasaan, fakta yang diingat).',
        parameters: { type: 'object', properties: {}, required: [] }
      }
    }
  ];

  function defsFor(names) {
    if (!Array.isArray(names) || !names.length) return DEFS.slice();
    return DEFS.filter(function (d) { return names.indexOf(d.function.name) !== -1; });
  }

  /* ---------------------------- EKSEKUTOR -------------------------- */
  var RUN = {};

  RUN.get_brief = function () {
    return window.Brain ? window.Brain.brief() : { error: 'brain tidak aktif' };
  };

  RUN.list_tasks = function (a) {
    var T = lsGet(TASKS, []) || [];
    var st = a.status || 'terbuka';
    var lim = Math.max(1, Math.min(30, parseInt(a.limit, 10) || 12));
    var out = T.filter(function (x) {
      if (!x || !x.t) return false;
      if (st === 'terbuka') return !x.d;
      if (st === 'selesai') return !!x.d;
      return true;
    }).slice(0, lim).map(function (x) {
      return { t: x.t, selesai: !!x.d, prioritas: x.p || 'sedang', tenggat: x.u || '' };
    });
    return { jumlah: out.length, tugas: out };
  };

  RUN.add_task = function (a) {
    var title = String(a.title || '').trim().slice(0, 80);
    if (!title) return { ok: false, error: 'judul kosong' };
    var T = lsGet(TASKS, []) || [];
    var o = { t: title, n: String(a.note || '').trim().slice(0, 160), p: (['tinggi', 'sedang', 'rendah'].indexOf(a.priority) !== -1 ? a.priority : 'sedang'), d: false, id: uid() };
    if (a.due) o.u = parseDate(a.due);
    T.unshift(o);
    lsSet(TASKS, T);
    needsReload = true;
    return { ok: true, ditambahkan: { t: o.t, prioritas: o.p, tenggat: o.u || '' } };
  };

  RUN.complete_task = function (a) {
    var q = norm(a.query);
    if (!q) return { ok: false, error: 'query kosong' };
    var T = lsGet(TASKS, []) || [];
    var hit = null;
    for (var i = 0; i < T.length; i++) {
      if (T[i] && !T[i].d && norm(T[i].t).indexOf(q) !== -1) { hit = T[i]; T[i].d = true; break; }
    }
    if (!hit) return { ok: false, error: 'tugas tidak ditemukan: ' + a.query };
    lsSet(TASKS, T);
    needsReload = true;
    return { ok: true, diselesaikan: hit.t };
  };

  RUN.list_notes = function (a) {
    var N = lsGet(NOTES, []) || [];
    var q = norm(a.query);
    var lim = Math.max(1, Math.min(20, parseInt(a.limit, 10) || 8));
    var out = N.filter(function (x) {
      if (!x) return false;
      if (!q) return true;
      return norm(x.t).indexOf(q) !== -1 || norm(x.b).indexOf(q) !== -1;
    }).slice(0, lim).map(function (x) {
      return { judul: x.t || '', isi: String(x.b || '').slice(0, 220) };
    });
    return { jumlah: out.length, catatan: out };
  };

  RUN.add_note = function (a) {
    var body = String(a.body || '').trim();
    if (!body) return { ok: false, error: 'isi catatan kosong' };
    var N = lsGet(NOTES, []) || [];
    var title = String(a.title || '').trim().slice(0, 60);
    var esc = body.replace(/[&<>]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]; });
    N.unshift({ t: title, b: body.slice(0, 8000), h: esc.replace(/\n/g, '<br>'), m: Date.now(), id: uid() });
    lsSet(NOTES, N);
    needsReload = true;
    return { ok: true, judul: title || '(tanpa judul)' };
  };

  RUN.finance_summary = function (a) {
    var K = lsGet(FIN, []) || [];
    var p = a.period || 'hari_ini';
    var now = new Date();
    var start;
    if (p === 'bulan_ini') start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (p === 'minggu_ini') { start = new Date(now); start.setDate(now.getDate() - 6); }
    else start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var s = dayKey(start);
    var rows = K.filter(function (x) { return x && x.d && x.d >= s; });
    var inSum = 0, outSum = 0;
    rows.forEach(function (x) { if (x.k === 'in') inSum += Math.abs(+x.n || 0); else outSum += Math.abs(+x.n || 0); });
    var per = {};
    rows.forEach(function (x) { var key = String(x.t || '').trim().toLowerCase().slice(0, 20) || 'lainnya'; if (x.k !== 'in') per[key] = (per[key] || 0) + Math.abs(+x.n || 0); });
    var top = Object.keys(per).sort(function (x, y) { return per[y] - per[x]; }).slice(0, 4).map(function (k) { return { ket: k, total: per[k] }; });
    return { periode: p, transaksi: rows.length, masuk: rp(inSum), keluar: rp(outSum), saldo_periode: rp(inSum - outSum), pengeluaran_terbesar: top };
  };

  RUN.add_finance = function (a) {
    var amount = Math.abs(Number(a.amount) || 0);
    if (!amount) return { ok: false, error: 'nominal tidak valid' };
    var K = lsGet(FIN, []) || [];
    var dir = a.dir === 'masuk' ? 'in' : 'out';
    K.push({ id: uid(), t: String(a.title || '').trim().slice(0, 60) || 'tanpa keterangan', n: amount, k: dir, d: parseDate(a.date), c: Date.now() });
    lsSet(FIN, K);
    needsReload = true;
    return { ok: true, dicatat: { jenis: dir === 'in' ? 'masuk' : 'keluar', nominal: rp(amount), keterangan: a.title || '' } };
  };

  RUN.list_agenda = function (a) {
    var A = lsGet(AGENDA, {}) || {};
    var d = a.date === 'besok' ? dayKey(new Date(Date.now() + 864e5)) : parseDate(a.date);
    var list = Array.isArray(A[d]) ? A[d] : [];
    return { tanggal: d, jumlah: list.length, agenda: list.slice(0, 12).map(function (x) { return { jam: x.j || '', acara: x.t, catatan: x.c || '' }; }) };
  };

  RUN.add_agenda = function (a) {
    var title = String(a.title || '').trim().slice(0, 80);
    if (!title) return { ok: false, error: 'judul acara kosong' };
    var d = a.date === 'besok' ? dayKey(new Date(Date.now() + 864e5)) : parseDate(a.date);
    var A = lsGet(AGENDA, {}) || {};
    var list = Array.isArray(A[d]) ? A[d] : (A[d] = []);
    var item = { t: title };
    if (a.time && /^\d{1,2}[:.]\d{2}$/.test(String(a.time))) { var t = String(a.time).replace('.', ':'); var p = t.split(':'); item.j = pad(+p[0]) + ':' + p[1]; }
    list.push(item);
    list.sort(function (x, y) { var p1 = (typeof x === 'object' && x.j) || '99:99', p2 = (typeof y === 'object' && y.j) || '99:99'; return p1 < p2 ? -1 : p1 > p2 ? 1 : 0; });
    var ok = lsSet(AGENDA, A);
    if (!ok) return { ok: false, error: 'penyimpanan penuh' };
    needsReload = true;
    return { ok: true, tanggal: d, acara: title, jam: item.j || '(sepanjang hari)' };
  };

  RUN.open_page = function (a) {
    var map = { kalender: 'openCal', tugas: 'openTask', catatan: 'openNote2', keuangan: 'openKeu', jam: 'openJam', feed: 'openFeed', profil: 'openProf', beranda: '' };
    var id = map[a.page];
    if (id === undefined) return { ok: false, error: 'halaman tidak dikenal' };
    try {
      var chatBack = document.getElementById('chatBack');
      var chatSec = document.getElementById('chat');
      if (chatSec && chatSec.classList.contains('open') && chatBack) chatBack.click();
      setTimeout(function () {
        if (id) { var b = document.getElementById(id); if (b) b.click(); }
        else window.scrollTo(0, 0);
      }, 120);
      return { ok: true, dibuka: a.page };
    } catch (e) { return { ok: false, error: 'gagal membuka halaman' }; }
  };

  RUN.remember = function (a) {
    var f = String(a.fact || '').trim();
    if (!f) return { ok: false, error: 'fakta kosong' };
    if (window.Brain) window.Brain.remember(f, 'ai');
    return { ok: true, diingat: f };
  };

  RUN.brain_report = function () {
    if (!window.Brain) return { error: 'brain tidak aktif' };
    return window.Brain.profile().then(function (p) {
      return {
        total_sinyal: p.n,
        pesan_chat: p.msgs,
        rata_panjang_pesan: p.avgLen,
        emoji_favorit: Object.keys(p.emoji).sort(function (a, b) { return p.emoji[b] - p.emoji[a]; }).slice(0, 4),
        kata_sering: Object.keys(p.words).sort(function (a, b) { return p.words[b] - p.words[a]; }).slice(0, 8),
        jam_aktif: p.hours.map(function (v, i) { return { jam: i, sinyal: v }; }).sort(function (a, b) { return b.sinyal - a.sinyal; }).slice(0, 3),
        tugas: p.tasks, catatan: p.notes,
        fakta: p.facts.slice(0, 10)
      };
    });
  };

  /* ---------------------------- API publik ------------------------- */
  window.AITools = {
    defs: DEFS,
    defsFor: defsFor,
    has: function (name) { return !!RUN[name]; },
    run: function (name, args) {
      try {
        if (!RUN[name]) return Promise.resolve({ ok: false, error: 'tool tidak dikenal: ' + name });
        var r = RUN[name](args || {});
        return Promise.resolve(r);
      } catch (e) {
        return Promise.resolve({ ok: false, error: String(e && e.message || e) });
      }
    },
    get needsReload() { return needsReload; },
    clearReload: function () { needsReload = false; }
  };
})();
