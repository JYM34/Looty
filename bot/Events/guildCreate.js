module.exports = {
    name: "guildCreate",
  
    async execute(guild, client) {
      // 🛡️ Vérifie si le propriétaire du serveur est un bot
      const owner = await guild.fetchOwner();
      if (owner.user.bot) {
        log.warn(`🚫 Le serveur "${guild.name}" est géré par un autre bot. Aucun message envoyé.`);
        return;
      }
      try {
        const defaultChannel =
          guild.systemChannel ||
          guild.channels.cache.find(c => c.type === 0 && c.permissionsFor(guild.me).has("SendMessages"));
  
        if (defaultChannel) {
            const { EmbedBuilder } = require("discord.js");
            const embed = new EmbedBuilder()
              .setColor("#00bfff")
              .setTitle("🎮 Bienvenue sur Looty !")
              .setDescription(`Merci d’avoir ajouté Looty à **${guild.name}** !`)
              .addFields({ name: "🔧 Configurer Looty", value: `[Cliquez ici](https://looty.nkconcept.fr/dashboard/${guild.id})` })
              .setFooter({ text: "Looty - Jeux gratuits Epic Games" });
            
            defaultChannel.send({ embeds: [embed] });
        }
  
        log.error(`✅ Nouveau serveur ajouté : `, guild.name);
      } catch (error) {
        log.error(`❌ Erreur lors du message de bienvenue :`, error);
      }
    }
  };
  