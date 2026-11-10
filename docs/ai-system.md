# Sistem Belajar & Aksi AI (Clara)

Dokumen singkat untuk dua lapisan baru di My Daily: **otak** (dataset + profil belajar) dan **tangan** (akses fitur lewat tool).

## 1. Lapisan dataset — `js/ai-brain.js`

Merekam aktivitas user **di perangkatnya sendiri** tanpa mengubah kode modul lain:

- Hook `Storage.prototype.setItem`: setiap kali modul app menyimpan `tugas`, `catatan`, `keuangan`, `agenda`, `feed`, `chat`, `profil`, atau `jam_alarm`, hook membandingkan versi lama vs baru lalu mencatat event (tugas dibuat/selesai/dihapus, catatan baru, transaksi, agenda, pesan chat, dsb.).
- `MutationObserver` pada tiap section mendeteksi halaman yang dibuka (`page_open`).
- Event disimpan di **IndexedDB** (`mydaily_brain` → store `events`), dibatasi 8.000 event terbaru; bila IndexedDB diblokir, jatuh ke `localStorage` (`brain_events`, 1.500 terbaru).

### Profil belajar

`Brain.profile()` mengagregasi event menjadi:

- gaya bahasa: rata-rata panjang pesan, frekuensi tanda tanya/seru, emoji favorit, kata & topik yang sering muncul
- ritme: histogram jam aktif, jumlah hari aktif
- kebiasaan: tugas dibuat/selesai, jumlah catatan, pola pemasukan/pengeluaran, agenda
- fakta yang diingat (`Brain.remember`), dipakai lintas sesi

`Brain.contextBlock()` mengubah profil itu menjadi blok < 1.200 karakter yang **disuntikkan ke tiap permintaan chat** (field `memory`), dengan cache 6 jam.

### Pembelajar berkala

`Brain.learn()` (dipanggil otomatis 4 detik setelah app dibuka) mengirim 80 event terakhir ke `POST /api/chat {action:'learn'}` jika sudah ≥3 hari dan ≥40 sinyal baru. Server merangkumnya jadi maksimal 6 fakta pendek yang disimpan sebagai ingatan.

Privasi: data mentah tetap di perangkat. Yang keluar hanya potongan ringkasan saat chat dan sampel event saat pembelajar berkala.

## 2. Lapisan aksi — `js/ai-tools.js`

13 tool yang boleh dipanggil AI:

| Tool | Fungsi |
|---|---|
| `get_brief` | ringkasan hari ini (tugas, agenda, keuangan, catatan) |
| `list_tasks`, `add_task`, `complete_task` | kelola tugas |
| `list_notes`, `add_note` | kelola catatan |
| `finance_summary`, `add_finance` | ringkasan & pencatatan keuangan |
| `list_agenda`, `add_agenda` | kelola agenda |
| `open_page` | buka halaman aplikasi untuk user |
| `remember` | simpan fakta tentang user |
| `brain_report` | tampilkan apa yang sudah dipelajari |

Alur: client mengirim `tools` → server (Groq, `gpt-oss-120b`) membalas `tool_calls` → client mengeksekusi tool pada data app → hasil dikirim balik sebagai pesan `tool` → model menyusun balasan natural. Maksimal 3 putaran per pesan. Bila provider menolak skema tool, server otomatis beralih ke protokol teks `[[act {...}]]` (fallback), sehingga fitur tetap bisa dipanggil.

### Sinkronisasi tampilan

Modul app menyimpan salinan data di memori. Setelah tool yang **menulis** berhasil, client menandai `needsReload`, menyimpan pesan terakhir, memuat ulang halaman sekali, lalu membuka chat kembali otomatis (`sessionStorage.md_reopen_chat`).

## 3. Menambah tool baru

1. Tambah definisi di `DEFS` (`js/ai-tools.js`) dan eksekutor di `RUN`.
2. Tambahkan namanya ke `TOOL_NAMES` di `functions/api/chat.js` (whitelist server).
3. Uji dengan Node: `AITools.run('nama_tool', {…})`.

## 4. Batas & catatan

- Tanpa IndexedDB, dataset tetap jalan lewat localStorage (lebih kecil).
- Tool menulis dengan bentuk data yang sama seperti UI; jangan ubah bentuk tanpa memperbarui `ai-tools.js`.
- Chat tetap berfungsi meski tools gagal total (mode teks biasa).
