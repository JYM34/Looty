// 📦 Import des modules nécessaires
const { getEpicFreeGames } = require("epic-games-free"); // Lib externe qui récupère les jeux gratuits depuis l'API officielle
const path = require("path");
const fs = require("fs");

// ⚠️ On évite les dépendances circulaires avec sendEmbeds → import dynamique + updateStatus OK ici
// const sendEpicGamesEmbed = require("./sendEmbeds"); ❌ causait circular dependency
const updateStatus = require("./updateStatus"); // Helper safe pour le statut du bot

// 📁 Récupération de la configuration des salons depuis un fichier JSON partagé
const channelsPath = path.join(__dirname, "../../../shared/guilds.json");
const { currentGamesChannelId, nextGamesChannelId } = JSON.parse(
  fs.readFileSync(channelsPath, "utf-8")
);

/**
 * ⏱️ Planifie l’envoi automatique des jeux gratuits Epic Games + met à jour le statut du bot
 * @param {import('discord.js').Client} client - L’instance du bot Discord
 */
module.exports = async function scheduleTask(client) {
  // 📡 Récupère les jeux Epic en cours depuis l’API
  const { currentGames } = await getEpicFreeGames();

  // 🚫 Si aucun jeu gratuit dispo, on log et on quitte la fonction
  if (!currentGames.length) {
    log.warn("⚠️ Aucun jeu gratuit Epic trouvé.");
    return;
  }

  // 🕐 Calcule combien de temps il reste avant la fin de la promo (1er jeu)
  const end = new Date(currentGames[0].expiryDate).getTime(); // Fin de la promo
  const now = Date.now();                                     // Timestamp actuel
  const delay = end - now + 60_000;                           // +1 minute de marge de sécurité

  // ⏳ Si on a un délai positif, on programme un nouvel envoi à la fin de l'offre
  if (delay > 0) {
    log.info(`⏱️ Prochaine vérif dans ${Math.round(delay / 1000)} sec (+1min).`);

    setTimeout(async () => {
      // 📥 Import dynamique pour éviter une boucle de dépendance
      const sendEpicGamesEmbed = require("./sendEmbeds");

      // 📤 Envoie des jeux dans les salons configurés
      await sendEpicGamesEmbed(client, currentGamesChannelId, nextGamesChannelId);

      log.success("🎉 Jeux Epic envoyés !");

      // 🔁 Relance la planification pour continuer en boucle
      scheduleTask(client);
    }, delay);
  }

  // 🕹️ Met à jour le statut Discord (ex: "Nouvelle offre dans 3h12min")
  updateStatus(client, end);
};
