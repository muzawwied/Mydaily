/* Pembaca Berkas universal — semua ekstensi bisa dibuka di dalam aplikasi.
   Jenis tampilan dipilih otomatis: gambar, audio, video, PDF, arsip ZIP,
   teks/kode (dengan nomor baris & bungkus baris), atau tampilan hex untuk
   berkas biner yang tidak dikenali. Tidak memakai pustaka luar. */
(function () {
  'use strict';

  var IMG = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif', 'svg', 'heic', 'heif'];
  var AUD = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba', 'amr', 'm4b'];
  var VID = ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'mkv', '3gp', 'avi'];
  var ARC = ['zip', 'apk', 'jar', 'docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'epub', 'h5p'];
  var TXT = ['txt', 'md', 'markdown', 'rst', 'log', 'csv', 'tsv', 'json', 'jsonl', 'ndjson',
    'xml', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf', 'env', 'properties', 'sql',
    'html', 'htm', 'xhtml', 'css', 'scss', 'sass', 'less', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx',
    'py', 'rb', 'php', 'java', 'kt', 'kts', 'swift', 'go', 'rs', 'c', 'h', 'cpp', 'cc', 'hpp',
    'cs', 'sh', 'bash', 'zsh', 'fish', 'bat', 'ps1', 'lua', 'pl', 'r', 'dart', 'vue', 'svelte',
    'gradle', 'dockerfile', 'makefile', 'gitignore', 'editorconfig', 'srt', 'vtt', 'ass', 'diff', 'patch'];

  var MAX_TEXT = 2 * 1024 * 1024;   // batas baca teks awal
  var HEAD_TEXT = 512 * 1024;       // potongan pertama yang ditampilkan
  var HEAD_HEX = 8192;              // byte awal untuk tampilan hex
  var MAX_ZIP_ROWS = 800;

  var files = [];                   // { file, url, name, size, ext, kind }
  var active = -1;
  var wrapOn = true;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function bytes(n) {
    if (!n && n !== 0) return '-';
    var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0, v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return (i === 0 ? v : (v >= 100 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2))) + ' ' + u[i];
  }
  function extOf(name) {
    var base = String(name || '').split('/').pop();
    var i = base.lastIndexOf('.');
    if (i <= 0) return base.toLowerCase() === 'dockerfile' || base.toLowerCase() === 'makefile' ? base.toLowerCase() : '';
    return base.slice(i + 1).toLowerCase();
  }
  function kindOf(file) {
    var e = extOf(file.name), t = (file.type || '').toLowerCase();
    if (t.indexOf('image/') === 0 || IMG.indexOf(e) >= 0) return 'gambar';
    if (t.indexOf('audio/') === 0 || AUD.indexOf(e) >= 0) return 'audio';
    if (t.indexOf('video/') === 0 || VID.indexOf(e) >= 0) return 'video';
    if (t === 'application/pdf' || e === 'pdf') return 'pdf';
    if (ARC.indexOf(e) >= 0 || /zip/.test(t)) return 'arsip';
    if (TXT.indexOf(e) >= 0 || t.indexOf('text/') === 0 || /json|xml|javascript|yaml/.test(t)) return 'teks';
    return 'biner';
  }
  function mimeOf(file, e) {
    if (file.type) return file.type;
    var map = {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
      svg: 'image/svg+xml', bmp: 'image/bmp', avif: 'image/avif', ico: 'image/x-icon',
      mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac',
      flac: 'audio/flac', opus: 'audio/opus', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
      pdf: 'application/pdf', zip: 'application/zip', json: 'application/json',
      html: 'text/html', css: 'text/css', js: 'text/javascript', md: 'text/markdown', txt: 'text/plain',
      csv: 'text/csv', xml: 'application/xml', apk: 'application/vnd.android.package-archive'
    };
    return map[e] || 'application/octet-stream';
  }
  function isTextish(file) {
    var k = kindOf(file);
    if (k === 'teks') return true;
    if (k === 'biner' && /charset=(utf|us-ascii|iso-8859)/i.test(file.type || '')) return true;
    return false;
  }
  function looksBinary(u8) {
    var n = Math.min(u8.length, 4096);
    for (var i = 0; i < n; i++) if (u8[i] === 0) return true;
    return false;
  }
  function readHead(file, size) {
    var blob = file.slice(0, Math.min(size, file.size));
    if (blob.arrayBuffer) return blob.arrayBuffer();
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = function () { rej(r.error || new Error('gagal baca')); };
      r.readAsArrayBuffer(blob);
    });
  }
  function decode(u8) {
    try { return new TextDecoder('utf-8', { fatal: false }).decode(u8); }
    catch (e) { return String.fromCharCode.apply(null, u8.subarray(0, 2048)); }
  }

  /* ---------- daftar berkas ---------- */
  function info(t) {
    var n = document.getElementById('frInfo');
    if (n) n.textContent = t;
  }
  function renderList() {
    var box = document.getElementById('frList');
    var empty = document.getElementById('frEmpty');
    if (!box) return;
    box.textContent = '';
    if (!files.length) { box.hidden = true; if (empty) empty.hidden = false; return; }
    box.hidden = false;
    if (empty) empty.hidden = true;
    files.forEach(function (it, i) {
      var row = el('div', 'frrow' + (i === active ? ' on' : ''));
      var open = el('button', 'frpickrow');
      open.type = 'button';
      open.appendChild(el('span', 'frnm', it.name));
      open.appendChild(el('span', 'frsz', it.kind + ' · ' + bytes(it.size)));
      open.addEventListener('click', function () { show(i); });
      var rm = el('button', 'frrm');
      rm.type = 'button';
      rm.setAttribute('aria-label', 'Tutup ' + it.name);
      rm.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      rm.addEventListener('click', function (p) {
        p.stopPropagation();
        remove(i);
      });
      row.appendChild(open);
      row.appendChild(rm);
      box.appendChild(row);
    });
  }
  function remove(i) {
    var it = files[i];
    if (it && it.url) { try { URL.revokeObjectURL(it.url); } catch (e) {} }
    files.splice(i, 1);
    if (!files.length) { active = -1; clearBody(); info('Belum ada berkas dibuka.'); }
    else if (active >= files.length) active = files.length - 1;
    renderList();
    if (active >= 0) show(active, true);
  }
  function clearBody() {
    var b = document.getElementById('frBody');
    if (b) { b.textContent = ''; b.hidden = true; }
  }

  /* ---------- tampilan per jenis ---------- */
  function tools() {
    var t = el('div', 'frtools');
    return t;
  }
  function btn(label, fn) {
    var b = el('button', 'frbtn', label);
    b.type = 'button';
    b.addEventListener('click', fn);
    return b;
  }
  function meta(it) {
    var m = el('div', 'frmeta');
    m.appendChild(el('span', '', it.ext ? '.' + it.ext : 'tanpa ekstensi'));
    m.appendChild(el('span', '', bytes(it.size)));
    m.appendChild(el('span', '', mimeOf(it.file, it.ext)));
    return m;
  }
  function downloadBtn(it) {
    return btn('Unduh', function () {
      var a = document.createElement('a');
      a.href = it.url;
      a.download = it.name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  function viewText(it, body, u8, truncated) {
    var text = decode(u8);
    var box = el('pre', 'frpre' + (wrapOn ? ' wrap' : ''));
    box.textContent = text;
    var tb = tools();
    var wrapBtn = btn(wrapOn ? 'Bungkus: aktif' : 'Bungkus: mati', function () {
      wrapOn = !wrapOn;
      box.classList.toggle('wrap', wrapOn);
      wrapBtn.textContent = wrapOn ? 'Bungkus: aktif' : 'Bungkus: mati';
      wrapBtn.classList.toggle('on', wrapOn);
    });
    if (wrapOn) wrapBtn.classList.add('on');
    tb.appendChild(wrapBtn);
    tb.appendChild(btn('Salin', function (ev) {
      var b = ev.currentTarget, old = b.textContent;
      var done = function () { b.textContent = 'Tersalin'; b.classList.add('on'); setTimeout(function () { b.textContent = old; b.classList.remove('on'); }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
      else {
        var ta = document.createElement('textarea');
        ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        ta.remove();
      }
    }));
    tb.appendChild(downloadBtn(it));
    if (truncated) {
      tb.appendChild(btn('Tampilkan semua', function (ev) {
        var b = ev.currentTarget;
        b.disabled = true;
        b.textContent = 'Memuat…';
        it.file.text().then(function (full) {
          box.textContent = full;
          b.remove();
        }, function () { b.textContent = 'Gagal memuat'; });
      }));
    }
    var lines = text.split('\n').length;
    info(it.name + ' · ' + lines.toLocaleString('id-ID') + ' baris' + (truncated ? ' (pratinjau)' : ''));
    body.appendChild(meta(it));
    body.appendChild(tb);
    body.appendChild(box);
  }

  function viewHex(it, body, u8) {
    var lines = [];
    for (var off = 0; off < u8.length; off += 16) {
      var slice = u8.subarray(off, Math.min(off + 16, u8.length));
      var hex = [], asc = '';
      for (var i = 0; i < 16; i++) {
        if (i < slice.length) {
          hex.push((slice[i] < 16 ? '0' : '') + slice[i].toString(16));
          asc += slice[i] >= 32 && slice[i] < 127 ? String.fromCharCode(slice[i]) : '.';
        } else { hex.push('  '); asc += ' '; }
      }
      lines.push(('00000000' + off.toString(16)).slice(-8) + '  ' + hex.join(' ') + '  ' + asc);
    }
    var tb = tools();
    tb.appendChild(downloadBtn(it));
    body.appendChild(meta(it));
    body.appendChild(tb);
    var pre = el('pre', 'frhex', lines.join('\n'));
    body.appendChild(pre);
    var more = el('p', 'frnote');
    more.textContent = it.size > HEAD_HEX
      ? 'Pratinjau ' + bytes(HEAD_HEX) + ' pertama dari ' + bytes(it.size) + '. Unduh berkasnya untuk membuka utuh di aplikasi lain.'
      : 'Seluruh isi berkas ditampilkan (mode hex).';
    body.appendChild(more);
    info(it.name + ' · biner · ' + bytes(it.size));
  }

  function parseZip(u8) {
    var dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return null;
    var count = dv.getUint16(eocd + 10, true);
    var off = dv.getUint32(eocd + 16, true);
    var rows = [];
    for (var n = 0; n < count; n++) {
      if (off + 46 > u8.length || dv.getUint32(off, true) !== 0x02014b50) break;
      var nameLen = dv.getUint16(off + 28, true);
      var extraLen = dv.getUint16(off + 30, true);
      var cmtLen = dv.getUint16(off + 32, true);
      var size = dv.getUint32(off + 24, true);
      var name = decode(u8.subarray(off + 46, off + 46 + nameLen));
      rows.push({ name: name, size: size });
      off += 46 + nameLen + extraLen + cmtLen;
      if (rows.length >= MAX_ZIP_ROWS) break;
    }
    return { rows: rows, total: count };
  }

  function viewZip(it, body, u8) {
    var zip = parseZip(u8);
    body.appendChild(meta(it));
    var tb = tools();
    tb.appendChild(downloadBtn(it));
    if (!zip || !zip.rows.length) {
      body.appendChild(tb);
      var note = el('p', 'frnote', 'Struktur arsip tidak terbaca. Berkas tetap bisa diunduh lalu dibuka di aplikasi lain.');
      body.appendChild(note);
      info(it.name + ' · arsip · ' + bytes(it.size));
      return;
    }
    body.appendChild(tb);
    var list = el('div', 'frzip');
    zip.rows.forEach(function (r) {
      var row = el('div', 'frziprow');
      row.appendChild(el('span', 'frnm', r.name));
      row.appendChild(el('span', 'frsz', bytes(r.size)));
      list.appendChild(row);
    });
    body.appendChild(list);
    var p = el('p', 'frnote');
    p.textContent = zip.rows.length + ' dari ' + zip.total + ' entri arsip.';
    body.appendChild(p);
    info(it.name + ' · arsip · ' + bytes(it.size));
  }

  function viewMedia(it, body, kind) {
    body.appendChild(meta(it));
    var tb = tools();
    tb.appendChild(downloadBtn(it));
    body.appendChild(tb);
    if (kind === 'gambar') {
      var img = el('img', 'frimg');
      img.alt = it.name;
      img.src = it.url;
      body.appendChild(img);
      info(it.name + ' · gambar · ' + bytes(it.size));
      return;
    }
    if (kind === 'pdf') {
      var fr = el('iframe', 'frpdf');
      fr.title = it.name;
      fr.src = it.url;
      body.appendChild(fr);
      var n = el('p', 'frnote', 'Kalau pratinjau kosong, gunakan tombol Unduh lalu buka di aplikasi PDF.');
      body.appendChild(n);
      info(it.name + ' · pdf · ' + bytes(it.size));
      return;
    }
    var media = document.createElement(kind === 'audio' ? 'audio' : 'video');
    media.className = 'frmedia';
    media.controls = true;
    media.preload = 'metadata';
    if (kind === 'video') media.setAttribute('playsinline', '');
    media.src = it.url;
    body.appendChild(media);
    info(it.name + ' · ' + kind + ' · ' + bytes(it.size));
  }

  function show(i, keepScroll) {
    var it = files[i];
    if (!it) return;
    active = i;
    var body = document.getElementById('frBody');
    if (!body) return;
    body.textContent = '';
    body.hidden = false;
    if (!keepScroll) {
      var sec = document.getElementById('berkas');
      if (sec) sec.scrollTop = 0;
    }
    renderList();
    var kind = it.kind;

    if (kind === 'gambar' || kind === 'audio' || kind === 'video' || kind === 'pdf') {
      viewMedia(it, body, kind);
      return;
    }

    readHead(it.file, kind === 'teks' ? MAX_TEXT : HEAD_HEX).then(function (buf) {
      var u8 = new Uint8Array(buf);
      if (kind === 'arsip') {
        viewZip(it, body, u8);
        return;
      }
      var binary = kind === 'biner' ? looksBinary(u8) : false;
      if (kind === 'teks' && looksBinary(u8)) binary = true;
      if (binary) { viewHex(it, body, u8); return; }
      viewText(it, body, u8, it.size > u8.length);
    }, function () {
      var p = el('p', 'frnote', 'Berkas tidak bisa dibaca di perangkat ini.');
      body.appendChild(p);
      var tb = tools();
      tb.appendChild(downloadBtn(it));
      body.appendChild(tb);
    });
  }

  function add(fileList) {
    var picked = Array.prototype.slice.call(fileList || []);
    if (!picked.length) return;
    var added = [];
    picked.forEach(function (f) {
      var url = null;
      try { url = URL.createObjectURL(f); } catch (e) {}
      var it = {
        file: f,
        url: url,
        name: f.name || 'berkas',
        size: f.size || 0,
        ext: extOf(f.name),
        kind: kindOf(f)
      };
      files.push(it);
      added.push(it);
    });
    renderList();
    info(files.length + ' berkas terbuka');
    show(files.length - added.length);   // langsung tampilkan berkas pertama yang baru dipilih
  }

  /* ---------- buka / tutup bagian ---------- */
  function closeOthers() {
    var open = document.querySelectorAll('.cal.open');
    for (var i = 0; i < open.length; i++) {
      if (open[i].id === 'berkas') continue;
      open[i].classList.remove('open');
      open[i].setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('feed-open', 'gal-open', 'chat-open');
  }
  function open() {
    closeOthers();
    var sec = document.getElementById('berkas');
    if (!sec) return;
    sec.classList.add('open');
    sec.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    sec.scrollTop = 0;
  }
  function close() {
    var sec = document.getElementById('berkas');
    if (!sec) return;
    sec.classList.remove('open');
    sec.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function pick() {
    var inp = document.getElementById('frFile');
    if (!inp) return;
    inp.value = '';
    inp.click();
  }

  function init() {
    var sec = document.getElementById('berkas');
    if (!sec) return;
    var tile = document.getElementById('openBerkas');
    if (tile) tile.addEventListener('click', open);
    var back = document.getElementById('berkasBack');
    if (back) back.addEventListener('click', close);
    var pickBtn = document.getElementById('berkasPick');
    if (pickBtn) pickBtn.addEventListener('click', pick);
    var pickBtn2 = document.getElementById('frPick2');
    if (pickBtn2) pickBtn2.addEventListener('click', pick);
    var inp = document.getElementById('frFile');
    if (inp) inp.addEventListener('change', function (e) { add(e.target.files); e.target.value = ''; });

    // tarik-lepas (desktop / Chrome)
    sec.addEventListener('dragover', function (e) { e.preventDefault(); sec.classList.add('drop'); });
    sec.addEventListener('dragleave', function () { sec.classList.remove('drop'); });
    sec.addEventListener('drop', function (e) {
      e.preventDefault();
      sec.classList.remove('drop');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) add(e.dataTransfer.files);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sec.classList.contains('open')) close();
    });

    window.FR = { open: open, close: close, add: add };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
