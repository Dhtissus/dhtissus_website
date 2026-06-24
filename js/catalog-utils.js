/**
 * DH TISSU — Utilitaires catalogue (partagés catalogue + fiche produit)
 */
window.DH_CATALOG = {
  formatPrice(price) {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  formatDecimal(value) {
    return String(value).replace('.', ',');
  },

  getProductImages(product) {
    if (product.images && product.images.length) return product.images;
    return [product.image];
  },

  getImageFitClass(product) {
    if (product.imageFit === 'top') return 'img-fit-top';
    if (product.imageFit === 'contain') return 'img-fit-contain';
    return '';
  },

  getProductById(id) {
    const data = window.DH_TISSU;
    if (!data) return null;
    return data.products.find((p) => p.id === id) || null;
  },

  getProductUrl(id) {
    return `product.html?id=${encodeURIComponent(id)}`;
  },

  getCollectionName(slug) {
    return window.DH_TISSU?.collections[slug]?.name || slug;
  },

  formatSpecsShort(product) {
    const parts = [];
    if (product.coupon) parts.push(`Coupon ${this.formatDecimal(product.coupon)} m`);
    if (product.width) parts.push(`Largeur ${this.formatDecimal(product.width)} m`);
    return parts.join(' · ');
  },

  getWhatsAppLink(product) {
    const data = window.DH_TISSU;
    if (!data) return '#';

    const collectionName = this.getCollectionName(product.collection);
    let specs = '';
    if (product.coupon) specs += `\n• Coupon : ${this.formatDecimal(product.coupon)} m`;
    if (product.width) specs += `\n• Largeur : ${this.formatDecimal(product.width)} m`;

    const pageUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, '')}${this.getProductUrl(product.id)}`;

    const message = encodeURIComponent(
      `Bonjour DH TISSU,\n\n` +
      `Je souhaite commander :\n` +
      `• ${product.name}\n` +
      `• Réf. : ${product.id}\n` +
      `• Collection : ${collectionName}\n` +
      `• Prix : ${this.formatPrice(product.price)} MAD / ${product.unit}` +
      specs +
      `\n• Lien : ${pageUrl}\n\n` +
      `Merci de me confirmer la disponibilité et les modalités.`
    );
    return `https://wa.me/${data.whatsapp}?text=${message}`;
  },

  getRelatedProducts(product, limit = 4) {
    const data = window.DH_TISSU;
    if (!data) return [];
    const slugs = product.collections || [product.collection];
    return data.products
      .filter((p) => {
        if (p.id === product.id) return false;
        const pSlugs = p.collections || [p.collection];
        return slugs.some((s) => pSlugs.includes(s));
      })
      .slice(0, limit);
  },

  productInCollection(product, slug) {
    const slugs = product.collections || [product.collection];
    return slugs.includes(slug);
  },

  getDefaultFeatures(product) {
    const features = ['Matière sélectionnée haute couture', 'Conseil personnalisé en showroom'];
    if (product.unit === 'coupon') features.push('Vendu par coupon — quantité limitée');
    else features.push('Vendu au mètre — découpe sur mesure');
    if (product.available) features.push('Disponible en showroom Casablanca');
    return features;
  },

  isUsableImage(src) {
    return Boolean(src && !(src.startsWith('http') && src.includes('unsplash.com')));
  },

  getCatalogVisualPool() {
    const data = window.DH_TISSU;
    if (!data) return [];

    const pool = [];
    const seen = new Set();

    Object.entries(data.collections || {}).forEach(([slug, col]) => {
      const src = col.image;
      if (!this.isUsableImage(src) || seen.has(src)) return;
      seen.add(src);
      pool.push({ src, label: col.name, href: `collection.html?c=${slug}` });
    });

    (data.products || []).forEach((product) => {
      this.getProductImages(product).forEach((src) => {
        if (!this.isUsableImage(src) || seen.has(src)) return;
        seen.add(src);
        pool.push({ src, label: product.name, href: this.getProductUrl(product.id) });
      });
    });

    return pool;
  },

  pickRandomVisuals(count) {
    const pool = [...this.getCatalogVisualPool()];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    if (!pool.length) return [];
    const picks = pool.slice(0, count);
    while (picks.length < count) {
      picks.push(pool[picks.length % pool.length]);
    }
    return picks;
  },
};
