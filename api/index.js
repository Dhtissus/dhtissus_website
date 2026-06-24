require('dotenv').config();

const express = require('express');
const { mountApiRoutes } = require('../lib/api-routes');

const app = express();
app.use(express.json({ limit: '2mb' }));
mountApiRoutes(app);

module.exports = app;
