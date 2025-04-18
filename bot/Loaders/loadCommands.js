// 📦 Modules Node.js natifs
const { readdirSync, existsSync } = require('fs');
const path = require('path');

// 🔗 Discord.js REST API
const { REST, Routes } = require('discord.js');

// 🚀 Fonction appelée lors du lancement du bot
module.exports = async client => {
  const commands = [];

  // 🗺️ Initialise la map des commandes si elle n'existe pas
  if (!client.commands) client.commands = new Map();

  // 📁 Chemin absolu vers le dossier des commandes slash
  const commandsPath = path.join(__dirname, '..', 'SlashCommands');

  // 🚨 Si le dossier SlashCommands n'existe pas, on s'arrête là
  if (!existsSync(commandsPath)) {
    log.warn(`Dossier 'SlashCommands' introuvable.`);
    return;
  }

  // 📜 Récupère tous les fichiers .js du dossier SlashCommands
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  // ⚠️ Si aucun fichier trouvé → warning
  if (commandFiles.length === 0) {
    log.warn(`Aucune commande trouvée dans SlashCommands.`);
  }

  // 🔁 Lecture de chaque fichier de commande
  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));

      // ✅ Vérifie que la commande exporte bien `.data` et `.run`
      if (!command.data || !command.run) {
        log.warn(`Commande ${file} invalide (manque .data ou .run)`);
        continue;
      }

      // ➕ Ajoute la commande à la liste pour l’enregistrement
      commands.push(command.data.toJSON());

      // 🗂️ Enregistre la commande dans la map du bot
      client.commands.set(command.data.name, command);

      // ✅ Log succès
      log.success(`${config.BLUE} Commande ${config.GREEN}${file.replace('.js', '')}${config.WHITE} chargée.`);
    } catch (error) {
      log.error(`Erreur chargement ${file} :`, error);
    }
  }

  // 📡 Enregistrement des commandes via API Discord
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    // ℹ️ Vérifie que GUILD_ID est bien défini
    if (!process.env.GUILD_ID) {
      log.warn(`GUILD_ID manquant dans .env. Enregistrement annulé.`);
      return;
    }

    log.maj(`Enregistrement des commandes dans la guilde ${process.env.GUILD_ID}...`);

    // 📌 Enregistrement des commandes uniquement pour la guilde (local = instantané)
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    log.success(`Commandes enregistrées avec succès (guilde uniquement).`);
  } catch (error) {
    log.error(`Échec de l'enregistrement des commandes :`, error);
  }

  return commands;
};