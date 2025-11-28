# 🕹️ Looty — Bot Discord + Dashboard Web

Looty est un bot Discord full Node.js avec un dashboard web intégré. Il permet de publier automatiquement les jeux Epic Games gratuits, de maintenir un statut dynamique et de piloter le bot via des commandes slash — le tout avec un petit dashboard propre.

---

## 🚀 Fonctionnalités

- 🎯 Récupération des jeux via l'API [`epic-games-free`](https://github.com/JYM34/EpicGamesFree)
- 📨 Publication automatique dans les salons configurés (jeux actuels + prochains)
- 🖼️ Embeds riches (image, dates, prix, bouton “Ajouter à Epic Games”)
- ⏱️ Planification automatique (avec délai de sécurité de 1 min en fin de promo)
- 🟢 Statut Discord mis à jour toutes les minutes (ex: `Prochain jeu : 2j 03h 15mn`)
- 🛠️ Dashboard d’administration (Express + EJS)
- 🧹 Nettoyage des anciens messages

---

## 🔧 Commandes Slash

- `/force-check` — force un check complet de l’API Epic Games (déclenche publication si nécessaire)

---

## ⚙️ Installation rapide (développement)

```bash
git clone <repo-url>
cd Looty
npm install
cp .env.example .env
node start.js        # démarre en local (sans PM2)
```

### Production (PM2)

```bash
npm run start        # démarre via PM2 (voir package.json)
npm run looty        # shortcuts pour flush/restart/log via PM2
```

---

## 🧩 Structure utile (contributeurs)

- `start.js` — orchestration (initialise le bot puis démarre le dashboard)
- `bot/` — client Discord, loaders, events, SlashCommands
  - `bot/Loaders/loadCommands.js` — charge et enregistre les commandes slash
  - `bot/Loaders/loadEvents.js` — charge les événements Discord
  - `bot/SlashCommands/` — commandes (ex: `force-check.js`)
- `shared/` — config partagée (`guilds.json`)
- `web/` — dashboard Express + EJS (routes, vues, passport)

---

## 🔐 Variables d’environnement (essentielles)

- `TOKEN` — token du bot Discord
- `CLIENT_ID` — application ID Discord (pour enregistrer les commandes)
- `GUILD_ID` — ID de guilde de dev (optionnel)
- `SESSION_SECRET` — secret pour `express-session` (obligatoire en prod)
- `CLIENT_SECRET`, `REDIRECT_URI` — OAuth Discord pour le dashboard

Les variables plus avancées (Google API, Drive, etc.) sont détaillées dans `docs/SETUP.md`.

---

## ➕ Ajouter une commande slash (rapide)

1. Créez un fichier dans `bot/SlashCommands/` avec `module.exports = { data, run }`.
   - `data` — construit avec `SlashCommandBuilder` puis `.toJSON()` (consommé par le loader)
   - `run` — fonction async `(client, interaction) => {}`
2. Exécutez `node deploy-commands.js` si un enregistrement manuel est nécessaire.

Consultez `bot/Loaders/loadCommands.js` pour l’implémentation exacte.

---

## ✅ Bonnes pratiques

- `shared/guilds.json` est modifié par le dashboard et des commandes : évitez les écritures concurrentes et pensez aux sauvegardes.
- Définissez un `SESSION_SECRET` fort en production (secret manager recommandé).
- Le dashboard écoute par défaut sur le port `3000` — adaptez si vous êtes derrière un proxy.

---

## 🤝 Contribuer

Les détails pour contribuer (style, pipeline, etc.) sont dans `CONTRIBUTING.md`.

---

## 👤 Auteur

Bot développé par **JYM** 🥃 — code commenté et structuré pour rester lisible et maintenable.

---

## 📄 Licence

MIT — libre d'utilisation, d’adaptation et d'amélioration.
