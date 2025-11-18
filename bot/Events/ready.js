/**
 * ready.js
 * Evénement déclenché quand le bot est prêt. Actions principales :
 *  - lance le `scheduler` (surveillance des promos Epic)
 *  - enregistre dynamiquement les commandes slash pour chaque guilde
 *
 * Remarques opérationnelles :
 *  - L'enregistrement des slash commands est fait ici guild-by-guild pour garantir la disponibilité
 *    immédiate des commandes locales. Assurez-vous que `process.env.TOKEN` et `client.user.id` sont corrects.
 */
// ⏱️ Fonction centrale pour planifier l'envoi des jeux Epic + mise à jour de statut
const scheduler = require("../Modules/epic/scheduler");
const { REST, Routes } = require("discord.js");

module.exports = {
  name: "clientReady",     // Nom de l’événement Discord
  once: true,        // Ne s’exécute qu’une seule fois à la connexion

  /**
   * 🔁 Événement déclenché quand le bot est prêt
   * @param {import('discord.js').Client} client - Instance du bot Discord
   */
  async execute(client) {
    // ✅ Affichage dans le terminal que le bot est bien prêt
    log.success(`Bot opérationnel !`);

    if (config.APP_ENVIRONMENTS === 'debug') {
      log.debug(`Mode ${config.APP_ENVIRONMENTS} activé`);
    } else {
      log.info(`Mode ${config.APP_ENVIRONMENTS} activé`);
    }

    // 🚀 Lancement de la logique Epic Games (embed + statut)
    scheduler(client);

    // 🧠 Enregistrement automatique des slash commands dans chaque guilde
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    for (const [guildId, guild] of client.guilds.cache) {
      try {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, guildId),
          { body: commands }
        );
        log.success(`Commandes slash enregistrées pour ${guild.name} (${guildId})`);
      } catch (err) {
        log.error(`Erreur enregistrement slash dans ${guild.name} (${guildId}) :`, err.message);
      }
    }
  }
};

