require('dotenv').config();

const express = require('express');
const path = require('path');
const { mountApiRoutes } = require('./api-routes');

const ROOT = path.resolve(__dirname, '..');

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
