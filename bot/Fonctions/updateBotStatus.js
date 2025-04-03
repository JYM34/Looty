const { ActivityType } = require("discord.js");
const formatTimeLeft = require("./formatTimeLeft");

/**
 * 🕹️ Met à jour dynamiquement le statut du bot selon la promo Epic
 * @param {Client} client - Instance du bot Discord
 * @param {number} endTimestamp - Date de fin de la promo (en ms)
 */
module.exports = function updateBotStatus(client, endTimestamp) {

  /**
   * ⏰ Met à jour le statut visible du bot
   */
  function refresh() {
    const now = Date.now();
    const diff = endTimestamp - now;

    if (diff <= 0) {
      // ✅ Promo terminée : affiche un message générique
      client.user.setActivity("⏳ Nouveau jeu dispo !", { type: ActivityType.Custom });
      return;
    }

    // 📆 Format "Xj HHh MMmn"
    const formatted = formatTimeLeft(diff);
    client.user.setActivity(`⏳ Prochain jeu : ${formatted}`, { type: ActivityType.Custom });
  }

  /**
   * 🖥️ Log console toutes les heures
   */
  function logStatus() {
    const now = Date.now();
    const diff = endTimestamp - now;
    if (diff > 0) {
      log.info(`⌛ Temps restant avant la prochaine promo : ${formatTimeLeft(diff)}`);
    }
  }

  // 🚀 Mise à jour continue
  refresh();                        // immédiat
  setInterval(refresh, 60_000);     // chaque minute
  setInterval(logStatus, 3600_000); // chaque heure
};
