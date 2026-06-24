require('dotenv').config();

const express = require('express');
const path = require('path');
const { mountApiRoutes } = require('./lib/api-routes');

const ROOT = path.resolve(__dirname);
const PREFERRED_PORTS = [Number(process.env.PORT) || 8080, 8081, 8082, 8888, 3000];

const app = express();
app.use(express.json({ limit: '2mb' }));

mountApiRoutes(app);

app.get('/admin', (_req, res) => res.redirect('/admin/login.html'));

app.use(express.static(ROOT, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (/\.(js|html)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  },
}));

module.exports = app;

function tryListen(ports, index) {
  const port = ports[index];
  if (port === undefined) {
    console.error('  Aucun port disponible.');
    process.exit(1);
  }

  const server = app.listen(port, '127.0.0.1', () => {
    const { getConfig } = require('./lib/supabase');
    const { configured } = getConfig();
    console.log('');
    console.log('  DH TISSU — Serveur démarré');
    console.log('  Site public  : http://localhost:' + port);
    console.log('  Admin        : http://localhost:' + port + '/admin');
    console.log('  Supabase     : ' + (configured ? 'connecté' : 'non configuré (fallback products.js)'));
    console.log('  Ctrl+C pour arrêter');
    console.log('');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log('  Port ' + port + ' occupé, essai sur ' + ports[index + 1] + '...');
      tryListen(ports, index + 1);
      return;
    }
    console.error('  Erreur serveur :', err.message);
    process.exit(1);
  });
}

if (!process.env.VERCEL) {
  tryListen(PREFERRED_PORTS, 0);
}
