const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const config = require('../config');
const {
  getTauxDuJour,
  getTauxComplets,
  getHealthState,
  isReady,
} = require('../services/tauxService');
const { convert } = require('../services/convertService');
const historyService = require('../services/historyService');

const startTime = Date.now();

function parseRefreshFlag(value) {
  return value === 'true' || value === '1';
}

function sendWithStaleHeader(res, data) {
  if (data?.stale) {
    res.set('X-Cache-Stale', 'true');
  }
  return res.status(200).json(data);
}

function createRouter() {
  const router = express.Router();

  router.get('/api/brh/taux-du-jour', async (req, res) => {
    try {
      const data = await getTauxDuJour({
        forceRefresh: parseRefreshFlag(req.query.refresh),
      });
      sendWithStaleHeader(res, data);
    } catch (error) {
      console.error('Erreur taux-du-jour:', error.message);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération du taux du jour',
      });
    }
  });

  router.get('/api/brh/taux-complets', async (req, res) => {
    try {
      const data = await getTauxComplets({
        forceRefresh: parseRefreshFlag(req.query.refresh),
      });
      sendWithStaleHeader(res, data);
    } catch (error) {
      console.error('Erreur taux-complets:', error.message);
      res.status(500).json({
        error: error.message || 'Erreur lors de la récupération des taux complets',
      });
    }
  });

  router.get('/api/brh/history/years', async (req, res) => {
    try {
      const years = await historyService.listYears();
      res.status(200).json({ years });
    } catch (error) {
      console.error('Erreur history/years:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/brh/history', async (req, res) => {
    try {
      const { year, from, to } = req.query;

      if (!year && !from && !to) {
        const data = await historyService.getHistory();
        return res.status(200).json(data);
      }

      const data = await historyService.getHistory({
        year: year ? parseInt(year, 10) : undefined,
        from,
        to,
      });
      res.status(200).json(data);
    } catch (error) {
      console.error('Erreur history:', error.message);
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/brh/convert', async (req, res) => {
    try {
      const { amount, from, to, rateType, refresh } = req.query;

      if (amount === undefined || !from || !to) {
        return res.status(400).json({
          error: 'Paramètres requis: amount, from, to',
        });
      }

      const data = await convert(amount, {
        from,
        to,
        rateType,
        forceRefresh: parseRefreshFlag(refresh),
      });
      sendWithStaleHeader(res, data);
    } catch (error) {
      const status = error.message.includes('invalide') || error.message.includes('requis')
        ? 400
        : 500;
      console.error('Erreur convert:', error.message);
      res.status(status).json({ error: error.message });
    }
  });

  router.get('/health', (req, res) => {
    const health = getHealthState();
    res.status(200).json({
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      cache: health.cache,
      brh: health.brh,
    });
  });

  router.get('/health/ready', (req, res) => {
    if (isReady()) {
      return res.status(200).json({ status: 'ready' });
    }

    return res.status(503).json({
      status: 'not_ready',
      message: 'Aucune donnée BRH disponible',
    });
  });

  return router;
}

function createApp(options = {}) {
  const app = express();
  const corsOrigin = options.corsOrigin ?? config.corsOrigin;

  app.use(express.json());
  app.use(
    cors({
      origin: corsOrigin === '*' ? true : corsOrigin,
    })
  );

  if (options.rateLimit !== false) {
    app.use(
      rateLimit({
        windowMs: options.rateLimitWindowMs ?? config.rateLimitWindowMs,
        max: options.rateLimitMax ?? config.rateLimitMax,
        standardHeaders: true,
        legacyHeaders: false,
      })
    );
  }

  const openApiPath = path.join(__dirname, '..', '..', 'openapi.yaml');
  const dashboardPath = path.join(__dirname, '..', 'public', 'dashboard.html');

  app.get('/', (req, res) => {
    res.sendFile(dashboardPath);
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: '/openapi.yaml' },
  }));
  app.get('/openapi.yaml', (req, res) => {
    res.sendFile(openApiPath);
  });

  app.use(createRouter());

  return app;
}

module.exports = {
  createApp,
  createRouter,
};
