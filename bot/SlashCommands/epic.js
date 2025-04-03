const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const sendEpicGamesEmbed = require("../Fonctions/sendEpicGamesEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("epic")
    .setDescription("🎮 Affiche les jeux gratuits Epic Games")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  /**
   * 🔁 Exécution de la commande /epic
   * @param {import("discord.js").Client} client - Instance du bot
   * @param {import("discord.js").ChatInputCommandInteraction} interaction - L'interaction slash
   */
  async run(client, interaction) {
    try {
      await interaction.deferReply({ flags: 64 });

      const channels = require("../../shared/channels.json");
      const currentChannelId = channels.epicGames.currentGamesChannelId;
      const nextChannelId = channels.epicGames.nextGamesChannelId;
      
      await sendEpicGamesEmbed(client, currentChannelId, nextChannelId);

      await interaction.editReply("🎉 Jeux envoyés dans les salons configurés !");
    } catch (err) {
      console.error("❌ Erreur commande /epic :", err);
      console.error("❌ Erreur commande /epic :", err.stack || err.message || err);

      try {
        await interaction.editReply("❌ Une erreur est survenue pendant l’envoi.");
      } catch (editErr) {
        console.error("❌ Erreur lors de l'editReply :", editErr);
      }
    }
  }
};
