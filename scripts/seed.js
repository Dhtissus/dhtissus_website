/**
 * Importe collections + produits depuis js/products.js vers Supabase
 * Usage : node scripts/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { createAdminClient } = require('../lib/supabase');
const { loadStaticCatalog, productToRow, collectionToRow } = require('../lib/catalog');

async function seed() {
  const supabase = createAdminClient();
  const data = loadStaticCatalog();

  console.log('\n  DH TISSU — Import vers Supabase\n');

  const collectionRows = Object.entries(data.collections).map(([slug, col], i) =>
    collectionToRow(slug, col, i)
  );

  const { error: colErr } = await supabase.from('collections').upsert(collectionRows, { onConflict: 'slug' });
  if (colErr) throw colErr;
  console.log(`  ✓ ${collectionRows.length} collections importées`);

  const productRows = data.products.map(productToRow);
  const batchSize = 50;
  for (let i = 0; i < productRows.length; i += batchSize) {
    const batch = productRows.slice(i, i + batchSize);
    const { error } = await supabase.from('products').upsert(batch, { onConflict: 'id' });
    if (error) throw error;
  }
  console.log(`  ✓ ${productRows.length} produits importés`);

  await supabase.from('site_settings').upsert(
    { key: 'whatsapp', value: data.whatsapp || '212600000000' },
    { onConflict: 'key' }
  );
  console.log('  ✓ Paramètres WhatsApp enregistrés\n');
  console.log('  Import terminé. Lancez le serveur et ouvrez /admin\n');
}

seed().catch((err) => {
  console.error('\n  Erreur import :', err.message);
  console.error('  Vérifiez .env et que schema.sql a été exécuté dans Supabase.\n');
  process.exit(1);
});
