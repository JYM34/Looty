// 📁 web/Utils/guildsFile.js

const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../../shared/guilds.json");

function readGuilds() {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeGuilds(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  log.debug("/Looty/web/Utils/guildsFile.js : ", JSON.stringify(data, null, 2));
}

function getGuildData(guildId) {
  const db = readGuilds();
  return db[guildId] || {};
}

function setGuildData(guildId, newData) {
  const db = readGuilds();
  db[guildId] = { ...db[guildId], ...newData };
  writeGuilds(db);
}

function addInfraction(guildId, userId, reason) {
    const guilds = readGuilds();
  
    // Initialise l'objet de la guilde si nécessaire
    if (!guilds[guildId]) {
      guilds[guildId] = { name: "Nom inconnu", infractions: {} };
    }
  
    // Initialise les infractions si absentes
    if (!guilds[guildId].infractions) {
      guilds[guildId].infractions = {};
    }
  
    // Initialise la liste de l'utilisateur
    if (!guilds[guildId].infractions[userId]) {
      guilds[guildId].infractions[userId] = [];
    }
  
    guilds[guildId].infractions[userId].push({
      reason,
      date: new Date().toISOString()
    });
  
    writeGuilds(guilds);
  }
  

module.exports = {
  readGuilds,
  writeGuilds,
  getGuildData,
  setGuildData,
  addInfraction
};
