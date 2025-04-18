const { readdirSync } = require("fs");
const path = require("path");

/**
 * 📦 Charge dynamiquement toutes les commandes slash depuis le dossier bot/SlashCommands/
 * Peu importe depuis où ce fichier est appelé
 * @returns {Array} - Tableau de commandes prêtes à être enregistrées (au format JSON)
 */
function loadSlashCommands() {
  const commands = [];

  // 📍 Étape 1 : remonter jusqu’à la racine du projet (2 dossiers au-dessus de /web/Utils)
  const projectRoot = path.resolve(__dirname, "../.."); // /var/www/Looty

  // 📁 Étape 2 : définir le chemin vers bot/SlashCommands depuis la racine du projet
  const commandsPath = path.join(projectRoot, "bot", "SlashCommands");

  // 📜 Étape 3 : lire tous les fichiers JS du dossier SlashCommands
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    try {
      const command = require(filePath);

      // ✅ On ajoute uniquement les commandes valides
      if (command.data) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(`⚠️ Commande "${file}" ignorée (manque .data)`);
      }

    } catch (err) {
      console.error(`❌ Erreur lors du chargement de "${file}" :`, err.message);
    }
  }

  return commands;
}

module.exports = loadSlashCommands;
