const path = require('path');
const fs = require('fs/promises');
const config = require('../config');

function resolveDataDir(options = {}) {
  return options.dataDir || config.historyDataDir;
}

function getYearFilePath(year, dataDir) {
  return path.join(dataDir, `${year}.json`);
}

async function ensureDir(dataDir) {
  await fs.mkdir(dataDir, { recursive: true });
}

function createEmptyYearFile(year) {
  return {
    year,
    source: config.brhSource,
    updated_at: null,
    entries: [],
  };
}

async function loadYear(year, options = {}) {
  const dataDir = resolveDataDir(options);
  const filePath = getYearFilePath(year, dataDir);

  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createEmptyYearFile(year);
    }
    throw error;
  }
}

async function listYears(options = {}) {
  const dataDir = resolveDataDir(options);

  try {
    const files = await fs.readdir(dataDir);
    return files
      .filter((file) => /^\d{4}\.json$/.test(file))
      .map((file) => parseInt(file.replace('.json', ''), 10))
      .sort((a, b) => a - b);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function toHistoryEntry(data) {
  const {
    date,
    taux_reference,
    marche_informel,
    marche_bancaire,
    tma,
    variations,
    taux_reference_veille,
    transactions_bancaires,
    volume_moyen_semaine,
    tableau,
    fetched_at,
  } = data;

  return {
    date,
    taux_reference,
    marche_informel,
    marche_bancaire,
    tma,
    variations,
    taux_reference_veille,
    transactions_bancaires,
    volume_moyen_semaine,
    tableau,
    fetched_at,
  };
}

async function saveEntry(data, options = {}) {
  if (!data?.date) {
    throw new Error('Impossible de sauvegarder l\'historique sans date');
  }

  const dataDir = resolveDataDir(options);
  await ensureDir(dataDir);

  const year = parseInt(data.date.slice(0, 4), 10);
  const yearFile = await loadYear(year, options);
  const entry = toHistoryEntry(data);

  const existingIndex = yearFile.entries.findIndex((item) => item.date === entry.date);
  if (existingIndex >= 0) {
    yearFile.entries[existingIndex] = entry;
  } else {
    yearFile.entries.push(entry);
  }

  yearFile.entries.sort((a, b) => a.date.localeCompare(b.date));
  yearFile.updated_at = new Date().toISOString();

  const filePath = getYearFilePath(year, dataDir);
  await fs.writeFile(filePath, `${JSON.stringify(yearFile, null, 2)}\n`, 'utf8');

  return { year, entry, filePath };
}

async function getHistory(options = {}) {
  const { year, from, to } = options;

  if (year) {
    const yearFile = await loadYear(year, options);
    let entries = yearFile.entries;

    if (from) {
      entries = entries.filter((entry) => entry.date >= from);
    }
    if (to) {
      entries = entries.filter((entry) => entry.date <= to);
    }

    return { ...yearFile, entries };
  }

  const years = await listYears(options);
  const allEntries = [];

  for (const y of years) {
    const yearFile = await loadYear(y, options);
    allEntries.push(...yearFile.entries);
  }

  let entries = allEntries.sort((a, b) => a.date.localeCompare(b.date));

  if (from) {
    entries = entries.filter((entry) => entry.date >= from);
  }
  if (to) {
    entries = entries.filter((entry) => entry.date <= to);
  }

  return {
    years,
    entries,
    count: entries.length,
  };
}

module.exports = {
  resolveDataDir,
  getYearFilePath,
  loadYear,
  listYears,
  saveEntry,
  getHistory,
  toHistoryEntry,
};
