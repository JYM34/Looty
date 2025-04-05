const fs = require("fs");
const path = require("path");

// 📁 Chemin vers le fichier JSON contenant les configs des serveurs
const filePath = path.join(__dirname, "../../shared/guilds.json");

// 📖 Lit l'intégralité de la base (tous les serveurs)
function readDB() {
  if (!fs.existsSync(filePath)) return {}; // Si le fichier n'existe pas encore
  return JSON.parse(fs.readFileSync(filePath, "utf8")); // Lecture du fichier JSON
}

// 💾 Écrit la base complète (remplace tout)
function writeDB(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); // Sauvegarde joliment formatée
}

// 📄 Récupère la config d'un serveur précis via son ID
function getGuildConfig(guildId) {
  const db = readDB();
  return db[guildId] || {}; // Retourne un objet vide par défaut
}

// ✏️ Modifie la config d’un serveur et la sauvegarde
function setGuildConfig(guildId, config) {
  const db = readDB();
  db[guildId] = config;
  writeDB(db); // Sauvegarde la modif
}

// 📤 Export des fonctions pour les utiliser dans les routes
module.exports = {
  getGuildConfig,
  setGuildConfig
};
