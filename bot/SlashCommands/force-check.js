// 📦 Imports nécessaires
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");  // Builder pour créer une slash command
const sendEmbeds = require("../Modules/epic/sendEmbeds");                    // Envoie les jeux Epic en embed
const updateStatus = require("../Modules/epic/updateStatus");                // Met à jour le statut du bot
const { getEpicFreeGames } = require("epic-games-free");                     // Récupère les jeux gratuits Epic
const channels = require("../../shared/channels.json");                      // Config JSON des salons

module.exports = {
  // 🛠️ Définition de la commande /force-check
  data: new SlashCommandBuilder()
    .setName("force-check")
    .setDescription("🔁 Force l’envoi immédiat des jeux Epic Games")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Réservée aux admins

  /**
   * ▶️ Fonction exécutée quand on utilise la commande /force-check
   * @param {import('discord.js').Client} client - Instance du bot
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - Interaction Discord reçue
   */
  async run(client, interaction) {
    try {
      // ⏳ On répond de façon différée pour éviter le timeout (éphémère = visible que par l'utilisateur)
      await interaction.deferReply({ flags: 64 }); // 64 = Interaction ephemeral

      // 📥 Récupération des salons à partir de la config
      const { currentGamesChannelId, nextGamesChannelId } = channels.epicGames;

      // 📡 Appel de l'API pour obtenir les jeux gratuits actuels
      const { currentGames } = await getEpicFreeGames();

      // 📤 Envoie des jeux dans les salons configurés
      await sendEmbeds(client, currentGamesChannelId, nextGamesChannelId);

      // 🕹️ Mise à jour du statut si on a bien un jeu en cours
      if (currentGames?.[0]) {
        const end = new Date(currentGames[0].expiryDate).getTime() + 60_000; // On ajoute une marge de sécurité
        log.info("⌛ +1min de marge ajoutée avant mise à jour du statut.");
        updateStatus(client, end);
      }

      // ✅ Message de confirmation dans Discord
      await interaction.editReply("✅ Vérification Epic Games forcée !");
    } catch (err) {
      // ❌ Gestion propre des erreurs (réponse + log console)
      console.error("❌ Erreur /force-check :", err);
      await interaction.editReply("❌ Une erreur est survenue pendant l'exécution de la commande.");
    }
  }
};
