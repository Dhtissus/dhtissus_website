/**
 * DH TISSU — Applique le numéro WhatsApp depuis Supabase sur tout le site
 */
(function () {
  'use strict';

  function normalize(number) {
    return String(number || '').replace(/\D/g, '');
  }

  function buildUrl(number, text) {
    const n = normalize(number);
    if (!n) return '#';
    return text
      ? `https://wa.me/${n}?text=${encodeURIComponent(text)}`
      : `https://wa.me/${n}`;
  }

  function getNumber() {
    return normalize(window.DH_TISSU?.whatsapp) || '212600000000';
  }

  async function applyAll() {
    try {
      await window.DH_CATALOG_READY;
    } catch {
      /* fallback numéro par défaut */
    }

    const num = getNumber();

    document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
      try {
        const url = new URL(link.href);
        const text = url.searchParams.get('text');
        link.href = buildUrl(num, text);
      } catch {
        link.href = buildUrl(num);
      }
    });

    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        if (data.telephone) {
          data.telephone = `+${num}`;
          script.textContent = JSON.stringify(data);
        }
      } catch {
        /* ignore invalid json */
      }
    });
  }

  window.DH_WHATSAPP = { normalize, buildUrl, getNumber, applyAll };

  function trackWhatsAppClick(link) {
    if (typeof window.DH_TRACK !== 'function') return;

    const payload = {
      metadata: {
        page: location.pathname.split('/').pop() || 'index.html',
        source: link.id || 'link',
      },
    };

    if (window.DH_PRODUCT_CONTEXT) {
      payload.product_id = window.DH_PRODUCT_CONTEXT.id;
      payload.collection_slug = window.DH_PRODUCT_CONTEXT.collection;
    } else {
      const params = new URLSearchParams(location.search);
      const productId = params.get('id');
      if (productId && /product\.html$/i.test(location.pathname)) {
        payload.product_id = productId;
        const product = window.DH_CATALOG?.getProductById?.(productId);
        if (product) payload.collection_slug = product.collection;
      }
      const collection = params.get('c');
      if (collection && /collection\.html$/i.test(location.pathname)) {
        payload.collection_slug = collection;
      }
    }

    window.DH_TRACK('whatsapp_click', payload);
  }

  if (!window.DH_WHATSAPP_TRACK_BOUND) {
    window.DH_WHATSAPP_TRACK_BOUND = true;
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href*="wa.me"]');
      if (link) trackWhatsAppClick(link);
    }, true);
  }

  if (document.getElementById('whatsappFloat')) {
    document.body.classList.add('has-whatsapp-float');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
})();
