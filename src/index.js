const { createApp } = require('./server/app');
const {
  getTauxDuJour,
  getTauxComplets,
  clearCache,
  getHealthState,
  isReady,
} = require('./services/tauxService');
const { convert } = require('./services/convertService');
const historyService = require('./services/historyService');
const config = require('./config');

module.exports = {
  getTauxDuJour,
  getTauxComplets,
  convert,
  clearCache,
  createApp,
  getHealthState,
  isReady,
  getHistory: historyService.getHistory,
  listHistoryYears: historyService.listYears,
  loadHistoryYear: historyService.loadYear,
  saveToHistory: historyService.saveEntry,
  getHistoryDir: historyService.resolveDataDir,
  config,
};
