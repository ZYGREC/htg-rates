const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Récupère le HTML de la page des taux du jour de la BRH
 * @returns {Promise<string>} Le contenu HTML de la page
 * @throws {Error} En cas d'erreur réseau ou HTTP
 */
async function fetchBrhHtml() {
  try {
    const response = await axios.get('https://www.brh.ht/taux-du-jour/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 10000 // 10 secondes de timeout
    });

    if (response.status !== 200) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout lors de la récupération de la page BRH');
    }
    if (error.response) {
      throw new Error(`Erreur HTTP ${error.response.status}: ${error.message}`);
    }
    if (error.request) {
      throw new Error('Impossible de se connecter au site BRH (vérifiez votre connexion réseau)');
    }
    throw new Error(`Erreur lors de la récupération de la page BRH: ${error.message}`);
  }
}

/**
 * Extrait le taux de référence depuis le HTML de la page BRH
 * @param {string} html - Le contenu HTML à parser
 * @returns {number} Le taux de référence (nombre décimal)
 * @throws {Error} Si le taux de référence n'est pas trouvé dans le HTML
 */
function extractTauxReference(html) {
  try {
    const $ = cheerio.load(html);

    // Recherche dans toutes les lignes de tableau
    let tauxTrouve = null;

    $('table tr').each((index, element) => {
      const $row = $(element);
      const cells = $row.find('td, th');

      // Parcourir les cellules pour trouver "TAUX DE REFERENCE"
      cells.each((cellIndex, cell) => {
        const cellText = $(cell).text().trim().toUpperCase();
        
        if (cellText.includes('TAUX DE REFERENCE')) {
          // Le taux devrait être dans la cellule suivante ou dans une colonne spécifique
          // On cherche la valeur numérique dans les cellules de la ligne
          cells.each((idx, c) => {
            const text = $(c).text().trim();
            // Extraction d'un nombre décimal (peut contenir un point ou une virgule)
            const match = text.match(/[\d,]+\.?\d*/);
            if (match) {
              // Remplacer la virgule par un point si nécessaire et convertir en nombre
              const valeurNumerique = parseFloat(match[0].replace(/,/g, ''));
              if (!isNaN(valeurNumerique) && valeurNumerique > 0) {
                tauxTrouve = valeurNumerique;
                return false; // Sortir de la boucle
              }
            }
          });
          return false; // Sortir de la boucle externe
        }
      });
      
      if (tauxTrouve !== null) {
        return false; // Sortir de la boucle principale
      }
    });

    if (tauxTrouve === null) {
      throw new Error('TAUX DE REFERENCE introuvable dans le HTML');
    }

    return tauxTrouve;
  } catch (error) {
    if (error.message === 'TAUX DE REFERENCE introuvable dans le HTML') {
      throw error;
    }
    throw new Error(`Erreur lors du parsing HTML: ${error.message}`);
  }
}

module.exports = {
  fetchBrhHtml,
  extractTauxReference
};

