// /events/guildDelete.js
const fs = require("fs");
const path = require("path");
const log = require("../../shared/log"); // adapte au bon chemin

// NOTE: chemin absolu utilisé ici. Pour plus de portabilité, préférez une constante relative
// via `path.join(__dirname, '../../shared/guilds.json')` ou un helper centralisé.
const GUILDS_FILE_PATH = path.join(__dirname, '..', '..', 'shared', 'guilds.json'); // chemin relatif portable

module.exports = {
  name: "guildDelete",

  /**
   * 🔧 Supprime la config d'une guilde quand le bot est retiré
   * @param {import('discord.js').Guild} guild
   */
  async execute(guild) {
    try {
      // 🗂️ Lecture du fichier JSON existant
      const rawData = fs.readFileSync(GUILDS_FILE_PATH, "utf-8");
      const guildConfigs = JSON.parse(rawData);

      // 🧹 Suppression de l'entrée
      if (guild.id in guildConfigs) {
        delete guildConfigs[guild.id];

        // ✍️ Réécriture du fichier sans la guilde
        fs.writeFileSync(GUILDS_FILE_PATH, JSON.stringify(guildConfigs, null, 2), "utf-8");

        log.info(`🗑️ Configuration supprimée pour la guilde ${guild.name} (${guild.id})`);
      } else {
        log.info(`Aucune config à supprimer pour ${guild.name} (${guild.id})`);
      }

    } catch (err) {
      log.error(`Erreur lors de la suppression de la config de ${guild.name} : ${err.message}`);
    }
  }
};
