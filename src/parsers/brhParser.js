const cheerio = require('cheerio');

const FRENCH_MONTHS = {
  janvier: 1,
  fevrier: 2,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  décembre: 12,
};

function normalizeLabel(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function parseNumber(text) {
  if (!text || text === '-' || text === '—') {
    return null;
  }

  const cleaned = text.replace(/\s/g, '').replace(/,/g, '').replace(/\$/g, '');
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

function parseCurrency(text) {
  return parseNumber(text);
}

function parsePercent(text) {
  if (!text || text === '-' || text === '—') {
    return null;
  }

  const match = text.match(/-?[\d.,]+/);
  if (!match) {
    return null;
  }

  return parseNumber(match[0]);
}

function parseBrhDate(text) {
  const match = text.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/i);
  if (!match) {
    return null;
  }

  const day = parseInt(match[1], 10);
  const monthKey = match[2].toLowerCase();
  const year = parseInt(match[3], 10);
  const month = FRENCH_MONTHS[monthKey];

  if (!month) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function extractDateFromHtml(html, $ = cheerio.load(html)) {
  const bodyText = $('body').text();

  const headerMatch = bodyText.match(/Taux du Jour\s*:\s*(\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+\d{4})/i);
  if (headerMatch) {
    const parsed = parseBrhDate(headerMatch[1]);
    if (parsed) {
      return parsed;
    }
  }

  const isoMatch = bodyText.match(/(\d{4}-\d{2}-\d{2})/);
  return isoMatch ? isoMatch[1] : null;
}

function getRowLabel($, row) {
  const firstCell = $(row).find('td, th').first();
  return normalizeLabel(firstCell.text());
}

function getRowValues($, row) {
  const cells = $(row).find('td, th');
  const values = [];

  cells.slice(1).each((_, cell) => {
    const text = $(cell).text().trim();
    if (text.includes('%')) {
      values.push(parsePercent(text));
    } else if (text.includes('$')) {
      values.push(parseCurrency(text));
    } else {
      values.push(parseNumber(text));
    }
  });

  return values;
}

function cellDisplay(value, kind = 'rate') {
  if (kind === 'empty' || value === null || value === undefined) {
    return '-';
  }

  if (kind === 'percent') {
    return `${value}%`;
  }

  if (kind === 'currency') {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return String(value);
}

function buildTableauRow(label, achats, ventes, spread, kinds = {}) {
  return {
    label,
    achats: {
      raw: achats,
      display: cellDisplay(achats, kinds.achats || 'rate'),
      kind: kinds.achats || 'rate',
    },
    ventes: {
      raw: ventes,
      display: cellDisplay(ventes, kinds.ventes || 'rate'),
      kind: kinds.ventes || 'rate',
    },
    spread: {
      raw: spread,
      display: cellDisplay(spread, kinds.spread || 'rate'),
      kind: kinds.spread || 'rate',
    },
  };
}

function findRowByLabel($, labelIncludes) {
  let found = null;

  $('table tr').each((_, row) => {
    const label = getRowLabel($, row);
    if (label.includes(labelIncludes)) {
      found = row;
      return false;
    }
    return undefined;
  });

  return found;
}

function extractMarketRow($, labelIncludes) {
  const row = findRowByLabel($, labelIncludes);
  if (!row) {
    return null;
  }

  const [achats, ventes, spread] = getRowValues($, row);
  return { achats, ventes, spread };
}

function extractReferenceFromTable($) {
  const row = findRowByLabel($, 'TAUX DE REFERENCE');
  if (!row) {
    return null;
  }

  const [tauxReference] = getRowValues($, row);
  return tauxReference;
}

function extractReferenceFromHero($) {
  const heroText = $('h1, h2, h3, .taux-reference, [class*="taux"]').text();
  const match = heroText.match(/([\d.,]+)/);
  return match ? parseNumber(match[1]) : null;
}

function extractReferenceFromRegex(html) {
  const match = html.match(/TAUX DE R[EÉ]F[EÉ]RENCE[\s\S]{0,200}?([\d.,]+)/i);
  return match ? parseNumber(match[1]) : null;
}

function extractTauxReference(html, $ = cheerio.load(html)) {
  const strategies = [
    () => extractReferenceFromTable($),
    () => extractReferenceFromHero($),
    () => extractReferenceFromRegex(html),
  ];

  for (const strategy of strategies) {
    const value = strategy();
    if (value !== null && value > 0) {
      return value;
    }
  }

  throw new Error('TAUX DE REFERENCE introuvable dans le HTML');
}

function extractVariationsForSection($, sectionLabel, options = {}) {
  const { multiColumn = false } = options;
  const sectionRow = findRowByLabel($, sectionLabel);
  if (!sectionRow) {
    return null;
  }

  const variations = {};
  let capture = false;

  $('table tr').each((_, row) => {
    const label = getRowLabel($, row);

    if (label.includes(sectionLabel) && !label.includes('(')) {
      capture = true;
      return undefined;
    }

    if (!capture) {
      return undefined;
    }

    if (label.startsWith('VARIATION / JOUR PRECEDENT')) {
      const values = getRowValues($, row);
      variations.jour = multiColumn
        ? { achats: values[0], ventes: values[1], spread: values[2] }
        : values[0];
      return undefined;
    }

    if (label.startsWith('VARIATION / SEMAINE PRECEDENTE')) {
      const values = getRowValues($, row);
      variations.semaine = multiColumn
        ? { achats: values[0], ventes: values[1], spread: values[2] }
        : values[0];
      return undefined;
    }

    if (label.startsWith('VARIATION / ANNEE PRECEDENTE')) {
      const values = getRowValues($, row);
      variations.annee = multiColumn
        ? { achats: values[0], ventes: values[1], spread: values[2] }
        : values[0];
      return undefined;
    }

    if (!label.startsWith('VARIATION /')) {
      return false;
    }

    return undefined;
  });

  return Object.keys(variations).length > 0 ? variations : null;
}

function formatVeilleLabel(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year.slice(-2)}`;
}

function extractTauxReferenceVeille($) {
  let result = null;

  $('table tr').each((_, row) => {
    const label = getRowLabel($, row);
    if (label.includes('TAUX DE REFERENCE') && label.includes('(')) {
      const dateMatch = label.match(/\((\d{2})\/(\d{2})\/(\d{2,4})\)/);
      const [valeur] = getRowValues($, row);

      if (dateMatch && valeur !== null) {
        let year = parseInt(dateMatch[3], 10);
        if (year < 100) {
          year += 2000;
        }

        result = {
          date: `${year}-${dateMatch[2]}-${dateMatch[1]}`,
          valeur,
        };
        return false;
      }
    }
    return undefined;
  });

  return result;
}

function extractTma($) {
  const row = findRowByLabel($, "TAUX MOYEN D'ACQUISITION");
  if (!row) {
    return null;
  }

  const [achats, ventes] = getRowValues($, row);
  return {
    achats,
    ventes,
  };
}

function extractTransactionsBancaires($) {
  const row = findRowByLabel($, 'TRANSACTION BANCAIRES');
  if (!row) {
    return null;
  }

  const [achats, ventes] = getRowValues($, row);
  return { achats, ventes };
}

function extractVolumeMoyenSemaine($) {
  const row = findRowByLabel($, 'VOLUME MOYEN / SEMAINE');
  if (!row) {
    return null;
  }

  const [achats, ventes] = getRowValues($, row);
  return { achats, ventes };
}

function buildTableau(parsed) {
  const rows = [];
  const { variations, taux_reference_veille } = parsed;

  if (parsed.marche_informel) {
    const { achats, ventes, spread } = parsed.marche_informel;
    rows.push(buildTableauRow('MARCHE INFORMEL', achats, ventes, spread));

    if (variations?.informel?.jour) {
      const jour = variations.informel.jour;
      rows.push(
        buildTableauRow(
          'Variation / Jour précédent',
          jour.achats ?? jour,
          jour.ventes ?? jour,
          jour.spread ?? null,
          { achats: 'percent', ventes: 'percent', spread: 'rate' }
        )
      );
    }
  }

  if (parsed.marche_bancaire) {
    const { achats, ventes, spread } = parsed.marche_bancaire;
    rows.push(buildTableauRow('MARCHE BANCAIRE', achats, ventes, spread));

    if (variations?.bancaire) {
      if (variations.bancaire.jour !== undefined) {
        const jour = variations.bancaire.jour;
        rows.push(
          buildTableauRow(
            'Variation / Jour précédent',
            jour.achats ?? jour,
            jour.ventes ?? jour,
            jour.spread ?? null,
            { achats: 'percent', ventes: 'percent', spread: 'rate' }
          )
        );
      }
      if (variations.bancaire.semaine !== undefined) {
        const semaine = variations.bancaire.semaine;
        rows.push(
          buildTableauRow(
            'Variation / Semaine précédente',
            semaine.achats ?? semaine,
            semaine.ventes ?? semaine,
            semaine.spread ?? null,
            { achats: 'percent', ventes: 'percent', spread: 'rate' }
          )
        );
      }
    }
  }

  rows.push(
    buildTableauRow('TAUX DE REFERENCE', parsed.taux_reference, null, null, {
      ventes: 'empty',
      spread: 'empty',
    })
  );

  if (variations?.reference) {
    const refVar = variations.reference;
    if (refVar.jour !== undefined) {
      rows.push(
        buildTableauRow('Variation / Jour précédent', refVar.jour, null, null, {
          achats: 'percent',
          ventes: 'empty',
          spread: 'empty',
        })
      );
    }
    if (refVar.semaine !== undefined) {
      rows.push(
        buildTableauRow('Variation / Semaine précédente', refVar.semaine, null, null, {
          achats: 'percent',
          ventes: 'empty',
          spread: 'empty',
        })
      );
    }
    if (refVar.annee !== undefined) {
      rows.push(
        buildTableauRow('Variation / Année précédente', refVar.annee, null, null, {
          achats: 'percent',
          ventes: 'empty',
          spread: 'empty',
        })
      );
    }
  }

  if (taux_reference_veille) {
    const veilleLabel = `Taux de référence (${formatVeilleLabel(taux_reference_veille.date)})`;
    rows.push(
      buildTableauRow(veilleLabel, taux_reference_veille.valeur, null, null, {
        ventes: 'empty',
        spread: 'empty',
      })
    );
  }

  if (parsed.tma) {
    rows.push(
      buildTableauRow("TAUX MOYEN D'ACQUISITION (TMA)", parsed.tma.achats, parsed.tma.ventes, null, {
        spread: 'empty',
      })
    );

    if (variations?.tma?.jour !== undefined) {
      const jour = variations.tma.jour;
      rows.push(
        buildTableauRow('Variation / Jour précédent', null, jour.ventes ?? jour, null, {
          achats: 'empty',
          ventes: 'percent',
          spread: 'empty',
        })
      );
    }
  }

  if (parsed.transactions_bancaires) {
    const { achats, ventes } = parsed.transactions_bancaires;
    rows.push(
      buildTableauRow('TRANSACTION BANCAIRES', achats, ventes, null, {
        achats: 'currency',
        ventes: 'currency',
        spread: 'empty',
      })
    );

    if (variations?.transactions?.jour) {
      rows.push(
        buildTableauRow(
          'Variation / Jour précédent',
          variations.transactions.jour.achats,
          variations.transactions.jour.ventes,
          null,
          { achats: 'percent', ventes: 'percent', spread: 'empty' }
        )
      );
    }
  }

  if (parsed.volume_moyen_semaine) {
    const { achats, ventes } = parsed.volume_moyen_semaine;
    rows.push(
      buildTableauRow('Volume moyen / semaine', achats, ventes, null, {
        achats: 'currency',
        ventes: 'currency',
        spread: 'empty',
      })
    );
  }

  return rows;
}

/**
 * Parse le HTML BRH et retourne toutes les données structurées.
 * @param {string} html
 * @returns {object}
 */
function parseBrhHtml(html) {
  try {
    const $ = cheerio.load(html);
    const date = extractDateFromHtml(html, $);
    const tauxReference = extractTauxReference(html, $);

    const parsed = {
      date,
      taux_reference: tauxReference,
      marche_informel: extractMarketRow($, 'MARCHE INFORMEL'),
      marche_bancaire: extractMarketRow($, 'MARCHE BANCAIRE'),
      tma: extractTma($),
      transactions_bancaires: extractTransactionsBancaires($),
      volume_moyen_semaine: extractVolumeMoyenSemaine($),
      variations: {
        informel: extractVariationsForSection($, 'MARCHE INFORMEL', { multiColumn: true }),
        bancaire: extractVariationsForSection($, 'MARCHE BANCAIRE', { multiColumn: true }),
        reference: extractVariationsForSection($, 'TAUX DE REFERENCE'),
        tma: extractVariationsForSection($, "TAUX MOYEN D'ACQUISITION", { multiColumn: true }),
        transactions: extractVariationsForSection($, 'TRANSACTION BANCAIRES', { multiColumn: true }),
      },
      taux_reference_veille: extractTauxReferenceVeille($),
    };

    parsed.tableau = buildTableau(parsed);

    return parsed;
  } catch (error) {
    if (error.message === 'TAUX DE REFERENCE introuvable dans le HTML') {
      throw error;
    }
    throw new Error(`Erreur lors du parsing HTML: ${error.message}`);
  }
}

module.exports = {
  parseBrhHtml,
  extractTauxReference,
  extractDateFromHtml,
  parseNumber,
  parsePercent,
  parseCurrency,
  parseBrhDate,
  buildTableau,
};
