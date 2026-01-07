const { fetchBrhHtml, extractTauxReference } = require('./brhClient');

/**
 * Récupère le taux du jour depuis le site BRH
 * @returns {Promise<Object>} Objet contenant la date, le taux de référence et la source
 * @throws {Error} En cas d'erreur lors de la récupération ou du parsing
 */
async function getTauxDuJour() {
  try {
    // Récupération du HTML
    const html = await fetchBrhHtml();
    
    // Extraction du taux de référence
    const tauxReference = extractTauxReference(html);
    
    // Génération de la date du jour au format YYYY-MM-DD
    const aujourdhui = new Date();
    const dateStr = aujourdhui.toISOString().split('T')[0]; // Format YYYY-MM-DD
    
    // Construction de l'objet résultat
    const resultat = {
      date: dateStr,
      taux_reference: tauxReference,
      taux_du_jour: tauxReference, // Alias - même valeur
      source: 'https://www.brh.ht/taux-du-jour/'
    };
    
    return resultat;
  } catch (error) {
    // Remonter l'erreur pour que le serveur puisse la gérer
    throw error;
  }
}

module.exports = {
  getTauxDuJour
};

