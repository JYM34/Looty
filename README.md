# 🕹️ Looty — Bot Discord + Dashboard Web

Looty est un bot Discord full Node.js avec un dashboard web intégré, conçu pour :

- 🎁 Afficher les jeux gratuits Epic Games chaque semaine  
- 📤 Envoyer automatiquement les jeux dans les salons définis  
- ⏰ Mettre à jour dynamiquement le statut du bot Discord  
- 🧹 Nettoyer les anciens messages  
- 🔧 Offrir des commandes slash pratiques (/force-check)

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
- 📤 Envoie les jeux dans les salons
- ⏰ Met à jour le statut du bot avec un délai de sécurité de 60s
- ✅ Très utile pour les admins ou tests

---

## 🔧 Configuration

### Fichier `shared/guilds.json`

Définir les IDs de salons utilisés pour Epic Games :

```json
  "ID_DU_SERVEUR_ACTUEL": {
    "epic": {
      "country": "FR",
      "locale": "fr-FR",
      "currentGamesChannelId": "ID_DU_SALON_JEU_GRATUIT",
      "nextGamesChannelId": "ID_DU_SALON_PROCHAIN_JEU_GRATUIT",
      "logsChannelId": "ID_DU_SALON_LOG"
    },
    "name": "NOM_DU_SERVEUR",
    "prefix": "!",
    "moderation": false
  },

```

---

## 🧪 Démo rapide

```bash
/force-check  # Force un check + mise à jour du statut
```

---

## 🛠 Stack Technique

- Discord.js v14+
- Express.js (dashboard)
- EJS (templates)
- API custom [`epic-games-free`](https://github.com/JYM34/EpicGamesFree)
- PM2 (démarrage en prod)

---

## 👤 Auteur

Bot développé par **JYM** 🥃  
Code commenté et structuré pour une lecture fluide & maintenance easy.

---

## 📄 Licence

MIT – libre d'utilisation, d’adaptation et d'amélioration.
