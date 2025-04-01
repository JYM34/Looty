const { InteractionType } = require("discord.js");
const { readdirSync, existsSync } = require("fs");
const path = require("path");
require("dotenv").config();
const log = require("../Fonctions/log");

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
            await command.run(client, interaction, interaction.options);
        } catch (error) {
            log.error(`Erreur exécution commande '${interaction.commandName}' : ${error.message}`);
            await interaction.reply({
                content: '❌ Une erreur est survenue lors de l’exécution de la commande.',
                ephemeral: true
            });
        }
    }
};

// 🔔 Fonction de log Discord dans un canal spécifique
async function sendDiscordLog(client, interaction, channelId) {
    if (!channelId) return; // Ne fait rien si aucune ID fournie

    try {
        const channel = await client.channels.fetch(channelId);
        if (channel) {
            await channel.send(`📥 ${interaction.user.tag} a utilisé la commande \`/${interaction.commandName}\``);
        } else {
            log.warn(`Canal ID ${channelId} introuvable.`);
        }
    } catch (err) {
        log.error(`Erreur lors de l'envoi dans le canal de log : ${err.message}`);
    }
}

