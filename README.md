# 🕹️ Looty — Bot Discord + Dashboard Web

Looty est un bot Discord full Node.js avec un dashboard web intégré, conçu pour :

- 🎁 Afficher les jeux gratuits Epic Games chaque semaine
- 📤 Envoyer automatiquement les jeux dans les salons définis
- ⏰ Mettre à jour dynamiquement le statut du bot Discord
- 🧹 Nettoyer les anciens messages
- 🔧 Offrir des commandes slash pratiques (`/force-check`)

---

## 🚀 Fonctionnalités

### 🎯 Envoi des jeux gratuits Epic Games
- Récupération via l'API [`epic-games-free`](https://github.com/JYM34/EpicGamesFree)
- Affichage des **jeux actuels** et **à venir** dans deux salons distincts
- Génération d'**embeds dynamiques** avec :
  - 🖼️ Image du jeu
  - 📅 Dates de début et fin
  - 💰 Prix original
  - 🔗 Bouton “Ajouter à Epic Games” (`🏷️`)

### ⏱ Planification automatique
- Déclenchement automatique **à la fin de chaque promo**
- ⚠️ Ajout d’un **délai de sécurité de 1 min** pour éviter que le bot vérifie trop tôt

### 🟢 Statut Discord dynamique
- Affiche le temps restant jusqu’au prochain jeu avec `Prochain jeu : 2j 03h 15mn`
- Mis à jour toutes les minutes

---

## 🔧 Commandes Slash

### `/force-check`
> Force un nouveau check complet de l’API Epic Games

- 🔍 Vérifie si de nouveaux jeux sont apparus
 # 🕹️ Looty — Bot Discord + Dashboard Web

 Looty est un bot Discord (Node.js) avec un dashboard web intégré, conçu pour :

 - 🎁 Publier automatiquement les jeux gratuits Epic Games
 - 📤 Envoyer les jeux dans les salons configurés
 - ⏰ Mettre à jour le statut du bot et planifier les vérifications
 - 🔧 Offrir des commandes slash (ex. `/force-check`)

 ---

 ## 🚀 Fonctionnalités principales

 - Récupération via l'API `epic-games-free`
 - Publications automatisées (jeux actuels + prochains)
 - Dashboard d'administration (OAuth Discord)
 - Commandes administratives (ex. `/force-check`)

 ---

 ## ⚙️ Installation rapide (dev)

 ```bash
 git clone <repo-url>
 cd Looty
 npm install
 cp .env.example .env
 node start.js        # démarre en local (sans PM2)
 ```

 Pour la production, le projet utilise PM2 :

 ```bash
 npm run start        # démarre via PM2 (voir package.json)
 npm run looty        # flush/restart/log via PM2
 ```

 ---

 ## 🧩 Fichiers & zones importantes (pour contributeurs)

 - `start.js` : orchestration (initialise le bot puis démarre le dashboard)
 - `bot/` : code du bot (client, loaders, events, SlashCommands)
   - `bot/Loaders/loadCommands.js` : charge et enregistre les commandes slash
   - `bot/Loaders/loadEvents.js` : charge les événements Discord
   - `bot/SlashCommands/` : emplacement des commandes (ex: `force-check.js`)
 - `shared/` : configuration partagée entre bot et dashboard (`guilds.json`)
 - `web/` : dashboard Express + EJS (routes, vues, passport)

 ---

 ## 🔐 Variables d'environnement (essentielles)

 - `TOKEN` : token du bot Discord
 - `CLIENT_ID` : application ID Discord (pour commands)
 - `GUILD_ID` : ID de la guilde de développement (optionnel)
 - `SESSION_SECRET` : secret pour `express-session` (ne pas utiliser la valeur par défaut en prod)
 - `CLIENT_SECRET`, `REDIRECT_URI` : config OAuth Discord

 Les variables complètes et spéciales (Google API, Drive) sont listées dans `docs/SETUP.md`.

 ---

 ## Développer / ajouter une commande slash (rapide)

 1. Créer un fichier dans `bot/SlashCommands/` avec `module.exports = { data, run }`.
    - `data` : `SlashCommandBuilder` + `.toJSON()` est attendu par le loader.
    - `run` : fonction async `(client, interaction) => {}`.
 2. Lancer `node deploy-commands.js` pour enregistrer la commande (si nécessaire).

 Voir `bot/Loaders/loadCommands.js` pour l’implémentation exacte du loader.

 ---

 ## Avertissements & bonnes pratiques

 - `shared/guilds.json` est modifié en écriture synchrones par le dashboard et les commandes : évitez les modifications concurrentes et privilégiez des sauvegardes régulières.
 - Le `SESSION_SECRET` doit être défini en production et stocké dans un secret manager.
 - Le projet expose un serveur web sur le port `3000` par défaut ; ajustez la config si vous mettez derrière un proxy.

 ---

 ## Contribuer

 Pour les instructions détaillées pour contributeurs (ajout de commande, style de code, pipeline), consultez `CONTRIBUTING.md`.

 ---

  ## 👤 Auteur

  Bot développé par **JYM** 🥃
  Code commenté et structuré pour une lecture fluide & maintenance easy.

  ---

 ## Licence

 MIT – libre d'utilisation, d’adaptation et d'amélioration.
