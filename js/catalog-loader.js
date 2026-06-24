/**
 * Charge le catalogue depuis l'API (Supabase) ou fallback products.js
 */
window.DH_TISSU = window.DH_TISSU || null;

window.DH_CATALOG_READY = (async function loadCatalog() {
  try {
    const res = await fetch('/api/catalog');
    if (res.ok) {
      const data = await res.json();
      delete data._source;
      window.DH_TISSU = data;
      return data;
    }
  } catch (_) { /* fallback below */ }

  if (window.DH_TISSU) return window.DH_TISSU;
  throw new Error('Catalogue indisponible');
})();

window.DH_TRACK = function (eventType, payload) {
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, ...payload }),
    keepalive: true,
  }).catch(() => {});
};
