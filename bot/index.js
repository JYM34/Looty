// 🌍 Variables d'environnement
require("dotenv").config();

// 📦 Dépendances & modules
global.log = require("../shared/log");
const config = require("./config");
const client = require("./client");
const loadCommands = require("./Loaders/loadCommands");
const loadEvents = require("./Loaders/loadEvents");

// 🧹 Terminal clean
console.clear();
log.success(`${config.GREEN}Initialisation...${config.WHITE}`);

// 🚀 Lancement
(async () => {
  try {
    await loadCommands(client);
    loadEvents(client);

    client.once("ready", () => {
      log.success(`${config.PINK}-------------------------${config.WHITE}`);
      log.success(`${config.GREEN}Connecté en tant que ${config.BLUE}${client.user.username}${config.WHITE}`);
      log.success(`${config.PINK}-------------------------${config.WHITE}`);
    });

    await client.login(process.env.TOKEN);
    log.success("✅ Connexion à l'API Discord en cours...");
  } catch (err) {
    log.error("❌ Erreur au lancement :", err);
  }
})();

// 🛡️ Gestion globale des erreurs
process.on("unhandledRejection", (e) => log.error("🔥 Unhandled Promise Rejection:", e));
process.on("uncaughtException", (e) => log.error("🔥 Uncaught Exception:", e));
process.on("uncaughtExceptionMonitor", (e) => log.error("🔥 Uncaught Exception Monitor:", e));
