// 📦 Imports nécessaires
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js"); // Pour créer une commande slash avec permissions
const sendEpicGamesEmbed = require("../Fonctions/sendEpicGamesEmbed");      // Envoie les jeux dans les salons Discord
const updateBotStatus = require("../Fonctions/updateBotStatus");            // Met à jour le statut du bot (temps restant)
const { getEpicFreeGames } = require("epic-games-free");                    // Lib perso pour récupérer les jeux Epic
const channels = require("../../shared/channels.json");                     // Config des salons (current / next)

module.exports = {
  // 🔧 Définition de la commande slash
  data: new SlashCommandBuilder()
    .setName("force-check")                                                  // Nom de la commande
    .setDescription("🔁 Force l’envoi immédiat des jeux Epic Games")        // Description affichée dans Discord
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),        // Seuls les admins peuvent l’utiliser

  // 🚀 Ce qui se passe quand un user exécute /force-check
  async run(client, interaction) {
    try {
      // ⏳ On prépare une réponse éphémère (invisible pour les autres)
      await interaction.deferReply({ flags: 64 }); // 64 = Interaction ephemeral

      // 🎯 Récupération des salons ciblés (config dans channels.json)
      const { currentGamesChannelId, nextGamesChannelId } = channels.epicGames;

      // 🔁 On check l’API Epic Games pour récupérer les jeux gratuits actuels
      const { currentGames } = await getEpicFreeGames();

      // 📤 On envoie les embeds dans les bons salons (jeux actuels + à venir)
      await sendEpicGamesEmbed(client, currentGamesChannelId, nextGamesChannelId);

      // 🕰 Si un jeu est trouvé → on met à jour le statut du bot
      if (currentGames?.[0]) {
        const end = new Date(currentGames[0].expiryDate).getTime() + 60_000; // 🛡️ +1 min de marge de sécurité
        log.info(`⌛ Délai de sécurité : +1min ajouté avant mise à jour du statut.`);
        updateBotStatus(client, end);
      }

      // ✅ On répond dans Discord que tout s’est bien passé
      await interaction.editReply("✅ Vérification Epic Games forcée !");
    } catch (err) {
      // ❌ Gestion des erreurs si l’API ou Discord plante
      console.error("❌ Erreur /force-check :", err);
      await interaction.editReply("❌ Une erreur est survenue.");
    }
  }
};
