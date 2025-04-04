// 📦 Imports nécessaires
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js"); // Pour créer une slash command
const sendEmbeds = require("../Modules/epic/sendEmbeds");                          // Fonction d’envoi des jeux Epic Games
const channels = require("../../shared/channels.json");                     // Config des salons

module.exports = {
  // 🧩 Définition de la commande /epic
  data: new SlashCommandBuilder()
    .setName("epic")
    .setDescription("🎮 Affiche les jeux gratuits Epic Games")
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  /**
   * ▶️ Exécution de la commande /epic
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async run(client, interaction) {
    try {
      // ⏳ Réponse différée (éphémère)
      await interaction.deferReply({ flags: 64 }); // 64 = Interaction ephemeral

      // 🛠️ Récupération des IDs de salons depuis la config
      const { currentGamesChannelId, nextGamesChannelId } = channels.epicGames;

      // 🚀 Envoi des jeux dans les salons configurés
      await sendEmbeds(client, currentGamesChannelId, nextGamesChannelId);

      // ✅ Réponse à l'utilisateur
      await interaction.editReply("🎉 Jeux envoyés dans les salons configurés !");
    } catch (err) {
      // ❌ Gestion des erreurs API ou embed
      console.error("❌ Erreur commande /epic :", err);

      try {
        await interaction.editReply("❌ Une erreur est survenue pendant l’envoi.");
      } catch (editErr) {
        console.error("❌ Erreur lors de l'editReply :", editErr);
      }
    }
  }
};
