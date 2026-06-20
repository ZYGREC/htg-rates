const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseBrhHtml, extractTauxReference, parseBrhDate } = require('../src/parsers/brhParser');
const { buildBrhFixtureHtml } = require('./helpers/brhFixture');

describe('brhParser', () => {
  it('parse la date BRH au format ISO', () => {
    assert.equal(parseBrhDate('19 Juin 2026'), '2026-06-19');
    assert.equal(parseBrhDate('15 Janvier 2024'), '2024-01-15');
  });

  it('extrait le taux de référence depuis une fixture générée', () => {
    const html = buildBrhFixtureHtml({ date: '2024-01-15' });
    assert.equal(extractTauxReference(html), 130.5329);
  });

  it('parse toutes les données selon la date fournie à la fixture', () => {
    const html = buildBrhFixtureHtml({
      date: '2024-01-15',
      veilleDate: '2024-01-14',
    });
    const data = parseBrhHtml(html);

    assert.equal(data.date, '2024-01-15');
    assert.equal(data.taux_reference, 130.5329);
    assert.deepEqual(data.marche_informel, {
      achats: 131,
      ventes: 136,
      spread: 5,
    });
    assert.deepEqual(data.marche_bancaire, {
      achats: 130.2215,
      ventes: 131.1009,
      spread: 0.8794,
    });
    assert.deepEqual(data.tma, { achats: null, ventes: 131.1009 });
    assert.deepEqual(data.transactions_bancaires, {
      achats: 15590360.15,
      ventes: 15520501.18,
    });
    assert.deepEqual(data.volume_moyen_semaine, {
      achats: 17700276.4,
      ventes: 17389418.29,
    });
    assert.ok(Array.isArray(data.tableau));
    assert.ok(data.tableau.some((row) => row.label === 'TRANSACTION BANCAIRES'));
    assert.deepEqual(data.variations.reference, {
      jour: 0.06,
      semaine: 0.05,
      annee: -0.33,
    });
    assert.deepEqual(data.taux_reference_veille, {
      date: '2024-01-14',
      valeur: 130.9701,
    });
  });

  it('suit la date de la fixture et non une valeur figée', () => {
    const html = buildBrhFixtureHtml({ date: '2025-03-08', veilleDate: '2025-03-07' });
    const data = parseBrhHtml(html);

    assert.equal(data.date, '2025-03-08');
    assert.deepEqual(data.taux_reference_veille, {
      date: '2025-03-07',
      valeur: 130.9701,
    });
  });

  it('utilise le fallback hero si le tableau est absent', () => {
    const html = '<html><body><h1>130.5329</h1><h6>Taux de Référence</h6></body></html>';
    assert.equal(extractTauxReference(html), 130.5329);
  });

  it('lève une erreur si aucun taux trouvé', () => {
    assert.throws(
      () => extractTauxReference('<html><body>vide</body></html>'),
      /TAUX DE REFERENCE introuvable/
    );
  });
});
