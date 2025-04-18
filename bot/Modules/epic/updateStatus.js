const { ActivityType } = require("discord.js");
const formatTimeLeft = require("../../Fonctions/formatTimeLeft");
let logInterval = null;
let refreshInterval = null;

/**
 * 🕹️ Met à jour dynamiquement le statut du bot selon la promo Epic
 * @param {Client} client - Instance du bot Discord
 * @param {number} endTimestamp - Date de fin de la promo (en ms)
 */
module.exports = function updateBotStatus(client, endTimestamp) {
  // ⏱️ Ajoute un délai de 2 minutes après la fin officielle de la promo
  const extendedEnd = endTimestamp + 2 * 60_000;

  // 🔁 Variable pour stocker le dernier statut affiché
  let lastStatus = "";

  /**
   * ⏰ Met à jour le statut visible du bot Epic Games
   */
  function refresh() {
    const now = Date.now();                  // ⌚ Timestamp actuel
    const diff = extendedEnd - now;          // ⌛ Temps restant avant la fin (avec 2min en plus)

    let newStatus;

    if (diff <= 0) {
      // ✅ Si la promo est réellement terminée (avec les 2 min), message générique
      newStatus = "⏳ Nouveau jeu dispo !";
    } else if (diff < 10_000) {
      // ⚠️ Si on est à moins de 10 secondes de la fin, on n'affiche rien pour éviter un switch rapide
      return;
    } else {
      // 🗓️ Sinon, on affiche le temps restant
      const formatted = formatTimeLeft(diff);
      newStatus = `⏳ Prochain jeu : ${formatted}`;
    }

    // ✅ Met à jour le statut uniquement si le message a changé
    if (newStatus !== lastStatus) {
      client.user.setActivity(newStatus, { type: ActivityType.Custom });
      lastStatus = newStatus; // 📝 On stocke le statut actuel pour comparaison future
    }
  }

  /**
   * 🖥️ Log console toutes les heures
   */
  function logStatus() {
    const now = Date.now();
    const diff = extendedEnd - now;
    if (diff > 0) {
      log.info(`⌛ Temps restant avant la prochaine promo : ${formatTimeLeft(diff)}`);
    }
  }

  // ⛔️ Empêche les doublons d'intervalles
  if (refreshInterval) clearInterval(refreshInterval);
  if (logInterval) clearInterval(logInterval);

  // 🚀 Mise à jour continue
  refresh();                        // immédiat
  refreshInterval = setInterval(refresh, 60_000);     // chaque minute
  logInterval = setInterval(logStatus, 3600_000);     // chaque heure
};
