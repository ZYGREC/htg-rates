# Service BRH - Taux du jour USD/HTG

API Node.js pour récupérer automatiquement le taux de référence USD/HTG publié chaque jour par la Banque de la République d'Haïti (BRH). Ce service permet d'exposer le taux officiel pour usage comptable et facturation.

## 📋 Prérequis

- Node.js (version 14 ou supérieure)
- npm ou yarn

## 🚀 Installation

```bash
npm install
```

## ▶️ Démarrage

### Mode production
```bash
npm start
```

### Mode développement (avec rechargement automatique)
```bash
npm run dev
```

Le serveur démarre sur le port **3000** par défaut. Vous pouvez le configurer via la variable d'environnement `PORT` :

```bash
PORT=8080 npm start
```

## 📡 Utilisation

### Endpoint principal

**GET** `/api/brh/taux-du-jour`

Récupère le taux de référence USD/HTG du jour publié par la BRH.

#### Réponse réussie (200 OK)

```json
{
  "date": "2024-01-15",
  "taux_reference": 130.5983,
  "taux_du_jour": 130.5983,
  "source": "https://www.brh.ht/taux-du-jour/"
}
```

**Champs de la réponse :**
- `date` : Date du jour au format ISO (YYYY-MM-DD)
- `taux_reference` : Taux de référence officiel USD/HTG
- `taux_du_jour` : Alias du taux de référence (même valeur)
- `source` : URL de la page source BRH

#### Exemples de requêtes

**Avec curl :**
```bash
curl http://localhost:3000/api/brh/taux-du-jour
```

**Avec fetch (JavaScript) :**
```javascript
fetch('http://localhost:3000/api/brh/taux-du-jour')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Erreur:', error));
```

**Avec axios (JavaScript) :**
```javascript
const axios = require('axios');

axios.get('http://localhost:3000/api/brh/taux-du-jour')
  .then(response => console.log(response.data))
  .catch(error => console.error('Erreur:', error.message));
```

### Endpoint de santé

**GET** `/health`

Vérifie que le serveur est opérationnel.

```json
{
  "status": "ok"
}
```

### Gestion des erreurs

En cas d'erreur (réseau, parsing, site BRH indisponible, etc.), l'API retourne un statut HTTP **500** avec un message d'erreur explicite :

```json
{
  "error": "TAUX DE REFERENCE introuvable dans le HTML"
}
```

**Exemples d'erreurs possibles :**
- `"Timeout lors de la récupération de la page BRH"`
- `"TAUX DE REFERENCE introuvable dans le HTML"`
- `"Impossible de se connecter au site BRH (vérifiez votre connexion réseau)"`
- `"Erreur HTTP 404: Not Found"`

## 📁 Structure du projet

```
brh-taux-du-jour-usd-htg-api/
├── package.json           # Configuration npm et dépendances
├── README.md              # Documentation du projet
└── src/
    ├── brhClient.js       # Récupération HTML + parsing avec Cheerio
    ├── tauxService.js     # Logique métier (orchestration)
    └── server.js          # Serveur Express et endpoints API
```

### Description des modules

- **`src/brhClient.js`** : Gère la communication avec le site BRH
  - `fetchBrhHtml()` : Récupère le HTML de la page des taux
  - `extractTauxReference(html)` : Parse le HTML et extrait le taux de référence

- **`src/tauxService.js`** : Couche de service métier
  - `getTauxDuJour()` : Fonction principale qui orchestre la récupération et formate les données

- **`src/server.js`** : Serveur Express et routes API
  - Configure le serveur HTTP
  - Gère les endpoints et les erreurs

## 📦 Dépendances

### Production
- **axios** (^1.6.0) : Client HTTP pour récupérer le contenu de la page BRH
- **cheerio** (^1.0.0-rc.12) : Parseur HTML côté serveur (similaire à jQuery)
- **express** (^4.18.2) : Framework web minimaliste pour Node.js

### Développement
- **nodemon** (^3.0.1) : Outil de développement pour recharger automatiquement le serveur

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port d'écoute du serveur | `3000` |

Exemple :
```bash
PORT=8080 npm start
```

## ⚙️ Fonctionnement technique

1. **Récupération** : Le service fait une requête HTTP GET sur `https://www.brh.ht/taux-du-jour/` avec un User-Agent réaliste
2. **Parsing** : Le HTML est analysé avec Cheerio pour trouver la ligne contenant "TAUX DE REFERENCE"
3. **Extraction** : La valeur numérique correspondante est extraite et convertie en nombre
4. **Formatage** : Les données sont formatées avec la date du jour et la source
5. **API** : Le résultat est exposé via une API REST JSON

## 📝 Notes

- Le service récupère le taux en temps réel à chaque appel de l'API (pas de cache)
- Le taux est celui publié sur le site BRH le jour de la requête
- La page source est consultée à chaque requête API

## 🐛 Dépannage

**Le serveur ne démarre pas :**
- Vérifiez que le port n'est pas déjà utilisé
- Assurez-vous que toutes les dépendances sont installées (`npm install`)

**L'API retourne une erreur :**
- Vérifiez votre connexion internet
- Vérifiez que le site BRH est accessible : https://www.brh.ht/taux-du-jour/
- Consultez les logs du serveur pour plus de détails

**Le taux n'est pas trouvé :**
- Le format de la page BRH peut avoir changé
- Vérifiez que la page contient bien "TAUX DE REFERENCE"

## 📄 Licence

ISC

