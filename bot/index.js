// Importation des modules nécessaires de discord.js
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");

// Configuration du client Discord
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
    shards: "auto", // Sharding automatique pour scalabilité
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.User,
        Partials.ThreadMember
    ]
});

// Chargement des variables d'environnement
require('dotenv').config();

// Chargement de la configuration du thème console
const config = require('./config');
const log = require('./Fonctions/log');

// Chargement dynamique des commandes et événements
const loadCommands = require('./Loaders/loadCommands');
const loadEvents = require('./Loaders/loadEvents');

// Initialisation de la collection des commandes (clé: nom de la commande, valeur: fonction)
client.commands = new Collection();

console.clear();
log.success(`${config.GREEN}Initialisation!${config.WHITE}`);

// Chargement des commandes personnalisées
const commands = loadCommands(client); // 💡 Tu peux utiliser la valeur retournée si besoin (pour du logging, stats, etc.)

// Déclenché quand le bot est prêt
client.on("ready", async () => {

    log.success(`${config.PINK}-------------------------${config.WHITE}`);
    log.success(`${config.GREEN}Logged in${config.WHITE} as ${config.BLUE}${client.user.username}${config.WHITE}!`);
    log.success(`${config.PINK}-------------------------${config.WHITE}`);
});

// Initialisation des événements Discord (interactionCreate, guildCreate, etc.)
loadEvents(client);

// Gestion des erreurs critiques non attrapées
process.on("unhandledRejection", (e) => {
    log.error("🔴 Unhandled Promise Rejection:", e);
});

process.on("uncaughtException", (e) => {
    log.error("🔴 Uncaught Exception:", e);
});

process.on("uncaughtExceptionMonitor", (e) => {
    log.error("🔴 Uncaught Exception Monitor:", e);
});

// Connexion à l’API Discord avec le token
client.login(process.env.TOKEN) // 💡 Assure-toi que TOKEN est défini dans .env
    .then(() => log.success("✅ Connexion Discord demandée..."))
    .catch(err => log.error("❌ Erreur de connexion Discord :", err));