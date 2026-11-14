# My Daily — aplikasi Android (reader "Buka dengan")

Aplikasi native tipis (WebView) yang membungkus vylonium.my.id, dengan satu tambahan penting
yang tidak mungkin dilakukan TWA/Bubblewrap: **intent filter untuk semua jenis berkas**.

## Kenapa bukan TWA lagi

APK lama dibuat dengan Bubblewrap (TWA). TWA hanya menjalankan Chrome di dalam shell, sehingga
Android tidak pernah melihat aplikasi ini sebagai pembuka berkas — konsekuensinya My Daily tidak
bisa muncul di dialog "Buka dengan". Aplikasi di folder ini adalah APK native (Java + WebView)
dengan `intent-filter` `VIEW` untuk skema `content://` dan `file://` dengan `mimeType="*/*"`,
plus `SEND` untuk berkas yang dibagikan dari aplikasi lain.

## Alur kerja

1. Dibuka biasa (ikon aplikasi) → memuat `https://vylonium.my.id/`.
2. Dibuka lewat "Buka dengan → My Daily" untuk sebuah berkas → memuat `https://vylonium.my.id/berkas/`,
   lalu isi berkas dikirim ke halaman secara bertahap (base64, potongan 256 KB) lewat jembatan
   `window.MD.incoming` / `window.MD.chunk` / `window.MD.end`.
3. Tombol "Unduh" di halaman memakai `MDNative.save()` sehingga berkas tersimpan ke folder **Unduhan**
   (MediaStore), bukan gagal seperti pada WebView biasa.

## Build

APK dibangun otomatis oleh GitHub Actions: `.github/workflows/android-apk.yml`
(artifact bernama `mydaily-apk`). Build lokal:

```
cd android-app
gradle assembleDebug
```

## Pemasangan

- APK ini **ditandatangani berbeda** dari APK Bubblewrap lama dengan `applicationId` yang sama
  (`id.vylonium.mydaily`), jadi **uninstall APK lama dulu** sebelum memasang yang ini.
- APK debug (bukan untuk Play Store). Untuk rilis, tambahkan keystore rilis di CI.
- Setelah terpasang: ketuk berkas apa pun di pengelola berkas → **Buka dengan** → **My Daily**.
  Jika belum muncul, buka Pengaturan Android → Aplikasi → Default → "Buka tautan/buka dengan"
  dan tambahkan My Daily, atau pilih "Selalu" saat dialog muncul.
