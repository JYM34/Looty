const { ActivityType } = require("discord.js");
const formatTimeLeft = require("../../Fonctions/formatTimeLeft");

/**
 * 🕹️ Met à jour dynamiquement le statut du bot selon la promo Epic
 * @param {Client} client - Instance du bot Discord
 * @param {number} endTimestamp - Date de fin de la promo (en ms)
 */
module.exports = function updateBotStatus(client, endTimestamp) {

// 🔁 Variable pour stocker le dernier statut affiché
let lastStatus = "";

/**
 * ⏰ Met à jour le statut visible du bot Epic Games
 */
function refresh() {
  const now = Date.now();                      // ⌚ Timestamp actuel
  const diff = endTimestamp - now;             // ⌛ Temps restant avant la fin de la promo

  let newStatus;

  if (diff <= 0) {
    // ✅ Si la promo est terminée, message générique
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
