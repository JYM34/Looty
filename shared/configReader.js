// 📁 /shared/configReader.js

const fs = require("fs");
const path = require("path");
const log = global.log || console; // fallback si log non global

// 📍 Emplacement du fichier config partagé
const configPath = path.join(__dirname, "guilds.json");

/**
 * 🔁 Lecture dynamique du fichier de config complet
 * @returns {Object} - Contenu JSON entier (toutes les guildes)
 */
function getAllGuildConfigs() {
  try {
    if (!fs.existsSync(configPath)) {
      log.warn("⚠️ guilds.json introuvable !");
      return {};
    }

    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw);

  } catch (err) {
    log.error("❌ Erreur lecture guilds.json :", err);
    return {};
  }
}

/**
 * 🔍 Récupère la config d’une guilde spécifique
 * @param {string} guildId - ID de la guilde
 * @returns {Object|null} - Config de la guilde ou null
 */
function getGuildConfig(guildId) {
  const configs = getAllGuildConfigs();
  return configs[guildId] || null;
}

module.exports = {
  getAllGuildConfigs,
  getGuildConfig
};
