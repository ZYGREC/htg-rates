#!/usr/bin/env node

require('dotenv').config();

const { createApp } = require('./server/app');
const config = require('./config');

const app = createApp();
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Endpoint disponible: http://localhost:${PORT}/api/brh/taux-du-jour`);
});

module.exports = app;
