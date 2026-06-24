const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { createAdminClient, getConfig } = require('./supabase');

const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'produits';
const LOCAL_UPLOAD_DIR = path.join(path.resolve(__dirname, '..'), 'assets', 'produits');
const MAX_SIZE = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|webp)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('Format accepté : PNG, JPG ou WEBP'));
  },
});

function buildFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase() || '.jpg';
  const base = path.basename(originalname, ext)
    .replace(/[^a-z0-9-]/gi, '-')
    .replace(/-+/g, '-')
    .slice(0, 40)
    .toLowerCase() || 'photo';
  return `${base}-${Date.now()}${ext}`;
}

function parseMultipart(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('image')(req, res, (err) => {
      if (err) reject(err);
      else resolve(req.file || null);
    });
  });
}

async function verifyAdmin(req, res) {
  const { configured } = getConfig();
  if (!configured) {
    res.status(503).json({ error: 'Supabase non configuré' });
    return null;
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Connexion requise' });
    return null;
  }

  try {
    const token = header.slice(7);
    const supabase = createAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Session expirée, reconnectez-vous' });
      return null;
    }
    return user;
  } catch (err) {
    res.status(401).json({ error: err.message });
    return null;
  }
}

async function saveToLocalDisk(file, filename) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  const fullPath = path.join(LOCAL_UPLOAD_DIR, filename);
  fs.writeFileSync(fullPath, file.buffer);
  const relative = `assets/produits/${filename}`;
  return { path: relative, url: `/${relative}` };
}

async function saveToSupabaseStorage(file, filename) {
  const supabase = createAdminClient();
  const storagePath = `uploads/${filename}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(
      error.message.includes('Bucket not found')
        ? `Bucket Supabase « ${STORAGE_BUCKET} » introuvable — créez-le en public dans le dashboard Supabase`
        : error.message
    );
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return { path: data.publicUrl, url: data.publicUrl };
}

async function saveUploadedFile(file) {
  const filename = buildFilename(file.originalname);
  if (process.env.VERCEL) {
    return saveToSupabaseStorage(file, filename);
  }
  return saveToLocalDisk(file, filename);
}

async function handleAdminUpload(req, res) {
  if (req.method && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await verifyAdmin(req, res);
  if (!user) return;

  try {
    const file = await parseMultipart(req, res);
    if (!file) {
      res.status(400).json({ error: 'Aucun fichier sélectionné' });
      return;
    }

    const result = await saveUploadedFile(file);
    res.status(200).json(result);
  } catch (err) {
    console.error('Admin upload error:', err.message);
    res.status(400).json({ error: err.message || 'Upload échoué' });
  }
}

function requireAdminToken(req, res, next) {
  verifyAdmin(req, res).then((user) => {
    if (!user) return;
    req.adminUser = user;
    next();
  });
}

module.exports = {
  handleAdminUpload,
  requireAdminToken,
  buildFilename,
};
