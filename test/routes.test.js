const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/server/app');
const memoryCache = require('../src/cache/memoryCache');
const tauxService = require('../src/services/tauxService');

const sampleRates = {
  date: '2026-06-19',
  taux_reference: 130.5329,
  marche_informel: { achats: 131, ventes: 136, spread: 5 },
  marche_bancaire: { achats: 130.2215, ventes: 131.1009, spread: 0.8794 },
  tma: { achats: null, ventes: 131.1009 },
  variations: { reference: { jour: 0.06 } },
  taux_reference_veille: { date: '2025-06-18', valeur: 130.9701 },
  source: 'https://www.brh.ht/taux-du-jour/',
  fetched_at: '2026-06-19T12:00:00.000Z',
};

describe('routes', () => {
  let app;

  beforeEach(() => {
    memoryCache.clear();
    memoryCache.set(sampleRates, 60000);
    tauxService.clearCache();
    memoryCache.set(sampleRates, 60000);
    app = createApp({ rateLimit: false });
  });

  it('GET /api/brh/taux-du-jour retourne le format legacy', async () => {
    const res = await request(app).get('/api/brh/taux-du-jour');
    assert.equal(res.status, 200);
    assert.equal(res.body.taux_reference, 130.5329);
    assert.equal(res.body.taux_du_jour, 130.5329);
    assert.equal(res.body.date, '2026-06-19');
  });

  it('GET /api/brh/taux-complets retourne les données enrichies', async () => {
    const res = await request(app).get('/api/brh/taux-complets');
    assert.equal(res.status, 200);
    assert.equal(res.body.taux_reference, 130.5329);
    assert.ok(res.body.marche_bancaire);
    assert.ok(res.body.fetched_at);
  });

  it('GET /api/brh/convert convertit un montant', async () => {
    const res = await request(app).get('/api/brh/convert').query({
      amount: 100,
      from: 'USD',
      to: 'HTG',
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.result, 13053.29);
  });

  it('GET /api/brh/convert retourne 400 si paramètres manquants', async () => {
    const res = await request(app).get('/api/brh/convert').query({
      amount: 100,
      from: 'USD',
    });
    assert.equal(res.status, 400);
  });

  it('GET /health retourne le statut', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.ok(res.body.uptime >= 0);
  });

  it('GET /health/ready retourne ready quand le cache est peuplé', async () => {
    const res = await request(app).get('/health/ready');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ready');
  });

  it('GET / sert le dashboard HTML', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /Évolution du taux de référence/);
  });

  it('GET /api/brh/history/years retourne les années', async () => {
    const res = await request(app).get('/api/brh/history/years');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.years));
  });
});
