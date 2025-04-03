# 📦 Changelog

## [1.1.0] - 2025-04-03

### ✨ Ajouts
- Intégration du module `epic-games-free` pour récupérer les jeux gratuits.
- Commande `/epic` pour afficher les jeux actuels et à venir.
- Envoi des jeux gratuits dans deux salons Discord (actuels et futurs).
- Tâche planifiée automatique pour envoyer les jeux dès leur mise à jour.
- Mise à jour du statut du bot avec le temps restant avant le prochain jeu.
- Centralisation des ID de salons dans `shared/channels.json`.
- Ajout de `formatDate.js`, `formatTimeLeft.js`, `sanitizeGame.js`.
- Nouveau système de log personnalisé global via `global.log`.

### 🛠️ Modifications
- Refactor complet de `ready.js` pour déléguer aux fonctions planifiées.
- Uniformisation du style des embeds et ajout d'un bouton d'action.

### 🐛 Corrections
- Fix des erreurs liées à `interaction.deferReply` et `editReply`.
- Correction d'erreurs silencieuses sur les IDs ou canaux Discord invalides.

