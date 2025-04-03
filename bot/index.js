// 🌍 Chargement des variables d'environnement dès le début
require("dotenv").config();

// 🔧 Logger global accessible partout
global.log = require("../shared/log");

// 📦 Modules Discord.js
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");

// 🎨 Configuration des couleurs console
const config = require("./config");

// 📁 Loaders personnalisés
const loadCommands = require("./Loaders/loadCommands");
const loadEvents = require("./Loaders/loadEvents");

// ⚙️ Création du client Discord avec les intents/partials nécessaires
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.User,
        Partials.ThreadMember
    ],
    shards: "auto" // 🔁 Sharding auto pour scalabilité
});

// 🧠 Collection des slash commands
client.commands = new Collection();

// 🧼 Nettoyage du terminal + message de démarrage
console.clear();
log.success(`${config.GREEN}Initialisation!${config.WHITE}`);

// ⚡ Chargement dynamique des commandes
loadCommands(client);

// 🧩 Chargement dynamique des événements
loadEvents(client);

// 🤖 Prêt !
client.on("ready", () => {
    log.success(`${config.PINK}-------------------------${config.WHITE}`);
    log.success(`${config.GREEN}Logged in${config.WHITE} as ${config.BLUE}${client.user.username}${config.WHITE}!`);
    log.success(`${config.PINK}-------------------------${config.WHITE}`);
});

// ⚠️ Gestion des erreurs non attrapées
process.on("unhandledRejection", (e) => {
    log.error("🔴 Unhandled Promise Rejection:", e);
});
process.on("uncaughtException", (e) => {
    log.error("🔴 Uncaught Exception:", e);
});
process.on("uncaughtExceptionMonitor", (e) => {
    log.error("🔴 Uncaught Exception Monitor:", e);
});

// 🔐 Connexion à l'API Discord
client.login(process.env.TOKEN)
    .then(() => log.success("✅ Connexion Discord demandée..."))
    .catch(err => log.error("❌ Erreur de connexion Discord :", err));
