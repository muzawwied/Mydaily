package id.vylonium.mydaily;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * My Daily — pembungkus WebView.
 * - Dibuka biasa: memuat aplikasi utama (vylonium.my.id).
 * - Dibuka lewat "Buka dengan" untuk sebuah berkas: memuat halaman /berkas/
 *   lalu mengirim isi berkas ke pembaca lewat jembatan JS (bertahap, base64).
 */
public class MainActivity extends Activity {

    private static final String HOME_URL = "https://vylonium.my.id/";
    private static final String READER_URL = "https://vylonium.my.id/berkas/";
    private static final int CHUNK = 256 * 1024;

    private WebView web;
    private Uri pending;
    private boolean pageReady = false;
    private boolean delivering = false;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);

        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "MDNative");
        setContentView(web);

        Uri incoming = incomingUri(getIntent());
        if (incoming != null) {
            pending = incoming;
            web.loadUrl(READER_URL);
        } else {
            web.loadUrl(HOME_URL);
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        Uri incoming = incomingUri(intent);
        if (incoming == null) return;
        pending = incoming;
        pageReady = false;
        web.loadUrl(READER_URL);
    }

    private Uri incomingUri(Intent intent) {
        if (intent == null) return null;
        String action = intent.getAction();
        if (Intent.ACTION_VIEW.equals(action)) return intent.getData();
        if (Intent.ACTION_SEND.equals(action)) {
            Object extra = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            if (extra instanceof Uri) return (Uri) extra;
        }
        return null;
    }

    private class Bridge {
        @JavascriptInterface
        public void ready() {
            pageReady = true;
            runOnUiThread(() -> deliver());
        }

        /** Simpan berkas (base64) ke folder Unduhan, dipakai tombol "Unduh" di halaman. */
        @JavascriptInterface
        public void save(String b64, String name, String mime) {
            try {
                byte[] data = Base64.decode(b64, Base64.DEFAULT);
                String safe = name == null || name.trim().isEmpty() ? "berkas" : name.replaceAll("[\\\\/:*?\"<>|]", "_");
                String where;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                    cv.put(MediaStore.Downloads.MIME_TYPE, mime == null || mime.isEmpty() ? "application/octet-stream" : mime);
                    cv.put(MediaStore.Downloads.IS_PENDING, 1);
                    Uri target = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (target == null) throw new IllegalStateException("tidak bisa membuat entri Unduhan");
                    try (OutputStream out = getContentResolver().openOutputStream(target)) {
                        if (out == null) throw new IllegalStateException("aliran tulis gagal");
                        out.write(data);
                    }
                    cv.clear();
                    cv.put(MediaStore.Downloads.IS_PENDING, 0);
                    getContentResolver().update(target, cv, null, null);
                    where = "Unduhan/" + safe;
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                    if (!dir.exists()) dir.mkdirs();
                    File out = new File(dir, safe);
                    try (FileOutputStream fos = new FileOutputStream(out)) {
                        fos.write(data);
                    }
                    where = out.getAbsolutePath();
                }
                final String w = where;
                runOnUiThread(() -> js("window.MD&&window.MD.onSaved&&window.MD.onSaved(" + q(w) + ")"));
            } catch (Exception e) {
                final String msg = e.getMessage() == null ? e.toString() : e.getMessage();
                runOnUiThread(() -> js("window.MD&&window.MD.onSaved&&window.MD.onSaved(" + q("gagal: " + msg) + ")"));
            }
        }
    }

    private void deliver() {
        if (delivering || !pageReady || pending == null) return;
        delivering = true;
        final Uri uri = pending;

        new Thread(() -> {
            try {
                String name = queryName(uri);
                String mime = getContentResolver().getType(uri);
                if (mime == null) mime = "";
                final String meta = "window.MD&&window.MD.incoming({name:" + q(name) + ",mime:" + q(mime) + "})";
                runOnUiThread(() -> js(meta));

                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    if (in == null) throw new IllegalStateException("berkas tidak bisa dibuka");
                    byte[] buf = new byte[CHUNK];
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        byte[] part = new byte[n];
                        System.arraycopy(buf, 0, part, 0, n);
                        final String b64 = Base64.encodeToString(part, Base64.NO_WRAP);
                        runOnUiThread(() -> js("window.MD&&window.MD.chunk('" + b64 + "')"));
                    }
                }
                runOnUiThread(() -> js("window.MD&&window.MD.end()"));
            } catch (Exception e) {
                final String msg = e.getMessage() == null ? e.toString() : e.getMessage();
                runOnUiThread(() -> js("window.MD&&window.MD.error(" + q(msg) + ")"));
            }
        }).start();
    }

    private String queryName(Uri uri) {
        String name = null;
        try (Cursor c = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            if (c != null && c.moveToFirst()) {
                int idx = c.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (idx >= 0) name = c.getString(idx);
            }
        } catch (Exception ignored) {
        }
        if (name == null || name.trim().isEmpty()) {
            String last = uri.getLastPathSegment();
            name = last == null ? "berkas" : last;
        }
        return name;
    }

    private void js(String code) {
        try {
            web.evaluateJavascript(code, null);
        } catch (Exception ignored) {
        }
    }

    private static String q(String v) {
        if (v == null) v = "";
        StringBuilder b = new StringBuilder("\"");
        for (int i = 0; i < v.length(); i++) {
            char ch = v.charAt(i);
            switch (ch) {
                case '"': b.append("\\\""); break;
                case '\\': b.append("\\\\"); break;
                case '\n': b.append("\\n"); break;
                case '\r': b.append("\\r"); break;
                case '\t': b.append("\\t"); break;
                default:
                    if (ch < 0x20) b.append(String.format("\\u%04x", (int) ch));
                    else b.append(ch);
            }
        }
        return b.append("\"").toString();
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack() && !READER_URL.equals(web.getUrl())) {
            web.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
