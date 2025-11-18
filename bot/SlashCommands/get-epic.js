const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

/**
 * /get-epic
 * Commande utilitaire pour tester la récupération depuis `epic-games-free`.
 * Affiche en console la liste des jeux récupérés (current + next).
 */
module.exports = {
  showHelp: true,
  category: "info",
    
  data: new SlashCommandBuilder()
    .setName("get-epic")
    .setDescription("Réponds pong")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
  /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').CommandInteraction} interaction
   */
  run: async (client, interaction) => {

const { getEpicFreeGames } = require("epic-games-free");
const guildConfig = {
  country: "FR", // ou récupéré dynamiquement via `configs[guildId]`
  locale: "fr-FR"
};

// Exemple d'utilisation
getEpicFreeGames({ guildConfig })
  .then((response) => {
    const elements = response || {};

    const currentGames = elements.currentGames || [];
    const nextGames = elements.nextGames || [];

    const allGames = [...currentGames, ...nextGames];

    console.log(`Nombre d'éléments : ${allGames.length}`);

    allGames.forEach((game, i) => {
      const emoji = game.status === "currentGames" ? "🟢" : "🟡";
      console.log(`
    ${emoji} ${game.title}
       🏷️ Auteur : ${game.author}
       🕒 Du ${game.effectiveDate} au ${game.expiryDate}
       💶 Prix : ${game.price}
       🔗 URL : ${game.url}
    `);
    });

    // Afficher une seule fois l’objet complet si besoin
    console.log("Structure complète des éléments :");
    console.dir(elements, { depth: null });

  })
  .catch(console.error);
    }
};