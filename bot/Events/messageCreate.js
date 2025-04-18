// 📁 bot/Events/messageCreate.js

const { getGuildData } = require("../../web/Utils/guildsFile");
const { handleMessageModeration } = require("../Modules/moderation");

module.exports = {
  name: 'messageCreate',

  execute: async (message) => {
    // Ignorer les messages envoyés par des bots
    if (message.author.bot) return;

    // Ignorer les messages dans les DMs
    if (message.channel.type === 'dm') return;

    // ⚙️ Chargement de la config du serveur
    const config = getGuildData(message.guild.id);

    // 👮‍♂️ Vérifie et applique la modération si activée
    await handleMessageModeration(message, config);

    // 🤖 Exemple simple : répondre à un mot-clé
    if (message.content.includes('hello')) {
      await message.reply('Hello! How can I assist you today?');
    }

    // 🐛 Logger tous les messages (utile en dev)
    log.info(`${message.author.tag} a envoyé un message dans ${message.channel.name}: ${message.content}`);
  }
};

