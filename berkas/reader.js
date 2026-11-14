/* Pembaca berkas My Daily — halaman mandiri /berkas/
   Menangani semua ekstensi: gambar, audio, video, PDF, arsip (zip/jar/apk/docx/xlsx),
   teks/kode, dan biner mentah (hex). Plus Studio: metadata, hash, ekstrak arsip. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var node = function (tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; };

  var IMG = ['png','jpg','jpeg','gif','webp','bmp','ico','avif','heic','heif','svg','jfif','apng'];
  var AUD = ['mp3','wav','ogg','oga','m4a','aac','flac','opus','weba','mid','midi','amr'];
  var VID = ['mp4','webm','mov','m4v','mkv','avi','3gp','ogv','mpd','ts'];
  var ZIP = ['zip','jar','apk','docx','xlsx','pptx','epub','odt','ods','odp','whl','ipa'];
  var TXT = ['txt','md','markdown','json','json5','jsonc','csv','tsv','log','ini','cfg','conf','env','yml','yaml','toml','xml','html','htm','xhtml','css','scss','sass','less','js','mjs','cjs','jsx','ts','tsx','py','pyw','rb','php','java','kt','kts','go','rs','c','h','cpp','hpp','cc','cs','swift','dart','lua','pl','pm','r','sql','sh','bash','zsh','fish','ps1','bat','cmd','vue','svelte','astro','graphql','gql','proto','gradle','properties','gitignore','dockerfile','makefile','lock','srt','vtt','ass','tex','rst','adoc'];
  var PDF = ['pdf'];

  var S = { files: [], active: -1, wrap: false, enc: 'utf-8', zoom: 1, hexMax: 8192, received: [] };

  /* ---------- util ---------- */
  function extOf(name) { var m = /\.([A-Za-z0-9]{1,12})$/.exec(name || ''); return m ? m[1].toLowerCase() : ''; }
  function human(n) {
    n = Number(n) || 0;
    if (n < 1024) return n + ' B';
    var u = ['KB','MB','GB','TB'], i = -1;
    do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
    return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.round(n)) + ' ' + u[i];
  }
  function kindOf(f) {
    var e = extOf(f.name), m = (f.type || '').toLowerCase();
    if (PDF.indexOf(e) >= 0 || m === 'application/pdf') return 'pdf';
    if (m.indexOf('image/') === 0 || IMG.indexOf(e) >= 0) return 'gambar';
    if (m.indexOf('audio/') === 0 || AUD.indexOf(e) >= 0) return 'audio';
    if (m.indexOf('video/') === 0 || VID.indexOf(e) >= 0) return 'video';
    if (m.indexOf('zip') >= 0 || ZIP.indexOf(e) >= 0) return 'arsip';
    if (m.indexOf('text/') === 0 || /json|xml|javascript|yaml|toml|csv/.test(m) || TXT.indexOf(e) >= 0) return 'teks';
    return 'biner';
  }
  function looksBinary(u8) {
    var n = Math.min(u8.length, 4096), i;
    for (i = 0; i < n; i++) if (u8[i] === 0) return true;
    return false;
  }
  function mimeFor(f) {
    if (f.type) return f.type;
    var e = extOf(f.name);
    var m = {
      png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp',
      svg:'image/svg+xml', mp3:'audio/mpeg', wav:'audio/wav', m4a:'audio/mp4', ogg:'audio/ogg',
      mp4:'video/mp4', webm:'video/webm', pdf:'application/pdf', zip:'application/zip',
      json:'application/json', txt:'text/plain', html:'text/html', css:'text/css', js:'text/javascript'
    };
    return m[e] || '';
  }
  function u8ToB64(u8) {
    var s = '', CH = 0x8000, i;
    for (i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  }
  function b64ToU8(b64) {
    var bin = atob(b64), u8 = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i) & 0xff;
    return u8;
  }
  async function sliceText(f, limit) {
    var blob = limit && f.size > limit ? f.slice(0, limit) : f;
    var buf = new Uint8Array(await blob.arrayBuffer());
    var dec;
    try { dec = new TextDecoder(S.enc); } catch (e) { dec = new TextDecoder('utf-8'); }
    return { text: dec.decode(buf), truncated: !!(limit && f.size > limit), shown: buf.length, binary: looksBinary(buf) };
  }
  async function sha256(u8) {
    if (!(crypto && crypto.subtle && crypto.subtle.digest)) return '';
    try {
      var d = await crypto.subtle.digest('SHA-256', u8);
      return Array.prototype.map.call(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    } catch (e) { return ''; }
  }

  /* ---------- label & status ---------- */
  function setSub(txt) { var s = $('sub'); if (s) s.textContent = txt; }
  function note(host, txt) { var p = node('p', 'note'); p.textContent = txt; host.appendChild(p); return p; }

  /* ---------- daftar berkas ---------- */
  function renderList() {
    var box = $('list');
    box.textContent = '';
    S.files.forEach(function (f, i) {
      var row = node('button', 'frow' + (i === S.active ? ' on' : ''));
      row.type = 'button';
      var nm = node('span', 'fnm'); nm.textContent = f.name;
      var sz = node('span', 'fsz'); sz.textContent = human(f.size);
      var x = node('button', 'fx'); x.type = 'button'; x.setAttribute('aria-label', 'Tutup ' + f.name); x.textContent = '×';
      x.addEventListener('click', function (ev) { ev.stopPropagation(); close(i); });
      row.appendChild(nm); row.appendChild(sz); row.appendChild(x);
      row.addEventListener('click', function () { show(i); });
      box.appendChild(row);
    });
    $('empty').hidden = S.files.length > 0;
  }

  function clearUrls(f) { if (f && f.url) { try { URL.revokeObjectURL(f.url); } catch (e) {} f.url = ''; } }

  function close(i) {
    clearUrls(S.files[i]);
    S.files.splice(i, 1);
    if (S.active === i) { S.active = -1; wipe(); }
    else if (S.active > i) S.active--;
    renderList();
    if (S.active < 0 && S.files.length) show(0);
  }

  function wipe() {
    var r = $('reader'); r.textContent = '';
    $('studioPanel').hidden = true;
    $('studioInfo').textContent = '';
    $('studioTools').textContent = '';
    $('studioExtra').textContent = '';
  }

  /* ---------- tambah berkas ---------- */
  function addFiles(fileList) {
    var arr = Array.prototype.slice.call(fileList || []);
    if (!arr.length) return;
    var start = S.files.length;
    arr.forEach(function (f) {
      S.files.push({ file: f, name: f.name || 'berkas', size: f.size || 0, type: f.type || '', url: '' });
    });
    renderList();
    show(start);
  }

  /* ---------- tampilan utama ---------- */
  async function show(i) {
    var item = S.files[i];
    if (!item) return;
    S.active = i;
    renderList();

    var r = $('reader');
    r.textContent = '';
    var kind = kindOf(item.file);
    var mime = mimeFor(item.file);

    var meta = node('div', 'meta');
    [kind, extOf(item.name) || 'tanpa ekstensi', human(item.size), mime || 'tipe tak dikenal'].forEach(function (t) {
      var c = node('span'); c.textContent = t; meta.appendChild(c);
    });
    r.appendChild(meta);

    var tools = node('div', 'tools');
    r.appendChild(tools);

    var host = node('div');
    r.appendChild(host);

    setSub(item.name + ' · ' + human(item.size));
    buildStudio(item, kind, mime);
    $('studio').classList.remove('on');

    try {
      if (kind === 'gambar') return showImage(item, tools, host);
      if (kind === 'audio' || kind === 'video') return showMedia(item, kind, tools, host);
      if (kind === 'pdf') return showPdf(item, tools, host);
      if (kind === 'arsip') {
        var ok = await showZip(item, host);
        if (ok) return;
      }
      return await showTextOrHex(item, tools, host, kind);
    } catch (e) {
      host.textContent = '';
      note(host, 'Gagal membaca berkas ini (' + (e && e.message ? e.message : 'kesalahan') + '). Coba Unduh lalu buka di aplikasi lain.');
    }
  }

  function toolBtn(label, fn, on) {
    var b = node('button', 'btn' + (on ? ' on' : ''));
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }
  function downloadBtn(item) {
    return toolBtn('Unduh', function () {
      var mime = mimeFor(item.file);
      if (window.MDNative && window.MDNative.save) {
        var fr = new FileReader();
        fr.onload = function () {
          var b64 = String(fr.result || '').split(',')[1] || '';
          try { window.MDNative.save(b64, item.name, mime || 'application/octet-stream'); } catch (e) {}
        };
        fr.readAsDataURL(item.file);
        return;
      }
      clearUrls(item);
      item.url = URL.createObjectURL(item.file);
      var a = node('a');
      a.href = item.url; a.download = item.name;
      document.body.appendChild(a); a.click(); a.remove();
    });
  }

  /* ---------- gambar ---------- */
  function showImage(item, tools, host) {
    clearUrls(item);
    item.url = URL.createObjectURL(item.file);
    var zoomWrap = node('div', 'zoomable');
    var img = node('img', 'view');
    img.alt = item.name;
    img.src = item.url;
    zoomWrap.appendChild(img);
    host.appendChild(zoomWrap);

    var z = 1;
    var apply = function () { img.style.width = (z * 100) + '%'; };
    tools.appendChild(toolBtn('−', function () { z = Math.max(0.25, z - 0.25); apply(); }));
    tools.appendChild(toolBtn('+', function () { z = Math.min(4, z + 0.25); apply(); }));
    tools.appendChild(toolBtn('Pas layar', function () { z = 1; apply(); }));
    tools.appendChild(downloadBtn(item));
    img.addEventListener('error', function () { note(host, 'Berkas ini berekstensi gambar tapi isinya tidak bisa ditampilkan browser.'); });
  }

  /* ---------- audio / video ---------- */
  function showMedia(item, kind, tools, host) {
    clearUrls(item);
    item.url = URL.createObjectURL(item.file);
    var el = node(kind === 'audio' ? 'audio' : 'video', 'view');
    el.controls = true;
    el.preload = 'metadata';
    el.src = item.url;
    if (kind === 'video') el.playsInline = true;
    host.appendChild(el);
    tools.appendChild(downloadBtn(item));
    el.addEventListener('error', function () { note(host, 'Codec berkas ini tidak didukung pemutar bawaan — coba Unduh lalu buka di aplikasi lain.'); });
  }

  /* ---------- pdf ---------- */
  function showPdf(item, tools, host) {
    clearUrls(item);
    item.url = URL.createObjectURL(item.file);
    var fr = node('iframe', 'pdf');
    fr.src = item.url;
    fr.title = item.name;
    host.appendChild(fr);
    tools.appendChild(downloadBtn(item));
    note(host, 'Kalau pratinjau kosong, unduh lalu buka di aplikasi PDF.');
  }

  /* ---------- teks / kode / hex ---------- */
  async function showTextOrHex(item, tools, host, kind) {
    var LIMIT = 2 * 1024 * 1024;
    var res = await sliceText(item.file, LIMIT);
    var asText = kind === 'teks' || (kind === 'biner' && !res.binary);

    var wrapBtn = toolBtn('Bungkus baris', function () {
      S.wrap = !S.wrap;
      wrapBtn.classList.toggle('on', S.wrap);
      var pre = host.querySelector('pre.code, pre.hex');
      if (pre) pre.classList.toggle('wrap', S.wrap);
    }, S.wrap);
    tools.appendChild(wrapBtn);

    if (asText) {
      var pre = node('pre', 'code' + (S.wrap ? ' wrap' : ''));
      pre.textContent = res.text;
      host.appendChild(pre);
      var lines = res.text.split('\n').length;
      if (res.truncated) note(host, 'Pratinjau ' + human(res.shown) + ' dari ' + human(item.size) + '. ');
      if (res.truncated) {
        tools.appendChild(toolBtn('Tampilkan semua', async function () {
          var all = await sliceText(item.file, 0);
          pre.textContent = all.text;
          var n = host.querySelectorAll('p.note'); if (n.length) n[n.length - 1].remove();
        }));
      }
      tools.appendChild(toolBtn('Salin', async function () {
        var btn = this;
        try { await navigator.clipboard.writeText(pre.textContent); btn.textContent = 'Tersalin'; }
        catch (e) { btn.textContent = 'Gagal salin'; }
        setTimeout(function () { btn.textContent = 'Salin'; }, 1600);
      }));
      var sel = node('select', 'sel');
      [['utf-8', 'UTF-8'], ['windows-1252', 'Windows-1252'], ['iso-8859-1', 'Latin-1']].forEach(function (p) {
        var o = node('option'); o.value = p[0]; o.textContent = p[1]; if (p[0] === S.enc) o.selected = true; sel.appendChild(o);
      });
      sel.addEventListener('change', async function () {
        S.enc = sel.value;
        var again = await sliceText(item.file, LIMIT);
        pre.textContent = again.text;
      });
      tools.appendChild(sel);
      tools.appendChild(downloadBtn(item));
      note(host, lines + ' baris' + (res.truncated ? ' (terpotong)' : ''));
      return;
    }

    // biner → hex
    var buf = new Uint8Array(await item.file.slice(0, S.hexMax).arrayBuffer());
    var pre2 = node('pre', 'hex');
    pre2.textContent = hexDump(buf);
    host.appendChild(pre2);
    tools.appendChild(toolBtn('Perbesar jendela', async function () {
      S.hexMax = S.hexMax >= 65536 ? 8192 : S.hexMax * 2;
      var b2 = new Uint8Array(await item.file.slice(0, S.hexMax).arrayBuffer());
      pre2.textContent = hexDump(b2);
      note(host, 'Menampilkan ' + human(S.hexMax) + ' dari ' + human(item.size) + '.');
    }));
    tools.appendChild(downloadBtn(item));
    note(host, 'Biner mentah — ' + human(S.hexMax) + ' dari ' + human(item.size) + ' ditampilkan sebagai hex.');
  }

  function hexDump(u8) {
    var out = [], i, j, line, chunk, asc, off;
    for (i = 0; i < u8.length; i += 16) {
      chunk = u8.subarray(i, i + 16);
      line = [];
      asc = '';
      for (j = 0; j < 16; j++) {
        if (j < chunk.length) {
          line.push(('0' + chunk[j].toString(16)).slice(-2));
          asc += chunk[j] >= 32 && chunk[j] < 127 ? String.fromCharCode(chunk[j]) : '.';
        } else { line.push('  '); asc += ' '; }
      }
      off = ('0000000' + i.toString(16)).slice(-8);
      out.push(off + '  ' + line.slice(0, 8).join(' ') + '  ' + line.slice(8).join(' ') + '  |' + asc + '|');
    }
    return out.join('\n');
  }

  /* ---------- arsip ---------- */
  async function showZip(item, host) {
    var buf = new Uint8Array(await item.file.arrayBuffer());
    var entries = zipEntries(buf);
    if (!entries) return false;

    var box = node('div', 'zl');
    var shown = 0;
    entries.forEach(function (e) {
      if (shown++ > 400) return;
      var row = node('div', 'zrow');
      var n = node('span'); n.textContent = e.name;
      var s = node('small'); s.textContent = human(e.size);
      row.appendChild(n); row.appendChild(s);
      box.appendChild(row);
    });
    host.appendChild(box);
    if (entries.length > 400) note(host, 'Menampilkan 400 dari ' + entries.length + ' entri.');
    else note(host, entries.length + ' entri di dalam arsip.');
    return true;
  }

  // Baca daftar entri dari central directory ZIP (tanpa library)
  function zipEntries(u8) {
    var i, n = u8.length, eocd = -1, maxBack = Math.min(n, 66560);
    for (i = n - 22; i >= n - maxBack; i--) {
      if (u8[i] === 0x50 && u8[i + 1] === 0x4b && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) { eocd = i; break; }
    }
    if (eocd < 0) return null;
    var view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var count = view.getUint16(eocd + 10, true);
    var off = view.getUint32(eocd + 16, true);
    if (!count || !off || off >= n) return null;
    var out = [], p = off, dec = new TextDecoder('utf-8'), k;
    for (k = 0; k < count && p + 46 <= n; k++) {
      if (!(u8[p] === 0x50 && u8[p + 1] === 0x4b && u8[p + 2] === 0x01 && u8[p + 3] === 0x02)) break;
      var nameLen = view.getUint16(p + 28, true);
      var extraLen = view.getUint16(p + 30, true);
      var cmtLen = view.getUint16(p + 32, true);
      var size = view.getUint32(p + 24, true);
      var nameBytes = u8.subarray(p + 46, p + 46 + nameLen);
      var name;
      try { name = dec.decode(nameBytes); } catch (e) { name = '(nama tak terbaca)'; }
      out.push({ name: name, size: size });
      p += 46 + nameLen + extraLen + cmtLen;
    }
    return out.length ? out : null;
  }

  /* ---------- studio ---------- */
  async function buildStudio(item, kind, mime) {
    var t = $('studioInfo');
    t.textContent = '';
    var tools = $('studioTools');
    tools.textContent = '';
    var extra = $('studioExtra');
    extra.textContent = '';

    var rows = [
      ['Nama', item.name],
      ['Ukuran', human(item.size) + ' (' + item.size.toLocaleString('id-ID') + ' byte)'],
      ['Ekstensi', extOf(item.name) || '—'],
      ['MIME', mime || 'tidak dilaporkan'],
      ['Jenis', kind],
      ['Terakhir diubah', item.file.lastModified ? new Date(item.file.lastModified).toLocaleString('id-ID') : '—']
    ];

    if (kind === 'gambar') {
      try {
        var dim = await imageSize(item.file);
        if (dim) rows.push(['Dimensi', dim.w + ' × ' + dim.h + ' px (' + (dim.w * dim.h / 1e6).toFixed(2) + ' MP)']);
      } catch (e) {}
    }
    if (kind === 'audio' || kind === 'video') {
      try {
        var dur = await mediaDuration(item.file);
        if (dur) rows.push(['Durasi', fmtDur(dur)]);
      } catch (e) {}
    }
    if (kind === 'arsip') {
      try {
        var buf = new Uint8Array(await item.file.arrayBuffer());
        var es = zipEntries(buf);
        if (es) rows.push(['Entri arsip', String(es.length)]);
      } catch (e) {}
    }
    if (item.size <= 64 * 1024 * 1024) {
      try {
        var all = new Uint8Array(await item.file.arrayBuffer());
        var h = await sha256(all);
        if (h) rows.push(['SHA-256', '<span class="hash">' + h + '</span>']);
      } catch (e) {}
    }

    rows.forEach(function (r) {
      var tr = node('tr');
      var th = node('th'); th.textContent = r[0];
      var td = node('td');
      if (r[0] === 'SHA-256') td.innerHTML = r[1]; else td.textContent = r[1];
      tr.appendChild(th); tr.appendChild(td);
      t.appendChild(tr);
    });

    tools.appendChild(downloadBtn(item));
    if (kind === 'teks' || kind === 'biner') {
      tools.appendChild(toolBtn('Salin hash', async function () {
        var btn = this;
        try {
          var u8 = new Uint8Array(await item.file.arrayBuffer());
          var hh = await sha256(u8);
          await navigator.clipboard.writeText(hh);
          btn.textContent = 'Tersalin';
        } catch (e) { btn.textContent = 'Gagal'; }
        setTimeout(function () { btn.textContent = 'Salin hash'; }, 1600);
      }));
    }
    if (kind === 'arsip') {
      var box = $('studioExtra');
      var buf2 = new Uint8Array(await item.file.arrayBuffer());
      var ents = zipEntries(buf2) || [];
      if (ents.length) {
        var wrapEl = node('div', 'zl');
        wrapEl.style.marginTop = '10px';
        ents.slice(0, 60).forEach(function (e) {
          var row = node('div', 'zrow');
          var a = node('span'); a.textContent = e.name;
          var b = node('small'); b.textContent = human(e.size);
          row.appendChild(a); row.appendChild(b);
          wrapEl.appendChild(row);
        });
        box.appendChild(wrapEl);
      }
    }
  }

  function fmtDur(s) {
    s = Math.round(s);
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), d = s % 60;
    return (h ? h + 'j ' : '') + m + 'm ' + ('0' + d).slice(-2) + 'd';
  }
  function imageSize(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { var r = { w: im.naturalWidth, h: im.naturalHeight }; URL.revokeObjectURL(url); resolve(r); };
      im.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      im.src = url;
    });
  }
  function mediaDuration(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var el = document.createElement(/^video\//.test(file.type) ? 'video' : 'audio');
      el.preload = 'metadata';
      el.onloadedmetadata = function () { var d = el.duration; URL.revokeObjectURL(url); resolve(isFinite(d) ? d : 0); };
      el.onerror = function () { URL.revokeObjectURL(url); resolve(0); };
      el.src = url;
    });
  }

  /* ---------- jembatan aplikasi Android ---------- */
  function decodePending(meta) {
    if (!S.received.length) return;
    var total = S.received.reduce(function (a, b) { return a + b.length; }, 0);
    var all = new Uint8Array(total), o = 0;
    S.received.forEach(function (u8) { all.set(u8, o); o += u8.length; });
    S.received = [];
    var f = new File([all], meta.name || 'berkas', { type: meta.mime || '' });
    addFiles([f]);
  }

  window.MD = {
    incoming: function (meta) {
      S.received = [];
      S.pending = meta || {};
      setSub('Membuka ' + ((meta && meta.name) || 'berkas') + '…');
    },
    chunk: function (b64) {
      try { S.received.push(b64ToU8(b64)); } catch (e) {}
    },
    end: function () {
      var meta = S.pending || {};
      S.pending = null;
      decodePending(meta);
    },
    error: function (msg) { setSub('Gagal membuka berkas dari aplikasi: ' + msg); },
    onSaved: function (where) { setSub('Tersimpan di ' + where); }
  };

  /* ---------- init ---------- */
  function init() {
    if (window.MDNative) { var b = $('modeBadge'); b.textContent = 'Aplikasi'; }
    $('pick').addEventListener('click', function () { $('inp').click(); });
    $('inp').addEventListener('change', function (e) { addFiles(e.target.files); e.target.value = ''; });
    $('studio').addEventListener('click', function () {
      var p = $('studioPanel');
      p.hidden = !p.hidden;
      $('studio').classList.toggle('on', !p.hidden);
      if (!p.hidden) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // tarik-lepas (desktop)
    document.addEventListener('dragover', function (e) { e.preventDefault(); });
    document.addEventListener('drop', function (e) {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.active >= 0) close(S.active); });
    renderList();
    if (window.MDNative && window.MDNative.ready) { try { window.MDNative.ready(); } catch (e) {} }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
