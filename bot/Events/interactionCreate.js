const { InteractionType, EmbedBuilder } = require("discord.js");
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
      const guildConfigs = require("../../shared/guilds.json"); // adapte le chemin si besoin

      const guildId = interaction.guild?.id;
      const logChannelId = guildConfigs[guildId]?.epic?.logsChannelId;
      
      if (!logChannelId) {
        log.warn(` Aucun salon log configuré pour le channel ${logChannelId}`);
        log.warn(` Aucun salon log configuré pour la guilde ${guildId}`);
        return;
      }
      
      await sendDiscordLog(client, interaction, logChannelId);

      // ▶️ Exécution de la commande
      await command.run(client, interaction);
    } catch (error) {
      log.error(`💥 Erreur lors de l'exécution de /${interaction.commandName} : `, error.message);
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

    log.debug(`✅ Salon récupéré : `,`${channel.name} (${channel.id})`);

    if (!channel.isTextBased()) {
      log.warn(`⚠️ Salon non textuel ou invalide : ${channelId}`);
      return;
    }

    log.debug(`🔍 Vérification de la présence du bot dans la guilde...`);
    const me = channel.guild.members.me;

    if (!me) {
      log.warn(`⚠️ Impossible de récupérer le membre bot dans la guilde ${channel.guild.id}`);
      return;
    }

    log.debug(`✅ Bot trouvé dans la guilde : ${channel.guild.name} (${channel.guild.id})`);

    const perms = channel.permissionsFor(me);
    if (!perms) {
      log.warn(`⚠️ Impossible d'obtenir les permissions du bot dans le salon ${channel.id}`);
      return;
    }

    log.debug(`🔍 Vérification de la permission 'SendMessages'...`);
    
    if (!perms?.has("SendMessages")) {
      log.warn("⚠️  Pas la permission d'envoyer des messages dans le salon log.",`${channel.id}`);
      return;
    }

    log.debug(`📨 Envoi du message de log dans le salon ${channel.name}...`);
    if (!perms.has("ViewChannel")) {
      log.warn(`⚠️ Le bot ne peut pas voir le salon ${channel.id}`);
      return;
    }
    
    if (!perms.has("ReadMessageHistory")) {
      log.warn(`⚠️ Le bot ne peut pas lire l'historique du salon ${channel.id}`);
      return;
    }

      const embed = new EmbedBuilder()
      .setColor(0x2f3136)
      .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ size: 1024 }) })
      .setDescription(`▶️ Utilisation de la commande \`/${interaction.commandName}\``)
      .setTimestamp()
      .setFooter({ text: `Effectué par : ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ size: 1024 }) });

    await channel.send({ embeds: [embed] });

    log.debug(`📡 Log envoyé vers salon ${channel.name} (${channel.id}) dans la guilde ${channel.guild.name}`);
  } catch (err) {
    log.error(`Erreur log salon : `,`${err.message}`);
  }
}
