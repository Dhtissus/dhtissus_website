/**
 * DH TISSU — Page catalogue collections
 */
(async function () {
  'use strict';

  await window.DH_CATALOG_READY;
  const data = window.DH_TISSU;
  const utils = window.DH_CATALOG;
  if (!data || !utils) return;

  if (window.DH_TRACK) {
    const c = new URLSearchParams(window.location.search).get('c');
    window.DH_TRACK('catalog_view', { collection_slug: c || 'all' });
  }

  const params = new URLSearchParams(window.location.search);
  const COLLECTION_ALIASES = { brocart: 'brocard', satin: 'brochet', dentelle: 'perles' };
  let initialCollection = params.get('c') || 'all';
  if (COLLECTION_ALIASES[initialCollection]) {
    initialCollection = COLLECTION_ALIASES[initialCollection];
    history.replaceState(null, '', `collection.html?c=${initialCollection}`);
  }

  const heroTitle = document.getElementById('catalogTitle');
  const heroDesc = document.getElementById('catalogDesc');
  const heroImage = document.getElementById('catalogHeroImage');
  const heroVideoWrap = document.getElementById('catalogHeroVideoWrap');
  const heroVideo = document.getElementById('catalogHeroVideo');
  const filtersEl = document.getElementById('catalogFilters');
  const gridEl = document.getElementById('productsGrid');
  const countEl = document.getElementById('productsCount');
  const emptyEl = document.getElementById('productsEmpty');

  let activeFilter = initialCollection;

  function playHeroVideo() {
    if (!heroVideo) return;
    heroVideo.play().catch(() => {
      document.addEventListener('click', () => heroVideo.play(), { once: true });
    });
  }

  function updateHero() {
    if (activeFilter === 'all' || !data.collections[activeFilter]) {
      heroTitle.textContent = 'Notre Catalogue';
      heroDesc.textContent = 'Découvrez nos tissus disponibles — matières nobles sélectionnées avec exigence pour vos créations haute couture.';
      heroVideoWrap.hidden = false;
      heroImage.hidden = true;
      playHeroVideo();
      document.title = 'Catalogue — DH TISSU | Tissus Haute Couture Casablanca';
      return;
    }

    heroVideoWrap.hidden = true;
    heroImage.hidden = false;
    heroVideo?.pause();

    const col = data.collections[activeFilter];
    heroTitle.textContent = `Collection ${col.name}`;
    heroDesc.textContent = col.description;
    heroImage.src = col.image;
    heroImage.alt = `Collection ${col.name} — DH TISSU`;
    document.title = `${col.name} — Catalogue DH TISSU | Casablanca`;
  }

  function buildFilters() {
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = 'catalog-filter' + (activeFilter === 'all' ? ' catalog-filter--active' : '');
    allBtn.dataset.filter = 'all';
    allBtn.textContent = 'Toutes';
    filtersEl.appendChild(allBtn);

    Object.entries(data.collections).forEach(([slug, col]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'catalog-filter' + (activeFilter === slug ? ' catalog-filter--active' : '');
      btn.dataset.filter = slug;
      btn.textContent = col.name;
      filtersEl.appendChild(btn);
    });

    filtersEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.catalog-filter');
      if (!btn) return;

      activeFilter = btn.dataset.filter;
      filtersEl.querySelectorAll('.catalog-filter').forEach((b) => {
        b.classList.toggle('catalog-filter--active', b.dataset.filter === activeFilter);
      });

      updateHero();
      renderProducts();

      const url = activeFilter === 'all'
        ? 'collection.html'
        : `collection.html?c=${activeFilter}`;
      history.replaceState(null, '', url);
    });
  }

  function renderProducts() {
    const filtered = activeFilter === 'all'
      ? data.products
      : data.products.filter((p) => utils.productInCollection(p, activeFilter));

    gridEl.innerHTML = '';
    countEl.textContent = `${filtered.length} produit${filtered.length !== 1 ? 's' : ''}`;
    emptyEl.hidden = filtered.length > 0;

    filtered.forEach((product, i) => {
      const col = data.collections[product.collection];
      const images = utils.getProductImages(product);
      const specs = utils.formatSpecsShort(product);
      const productUrl = utils.getProductUrl(product.id);
      const card = document.createElement('article');
      card.className = 'product-card reveal' + (product.available ? '' : ' product-card--unavailable');
      card.style.transitionDelay = `${(i % 6) * 80}ms`;

      const galleryDots = images.length > 1
        ? `<div class="product-card__gallery-dots">${images.map((_, idx) =>
            `<button type="button" class="product-card__gallery-dot${idx === 0 ? ' active' : ''}" aria-label="Photo ${idx + 1}" data-index="${idx}"></button>`
          ).join('')}</div>`
        : '';

      card.innerHTML = `
        <a href="${productUrl}" class="product-card__image-link">
          <div class="product-card__image">
            <img src="${images[0]}" alt="${product.name} — ${col?.name || ''}" loading="lazy" data-product-image${utils.getImageFitClass(product) ? ` class="${utils.getImageFitClass(product)}"` : ''}>
            ${product.available ? '' : '<span class="product-card__badge">Épuisé</span>'}
            ${galleryDots}
            <div class="product-card__shine"></div>
          </div>
        </a>
        <div class="product-card__body">
          <span class="product-card__collection">${col?.name || product.collection}</span>
          <h3 class="product-card__name"><a href="${productUrl}">${product.name}</a></h3>
          ${specs ? `<p class="product-card__specs">${specs}</p>` : ''}
          ${product.colors ? `<p class="product-card__specs">Coloris : ${product.colors.join(', ')}</p>` : ''}
          <p class="product-card__desc">${product.description}</p>
          <div class="product-card__footer">
            <div class="product-card__price">
              <span class="product-card__price-value">${utils.formatPrice(product.price)}</span>
              <span class="product-card__price-unit">MAD / ${product.unit}</span>
            </div>
            <a href="${productUrl}" class="product-card__cta">Voir le produit</a>
          </div>
        </div>
      `;

      if (images.length > 1) {
        const imgEl = card.querySelector('[data-product-image]');
        card.querySelectorAll('.product-card__gallery-dot').forEach((dot) => {
          dot.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const index = Number(dot.dataset.index);
            imgEl.src = images[index];
            card.querySelectorAll('.product-card__gallery-dot').forEach((d) => {
              d.classList.toggle('active', d === dot);
            });
          });
        });
      }

      gridEl.appendChild(card);
    });

    observeReveal();
    bindShineEffect();
  }

  function observeReveal() {
    const els = gridEl.querySelectorAll('.reveal:not(.visible)');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el) => observer.observe(el));
  }

  function bindShineEffect() {
    gridEl.querySelectorAll('.product-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const shine = card.querySelector('.product-card__shine');
        if (shine) {
          shine.style.transform = `translateX(${x - 50}%)`;
          shine.style.opacity = '0.25';
        }
      });
      card.addEventListener('mouseleave', () => {
        const shine = card.querySelector('.product-card__shine');
        if (shine) {
          shine.style.transform = 'translateX(-100%)';
          shine.style.opacity = '';
        }
      });
    });
  }

  buildFilters();
  updateHero();
  renderProducts();
})();
