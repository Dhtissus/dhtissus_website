/**
 * DH TISSU — Vercel Web Analytics (site statique, pas Next.js)
 * Sur Vercel : activez Analytics dans le dashboard du projet.
 */
(function () {
  'use strict';

  if (window.__DH_VERCEL_ANALYTICS__) return;
  window.__DH_VERCEL_ANALYTICS__ = true;

  window.va = window.va || function () {
    (window.va.q = window.va.q || []).push(arguments);
  };

  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  script.onerror = function () {
    /* Indisponible en local — normal */
  };
  document.head.appendChild(script);
})();
