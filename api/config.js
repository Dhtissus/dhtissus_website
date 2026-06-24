const { getConfig } = require('../lib/supabase');

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).end('Method not allowed');
    return;
  }

  const { url, anonKey, configured } = getConfig();
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(
    `window.DH_SUPABASE=${JSON.stringify({
      url: url || '',
      anonKey: anonKey || '',
      configured: configured,
    })};`
  );
};
