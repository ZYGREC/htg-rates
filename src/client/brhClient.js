const axios = require('axios');
const config = require('../config');

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapAxiosError(error) {
  if (error.code === 'ECONNABORTED') {
    return new Error('Timeout lors de la récupération de la page BRH');
  }
  if (error.response) {
    return new Error(`Erreur HTTP ${error.response.status}: ${error.message}`);
  }
  if (error.request) {
    return new Error('Impossible de se connecter au site BRH (vérifiez votre connexion réseau)');
  }
  return new Error(`Erreur lors de la récupération de la page BRH: ${error.message}`);
}

/**
 * Récupère le HTML de la page des taux du jour de la BRH avec retry exponentiel.
 * @returns {Promise<string>}
 */
async function fetchBrhHtml(options = {}) {
  const url = options.url || config.brhUrl;
  const timeout = options.timeout ?? config.brhTimeoutMs;
  const maxAttempts = options.retries ?? config.brhRetries;

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await axios.get(url, {
        headers: DEFAULT_HEADERS,
        timeout,
        validateStatus: () => true,
      });

      if (response.status !== 200) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      return response.data;
    } catch (error) {
      lastError = mapAxiosError(error);
      if (attempt < maxAttempts) {
        await sleep(250 * 2 ** (attempt - 1));
      }
    }
  }

  throw lastError;
}

module.exports = {
  fetchBrhHtml,
};
