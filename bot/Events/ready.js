// 📦 Importe la configuration globale (couleurs console, etc.)
const config = require("../config");

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
    log.debug(`Mode developpement `, `activé`)

    // 🚀 Lancement de la logique Epic Games (embed + statut)
    scheduler(client);
  }
};
