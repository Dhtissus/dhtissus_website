/**
 * DH TISSU — Fiche produit e-commerce
 */
(async function () {
  'use strict';

  await window.DH_CATALOG_READY;
  const utils = window.DH_CATALOG;
  const data = window.DH_TISSU;
  if (!utils || !data) return;

  const productId = new URLSearchParams(window.location.search).get('id');
  const product = productId ? utils.getProductById(productId) : null;

  const notFoundEl = document.getElementById('productNotFound');
  const pageEl = document.getElementById('productPage');

  if (!product) {
    notFoundEl.hidden = false;
    document.title = 'Produit introuvable — DH TISSU';
    return;
  }

  const col = data.collections[product.collection];
  const images = utils.getProductImages(product);
  const features = product.features || utils.getDefaultFeatures(product);
  const fullDescription = product.details || product.description;
  const waLink = utils.getWhatsAppLink(product);

  pageEl.hidden = false;

  /* ── SEO ── */
  document.title = `${product.name} — DH TISSU | ${col?.name || 'Haute Couture'}`;
  document.getElementById('productCanonical').href = `https://www.dhtissu.ma/product.html?id=${product.id}`;
  document.getElementById('ogTitle').content = `${product.name} — DH TISSU`;
  document.getElementById('ogDescription').content = product.description;
  document.getElementById('ogImage').content = images[0].startsWith('http') ? images[0] : `https://www.dhtissu.ma/${images[0]}`;
  document.getElementById('ogUrl').content = window.location.href;
  document.querySelector('meta[name="description"]').content = product.description;

  /* ── Breadcrumb ── */
  document.getElementById('productBreadcrumb').innerHTML = `
    <a href="index.html">Accueil</a>
    <span aria-hidden="true">/</span>
    <a href="collection.html">Catalogue</a>
    <span aria-hidden="true">/</span>
    <a href="collection.html?c=${product.collection}">${col?.name || product.collection}</a>
    <span aria-hidden="true">/</span>
    <span>${product.name}</span>
  `;

  /* ── Gallery ── */
  const imageFitClass = utils.getImageFitClass(product);
  const mainImg = document.getElementById('productMainImage');
  mainImg.src = images[0];
  mainImg.alt = `${product.name} — ${col?.name || ''}`;
  if (imageFitClass) mainImg.classList.add(imageFitClass);

  const thumbsEl = document.getElementById('productThumbs');
  if (images.length > 1) {
    images.forEach((src, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'product-gallery__thumb' + (i === 0 ? ' active' : '');
      btn.innerHTML = `<img src="${src}" alt="Vue ${i + 1} — ${product.name}"${imageFitClass ? ` class="${imageFitClass}"` : ''}>`;
      btn.addEventListener('click', () => {
        mainImg.src = src;
        thumbsEl.querySelectorAll('.product-gallery__thumb').forEach((t, j) => {
          t.classList.toggle('active', j === i);
        });
      });
      thumbsEl.appendChild(btn);
    });
  } else {
    thumbsEl.hidden = true;
  }

  /* ── Info ── */
  const collectionLink = document.getElementById('productCollection');
  collectionLink.href = `collection.html?c=${product.collection}`;
  collectionLink.textContent = col?.name || product.collection;

  document.getElementById('productTitle').textContent = product.name;
  document.getElementById('productRef').textContent = `Réf. ${product.id}`;
  document.getElementById('productPrice').textContent = `${utils.formatPrice(product.price)} MAD`;
  document.getElementById('productPriceUnit').textContent = `/ ${product.unit}`;
  document.getElementById('productSummary').textContent = product.description;

  const stockEl = document.getElementById('productStock');
  stockEl.textContent = product.available ? 'En stock' : 'Épuisé';
  stockEl.className = 'product-info__stock ' + (product.available ? 'product-info__stock--in' : 'product-info__stock--out');

  /* ── Specs table ── */
  const specsEl = document.getElementById('productSpecs');
  const specRows = [
    ['Collection', col?.name || product.collection],
    ['Prix', `${utils.formatPrice(product.price)} MAD / ${product.unit}`],
  ];
  if (product.coupon) specRows.push(['Coupon', `${utils.formatDecimal(product.coupon)} m`]);
  if (product.width) specRows.push(['Largeur', `${utils.formatDecimal(product.width)} m`]);
  if (product.brand) specRows.push(['Marque', product.brand]);
  if (product.colors && product.colors.length) specRows.push(['Coloris', product.colors.join(', ')]);
  specRows.push(['Disponibilité', product.available ? 'Disponible' : 'Épuisé']);

  specsEl.innerHTML = specRows.map(([label, value]) =>
    `<div class="product-specs__row"><dt>${label}</dt><dd>${value}</dd></div>`
  ).join('');

  /* ── Actions ── */
  document.getElementById('productActions').innerHTML = product.available
    ? `<a href="${waLink}" class="btn btn--primary btn--full" target="_blank" rel="noopener noreferrer">Commander sur WhatsApp</a>
       <a href="index.html#rendez-vous" class="btn btn--outline btn--full">Prendre rendez-vous</a>`
    : `<span class="btn btn--full product-actions__disabled">Produit épuisé</span>
       <a href="collection.html?c=${product.collection}" class="btn btn--outline btn--full">Voir la collection</a>`;

  document.getElementById('whatsappFloat').href = waLink;

  window.DH_PRODUCT_CONTEXT = { id: product.id, collection: product.collection };

  if (window.DH_TRACK) {
    window.DH_TRACK('product_view', { product_id: product.id, collection_slug: product.collection });
  }

  /* ── Description & features ── */
  const descParts = fullDescription.split('\n\n').map((p) => `<p>${p}</p>`).join('');
  document.getElementById('productDescription').innerHTML = descParts;

  document.getElementById('productFeatures').innerHTML = features
    .map((f) => `<li><span aria-hidden="true">◆</span>${f}</li>`)
    .join('');

  /* ── Tabs ── */
  document.querySelectorAll('.product-details__tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.product-details__tab').forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });
      document.querySelectorAll('.product-details__panel').forEach((panel) => {
        const isActive = panel.id === `panel-${target}`;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
      });
    });
  });

  /* ── Related products ── */
  const related = utils.getRelatedProducts(product);
  if (related.length) {
    const relatedSection = document.getElementById('productRelated');
    const relatedGrid = document.getElementById('relatedProducts');
    relatedSection.hidden = false;

    related.forEach((item) => {
      const itemCol = data.collections[item.collection];
      const card = document.createElement('a');
      card.href = utils.getProductUrl(item.id);
      card.className = 'product-card product-card--link reveal';
      card.innerHTML = `
        <div class="product-card__image">
          <img src="${utils.getProductImages(item)[0]}" alt="${item.name}" loading="lazy">
        </div>
        <div class="product-card__body">
          <span class="product-card__collection">${itemCol?.name || item.collection}</span>
          <h3 class="product-card__name">${item.name}</h3>
          <div class="product-card__footer">
            <div class="product-card__price">
              <span class="product-card__price-value">${utils.formatPrice(item.price)}</span>
              <span class="product-card__price-unit">MAD / ${item.unit}</span>
            </div>
          </div>
        </div>
      `;
      relatedGrid.appendChild(card);
    });

    relatedGrid.querySelectorAll('.reveal').forEach((el) => {
      requestAnimationFrame(() => el.classList.add('visible'));
    });
  }

  /* ── Schema.org Product ── */
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'DH TISSU' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MAD',
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'DH TISSU' },
    },
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
})();
