/**
 * DH TISSU — Galerie accueil (photos aléatoires du catalogue)
 */
(async function () {
  'use strict';

  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const LAYOUT = [
    'gallery__item gallery__item--large',
    'gallery__item',
    'gallery__item',
    'gallery__item',
    'gallery__item',
    'gallery__item gallery__item--wide',
    'gallery__item',
    'gallery__item',
  ];
  const COUNT = LAYOUT.length;

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function buildPool(data, utils) {
    return utils.getCatalogVisualPool();
  }

  function fillGrid(picks, utils) {
    grid.innerHTML = picks.map((item, i) => {
      const cls = LAYOUT[i] || 'gallery__item';
      const href = item.href || utils.getProductUrl(item.id);
      const label = item.label || item.name;
      return `<a href="${href}" class="${cls}">
        <img src="${item.src}" alt="${esc(label)}" loading="lazy">
        <div class="gallery__overlay"><span>Voir le produit</span></div>
      </a>`;
    }).join('');
    grid.classList.add('reveal', 'visible');
  }

  try {
    await window.DH_CATALOG_READY;
    const data = window.DH_TISSU;
    const utils = window.DH_CATALOG;
    if (!data || !utils) return;

    const pool = buildPool(data, utils);
    if (!pool.length) {
      grid.innerHTML = '<p class="gallery__empty">Aucune photo disponible dans le catalogue.</p>';
      return;
    }

    const picks = utils.pickRandomVisuals(COUNT);

    fillGrid(picks, utils);
  } catch {
    grid.innerHTML = '<p class="gallery__empty">Galerie indisponible.</p>';
  }
})();
