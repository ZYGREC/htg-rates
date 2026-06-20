const { fetchBrhHtml } = require('../client/brhClient');
const { parseBrhHtml } = require('../parsers/brhParser');
const memoryCache = require('../cache/memoryCache');
const historyService = require('./historyService');
const config = require('../config');

let lastFetchSucceeded = false;

function formatLegacyResponse(parsed, fetchedAt) {
  const date =
    parsed.date || new Date(fetchedAt).toISOString().split('T')[0];

  return {
    date,
    taux_reference: parsed.taux_reference,
    taux_du_jour: parsed.taux_reference,
    source: config.brhSource,
  };
}

function formatFullResponse(parsed, fetchedAt) {
  const date =
    parsed.date || new Date(fetchedAt).toISOString().split('T')[0];

  return {
    date,
    taux_reference: parsed.taux_reference,
    marche_informel: parsed.marche_informel,
    marche_bancaire: parsed.marche_bancaire,
    tma: parsed.tma,
    transactions_bancaires: parsed.transactions_bancaires,
    volume_moyen_semaine: parsed.volume_moyen_semaine,
    variations: parsed.variations,
    taux_reference_veille: parsed.taux_reference_veille,
    tableau: parsed.tableau,
    source: config.brhSource,
    fetched_at: fetchedAt,
  };
}

async function persistHistory(data, options = {}) {
  if (options.skipHistory || config.saveHistory === false) {
    return null;
  }

  try {
    return await historyService.saveEntry(data, options);
  } catch (error) {
    console.error('Erreur sauvegarde historique:', error.message);
    return null;
  }
}

async function fetchAndParse(options = {}) {
  const html = await fetchBrhHtml(options);
  const parsed = parseBrhHtml(html);
  const fetchedAt = new Date().toISOString();

  const fullData = formatFullResponse(parsed, fetchedAt);
  memoryCache.set(fullData);
  lastFetchSucceeded = true;

  await persistHistory(fullData, options);

  return fullData;
}

async function getTauxComplets(options = {}) {
  const forceRefresh = Boolean(options.forceRefresh);

  if (!forceRefresh) {
    const cached = memoryCache.get();
    if (cached) {
      return cached;
    }
  }

  try {
    return await fetchAndParse(options);
  } catch (error) {
    if (config.serveStaleOnError) {
      const stale = memoryCache.getStale();
      if (stale) {
        return { ...stale, stale: true };
      }
    }
    throw error;
  }
}

async function getTauxDuJour(options = {}) {
  const full = await getTauxComplets(options);
  const legacy = formatLegacyResponse(full, full.fetched_at || new Date().toISOString());

  if (full.stale) {
    legacy.stale = true;
  }

  return legacy;
}

function clearCache() {
  memoryCache.clear();
  lastFetchSucceeded = false;
}

function getHealthState() {
  return {
    cache: memoryCache.getCacheInfo(),
    brh: {
      reachable: lastFetchSucceeded || memoryCache.isValid(),
      last_fetch: memoryCache.getLastFetch(),
    },
  };
}

function isReady() {
  return memoryCache.isValid() || lastFetchSucceeded;
}

module.exports = {
  getTauxDuJour,
  getTauxComplets,
  clearCache,
  getHealthState,
  isReady,
  fetchAndParse,
  persistHistory,
};
