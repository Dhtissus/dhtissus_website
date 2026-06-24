const { getConfig, createAdminClient } = require('../lib/supabase');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { configured } = getConfig();
  if (!configured) {
    res.status(503).json({ error: 'Base de données non configurée' });
    return;
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body || '{}');
    } catch {
      res.status(400).json({ error: 'JSON invalide' });
      return;
    }
  }

  const { full_name, phone, project_type, message } = body;
  const name = String(full_name || '').trim();
  const tel = String(phone || '').trim();
  const project = String(project_type || '').trim();
  const allowed = ['mariage', 'caftan', 'soiree', 'styliste', 'autre'];

  if (!name || !tel || !project) {
    res.status(400).json({ error: 'Nom, téléphone et type de projet sont requis' });
    return;
  }
  if (!allowed.includes(project)) {
    res.status(400).json({ error: 'Type de projet invalide' });
    return;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('appointment_requests').insert({
      full_name: name,
      phone: tel,
      project_type: project,
      message: message ? String(message).trim().slice(0, 5000) : null,
    }).select('id').single();

    if (error) throw error;
    res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Enregistrement échoué' });
  }
};
