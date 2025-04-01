# <p align="left"><img src="https://ftp.nkconcept.fr/nomLooty.png" width="250" alt="Looty"></p> Looty

> Bot Discord multi-fonctions avec dashboard web à venir.

## 🧰 Stack technique

- [Node.js](https://nodejs.org/) (v18+ recommandé)
- [Discord.js v14](https://discord.js.org/)
- [PM2](https://pm2.io/) pour la supervision
- Express.js + EJS (pour le dashboard à venir)
- Architecture modulaire :
  - `bot/Events` — gestion des événements Discord
  - `bot/SlashCommands` — commandes slash dynamiques
  - `bot/Fonctions` — fonctions utilitaires (logger, etc.)
  - `bot/Loaders` — chargement dynamique

---

## 🚀 Lancement local

```bash
cp .env.example .env
npm install
npm run looty
```

> Utilise `pm2` pour lancer le bot avec redémarrage automatique et logs persistants.

---

## ⚙️ Variables d’environnement (`.env`)

```env
TOKEN=your_discord_token
CLIENT_ID=your_discord_app_id
GUILD_ID=your_guild_id
LOG_CHANNEL_ID=channel_id_for_command_logging
```

---

## 🧩 À venir

- Dashboard web (Express + Auth)
- Base de données (SQLite/PostgreSQL)
- Système de permissions
- UI config guilds

---

## 🛡️ License

Projet privé pour l’instant — licence à définir.
<p align="left">
  <img src="https://ftp.nkconcept.fr/nomLooty.png" width="400" alt="Aperçu bot">
</p>
