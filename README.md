# <p align="left"><img src="https://ftp.nkconcept.fr/nomLooty.png" width="250" alt="Looty"></p> Looty

> Bot Discord multi-fonctions avec dashboard web.

## 🧰 Stack technique

- [Node.js](https://nodejs.org/) (v18+ recommandé)
- [Discord.js v14](https://discord.js.org/)
- [PM2](https://pm2.io/) pour la supervision
- [Express.js](https://expressjs.com/) + [EJS](https://ejs.co/) (pour le dashboard)
- [express-ejs-layouts](https://www.npmjs.com/package/express-ejs-layouts) pour un layout global
- Architecture modulaire :
  - `bot/Events` — gestion des événements Discord
  - `bot/SlashCommands` — commandes slash dynamiques
  - `bot/Fonctions` — fonctions utilitaires (logger, etc.)
  - `bot/Loaders` — chargement dynamique
  - `web/` — dashboard (Express + EJS)

---

## 🚀 Lancement local

```bash
cp .env.example .env
npm install
npm run looty
```

> Utilise `pm2` pour lancer le bot et le dashboard avec redémarrage automatique et logs persistants.

---

## ⚙️ Variables d’environnement (`.env`)

```env
TOKEN=your_discord_token
CLIENT_ID=your_discord_app_id
GUILD_ID=your_guild_id
LOG_CHANNEL_ID=channel_id_for_command_logging

DOMAIN=https://looty.nkconcept.fr
SESSION_SECRET=your_random_secret
CALLBACK_URL=https://looty.nkconcept.fr/login/callback
```

---

## 🌐 Fonctionnalités du dashboard

- 🔐 Connexion sécurisée via Discord OAuth2
- 📂 Liste des serveurs administrés par l'utilisateur
- 🔧 Configuration serveur par serveur :
  - Préfixe personnalisé
  - Modules activables (modération, etc.)
- 🎨 Sidebar responsive avec détection mobile
- 🖼️ Avatar et nom utilisateur affiché
- 🧠 Layout EJS global

---

## 🛡️ License

Projet privé pour l’instant — licence à définir.

<p align="left">
  <img src="https://ftp.nkconcept.fr/nomLooty.png" width="400" alt="Aperçu bot">
</p>