# Setup & variables d'environnement — Looty

Ce fichier récapitule les variables `.env`, les commandes d'installation et de démarrage, et les prérequis spécifiques (Google keys, PM2).

## Prérequis
- Node.js (version recommandée : voir `.nvmrc`, ici `18`)
- `npm install` pour installer les dépendances
- PM2 pour exécuter en production

## Installation
```bash
git clone <repo-url>
cd Looty
npm install
```

## Variables d'environnement essentielles (.env)
- `TOKEN` : token du bot Discord
- `CLIENT_ID` : ID de l'application Discord (pour les commandes slash)
- `GUILD_ID` : ID de la guilde de développement (optionnel, pour enregistrement local rapide)
- `SESSION_SECRET` : secret pour `express-session` (utilisé par le dashboard)
- `REDIRECT_URI` : URL de callback OAuth2 (ex: `https://example.com/auth/callback`)
- `CLIENT_SECRET` : secret de l'application Discord

### Variables Google (pour `steamgame` / SteamTools)
- `GOOGLE_CLIENT_EMAIL` : email du compte de service Google
- `GOOGLE_PRIVATE_KEY` : clé privée (stockez-la avec `\n` pour les sauts de ligne, puis le code appelle `.replace(/\\n/g, '\n')`)
- `STEAMTOOLS_FOLDER_ID` : ID du dossier Google Drive utilisé pour stocker ZIP/.lua

## Commandes utiles
- Développement local :
```bash
node start.js
```
- Production (PM2) :
```bash
npm run start    # démarre via pm2
npm run looty    # flush/restart/log via pm2
```

## Notes de sécurité
- Ne jamais committer `.env` dans le dépôt.
- Pour la clé Google (`GOOGLE_PRIVATE_KEY`), utilisez un secret manager si possible.

## Où modifier les paramètres
- Les configs web OAuth : `web/Config/config.js` lit les variables `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI`.
- Les guild configs sont stockées dans `shared/guilds.json`.

---
Generated automatically by code reviewer script.