const Discord = require('discord.js');
const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    showHelp: true,
    category: "info",
    
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Réponds pong")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    /**
     * Retourne le ping websocket du bot.
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').CommandInteraction} interaction
     */
    run: async (client, interaction) => {

        const embed = new EmbedBuilder()
            .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL({ size: 1024})})
            .setTitle('Pong!')
            .setDescription(`ping: ${Math.round(client.ws.ping)}ms`)
            .setColor(config.color)
            .setTimestamp()
            .setFooter({ text: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ size: 1024})})

        interaction.reply({ embeds: [embed] })
    }
};