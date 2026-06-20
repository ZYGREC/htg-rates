const { getTauxComplets } = require('./tauxService');

const RATE_RESOLVERS = {
  reference: (data) => data.taux_reference,
  bancaire_achat: (data) => data.marche_bancaire?.achats,
  bancaire_vente: (data) => data.marche_bancaire?.ventes,
  informel_achat: (data) => data.marche_informel?.achats,
  informel_vente: (data) => data.marche_informel?.ventes,
};

function roundAmount(value) {
  return Math.round(value * 100) / 100;
}

function resolveRate(data, rateType) {
  const resolver = RATE_RESOLVERS[rateType];
  if (!resolver) {
    throw new Error(
      `Type de taux invalide: ${rateType}. Valeurs acceptées: ${Object.keys(RATE_RESOLVERS).join(', ')}`
    );
  }

  const rate = resolver(data);
  if (rate === null || rate === undefined) {
    throw new Error(`Taux "${rateType}" indisponible pour la date ${data.date}`);
  }

  return rate;
}

/**
 * Convertit un montant USD ↔ HTG selon le taux BRH.
 * @param {number} amount
 * @param {{ from: string, to: string, rateType?: string, forceRefresh?: boolean }} options
 */
async function convert(amount, options = {}) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('Le montant doit être un nombre positif');
  }

  const from = (options.from || '').toUpperCase();
  const to = (options.to || '').toUpperCase();
  const rateType = options.rateType || 'reference';

  if (!['USD', 'HTG'].includes(from) || !['USD', 'HTG'].includes(to)) {
    throw new Error('Devises supportées: USD et HTG');
  }

  if (from === to) {
    throw new Error('Les devises source et cible doivent être différentes');
  }

  const data = await getTauxComplets({ forceRefresh: options.forceRefresh });
  const rate = resolveRate(data, rateType);

  let result;
  if (from === 'USD' && to === 'HTG') {
    result = numericAmount * rate;
  } else {
    result = numericAmount / rate;
  }

  const response = {
    amount: numericAmount,
    from,
    to,
    rate,
    rate_type: rateType,
    result: roundAmount(result),
    date: data.date,
    source: data.source,
  };

  if (data.stale) {
    response.stale = true;
  }

  return response;
}

module.exports = {
  convert,
  RATE_RESOLVERS,
};
