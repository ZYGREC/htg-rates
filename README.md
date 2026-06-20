# htg-rates

Package npm pour récupérer les **taux de change USD/HTG** publiés chaque jour par la [Banque de la République d'Haïti (BRH)](https://www.brh.ht/taux-du-jour/).

Idéal pour la **facturation**, la **comptabilité** ou toute application qui a besoin du taux officiel haïtien.

---

## Sommaire

- [Installation](#installation)
- [3 façons d'utiliser le package](#3-façons-dutiliser-le-package)
- [Utiliser dans un autre projet Node.js](#utiliser-dans-un-autre-projet-nodejs)
- [API REST (serveur)](#api-rest-serveur)
- [API JavaScript (librairie)](#api-javascript-librairie)
- [Historique JSON par année](#historique-json-par-année)
- [Configuration](#configuration)
- [Docker](#docker)
- [Développement](#développement)

---

## Installation

```bash
npm install htg-rates
```

**Prérequis :** Node.js 18 ou supérieur.

---

## 3 façons d'utiliser le package

| Mode | Commande / import | Cas d'usage |
|------|-------------------|-------------|
| **Librairie** | `require('htg-rates')` | Appeler les taux depuis ton code (facturation, cron, etc.) |
| **Serveur intégré** | `require('htg-rates/server')` | Monter l'API dans une app Express existante |
| **CLI autonome** | `npx htg-rates` | Lancer un micro-serveur sans écrire de code |

Une fois le serveur lancé :

| URL | Contenu |
|-----|---------|
| http://localhost:3000/ | Dashboard (tableau complet + graphique d'évolution) |
| http://localhost:3000/docs | Documentation Swagger interactive |
| http://localhost:3000/api/brh/taux-du-jour | Taux de référence (JSON) |

---

## Utiliser dans un autre projet Node.js

### Exemple complet — facturation

```javascript
const { getTauxComplets, convert } = require('htg-rates');

async function facturer(montantUsd) {
  // Récupère tous les taux du jour (mise en cache 15 min)
  const taux = await getTauxComplets();

  console.log(`Date BRH : ${taux.date}`);
  console.log(`Taux de référence : ${taux.taux_reference} HTG/USD`);

  // Convertir un montant
  const conversion = await convert(montantUsd, {
    from: 'USD',
    to: 'HTG',
    rateType: 'reference', // ou bancaire_vente, informel_achat, etc.
  });

  return {
    montantUsd,
    montantHtg: conversion.result,
    tauxApplique: conversion.rate,
    date: conversion.date,
  };
}

facturer(250).then(console.log);
```

### Exemple — lire l'historique enregistré

```javascript
const { getHistory, listHistoryYears } = require('htg-rates');

async function afficherHistorique() {
  const years = await listHistoryYears();
  console.log('Années disponibles :', years);

  if (years.length === 0) {
    console.log('Aucun historique encore. Lance un fetch avec getTauxComplets() d\'abord.');
    return;
  }

  const { entries } = await getHistory({ year: years[years.length - 1] });
  entries.forEach((entry) => {
    console.log(`${entry.date} → ${entry.taux_reference}`);
  });
}
```

### Exemple — intégrer dans Express

```javascript
const express = require('express');
const { createApp } = require('htg-rates/server');

const app = express();

// Monte toutes les routes htg-rates sous la racine
app.use(createApp());

// Tes propres routes en plus
app.get('/ma-route', (req, res) => res.json({ ok: true }));

app.listen(3000, () => {
  console.log('App sur http://localhost:3000');
  console.log('Taux BRH sur http://localhost:3000/api/brh/taux-du-jour');
});
```

### Exemple — serveur autonome (sans code)

```bash
# Depuis ton projet après npm install htg-rates
npx htg-rates

# Ou avec un port personnalisé
npx htg-rates --port 8080
```

---

## API REST (serveur)

### Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/` | Dashboard HTML (tableau BRH + graphique) |
| `GET` | `/api/brh/taux-du-jour` | Taux de référence du jour |
| `GET` | `/api/brh/taux-complets` | Tous les taux + tableau structuré |
| `GET` | `/api/brh/convert` | Conversion USD ↔ HTG |
| `GET` | `/api/brh/history` | Historique JSON |
| `GET` | `/api/brh/history/years` | Liste des années disponibles |
| `GET` | `/health` | État du service |
| `GET` | `/health/ready` | Prêt à recevoir du trafic |
| `GET` | `/docs` | Swagger UI |

### Paramètre commun : `?refresh=true`

Force un nouveau fetch sur le site BRH (ignore le cache).

```bash
curl "http://localhost:3000/api/brh/taux-du-jour?refresh=true"
```

### `GET /api/brh/taux-du-jour`

Réponse :

```json
{
  "date": "2026-06-20",
  "taux_reference": 130.5549,
  "taux_du_jour": 130.5549,
  "source": "https://www.brh.ht/taux-du-jour/"
}
```

### `GET /api/brh/taux-complets`

Retourne **tous les taux** affichés sur le site BRH :

```json
{
  "date": "2026-06-20",
  "taux_reference": 130.5549,
  "marche_informel": { "achats": 131, "ventes": 136, "spread": 5 },
  "marche_bancaire": { "achats": 130.2581, "ventes": 131.0374, "spread": 0.7793 },
  "tma": { "achats": null, "ventes": 131.0374 },
  "transactions_bancaires": { "achats": 15590360.15, "ventes": 15520501.18 },
  "volume_moyen_semaine": { "achats": 17700276.4, "ventes": 17389418.29 },
  "variations": {
    "informel": { "jour": { "achats": 0, "ventes": 0 } },
    "bancaire": { "jour": { "achats": 0.03, "ventes": -0.05 }, "semaine": { "achats": 0.21, "ventes": 0.07 } },
    "reference": { "jour": 0.02, "semaine": 0.13, "annee": -0.32 },
    "tma": { "jour": { "ventes": -0.05 } },
    "transactions": { "jour": { "achats": 17.26, "ventes": 14.76 } }
  },
  "taux_reference_veille": { "date": "2025-06-18", "valeur": 130.9701 },
  "tableau": [
    {
      "label": "MARCHE INFORMEL",
      "achats": { "raw": 131, "display": "131", "kind": "rate" },
      "ventes": { "raw": 136, "display": "136", "kind": "rate" },
      "spread": { "raw": 5, "display": "5", "kind": "rate" }
    }
  ],
  "source": "https://www.brh.ht/taux-du-jour/",
  "fetched_at": "2026-06-20T12:00:00.000Z"
}
```

Le champ **`tableau`** est prêt à afficher tel quel (colonnes Achats / Ventes / Spread).

### `GET /api/brh/convert`

| Paramètre | Requis | Description |
|-----------|--------|-------------|
| `amount` | oui | Montant à convertir |
| `from` | oui | `USD` ou `HTG` |
| `to` | oui | `USD` ou `HTG` |
| `rateType` | non | Type de taux (défaut : `reference`) |
| `refresh` | non | `true` pour ignorer le cache |

```bash
curl "http://localhost:3000/api/brh/convert?amount=100&from=USD&to=HTG"
curl "http://localhost:3000/api/brh/convert?amount=100&from=USD&to=HTG&rateType=bancaire_vente"
```

Réponse :

```json
{
  "amount": 100,
  "from": "USD",
  "to": "HTG",
  "rate": 130.5549,
  "rate_type": "reference",
  "result": 13055.49,
  "date": "2026-06-20",
  "source": "https://www.brh.ht/taux-du-jour/"
}
```

**Types de taux (`rateType`) :**

| Valeur | Description |
|--------|-------------|
| `reference` | Taux de référence BRH *(défaut)* |
| `bancaire_achat` | Marché bancaire — achats |
| `bancaire_vente` | Marché bancaire — ventes |
| `informel_achat` | Marché informel — achats |
| `informel_vente` | Marché informel — ventes |

### `GET /api/brh/history`

| Paramètre | Description |
|-----------|-------------|
| `year` | Année (ex. `2026`) |
| `from` | Date début `YYYY-MM-DD` |
| `to` | Date fin `YYYY-MM-DD` |

```bash
curl "http://localhost:3000/api/brh/history?year=2026"
curl "http://localhost:3000/api/brh/history/years"
```

---

## API JavaScript (librairie)

Toutes les fonctions sont **async** (retournent une Promise).

### Récupérer les taux

```javascript
const { getTauxDuJour, getTauxComplets } = require('htg-rates');

// Taux de référence uniquement
const simple = await getTauxDuJour();
// → { date, taux_reference, taux_du_jour, source }

// Tous les taux + tableau
const complet = await getTauxComplets();
// → { date, taux_reference, marche_informel, tableau, ... }

// Forcer un nouveau fetch BRH
const frais = await getTauxComplets({ forceRefresh: true });
```

### Convertir

```javascript
const { convert } = require('htg-rates');

const result = await convert(100, {
  from: 'USD',
  to: 'HTG',
  rateType: 'reference', // optionnel
});
// → { amount, from, to, rate, rate_type, result, date, source }
```

### Historique

```javascript
const {
  getHistory,
  listHistoryYears,
  saveToHistory,
  getHistoryDir,
} = require('htg-rates');

// Lire l'historique
const years = await listHistoryYears();           // [2025, 2026]
const file2026 = await getHistory({ year: 2026 }); // fichier JSON de l'année
const plage = await getHistory({ from: '2026-01-01', to: '2026-06-30' });

// Chemin du dossier historique
console.log(getHistoryDir()); // ex. /mon-projet/data/history

// Sauvegarde manuelle (normalement automatique à chaque fetch)
await saveToHistory(complet);
```

### Serveur Express

```javascript
const { createApp, clearCache } = require('htg-rates');

const app = createApp({
  corsOrigin: '*',       // optionnel
  rateLimit: true,       // optionnel (défaut: true)
});

clearCache(); // vider le cache mémoire
```

### Référence complète

| Fonction | Description |
|----------|-------------|
| `getTauxDuJour(options?)` | Taux de référence du jour |
| `getTauxComplets(options?)` | Tous les taux BRH + `tableau` |
| `convert(amount, options?)` | Conversion USD ↔ HTG |
| `getHistory(options?)` | Lit l'historique (`year`, `from`, `to`) |
| `listHistoryYears(options?)` | Liste les années disponibles |
| `loadHistoryYear(year, options?)` | Charge le fichier JSON d'une année |
| `saveToHistory(data, options?)` | Enregistre une entrée dans l'historique |
| `getHistoryDir()` | Chemin du dossier `data/history` |
| `createApp(options?)` | Crée l'application Express |
| `clearCache()` | Vide le cache mémoire |
| `getHealthState()` | État cache + BRH |
| `isReady()` | `true` si des données BRH sont disponibles |

**Options communes :**

```javascript
{ forceRefresh: true }  // ignore le cache mémoire
{ skipHistory: true }   // ne pas sauvegarder dans l'historique JSON
{ dataDir: '/chemin' }  // dossier historique personnalisé (pour getHistory, saveToHistory)
```

---

## Historique JSON par année

À **chaque fetch réussi** vers la BRH, le package enregistre automatiquement les données dans :

```
votre-projet/data/history/2026.json
votre-projet/data/history/2027.json
...
```

Structure d'un fichier :

```json
{
  "year": 2026,
  "source": "https://www.brh.ht/taux-du-jour/",
  "updated_at": "2026-06-20T12:00:00.000Z",
  "entries": [
    {
      "date": "2026-06-20",
      "taux_reference": 130.5549,
      "marche_informel": { "achats": 131, "ventes": 136, "spread": 5 },
      "tableau": []
    }
  ]
}
```

> **Important :** l'historique se construit **jour après jour** à chaque utilisation du package. Il n'y a pas de données passées fournies par la BRH sur une seule requête — plus tu utilises le package, plus l'historique grandit.

Le dashboard sur `/` affiche un **graphique d'évolution** basé sur ces fichiers.

---

## Configuration

Copie `.env.example` vers `.env` à la racine de ton projet :

```bash
cp .env.example .env
```

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur CLI | `3000` |
| `BRH_URL` | URL page BRH | `https://www.brh.ht/taux-du-jour/` |
| `BRH_TIMEOUT_MS` | Timeout requête BRH (ms) | `10000` |
| `BRH_RETRIES` | Tentatives en cas d'échec | `3` |
| `CACHE_TTL_MS` | Durée cache mémoire (ms) | `900000` (15 min) |
| `SERVE_STALE_ON_ERROR` | Servir le cache si BRH down | `true` |
| `SAVE_HISTORY` | Enregistrer l'historique JSON | `true` |
| `HISTORY_DATA_DIR` | Dossier des fichiers historiques | `./data/history` |
| `CORS_ORIGIN` | Origine CORS | `*` |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre rate limit (ms) | `60000` |
| `RATE_LIMIT_MAX` | Requêtes max / fenêtre / IP | `60` |

---

## Docker

```bash
docker compose up --build
# → http://localhost:3000
```

---

## Développement

```bash
git clone <repo>
cd htg-rates
npm install
npm run dev    # serveur avec rechargement auto
npm test       # 27 tests
```

---

## Licence

ISC
