const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getConfig } = require('./supabase');
const { getCatalog } = require('./catalog');
const { requireAdminToken } = require('./upload-auth');

const UPLOAD_DIR = process.env.VERCEL
  ? path.join('/tmp', 'dhtissu-uploads')
  : path.join(path.resolve(__dirname, '..'), 'assets', 'produits');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9-]/gi, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)
      .toLowerCase() || 'photo';
    cb(null, `${base}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format accepté : PNG, JPG ou WEBP'));
  },
});

function mountApiRoutes(app) {
  app.get('/api/catalog', async (_req, res) => {
    try {
      const catalog = await getCatalog();
      const { source, ...data } = catalog;
      res.json({ ...data, _source: source });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/config.js', (_req, res) => {
    const { url, anonKey, configured } = getConfig();
    res.type('application/javascript');
    res.send(
      `window.DH_SUPABASE=${JSON.stringify({
        url: url || '',
        anonKey: anonKey || '',
        configured: configured,
      })};`
    );
  });

  app.post('/api/appointments', async (req, res) => {
    const { configured } = getConfig();
    if (!configured) return res.status(503).json({ error: 'Base de données non configurée' });

    const { full_name, phone, project_type, message } = req.body || {};
    const name = String(full_name || '').trim();
    const tel = String(phone || '').trim();
    const project = String(project_type || '').trim();
    const allowed = ['mariage', 'caftan', 'soiree', 'styliste', 'autre'];

    if (!name || !tel || !project) {
      return res.status(400).json({ error: 'Nom, téléphone et type de projet sont requis' });
    }
    if (!allowed.includes(project)) {
      return res.status(400).json({ error: 'Type de projet invalide' });
    }

    try {
      const { createAdminClient } = require('./supabase');
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('appointment_requests').insert({
        full_name: name,
        phone: tel,
        project_type: project,
        message: message ? String(message).trim().slice(0, 5000) : null,
      }).select('id').single();

      if (error) throw error;
      res.json({ ok: true, id: data.id });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Enregistrement échoué' });
    }
  });

  app.post('/api/analytics', async (req, res) => {
    const { configured } = getConfig();
    if (!configured) return res.json({ ok: true, skipped: true });

    try {
      const { createAdminClient } = require('./supabase');
      const supabase = createAdminClient();
      const { event_type, product_id, collection_slug, metadata } = req.body || {};
      if (!event_type) return res.status(400).json({ error: 'event_type requis' });

      const { error } = await supabase.from('analytics_events').insert({
        event_type,
        product_id: product_id || null,
        collection_slug: collection_slug || null,
        metadata: metadata || {},
      });
      if (error) throw error;
      res.json({ ok: true });
    } catch (err) {
      console.error('Analytics insert failed:', err.message);
      res.status(500).json({ error: err.message || 'Enregistrement échoué' });
    }
  });

  app.post('/api/admin/upload', requireAdminToken, (req, res) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Upload échoué' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Aucun fichier sélectionné' });
      }
      const relative = `assets/produits/${req.file.filename}`;
      res.json({ path: relative, url: `/${relative}` });
    });
  });
}

module.exports = { mountApiRoutes };
