const { getConfig, createAdminClient } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { configured } = getConfig();
  if (!configured) {
    res.status(200).json({ ok: true, skipped: true });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const supabase = createAdminClient();
    const { event_type, product_id, collection_slug, metadata } = body;
    if (!event_type) {
      res.status(400).json({ error: 'event_type requis' });
      return;
    }

    const { error } = await supabase.from('analytics_events').insert({
      event_type,
      product_id: product_id || null,
      collection_slug: collection_slug || null,
      metadata: metadata || {},
    });
    if (error) throw error;
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Analytics insert failed:', err.message);
    res.status(500).json({ error: err.message || 'Enregistrement échoué' });
  }
};
