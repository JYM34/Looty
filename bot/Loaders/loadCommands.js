/**
 * 📦 loadCommands.js
 * 
 * Charge dynamiquement toutes les commandes slash depuis le dossier `bot/SlashCommands`
 * et les enregistre auprès de Discord pour qu'elles soient utilisables dans ton serveur.
 * 
 * 🔧 Ce que fait ce fichier :
 * 1. Lit tous les fichiers .js dans SlashCommands/
 * 2. Vide le cache Node.js pour forcer le rechargement des fichiers modifiés
 * 3. Charge chaque commande et l'ajoute à `client.commands` (Map)
 * 4. Enregistre les commandes auprès de l'API Discord (guilde uniquement = instantané)
 * 
 * ⚙️ Variables d'environnement requises :
 * - TOKEN : Token du bot Discord
 * - CLIENT_ID : ID de l'application Discord
 * - GUILD_ID : ID du serveur de test (optionnel, mais recommandé)
 */

// 📦 Modules Node.js natifs
const { readdirSync, existsSync } = require('fs');
const path = require('path');

// 🔗 Discord.js REST API pour l'enregistrement des commandes
const { REST, Routes } = require('discord.js');

/**
 * Charge et enregistre les commandes slash
 * @param {import('discord.js').Client} client - Instance du client Discord
 * @returns {Promise<Object[]>} Liste des définitions de commandes enregistrées
 */
module.exports = async client => {
  // 📋 Tableau qui contiendra toutes les définitions de commandes au format JSON
  const commands = [];

  // 🗺️ Initialise la Map des commandes si elle n'existe pas encore
  // Cette Map permet d'accéder rapidement aux commandes par leur nom
  if (!client.commands) {
    client.commands = new Map();
  }

  // 📁 Construit le chemin absolu vers le dossier SlashCommands
  const commandsPath = path.join(__dirname, '..', 'SlashCommands');

  // 🚨 Vérifie que le dossier existe bien
  if (!existsSync(commandsPath)) {
    log.warn(`Dossier 'SlashCommands' introuvable à l'emplacement : ${commandsPath}`);
    return commands;
  }

  // 📜 Récupère tous les fichiers .js du dossier (ignore les autres types)
  const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  // ⚠️ Si aucune commande trouvée, on prévient
  if (commandFiles.length === 0) {
    log.warn(`Aucune commande trouvée dans le dossier SlashCommands.`);
    return commands;
  }

  log.maj(`Chargement de ${commandFiles.length} commande(s)...`);

  // 🔁 Parcourt chaque fichier de commande
  for (const file of commandFiles) {
    // 🗂️ Construit le chemin complet vers le fichier
    const filePath = path.join(commandsPath, file);

    try {
      // 🧹 IMPORTANT : Vide le cache Node.js pour ce module
      // Sans cette ligne, les modifications ne seraient pas prises en compte
      // car Node.js garde les modules en mémoire après le premier require()
      delete require.cache[require.resolve(filePath)];

      // 📥 Charge le module de commande
      const command = require(filePath);

      // ✅ Vérifie que la commande exporte bien les propriétés requises
      if (!command.data || typeof command.run !== 'function') {
        log.warn(`⚠️  Commande ${file} invalide : manque .data ou .run`);
        continue; // Passe à la commande suivante
      }

      // 📋 Convertit la définition de commande en JSON et l'ajoute à la liste
      // .toJSON() est une méthode de SlashCommandBuilder de discord.js
      commands.push(command.data.toJSON());

      // 🗂️ Enregistre la commande dans la Map du client
      // La clé est le nom de la commande, la valeur est l'objet commande complet
      client.commands.set(command.data.name, command);

      // ✅ Log de succès avec le nom du fichier (sans l'extension .js)
      log.success(
        `${config.BLUE}  ✓${config.WHITE} Commande ${config.GREEN}${file.replace('.js', '')}${config.WHITE} chargée`
      );
    } catch (error) {
      // ❌ Si une erreur se produit pendant le chargement, on log et on continue
      log.error(`Erreur lors du chargement de ${file} :`, error);
    }
  }

  // 📡 Enregistrement des commandes auprès de l'API Discord
  // Cette étape est nécessaire pour que Discord "connaisse" tes commandes slash

  // 🔑 Crée une instance REST avec le token du bot
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    // ℹ️ Vérifie que GUILD_ID est défini dans le .env
    if (!process.env.GUILD_ID) {
      log.warn(
        `GUILD_ID manquant dans .env. Les commandes ne seront pas enregistrées.\n` +
        `Pour un enregistrement instantané, ajoute GUILD_ID dans ton .env`
      );
      return commands;
    }

    log.maj(`Enregistrement des commandes dans la guilde ${process.env.GUILD_ID}...`);

    // 📌 Enregistre les commandes UNIQUEMENT pour la guilde spécifiée
    // Avantage : Les modifications sont instantanées (pas de délai comme pour les commandes globales)
    // Si tu veux enregistrer globalement, utilise Routes.applicationCommands() à la place
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    log.success(
      `${config.GREEN}✓${config.WHITE} ${commands.length} commande(s) enregistrée(s) avec succès sur Discord`
    );
  } catch (error) {
    // ❌ Gestion d'erreur lors de l'enregistrement API
    log.error(`Échec de l'enregistrement des commandes sur Discord :`, error);
    
    // 💡 Suggestions de debug
    if (error.code === 50001) {
      log.error(`Erreur 50001 : Vérifie que ton bot a les permissions nécessaires.`);
    } else if (error.code === 'TOKEN_INVALID') {
      log.error(`Token invalide : Vérifie la variable TOKEN dans ton .env`);
    }
  }

  // 🔙 Retourne la liste des commandes enregistrées
  return commands;
};
