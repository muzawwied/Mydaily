// Diagnostik: uji apakah lapisan Functions stabil (tanpa panggilan keluar).
export async function onRequestPost({ request }) {
  let n = 0;
  try { const b = await request.json(); n = JSON.stringify(b || {}).length; } catch (e) {}
  return Response.json({ ok: true, bytes: n, t: Date.now() }, { headers: { 'Access-Control-Allow-Origin': '*' } });
}
export async function onRequestGet() {
  return Response.json({ ok: true, t: Date.now() });
}
