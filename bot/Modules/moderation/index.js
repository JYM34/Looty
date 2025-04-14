// 📁 bot/Modules/moderation/index.js

const forbiddenPatterns = [
    /discord\.gg\/[a-zA-Z0-9]+/i, // liens d'invitations Discord
    /https?:\/\/[^\s]+/i          // tout lien http/https
  ];
  
  module.exports = {
    handleMessageModeration: async (message, config) => {
      if (!config.moderation) return;
  
      // 🔒 Ignore les bots ou les admins
      if (message.author.bot || message.member.permissions.has("Administrator")) return;
  
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(message.content)) {
          try {
            await message.delete();
            await message.channel.send(`🚫 [AutoMod] Le message a été supprimé (lien non autorisé).`);
          } catch (err) {
            log.warn(`[Moderation] Impossible de supprimer le message :`, err.message);
          }
          break;
        }
      }
    }
  };
  