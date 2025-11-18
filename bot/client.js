/**
 * client.js
 * Initialise l'instance Discord.js utilisée par le bot.
 * - Définit les intents et partials nécessaires
 * - Expose `client.commands` (Collection) pour stocker les commandes chargées dynamiquement
 */
// 🧠 Configuration du client Discord
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.User,
    Partials.ThreadMember,
  ],
  shards: "auto", // 🔁 Auto-shard pour scalabilité
});

client.commands = new Collection();

module.exports = client;
