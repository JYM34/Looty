const Discord = require('discord.js');
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const config = require("../config");

module.exports = {
    showHelp: true,
    category: "info",
    
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Réponds pong")
        .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator),
    
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