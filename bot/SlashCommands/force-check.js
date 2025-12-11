const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const sendEmbeds = require("../Modules/epic/sendEmbeds");        // ↗️ Envoi des embeds
const updateStatus = require("../Modules/epic/updateStatus");    // 🔄 Maj du statut bot
const { getEpicFreeGames } = require("epic-games-free");         // 📦 Jeux gratuits
const path = require("path");
const fs = require("fs");

/**
 * /force-check
 * Commande d'administration qui force l'appel à l'API Epic Games et l'envoi immédiat
 * des embeds dans les salons configurés pour la guilde courante.
 *
 * - Lit `shared/guilds.json` pour récupérer la configuration de la guilde
 * - Utilise `epic-games-free` pour récupérer `currentGames`
 * - Appelle `sendEmbeds` et `updateStatus`
 */
module.exports = {
  data: new SlashCommandBuilder()
    .setName("force-check")
    .setDescription("🔁 Force l’envoi immédiat des jeux Epic Games")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * Exécute la commande
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  async run(client, interaction) {
    try {
      await interaction.deferReply({ flags: 64 }); // Réponse éphémère
      const guildId = interaction.guildId;

      // 🔍 Lecture config locale depuis fichier unique
      const configPath = path.join(__dirname, "../../shared/guilds.json");
      const guildsConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const guildConfig = guildsConfig[guildId];

      if (!guildConfig?.epic) {
        return await interaction.editReply("⚠️ Ce serveur n’a pas encore été configuré via le dashboard.");
      }

      const {
        currentGamesChannelId,
        nextGamesChannelId,
        logsChannelId,
        country,
        locale
      } = guildConfig.epic;

      // ⛔ Vérifie que les salons sont définis
      if (!currentGamesChannelId || !nextGamesChannelId) {
        return await interaction.editReply("⚠️ Les salons Epic Games ne sont pas encore configurés.");
      }

      // 🧪 DEBUG complet
      log.debug("🎯 Force-check déclenché avec :", {
        guildId,
        currentGamesChannelId,
        nextGamesChannelId,
        logsChannelId,
        country,
        locale
      });

      // 📦 Appelle l’API avec les paramètres régionaux
      const { currentGames, nextGames } = await getEpicFreeGames({ guildConfig: { country, locale } });

      // Si AUCUN jeu (ni actuel ni futur), on arrête tout
      if (!currentGames.length && !nextGames.length) {
        return await interaction.editReply("❌ Aucun jeu gratuit Epic trouvé (ni actuel, ni à venir).");
      }

      // 📨 Envoi des embeds (même si current est vide, on envoie nextGames)
      await sendEmbeds(client, currentGamesChannelId, nextGamesChannelId, logsChannelId, { country, locale });

      // 🕓 Mise à jour du statut
      let endDate;
      if (currentGames.length > 0) {
          // Cas normal : on prend la fin du jeu actuel
          endDate = new Date(currentGames[0].expiryDate).getTime() + 60_000;
      } else if (nextGames.length > 0) {
          // Cas "vide" : on prend le début du prochain jeu comme échéance
          endDate = new Date(nextGames[0].effectiveDate).getTime() + 60_000;
      }

      if (endDate) {
          updateStatus(client, endDate);
      }

      await interaction.editReply("✅ Vérification Epic Games forcée !");
    } catch (error) {
      log.error("❌ Erreur lors de force-check :", error);
      await interaction.editReply("❌ Une erreur est survenue lors de la vérification.");
    }
  }
};
