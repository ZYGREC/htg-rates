const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const historyService = require('../src/services/historyService');

describe('historyService', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'htg-rates-'));
  });

  it('sauvegarde et charge un fichier par année', async () => {
    const entry = {
      date: '2026-06-20',
      taux_reference: 130.5549,
      fetched_at: '2026-06-20T12:00:00.000Z',
    };

    await historyService.saveEntry(entry, { dataDir: tempDir });
    const yearFile = await historyService.loadYear(2026, { dataDir: tempDir });

    assert.equal(yearFile.year, 2026);
    assert.equal(yearFile.entries.length, 1);
    assert.equal(yearFile.entries[0].taux_reference, 130.5549);
  });

  it('met à jour une entrée existante pour la même date', async () => {
    const base = {
      date: '2026-06-20',
      taux_reference: 130.5,
      fetched_at: '2026-06-20T10:00:00.000Z',
    };

    await historyService.saveEntry(base, { dataDir: tempDir });
    await historyService.saveEntry(
      { ...base, taux_reference: 130.6, fetched_at: '2026-06-20T12:00:00.000Z' },
      { dataDir: tempDir }
    );

    const yearFile = await historyService.loadYear(2026, { dataDir: tempDir });
    assert.equal(yearFile.entries.length, 1);
    assert.equal(yearFile.entries[0].taux_reference, 130.6);
  });

  it('liste les années disponibles', async () => {
    await historyService.saveEntry({ date: '2025-03-01', taux_reference: 130 }, { dataDir: tempDir });
    await historyService.saveEntry({ date: '2026-01-01', taux_reference: 131 }, { dataDir: tempDir });

    const years = await historyService.listYears({ dataDir: tempDir });
    assert.deepEqual(years, [2025, 2026]);
  });
});
