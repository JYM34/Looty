const { InteractionType } = require("discord.js");
const { readdirSync, existsSync } = require("fs");
const path = require("path");
require("dotenv").config();

module.exports = {
    name: "interactionCreate",

    async execute(interaction) {
        const client = interaction.client;

        // Ignorer si ce n’est pas une commande ou si l’utilisateur est un bot
        if (interaction.type !== InteractionType.ApplicationCommand || interaction.user.bot) return;

        try {
            const commandsPath = path.join(__dirname, "..", "SlashCommands");

            if (!existsSync(commandsPath)) {
                log.warn(`Dossier SlashCommands introuvable.`);
                return;
            }

            const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith(".js"));

            const command = commandFiles
                .map(file => require(path.join(commandsPath, file)))
                .find(cmd => cmd?.data?.name?.toLowerCase() === interaction.commandName.toLowerCase());

            if (!command || typeof command.run !== "function") {
                log.warn(`Commande '${interaction.commandName}' introuvable ou invalide.`);
                return;
            }

            // Log dans un canal Discord (si configuré)
            await sendDiscordLog(client, interaction, process.env.LOG_CHANNEL_ID);

            // Exécution de la commande
            await command.run(client, interaction);
        } catch (error) {
            log.error(`Erreur exécution commande '${interaction.commandName}' : ${error.message}`);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l’exécution de la commande.',
                ephemeral: true
            });
        }
    }
};

/**
 * 🔔 Fonction de log Discord dans un canal spécifique
 * Envoie un message dans un canal défini pour tracer les commandes utilisées.
 *
 * @param {Client} client - Le client Discord
 * @param {Interaction} interaction - L'interaction déclenchée (slash command)
 * @param {string} channelId - L'ID du salon où envoyer les logs
 */
async function sendDiscordLog(client, interaction, channelId) {
    if (!channelId) return; // 🛑 Ignore si aucun salon configuré
  
    try {
      // 🔍 Récupère le salon cible
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        log.warn(`⚠️ Canal log introuvable ou non textuel (${channelId})`);
        return;
      }
  
      // 🔐 Vérifie que le bot a la permission d'envoyer un message
      const me = channel.guild.members.me;
      const perms = channel.permissionsFor(me);
      if (!perms || !perms.has("SendMessages")) {
        log.warn("⚠️ Le bot n’a pas la permission d’envoyer un message dans ce salon.");
        return;
      }
  
      // ✅ Envoie le message de log
      await channel.send(`📥 ${interaction.user.tag} a utilisé la commande \`/${interaction.commandName}\``);
  
    } catch (err) {
      // ❌ Gestion des erreurs
      log.error(`❌ Erreur lors de l'envoi dans le canal de log : ${err.message}`);
    }
  }
  

