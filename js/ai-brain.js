/* =====================================================================
   ai-brain.js — Sistem dataset & pembelajaran My Daily
   ---------------------------------------------------------------------
   Tujuan: aplikasi mengumpulkan data tentang user (bahasa, kebiasaan,
   ritme harian, isi catatan/tugas/keuangan) lalu merangkumnya menjadi
   "profil belajar" yang disuntikkan ke AI agar makin lama makin kenal
   user, bukan seperti chatbot yang lupa segalanya tiap sesi.

   Prinsip:
   - Semua data tinggal di perangkat user (IndexedDB). Tidak dikirim ke
     mana pun kecuali potongan ringkasan (< 900 karakter) saat chat.
   - Perekaman berjalan otomatis: hook localStorage + observasi halaman.
   - Ringkasan dihitung ulang berkala (murah, tanpa panggilan API).
   ===================================================================== */
(function () {
  'use strict';

  var DB_NAME = 'mydaily_brain';
  var DB_VER = 1;
  var MAX_EVENTS = 8000;
  var MAX_FACTS = 120;
  var STORE_EV = 'events';
  var STORE_FACT = 'facts';
  var STORE_META = 'meta';

  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res) {
      try {
        if (!window.indexedDB) return res(null);
        var rq = indexedDB.open(DB_NAME, DB_VER);
        rq.onupgradeneeded = function (e) {
          var d = e.target.result;
          if (!d.objectStoreNames.contains(STORE_EV)) {
            var s = d.createObjectStore(STORE_EV, { keyPath: 'id', autoIncrement: true });
            s.createIndex('ts', 'ts');
            s.createIndex('kind', 'kind');
          }
          if (!d.objectStoreNames.contains(STORE_FACT)) d.createObjectStore(STORE_FACT, { keyPath: 'id', autoIncrement: true });
          if (!d.objectStoreNames.contains(STORE_META)) d.createObjectStore(STORE_META, { keyPath: 'k' });
        };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { res(null); };
      } catch (e) { res(null); }
    });
    return dbp;
  }

  /* ---------- fallback localStorage bila IndexedDB diblokir ---------- */
  var LS_KEY = 'brain_events';
  function lsRead() {
    try { var a = JSON.parse(localStorage.getItem(LS_KEY)); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function lsWrite(arr) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr.slice(-1500))); } catch (e) {}
  }

  /* ---------------------------- tulis event ------------------------- */
  var queue = [];
  var flushT = null;
  function push(ev) {
    if (!ev || !ev.kind) return;
    ev.ts = ev.ts || Date.now();
    queue.push(ev);
    if (flushT) return;
    flushT = setTimeout(flush, 700);
  }
  function flush() {
    flushT = null;
    if (!queue.length) return;
    var batch = queue.splice(0, queue.length);
    db().then(function (d) {
      if (!d) { var cur = lsRead(); lsWrite(cur.concat(batch)); touched(batch); return; }
      try {
        var tx = d.transaction(STORE_EV, 'readwrite');
        var st = tx.objectStore(STORE_EV);
        batch.forEach(function (ev) { st.add(ev); });
        tx.oncomplete = function () { touched(batch); trim(d); };
      } catch (e) { touched(batch); }
    });
  }
  function touched(batch) {
    try {
      batch.forEach(function (ev) {
        if (ev.kind === 'chat_user') learnWords(ev.text || '');
      });
      markDirty();
    } catch (e) {}
  }
  var dirty = false;
  function markDirty() { dirty = true; try { localStorage.setItem('brain_dirty', '1'); } catch (e) {} }

  function trim(d) {
    try {
      var tx = d.transaction(STORE_EV, 'readwrite');
      var st = tx.objectStore(STORE_EV);
      var cnt = 0;
      st.count().onsuccess = function (e) {
        cnt = e.target.result || 0;
        if (cnt <= MAX_EVENTS + 500) return;
        var del = cnt - MAX_EVENTS;
        var c = st.openCursor();
        c.onsuccess = function (ev) {
          var cur = ev.target.result;
          if (!cur || del-- <= 0) return;
          cur.delete();
          cur.continue();
        };
      };
    } catch (e) {}
  }

  /* ------------- kosa kata: kamus kata & emoji user ---------------- */
  var STOP = ('yang dan di ke dari untuk dengan ini itu ada atau juga aku kamu saya gue lu lo ' +
    'sudah udah belum akan bisa harus mau ingin pengen banget bgt sekali aja saja sih kan ya iya ' +
    'tidak gak nggak enggak apa apakah gimana bagaimana kenapa mengapa kapan dimana di mana siapa ' +
    'the and for with that this you are was were have has had but not just my me we our they he she ' +
    'nya lah kah pun untuk pada dalam oleh karena kalau kalo jadi terus lalu kemudian setelah sebelum ' +
    'banyak sedikit lebih paling lagi semua tiap setiap hari waktu sekarang nanti tadi besok kemarin ' +
    'ok oke sip mantap halo hai hi hey eh btw nah kok dong deh yuk yah ya udh gw gue aku ku mu nya si ' +
    'per para tentang sebagai sampai sejak hingga antara tanpa bila jika agar supaya bahwa meski walau ' +
    'orang sudah sedang masih pernah sering jarang selalu kadang memang betul benar salah bagus jelek ' +
    'satu dua tiga empat lima enam tujuh delapan sembilan sepuluh juga hanya cuma perlu tidak bukan')
    .split(/\s+/).filter(Boolean);
  var STOPSET = {};
  STOP.forEach(function (w) { STOPSET[w] = 1; });

  var EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2764}\u{2B50}]/gu;

  /* ------------------- hook localStorage: perilaku ------------------ */
  function arr(v) { try { var a = JSON.parse(v); return Array.isArray(a) ? a : null; } catch (e) { return null; } }
  function obj(v) { try { var o = JSON.parse(v); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
  function snap(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }

  function onWrite(key, val) {
    try {
      var prev = snap(key);
      if (prev === val) return;
      if (key === 'tugas') {
        var a = arr(val); if (!a) return;
        var b = prev ? arr(prev) || [] : [];
        var oldById = {};
        b.forEach(function (x) { if (x && x.id) oldById[x.id] = x; });
        a.forEach(function (x) {
          if (!x || !x.t) return;
          var o = x.id ? oldById[x.id] : null;
          if (!o) {
            push({ kind: 'task_add', text: String(x.t).slice(0, 120), pri: x.p || '', due: x.u || '' });
          } else if (!o.d && x.d) {
            push({ kind: 'task_done', text: String(x.t).slice(0, 120) });
          } else if (o.d && !x.d) {
            push({ kind: 'task_reopen', text: String(x.t).slice(0, 120) });
          }
        });
        var nowIds = {}; a.forEach(function (x) { if (x && x.id) nowIds[x.id] = 1; });
        b.forEach(function (x) { if (x && x.id && !nowIds[x.id]) push({ kind: 'task_del', text: String(x.t || '').slice(0, 120) }); });
      } else if (key === 'catatan') {
        var n = arr(val); if (!n) return;
        var nb = prev ? arr(prev) || [] : [];
        var seen = {};
        nb.forEach(function (x) { if (x && x.id) seen[x.id] = x; });
        n.forEach(function (x) {
          if (!x || (!x.t && !x.b)) return;
          var o = x.id ? seen[x.id] : null;
          if (!o) push({ kind: 'note_add', text: String(x.t || '').slice(0, 80), len: String(x.b || '').length });
          else if (String(o.b || '') !== String(x.b || '')) push({ kind: 'note_edit', text: String(x.t || '').slice(0, 80) });
        });
      } else if (key === 'keuangan') {
        var k = arr(val); if (!k) return;
        var kb = prev ? arr(prev) || [] : [];
        var kIds = {};
        kb.forEach(function (x) { if (x && x.id) kIds[x.id] = 1; });
        k.forEach(function (x) {
          if (!x || !x.id || kIds[x.id]) return;
          push({ kind: 'fin_add', dir: x.k === 'in' ? 'in' : 'out', amount: Math.abs(Number(x.n) || 0), text: String(x.t || '').slice(0, 60) });
        });
      } else if (key === 'agenda') {
        var g = obj(val); if (!g) return;
        var gb = prev ? obj(prev) || {} : {};
        Object.keys(g).forEach(function (d) {
          var la = Array.isArray(g[d]) ? g[d] : [];
          var lb = Array.isArray(gb[d]) ? gb[d] : [];
          if (la.length > lb.length) {
            var baru = la.filter(function (x) { return !lb.some(function (y) { return y && x && y.t === x.t && (y.j || '') === (x.j || ''); }); });
            baru.forEach(function (x) { if (x && x.t) push({ kind: 'agenda_add', text: String(x.t).slice(0, 80), date: d, time: x.j || '' }); });
          }
        });
      } else if (key === 'feed') {
        var f = arr(val); if (!f) return;
        var fb = prev ? arr(prev) || [] : [];
        if (f.length > fb.length) {
          var post = f[0];
          if (post && post.t) push({ kind: 'feed_post', text: String(post.t).slice(0, 140), len: String(post.t).length });
        }
      } else if (key === 'chat') {
        var c = arr(val); if (!c) return;
        var cb = prev ? arr(prev) || [] : [];
        if (c.length > cb.length) {
          var lastMsg = c[c.length - 1];
          if (lastMsg && lastMsg.r === 'u' && lastMsg.t) push({ kind: 'chat_user', text: String(lastMsg.t).slice(0, 400) });
          else if (lastMsg && lastMsg.r === 'a' && lastMsg.t) push({ kind: 'chat_ai', text: String(lastMsg.t).slice(0, 200) });
        }
      } else if (key === 'profil') {
        var p = obj(val);
        if (p && p.n) push({ kind: 'profile_set', text: String(p.n).slice(0, 40) });
      } else if (key === 'jam_alarm') {
        push({ kind: 'alarm_set' });
      }
    } catch (e) {}
  }

  // Pasang hook ke Storage.prototype.setItem (semua modul app lewat jalur ini).
  try {
    var origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      try { onWrite(String(k), String(v)); } catch (e) {}
      return origSet.apply(this, arguments);
    };
  } catch (e) {}

  /* ------------------- observasi halaman yang dibuka --------------- */
  function watchPages() {
    try {
      var map = { cal: 'kalender', task: 'tugas', note: 'catatan', keu: 'keuangan', jam: 'jam', chat: 'chat', feed: 'feed', prof: 'profil' };
      Object.keys(map).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        var was = el.classList.contains('open');
        new MutationObserver(function (ms) {
          ms.forEach(function (m) {
            if (m.attributeName !== 'class') return;
            var now = el.classList.contains('open');
            if (now && !was) push({ kind: 'page_open', page: map[id] });
            was = now;
          });
        }).observe(el, { attributes: true });
      });
    } catch (e) {}
  }

  /* --------------------- fakta yang diingat AI --------------------- */
  function remember(fact, source) {
    fact = String(fact || '').trim().slice(0, 240);
    if (fact.length < 3) return Promise.resolve(false);
    return db().then(function (d) {
      if (!d) {
        var ls = [];
        try { ls = JSON.parse(localStorage.getItem('brain_facts')) || []; } catch (e) {}
        if (ls.some(function (f) { return f.text === fact; })) return true;
        ls.unshift({ text: fact, ts: Date.now(), src: source || 'ai' });
        try { localStorage.setItem('brain_facts', JSON.stringify(ls.slice(0, MAX_FACTS))); } catch (e) {}
        markDirty();
        return true;
      }
      return new Promise(function (res) {
        try {
          var tx = d.transaction(STORE_FACT, 'readwrite');
          var st = tx.objectStore(STORE_FACT);
          var dup = false;
          st.openCursor().onsuccess = function (e) {
            var cur = e.target.result;
            if (!cur) {
              if (!dup) st.add({ text: fact, ts: Date.now(), src: source || 'ai' });
              return;
            }
            if (cur.value && cur.value.text === fact) { dup = true; return; }
            cur.continue();
          };
          tx.oncomplete = function () { markDirty(); res(true); };
        } catch (e) { res(false); }
      });
    });
  }
  function facts() {
    return db().then(function (d) {
      if (!d) {
        try { return JSON.parse(localStorage.getItem('brain_facts')) || []; } catch (e) { return []; }
      }
      return new Promise(function (res) {
        try {
          var out = [];
          var tx = d.transaction(STORE_FACT, 'readonly');
          tx.objectStore(STORE_FACT).openCursor().onsuccess = function (e) {
            var cur = e.target.result;
            if (!cur) return res(out.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); }).slice(0, MAX_FACTS));
            out.push(cur.value);
            cur.continue();
          };
        } catch (e) { res([]); }
      });
    });
  }

  /* ---------------- agregasi: profil belajar lengkap --------------- */
  function events(limit) {
    return db().then(function (d) {
      if (!d) return lsRead().slice(-(limit || 4000));
      return new Promise(function (res) {
        var out = [];
        try {
          var tx = d.transaction(STORE_EV, 'readonly');
          var idx = tx.objectStore(STORE_EV).index('ts');
          var rq = idx.openCursor(null, 'prev');
          rq.onsuccess = function (e) {
            var cur = e.target.result;
            if (!cur || out.length >= (limit || 4000)) return res(out.reverse());
            out.push(cur.value);
            cur.continue();
          };
        } catch (e) { res([]); }
      });
    });
  }

  function buildProfile(evs, fcs) {
    var p = {
      n: 0, msgs: 0, avgLen: 0, qRate: 0, exRate: 0, emoji: {}, words: {},
      hours: new Array(24).fill(0), days: {}, pages: {}, tasks: { add: 0, done: 0 }, notes: 0,
      fin: { in: 0, out: 0, outCount: 0, inCount: 0 }, agenda: 0, feed: 0, name: '', facts: []
    };
    var msgs = [];
    evs.forEach(function (ev) {
      p.n++;
      var d = new Date(ev.ts || Date.now());
      p.hours[d.getHours()]++;
      p.days[d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()] = 1;
      switch (ev.kind) {
        case 'chat_user': msgs.push(String(ev.text || '')); break;
        case 'page_open': p.pages[ev.page] = (p.pages[ev.page] || 0) + 1; break;
        case 'task_add': p.tasks.add++; learnWords(ev.text || '', p.words); break;
        case 'task_done': p.tasks.done++; break;
        case 'note_add': p.notes++; learnWords(ev.text || '', p.words); break;
        case 'fin_add':
          if (ev.dir === 'in') { p.fin.in += ev.amount || 0; p.fin.inCount++; }
          else { p.fin.out += ev.amount || 0; p.fin.outCount++; }
          break;
        case 'agenda_add': p.agenda++; learnWords(ev.text || '', p.words); break;
        case 'feed_post': p.feed++; learnWords(ev.text || '', p.words); break;
        case 'profile_set': if (ev.text) p.name = ev.text; break;
      }
    });
    p.msgs = msgs.length;
    if (msgs.length) {
      var total = 0, q = 0, ex = 0;
      msgs.forEach(function (t) {
        total += t.length;
        if (/\?/.test(t)) q++;
        if (/!/.test(t)) ex++;
        var em = t.match(EMOJI_RE) || [];
        em.forEach(function (e) { p.emoji[e] = (p.emoji[e] || 0) + 1; });
        learnWords(t, p.words);
      });
      p.avgLen = Math.round(total / msgs.length);
      p.qRate = Math.round((q / msgs.length) * 100);
      p.exRate = Math.round((ex / msgs.length) * 100);
    }
    p.facts = (fcs || []).map(function (f) { return f.text; });
    return p;
  }

  var wordAcc = {};
  function learnWords(text, target) {
    try {
      var t = String(text || '').toLowerCase()
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/[^a-z\u00c0-\u024f\s']/g, ' ');
      t.split(/\s+/).forEach(function (w) {
        w = w.replace(/^'+|'+$/g, '');
        if (w.length < 4 || w.length > 18) return;
        if (STOPSET[w]) return;
        wordAcc[w] = (wordAcc[w] || 0) + 1;
        if (target) target[w] = (target[w] || 0) + 1;
      });
    } catch (e) {}
  }

  function topOf(map, n) {
    return Object.keys(map || {}).sort(function (a, b) { return map[b] - map[a]; }).slice(0, n || 5)
      .map(function (k) { return { k: k, v: map[k] }; });
  }

  function hourLabel(h) { return (h < 10 ? '0' + h : h) + ':00'; }

  function profile() {
    return Promise.all([events(4000), facts()]).then(function (r) {
      var p = buildProfile(r[0], r[1]);
      try { localStorage.setItem('brain_profile_cache', JSON.stringify({ p: p, at: Date.now() })); } catch (e) {}
      return p;
    });
  }

  /* ---------- blok ringkas yang dikirim ke AI tiap chat ------------ */
  function promptBlock(p) {
    if (!p || !p.n) return '';
    var L = [];
    if (p.name) L.push('Nama user: ' + p.name + '.');
    if (p.msgs >= 5) {
      L.push('Gaya chat user: rata-rata ' + p.avgLen + ' karakter/pesan, ' +
        (p.qRate >= 40 ? 'sering bertanya, ' : '') +
        (p.exRate >= 30 ? 'ekspresif (banyak tanda seru), ' : '') +
        (p.avgLen < 30 ? 'pesan pendek-pendek, ' : '') + 'balas dengan gaya serupa.');
      var em = topOf(p.emoji, 3).map(function (x) { return x.k; }).join(' ');
      if (em) L.push('Emoji yang sering dipakai user: ' + em + '.');
      var sw = topOf(p.words, 6).map(function (x) { return x.k; }).join(', ');
      if (sw) L.push('Kata/topik yang sering muncul darinya: ' + sw + '.');
    }
    var hrs = p.hours.map(function (v, i) { return { h: i, v: v }; })
      .sort(function (a, b) { return b.v - a.v; }).slice(0, 3).filter(function (x) { return x.v > 0; });
    if (hrs.length) L.push('Jam aktif: ' + hrs.map(function (x) { return hourLabel(x.h); }).join(', ') + '.');
    var dayN = Object.keys(p.days).length;
    if (dayN) L.push('Tercatat aktif ' + dayN + ' hari, ' + p.tasks.add + ' tugas dibuat (' + p.tasks.done + ' selesai), ' + p.notes + ' catatan.');
    if (p.fin.outCount >= 3) L.push('Pengeluaran tercatat ' + p.fin.outCount + 'x (total ' + Math.round(p.fin.out) + ').');
    if (p.agenda) L.push('Agenda tercatat: ' + p.agenda + ' item.');
    if (p.facts && p.facts.length) L.push('Yang sudah kamu ingat: ' + p.facts.slice(0, 6).join('; ') + '.');
    var out = '';
    if (L.length) out = 'PROFIL BELAJAR USER (dari data harian di perangkatnya, pakai natural, jangan dibacakan mentah-mentah):\n- ' + L.join('\n- ');
    return out.slice(0, 1200);
  }

  function contextBlock() {
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('brain_profile_cache')); } catch (e) {}
    if (cached && cached.p && Date.now() - (cached.at || 0) < 6 * 3600 * 1000) return promptBlock(cached.p);
    return '';
  }

  /* --------------------- ringkasan untuk tool --------------------- */
  function brief() {
    var T = []; try { T = JSON.parse(localStorage.getItem('tugas')) || []; } catch (e) {}
    var K = []; try { K = JSON.parse(localStorage.getItem('keuangan')) || []; } catch (e) {}
    var N = []; try { N = JSON.parse(localStorage.getItem('catatan')) || []; } catch (e) {}
    var A = {}; try { A = JSON.parse(localStorage.getItem('agenda')) || {}; } catch (e) {}
    var d = new Date(); var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    var today = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    var todo = T.filter(function (x) { return x && !x.d; });
    var due = todo.filter(function (x) { return x.u && x.u <= today; });
    var finToday = K.filter(function (x) { return x && x.d === today; });
    var out = finToday.filter(function (x) { return x.k !== 'in'; }).reduce(function (s, x) { return s + Math.abs(+x.n || 0); }, 0);
    var inn = finToday.filter(function (x) { return x.k === 'in'; }).reduce(function (s, x) { return s + Math.abs(+x.n || 0); }, 0);
    return {
      tanggal: today,
      tugas_terbuka: todo.length,
      tugas_jatuh_tempo: due.slice(0, 6).map(function (x) { return { t: x.t, u: x.u || '' }; }),
      agenda_hari_ini: (A[today] || []).map(function (x) { return { t: x.t, j: x.j || '' }; }),
      keuangan_hari_ini: { masuk: inn, keluar: out, jumlah: finToday.length },
      catatan: N.length,
      contoh_catatan: N.slice(0, 3).map(function (x) { return String(x.t || '').slice(0, 40); })
    };
  }

  /* ---------------- pembelajar otomatis (berkala) ------------------
     Tiap >=3 hari dan ada >=40 sinyal baru, kirim potongan aktivitas ke
     mode "learn" di server. Hasilnya beberapa fakta ringkas yang disimpan
     sebagai ingatan. Murah: satu panggilan kecil, tidak tiap chat. */
  var LEARN_EVERY = 3 * 24 * 3600 * 1000;
  var LEARN_MIN_EVENTS = 40;
  function autoLearn() {
    var last = 0, lastN = 0;
    try {
      last = +localStorage.getItem('brain_learn_at') || 0;
      lastN = +localStorage.getItem('brain_learn_n') || 0;
    } catch (e) {}
    return events(600).then(function (evs) {
      if (evs.length < LEARN_MIN_EVENTS) return false;
      if (Date.now() - last < LEARN_EVERY) return false;
      if (evs.length - lastN < LEARN_MIN_EVENTS) return false;
      var sample = evs.slice(-80).map(function (e) {
        return { kind: e.kind, text: e.text || e.page || '', ts: e.ts };
      });
      return fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'learn', events: sample })
      }).then(function (r) { return r.json(); }).then(function (d) {
        var facts = (d && Array.isArray(d.facts)) ? d.facts : [];
        facts.slice(0, 6).forEach(function (f) { remember(f, 'auto'); });
        try {
          localStorage.setItem('brain_learn_at', String(Date.now()));
          localStorage.setItem('brain_learn_n', String(evs.length));
        } catch (e) {}
        return facts.length;
      });
    }).catch(function () { return false; });
  }

  function warm() {
    // siapkan cache profil supaya chat pertama tidak menunggu
    profile().then(function (p) {
      if (p && p.msgs >= 5) {
        var blk = promptBlock(p);
        if (blk) try { localStorage.setItem('brain_profile_cache', JSON.stringify({ p: p, at: Date.now() })); } catch (e) {}
      }
    }).catch(function () {});
    setTimeout(function () { autoLearn(); }, 4000);
  }

  window.Brain = {
    log: push,
    remember: remember,
    facts: facts,
    events: events,
    profile: profile,
    profileBlock: promptBlock,
    promptBlock: promptBlock,
    contextBlock: contextBlock,
    brief: brief,
    learn: autoLearn,
    warm: warm,
    topWords: function (n) { return topOf(wordAcc, n).map(function (x) { return x.k; }); },
    _onWrite: onWrite,
    _install: function () { watchPages(); push({ kind: 'app_open' }); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { watchPages(); push({ kind: 'app_open' }); warm(); });
  else { watchPages(); push({ kind: 'app_open' }); warm(); }
})();
