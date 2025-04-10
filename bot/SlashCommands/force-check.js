// 📦 Imports nécessaires
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const sendEmbeds = require("../Modules/epic/sendEmbeds");      // ↗️ Envoi d'embeds dans les salons
const updateStatus = require("../Modules/epic/updateStatus");  // 🔄 Mise à jour du statut
const { getEpicFreeGames } = require("epic-games-free");
const path = require("path");
const fs = require("fs");

module.exports = {
  // 🛠️ Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName("force-check")
    .setDescription("🔁 Force l’envoi immédiat des jeux Epic Games")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * ▶️ Fonction exécutée quand on utilise /force-check
   * @param {import('discord.js').Client} client - Instance du bot
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - Interaction reçue
   */
  async run(client, interaction) {
    try {
      // ⏳ On répond de façon différée (éphémère = visible uniquement par l’admin)
      await interaction.deferReply({ flags: 64 });

      const guildId = interaction.guildId;

      // 📖 On lit dynamiquement la config la plus récente
      const configPath = path.join(__dirname, "../../shared/guilds.json");
      const configs = JSON.parse(fs.readFileSync(configPath, "utf8"));

      const guildConfig = configs[guildId];
      if (!guildConfig) {
        return await interaction.editReply("⚠️ Ce serveur n’a pas encore été configuré via le dashboard.");
      }

      const { currentGamesChannelId, nextGamesChannelId } = guildConfig;

      if (!currentGamesChannelId || !nextGamesChannelId) {
        return await interaction.editReply("⚠️ Les salons Epic Games ne sont pas encore configurés.");
      }

      // 🎮 On récupère les jeux en cours
      const { currentGames } = await getEpicFreeGames();
      if (!currentGames.length) {
        return await interaction.editReply("❌ Aucun jeu gratuit Epic trouvé pour le moment.");
      }

      // 📤 Envoi des jeux dans les salons
      await sendEmbeds(client, currentGamesChannelId, nextGamesChannelId);

      // ✅ Mise à jour du statut (jusqu’à la fin de l’offre du 1er jeu)
      const end = new Date(currentGames[0].expiryDate).getTime() + 60_000;
      updateStatus(client, end);

      await interaction.editReply("✅ Vérification Epic Games forcée !");
    } catch (err) {
      console.error("❌ Erreur /force-check :", err);
      await interaction.editReply("❌ Une erreur est survenue pendant l’exécution de la commande.");
    }
  }
};
