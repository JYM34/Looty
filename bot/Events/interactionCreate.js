const { InteractionType } = require("discord.js");
require("dotenv").config();

module.exports = {
  name: "interactionCreate",

  /**
   * 💬 Gère l'exécution des commandes slash
   * @param {import('discord.js').Interaction} interaction
   */
  async execute(interaction) {
    const client = interaction.client;

    // 🚫 Ignore tout sauf les slash commands
    if (interaction.type !== InteractionType.ApplicationCommand || interaction.user.bot) return;

    // ✅ Récupère la commande depuis la collection
    const command = client.commands.get(interaction.commandName.toLowerCase());

    if (!command || typeof command.run !== "function") {
      log.warn(`❌ Commande '${interaction.commandName}' non trouvée ou invalide.`);
      return;
    }

    try {
      // 📥 Log dans un salon spécifique (si configuré)
      await sendDiscordLog(client, interaction, process.env.LOG_CHANNEL_ID);

      // ▶️ Exécution de la commande
      await command.run(client, interaction);
    } catch (error) {
      log.error(`💥 Erreur lors de l'exécution de /${interaction.commandName} : ${error.message}`);
      await interaction.reply({
        content: "❌ Une erreur est survenue pendant la commande.",
        ephemeral: true,
      });
    }
  }
};

/**
 * 🔔 Log les commandes utilisées dans un salon spécifique
 * @param {Client} client
 * @param {Interaction} interaction
 * @param {string} channelId
 */
async function sendDiscordLog(client, interaction, channelId) {
  if (!channelId) return;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      log.warn(`⚠️ Salon log invalide ou non textuel (${channelId})`);
      return;
    }

    const me = channel.guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has("SendMessages")) {
      log.warn("⚠️ Pas la permission d'envoyer des messages dans le salon log.");
      return;
    }

    await channel.send(`📥 ${interaction.user.tag} a utilisé la commande \`/${interaction.commandName}\``);
  } catch (err) {
    log.error(`❌ Erreur log salon : ${err.message}`);
  }
}
