# Changelog

## 1.0.0

Première version publique du package `htg-rates`.

### Fonctionnalités
- Librairie : `getTauxDuJour`, `getTauxComplets`, `convert`, historique JSON
- Serveur Express intégré (`createApp`) + CLI (`npx htg-rates`)
- Dashboard HTML avec tableau complet BRH et graphique d'évolution
- Historique JSON par année (`data/history/YYYY.json`)
- Parsing complet : marchés, TMA, transactions bancaires, variations
- Cache, retry, health checks, conversion USD ↔ HTG
- Documentation OpenAPI, Docker, tests et CI
