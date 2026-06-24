const { getCatalog } = require('../lib/catalog');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const catalog = await getCatalog();
    const { source, ...data } = catalog;
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.status(200).json({ ...data, _source: source });
  } catch (err) {
    console.error('catalog error:', err);
    res.status(500).json({ error: err.message || 'Catalogue indisponible' });
  }
};
