const { REST, Routes, EmbedBuilder } = require("discord.js");
const loadSlashCommands = require("../../web/Utils/loadSlashCommands")
module.exports = {
  name: "guildCreate", // 🧩 Nom de l'événement (géré automatiquement par ton système de load)

  /**
   * 🔄 Déclenché automatiquement quand le bot est ajouté à un nouveau serveur
   * @param {Guild} guild - Le serveur qui vient d’ajouter le bot
   * @param {Client} client - L'instance du bot Discord
   */
  async execute(guild, client) {
    // 🛡️ Étape 1 : On vérifie si le propriétaire du serveur est un bot (précaution)
    const owner = await guild.fetchOwner();
    if (owner.user.bot) {
      log.warn(`🚫 Le serveur "${guild.name}" est géré par un autre bot. Aucun message envoyé.`);
      return;
    }

    try {
      // 📜 Étape 2 : On charge dynamiquement toutes les commandes slash (même sans redémarrage)
      const commands = loadSlashCommands();

      // 📡 Étape 3 : Enregistrement des slash commands dans le serveur via l'API Discord
      const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        { body: commands }
      );
      log.success(`✅ Commandes slash enregistrées pour ${guild.name} (${guild.id})`);

      // 📫 Étape 4 : Recherche d’un salon dans lequel le bot peut envoyer un message de bienvenue
      const defaultChannel =
        guild.systemChannel || // ✅ Salon système si défini
        guild.channels.cache.find(
          c =>
            c.type === 0 && // 🎯 Type 0 = salon textuel classique
            c.permissionsFor(guild.members.me).has("SendMessages") // 🔐 Permission d’envoyer des messages
        );

      // 📩 Étape 5 : Envoi d’un embed de bienvenue si un salon est trouvé
      if (defaultChannel) {
        const embed = new EmbedBuilder()
          .setColor("#00bfff") // 🎨 Couleur de l’embed
          .setTitle("🎮 Bienvenue sur Looty !")
          .setDescription(`Merci d’avoir ajouté Looty à **${guild.name}** !`)
          .addFields({
            name: "🔧 Configurer Looty",
            value: `[Cliquez ici](https://looty.nkconcept.fr/dashboard/${guild.id})`
          })
          .setFooter({ text: "Looty - Jeux gratuits Epic Games" });

        await defaultChannel.send({ embeds: [embed] }); // 📨 Envoi du message
      }

    } catch (err) {
      // ❌ Si une erreur survient (permissions, API, etc.)
      log.error(`❌ Erreur lors du message ou enregistrement dans ${guild.name} (${guild.id}) :`, err.message);
    }
  }
};
