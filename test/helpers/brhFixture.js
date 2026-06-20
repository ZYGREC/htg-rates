const FRENCH_MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function formatFrenchDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${FRENCH_MONTHS[month - 1]} ${year}`;
}

function formatVeilleLabel(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const shortYear = String(year).slice(-2);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${shortYear}`;
}

/**
 * Génère un HTML BRH synthétique pour les tests (aucune date figée dans un fichier statique).
 */
function buildBrhFixtureHtml({
  date = '2024-01-15',
  veilleDate = '2024-01-14',
  tauxReference = 130.5329,
  tauxReferenceVeille = 130.9701,
  marcheInformel = { achats: 131, ventes: 136, spread: 5 },
  marcheBancaire = { achats: 130.2215, ventes: 131.1009, spread: 0.8794 },
  tmaVentes = 131.1009,
} = {}) {
  const frenchDate = formatFrenchDate(date);
  const veilleLabel = formatVeilleLabel(veilleDate);

  return `<!DOCTYPE html>
<html lang="fr">
<head><title>Taux du jour | BRH</title></head>
<body>
  <p>Taux du Jour : ${frenchDate}</p>
  <h1>${tauxReference}</h1>
  <h6>Taux de Référence</h6>
  <table>
    <tr><th></th><th>Achats</th><th>Ventes</th><th>Spread</th></tr>
    <tr><td>MARCHE INFORMEL</td><td>${marcheInformel.achats.toFixed(4)}</td><td>${marcheInformel.ventes.toFixed(4)}</td><td>${marcheInformel.spread.toFixed(4)}</td></tr>
    <tr><td>Variation / Jour précédent</td><td>0.00%</td><td>0.00%</td><td>-</td></tr>
    <tr><td>MARCHE BANCAIRE</td><td>${marcheBancaire.achats.toFixed(4)}</td><td>${marcheBancaire.ventes.toFixed(4)}</td><td>${marcheBancaire.spread.toFixed(4)}</td></tr>
    <tr><td>Variation / Jour précédent</td><td>0.10%</td><td>0.08%</td><td>-</td></tr>
    <tr><td>Variation / Semaine précédente</td><td>0.09%</td><td>-0.01%</td><td>-</td></tr>
    <tr><td>TAUX DE REFERENCE</td><td>${tauxReference.toFixed(4)}</td><td>-</td><td>-</td></tr>
    <tr><td>Variation / Jour précédent</td><td>0.06%</td><td>-</td><td>-</td></tr>
    <tr><td>Variation / Semaine précédente</td><td>0.05%</td><td>-</td><td>-</td></tr>
    <tr><td>Variation / Année précédente</td><td>-0.33%</td><td>-</td><td>-</td></tr>
    <tr><td>Taux de référence (${veilleLabel})</td><td>${tauxReferenceVeille.toFixed(4)}</td><td>-</td><td>-</td></tr>
    <tr><td>TAUX MOYEN D'ACQUISITION (TMA)</td><td>-</td><td>${tmaVentes.toFixed(4)}</td><td>-</td></tr>
    <tr><td>Variation / Jour précédent</td><td>-</td><td>-0.05%</td><td>-</td></tr>
    <tr><td>TRANSACTION BANCAIRES</td><td>$15,590,360.15</td><td>$15,520,501.18</td><td>-</td></tr>
    <tr><td>Variation / Jour précédent</td><td>17.26%</td><td>14.76%</td><td>-</td></tr>
    <tr><td>Volume moyen / semaine</td><td>$17,700,276.40</td><td>$17,389,418.29</td><td>-</td></tr>
  </table>
</body>
</html>`;
}

module.exports = {
  buildBrhFixtureHtml,
  formatFrenchDate,
};
