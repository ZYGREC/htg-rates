const express = require('express');
const { getTauxDuJour } = require('./tauxService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON (utile pour les futures extensions)
app.use(express.json());

/**
 * Endpoint pour récupérer le taux du jour
 * GET /api/brh/taux-du-jour
 */
app.get('/api/brh/taux-du-jour', async (req, res) => {
  try {
    const tauxData = await getTauxDuJour();
    res.status(200).json(tauxData);
  } catch (error) {
    console.error('Erreur lors de la récupération du taux du jour:', error.message);
    res.status(500).json({
      error: error.message || 'Erreur lors de la récupération du taux du jour'
    });
  }
});

// Route de santé (optionnelle mais utile)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`Endpoint disponible: http://localhost:${PORT}/api/brh/taux-du-jour`);
});

module.exports = app;

