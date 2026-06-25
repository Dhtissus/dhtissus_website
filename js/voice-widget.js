/**
 * DH TISSU — Chatbot vocal Qubot
 */
(function (w, d, s, o, f, js) {
  w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments); };
  js = d.createElement(s);
  js.id = o;
  js.src = f;
  js.async = 1;
  (d.head || d.body).appendChild(js);
}(window, document, 'script', 'vw', 'https://qubot.app/widget/embed.js'));
vw('init', 'wgt_Qqw8WS3vZBk0JRN9GM7vlETF');

(function () {
  'use strict';

  const MOBILE_MQ = window.matchMedia('(max-width: 1024px)');

  function markFloatingWidgets() {
    if (document.getElementById('whatsappFloat') || document.getElementById('vw-container')) {
      document.body.classList.add('has-floating-widgets');
    }
  }

  function layoutWidgets() {
    const vw = document.getElementById('vw-container');
    if (!vw || !MOBILE_MQ.matches) return;
    const wa = document.getElementById('whatsappFloat');
    const waWidth = wa ? wa.getBoundingClientRect().width + 16 : 72;
    vw.style.setProperty('right', `${waWidth}px`, 'important');
  }

  markFloatingWidgets();

  const observer = new MutationObserver(() => {
    markFloatingWidgets();
    layoutWidgets();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('resize', layoutWidgets, { passive: true });
  MOBILE_MQ.addEventListener('change', layoutWidgets);
  window.setTimeout(layoutWidgets, 1200);
  window.setTimeout(layoutWidgets, 3000);
})();
