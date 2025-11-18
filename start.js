// 📦 Fichier de démarrage principal

require("dotenv").config(); // 🌍 .env au tout début

global.log = require("./shared/log");
global.config = require("./shared/config");
const client = require("./bot/client");
const loadCommands = require("./bot/Loaders/loadCommands");
const loadEvents = require("./bot/Loaders/loadEvents");

// ============================================
// Point d'entrée: démarre le bot et le dashboard
// ============================================
(async () => {
  try {
    // Charge les commandes et événements
    await loadCommands(client);
    loadEvents(client);

    // 🧹 Clear console et affichage d'initialisation
    console.clear();
    log.success(`Initialisation...`);

    // Attendre l'événement custom `clientReady` (émis depuis `bot/ready.js`)
    client.once("clientReady", () => {
      log.success(`${config.PINK}-------------------------${config.WHITE}`);
      log.success(`${config.GREEN}🌐 Connecté en tant que ${config.BLUE}${client.user.username}${config.WHITE}`);
      log.success(`${config.PINK}-------------------------${config.WHITE}`);
    });

    // Connexion au gateway Discord
    await client.login(process.env.TOKEN);
    log.success("Connexion à l'API Discord en cours...");

    // ✅ Lancement du dashboard une fois connecté au bot
    require("./web/app")(client);
} catch (err) {
    // Gestion d'erreur globale au démarrage — log complet pour debug
    log.error("Erreur au lancement global :", err); // <- Affiche brute l'erreur
    log.error("Erreur au lancement global :", err?.stack || err);
  }
})();
