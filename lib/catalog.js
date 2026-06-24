const { createAdminClient, getConfig } = require('./supabase');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function loadStaticCatalog() {
  try {
    const filePath = path.join(__dirname, '..', 'js', 'products.js');
    const code = fs.readFileSync(filePath, 'utf8');
    const sandbox = { window: {} };
    vm.runInNewContext(code, sandbox);
    if (!sandbox.window.DH_TISSU) {
      throw new Error('products.js invalide');
    }
    return sandbox.window.DH_TISSU;
  } catch (err) {
    console.warn('  Fallback products.js indisponible :', err.message);
    return {
      whatsapp: '212600000000',
      collections: {},
      products: [],
    };
  }
}

function rowToProduct(row) {
  const product = {
    id: row.id,
    collection: row.collection_slug,
    name: row.name,
    price: Number(row.price),
    unit: row.unit || 'coupon',
    description: row.description || '',
    available: row.available !== false,
  };
  if (row.coupon != null) product.coupon = Number(row.coupon);
  if (row.width != null) product.width = Number(row.width);
  if (row.colors?.length) product.colors = row.colors;
  if (row.image_fit) product.imageFit = row.image_fit;
  if (row.image) product.image = row.image;
  if (row.images?.length) product.images = row.images;
  if (row.details) product.details = row.details;
  if (row.features?.length) product.features = row.features;
  if (row.brand) product.brand = row.brand;
  const extra = row.extra_collections || [];
  if (extra.length) {
    product.collections = extra.includes(row.collection_slug)
      ? extra
      : [row.collection_slug, ...extra];
  }
  return product;
}

function rowToCollection(slug, row) {
  return {
    name: row.name,
    description: row.description || '',
    image: row.image || '',
  };
}

async function fetchCatalogFromSupabase() {
  const supabase = createAdminClient();

  const [{ data: collections, error: colErr }, { data: products, error: prodErr }, { data: settings, error: setErr }] =
    await Promise.all([
      supabase.from('collections').select('*').order('sort_order'),
      supabase.from('products').select('*').order('name'),
      supabase.from('site_settings').select('key, value'),
    ]);

  if (colErr) throw colErr;
  if (prodErr) throw prodErr;
  if (setErr) throw setErr;

  const collectionsMap = {};
  (collections || []).forEach((c) => {
    collectionsMap[c.slug] = rowToCollection(c.slug, c);
  });

  const whatsapp = (settings || []).find((s) => s.key === 'whatsapp')?.value || '212600000000';

  return {
    whatsapp,
    collections: collectionsMap,
    products: (products || []).map(rowToProduct),
    source: 'supabase',
  };
}

async function getCatalog() {
  const { configured } = getConfig();
  if (!configured) {
    const staticData = loadStaticCatalog();
    return { ...staticData, source: 'static' };
  }

  try {
    const data = await fetchCatalogFromSupabase();
    if (!data.products.length && !Object.keys(data.collections).length) {
      return { ...loadStaticCatalog(), source: 'static' };
    }
    return data;
  } catch (err) {
    console.warn('  Supabase indisponible, fallback products.js :', err.message);
    return { ...loadStaticCatalog(), source: 'static' };
  }
}

function productToRow(product) {
  const extra = product.collections || [product.collection];
  const uniqueExtra = [...new Set(extra.filter((s) => s !== product.collection))];

  return {
    id: product.id,
    collection_slug: product.collection,
    name: product.name,
    price: product.price,
    unit: product.unit || 'coupon',
    coupon: product.coupon ?? null,
    width: product.width ?? null,
    colors: product.colors || [],
    image_fit: product.imageFit || null,
    image: product.image || null,
    images: product.images || (product.image ? [product.image] : []),
    description: product.description || null,
    details: product.details || null,
    features: product.features || [],
    extra_collections: uniqueExtra,
    brand: product.brand || null,
    available: product.available !== false,
  };
}

function collectionToRow(slug, col, sortOrder) {
  return {
    slug,
    name: col.name,
    description: col.description || null,
    image: col.image || null,
    sort_order: sortOrder,
  };
}

module.exports = {
  getCatalog,
  loadStaticCatalog,
  productToRow,
  collectionToRow,
  rowToProduct,
};
