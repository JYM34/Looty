// 📦 Import des modules nécessaires
const { getEpicFreeGames } = require("epic-games-free");
const sendEpicGamesEmbed = require("./sendEpicGamesEmbed");
const updateBotStatus = require("./updateBotStatus");
const path = require("path");
const fs = require("fs");

// 📁 Lecture du fichier JSON de configuration des salons
const channelsPath = path.join(__dirname, "../../shared/channels.json");
const { currentGamesChannelId, nextGamesChannelId } = JSON.parse(fs.readFileSync(channelsPath, "utf-8"));

/**
 * ⏱️ Planifie l’envoi des jeux gratuits Epic + met à jour le statut Discord
 * @param {Client} client - Instance du bot Discord
 */
module.exports = async function scheduleEpicTask(client) {
  const { currentGames, nextGames } = await getEpicFreeGames(); // ✅ Structure directe

  // ⛔ Aucun jeu gratuit actuel
  if (!currentGames.length) {
    log.warn("⚠️ Aucun jeu gratuit Epic trouvé.");
    return;
  }

  // 📆 Calcul du temps jusqu’à la fin de la promo du 1er jeu actuel
  const end = new Date(currentGames[0].expiryDate).getTime(); // ✅ Nouveau champ : expiryDate
  const now = Date.now();
  const securityDelay = 60_000; // 🕐 +1 minute pour laisser Epic se mettre à jour
  const delay = end - now + securityDelay;
  
  if (delay > 0) {
    log.info(`⏱️ Prochaine vérif dans ${Math.round(delay / 1000)} sec (+1min de sécurité).`);
  
    setTimeout(async () => {
      await sendEpicGamesEmbed(client, currentGamesChannelId, nextGamesChannelId);
      log.success("🎉 Jeux Epic envoyés !");
      scheduleEpicTask(client); // Replanifie après exécution
    }, delay);
  }

  // 🕐 Mise à jour régulière du statut Discord
  updateBotStatus(client, end);
};
