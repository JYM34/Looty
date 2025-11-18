/**
 * bot/Modules/epic/index.js
 * Regroupe les utilitaires liés à Epic Games utilisés par le bot.
 * Expose :
 *  - `formatDate` : formatage lisible des dates
 *  - `formatTimeLeft` : calcul du temps restant (depuis `bot/Fonctions`)
 *  - `sanitizeGame` : nettoyage/validation des objets jeu
 *  - `updateStatus` : mise à jour dynamique du statut Discord
 */
// 🧠 Helpers utilitaires — aucun ne dépend de sendEmbeds/scheduler
module.exports = {
    formatDate: require("./formatDate"),
    formatTimeLeft: require("../../Fonctions/formatTimeLeft"),
    sanitizeGame: require("./sanitizeGame"),
    updateStatus: require("./updateStatus")
  };