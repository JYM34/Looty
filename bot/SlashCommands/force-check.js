const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const sendEmbeds = require("../Modules/epic/sendEmbeds");        // ↗️ Envoi des embeds
const updateStatus = require("../Modules/epic/updateStatus");    // 🔄 Maj du statut bot
const { getEpicFreeGames } = require("epic-games-free");         // 📦 Jeux gratuits
const path = require("path");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("force-check")
    .setDescription("🔁 Force l’envoi immédiat des jeux Epic Games")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

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
      const { currentGames } = await getEpicFreeGames({ guildConfig: { country, locale } });

      if (!currentGames.length) {
        return await interaction.editReply("❌ Aucun jeu gratuit Epic trouvé pour le moment.");
      }

      // 📨 Envoi des embeds dans les salons configurés
      await sendEmbeds(client, currentGamesChannelId, nextGamesChannelId, logsChannelId, { country, locale });

      // 🕓 Mise à jour du statut
      const end = new Date(currentGames[0].expiryDate).getTime() + 60_000;
      updateStatus(client, end);

      await interaction.editReply("✅ Vérification Epic Games forcée !");
    } catch (err) {
      log.error("Erreur /force-check :", err);
      await interaction.editReply("❌ Une erreur est survenue pendant l’exécution de la commande.");
    }
  }
};
