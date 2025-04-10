// 📦 Fichier de démarrage principal

require("dotenv").config(); // 🌍 .env au tout début

global.log = require("./shared/log");
const config = require("./bot/config");
const client = require("./bot/client");
const loadCommands = require("./bot/Loaders/loadCommands");
const loadEvents = require("./bot/Loaders/loadEvents");

// 🚀 Lancement global (bot + web)
(async () => {
  try {
    await loadCommands(client);
    loadEvents(client);

    // 🧹 Terminal clean
    console.clear();
    log.success(`Initialisation...`);

    client.once("ready", () => {
      log.success(`${config.PINK}-------------------------${config.WHITE}`);
      log.success(`${config.GREEN} 🌐 Connecté en tant que ${config.BLUE}${client.user.username}${config.WHITE}`);
      log.success(`${config.PINK}-------------------------${config.WHITE}`);
    });

    await client.login(process.env.TOKEN);
    log.success("Connexion à l'API Discord en cours...");

    // ✅ Lancement du dashboard une fois connecté au bot
    require("./web/app")(client);
} catch (err) {
    log.error("Erreur au lancement global :", err); // <- Affiche brute l'erreur
    log.error("Erreur au lancement global :", err?.stack || err);
  }
})();
