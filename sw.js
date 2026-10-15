// Service worker de NRDIGITAL (tienda y panel).
// Las páginas se piden siempre a internet primero, así cada cambio que subas a GitHub
// se ve al instante; la copia guardada solo se usa si no hay conexión.
// Firebase (pedidos, saldos, etc.) nunca pasa por aquí: siempre es en vivo.
const CACHE = 'nrd-v1';
const CORE = ['./', './index.html', './admin.html', './manifest.webmanifest', './admin.webmanifest',
  './icons/tienda-192.png', './icons/tienda-512.png', './icons/admin-192.png', './icons/admin-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const OFFLINE = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sin conexión</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0e0d20;color:#eff0fc;font:16px system-ui,sans-serif;text-align:center;padding:24px">
<div><h1 style="font-size:22px;margin:0 0 8px">Sin conexión</h1><p style="color:#a6a8c5;margin:0 0 18px">Revisa tu internet y vuelve a intentar.</p>
<button onclick="location.reload()" style="border:0;border-radius:999px;padding:12px 22px;font:inherit;font-weight:700;color:#fff;background:linear-gradient(90deg,#6a00ff,#4b00c5)">Reintentar</button></div>`;

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match(url.pathname.endsWith('admin.html') ? './admin.html' : './index.html'))
      || new Response(OFFLINE, { headers: { 'content-type': 'text/html; charset=utf-8' } })));
    return;
  }
  // íconos y manifiestos: copia guardada y se actualiza en segundo plano
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
