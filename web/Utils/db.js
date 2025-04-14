// 📁 web/Utils/db.js

// 🔄 Utilise le nouveau module centralisé
const {
  getGuildData,
  setGuildData
} = require("./guildsFile");

// 📄 Récupère la config d'un serveur précis via son ID
function getGuildConfig(guildId) {
  return getGuildData(guildId);
}

// ✏️ Modifie la config d’un serveur et la sauvegarde
function setGuildConfig(guildId, config) {
  setGuildData(guildId, config);
}

// 📤 Export des fonctions pour les utiliser dans les routes
module.exports = {
  getGuildConfig,
  setGuildConfig
};
