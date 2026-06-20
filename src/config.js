require('dotenv').config();

const path = require('path');

const BRH_SOURCE = 'https://www.brh.ht/taux-du-jour/';

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  brhUrl: process.env.BRH_URL || BRH_SOURCE,
  brhSource: BRH_SOURCE,
  brhTimeoutMs: parseInt(process.env.BRH_TIMEOUT_MS || '10000', 10),
  brhRetries: parseInt(process.env.BRH_RETRIES || '3', 10),
  cacheTtlMs: parseInt(process.env.CACHE_TTL_MS || String(15 * 60 * 1000), 10),
  serveStaleOnError: process.env.SERVE_STALE_ON_ERROR !== 'false',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '60', 10),
  historyDataDir: process.env.HISTORY_DATA_DIR || path.join(process.cwd(), 'data', 'history'),
  saveHistory: process.env.SAVE_HISTORY !== 'false',
};
