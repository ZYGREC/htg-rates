const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const memoryCache = require('../src/cache/memoryCache');
const { convert } = require('../src/services/convertService');

const sampleRates = {
  date: '2026-06-19',
  taux_reference: 130.5329,
  marche_bancaire: { achats: 130.2215, ventes: 131.1009, spread: 0.8794 },
  marche_informel: { achats: 131, ventes: 136, spread: 5 },
  source: 'https://www.brh.ht/taux-du-jour/',
  fetched_at: '2026-06-19T12:00:00.000Z',
};

describe('convertService', () => {
  beforeEach(() => {
    memoryCache.clear();
    memoryCache.set(sampleRates, 60000);
  });

  it('convertit USD vers HTG avec le taux de référence', async () => {
    const result = await convert(100, { from: 'USD', to: 'HTG' });
    assert.equal(result.result, 13053.29);
    assert.equal(result.rate_type, 'reference');
  });

  it('convertit HTG vers USD', async () => {
    const result = await convert(13053.29, { from: 'HTG', to: 'USD' });
    assert.equal(result.result, 100);
  });

  it('supporte les types de taux bancaires', async () => {
    const result = await convert(100, {
      from: 'USD',
      to: 'HTG',
      rateType: 'bancaire_vente',
    });
    assert.equal(result.rate, 131.1009);
    assert.equal(result.result, 13110.09);
  });

  it('rejette un montant invalide', async () => {
    await assert.rejects(
      () => convert(-10, { from: 'USD', to: 'HTG' }),
      /montant doit être un nombre positif/
    );
  });

  it('rejette une devise inconnue', async () => {
    await assert.rejects(
      () => convert(100, { from: 'EUR', to: 'HTG' }),
      /Devises supportées/
    );
  });

  it('rejette un type de taux invalide', async () => {
    await assert.rejects(
      () => convert(100, { from: 'USD', to: 'HTG', rateType: 'invalid' }),
      /Type de taux invalide/
    );
  });
});
