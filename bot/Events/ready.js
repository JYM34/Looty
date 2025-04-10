// ⏱️ Fonction centrale pour planifier l'envoi des jeux Epic + mise à jour de statut
const scheduler = require("../Modules/epic/scheduler");

module.exports = {
  name: "ready",     // Nom de l’événement Discord
  once: true,        // Ne s’exécute qu’une seule fois à la connexion

  /**
   * 🔁 Événement déclenché quand le bot est prêt
   * @param {Client} client - Instance du bot Discord
   */
  async execute(client) {
    // ✅ Affichage dans le terminal que le bot est bien prêt
    log.success(`Bot opérationnel !`);
    if(config.APP_ENVIRONMENTS === 'debug') {
      log.debug(`Mode ${config.APP_ENVIRONMENTS} `, `activé`)
    }
    else {
      log.info(`Mode ${config.APP_ENVIRONMENTS} `, `activé`)
    }

    // 🚀 Lancement de la logique Epic Games (embed + statut)
    scheduler(client);
  }
};
