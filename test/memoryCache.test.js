const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const memoryCache = require('../src/cache/memoryCache');

describe('memoryCache', () => {
  beforeEach(() => {
    memoryCache.clear();
  });

  it('retourne null quand le cache est vide', () => {
    assert.equal(memoryCache.get(), null);
  });

  it('stocke et récupère une valeur', () => {
    memoryCache.set({ taux_reference: 130 }, 1000);
    assert.deepEqual(memoryCache.get(), { taux_reference: 130 });
  });

  it('expire après le TTL', async () => {
    memoryCache.set({ taux_reference: 130 }, 50);
    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.equal(memoryCache.get(), null);
    assert.deepEqual(memoryCache.getStale(), { taux_reference: 130 });
  });

  it('expose les métadonnées du cache', () => {
    memoryCache.set({ taux_reference: 130 }, 5000);
    const info = memoryCache.getCacheInfo();
    assert.equal(info.hit, true);
    assert.ok(info.age_ms >= 0);
    assert.ok(info.expires_in_ms > 0);
  });
});
