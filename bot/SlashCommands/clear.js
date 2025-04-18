// 📁 bot/SlashCommands/clear.js

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('🧹 Supprime un certain nombre de messages dans ce salon')
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de messages à supprimer (max 100)')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async run(client, interaction) {
    const amount = interaction.options.getInteger('nombre');
    const channel = interaction.channel;

    // ✅ Vérifie que le salon est textuel (TextChannel ou ForumThread)
    if (![ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.PublicThread, ChannelType.PrivateThread].includes(channel.type)) {
      return interaction.reply({
        content: '❌ Cette commande ne peut être utilisée que dans un salon textuel.',
        flags: 64
      });
    }

    // 🛡️ Vérifie que le bot a les permissions nécessaires dans ce salon
    const botPermissions = channel.permissionsFor(interaction.guild.members.me);

    if (!botPermissions.has(PermissionFlagsBits.ViewChannel) ||
        !botPermissions.has(PermissionFlagsBits.ReadMessageHistory) ||
        !botPermissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: '❌ Je n’ai pas les permissions nécessaires dans ce salon (voir, lire l’historique, gérer les messages).',
        flags: 64
      });
    }

    // 🔢 Validation du nombre demandé
    if (amount < 1 || amount > 100) {
      return interaction.reply({
        content: '❌ Tu dois fournir un nombre entre 1 et 100.',
        flags: 64
      });
    }

    // 🧹 Tentative de suppression
    try {
      const deleted = await channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `✅ ${deleted.size} message(s) supprimé(s).`,
        flags: 64
      });

    } catch (err) {
      console.error('❌ Erreur suppression messages :', err);
      return interaction.reply({
        content: '❌ Une erreur est survenue lors de la suppression. Vérifie les permissions ou l’âge des messages (max 14 jours).',
        flags: 64
      });
    }
  }
};


