#!/usr/bin/env node

require('dotenv').config();

const { createApp } = require('./server/app');
const config = require('./config');

function parseArgs(argv) {
  const args = { port: config.port };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--port' || arg === '-p') {
      args.port = parseInt(argv[i + 1], 10);
      i += 1;
    }
  }

  return args;
}

const { port } = parseArgs(process.argv);
const app = createApp();

app.listen(port, () => {
  console.log(`htg-rates démarré sur le port ${port}`);
  console.log(`Taux du jour: http://localhost:${port}/api/brh/taux-du-jour`);
  console.log(`Documentation: http://localhost:${port}/docs`);
});
