const { getConfig, createAdminClient } = require('./supabase');

async function requireAdminToken(req, res, next) {
  const { configured } = getConfig();
  if (!configured) {
    return res.status(503).json({ error: 'Supabase non configuré' });
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Connexion requise' });
  }

  try {
    const token = header.slice(7);
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Session expirée, reconnectez-vous' });
    }
    req.adminUser = user;
    next();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
}

module.exports = { requireAdminToken };
