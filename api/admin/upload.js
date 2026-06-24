const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { requireAdminToken } = require('../lib/upload-auth');

const UPLOAD_DIR = path.join('/tmp', 'dhtissu-uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
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
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format accepté : PNG, JPG ou WEBP'));
  },
});

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('image')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const authorized = await new Promise((resolve) => {
    requireAdminToken(req, res, () => resolve(true));
  });
  if (!authorized || res.headersSent) return;

  try {
    await runUpload(req, res);
    if (!req.file) {
      res.status(400).json({ error: 'Aucun fichier sélectionné' });
      return;
    }
    const relative = `assets/produits/${req.file.filename}`;
    res.status(200).json({ path: relative, url: `/${relative}` });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Upload échoué' });
  }
};
