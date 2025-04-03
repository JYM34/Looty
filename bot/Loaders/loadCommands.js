const { readdirSync, existsSync } = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config');

module.exports = async client => {
    const commands = [];

    if (!client.commands) client.commands = new Map();

    // 📁 Construction du chemin absolu vers SlashCommands
    const commandsPath = path.join(__dirname, '..', 'SlashCommands');

    if (!existsSync(commandsPath)) {
        log.warn(`⚠️ Dossier 'SlashCommands' introuvable.`);
        return;
    }

    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    if (commandFiles.length === 0) {
        log.warn(`⚠️ Aucune commande trouvée dans SlashCommands.`);
    }

    for (const file of commandFiles) {
        try {
            const command = require(path.join(commandsPath, file));

            if (!command.data || !command.run) {
                log.warn(`Commande ${file} invalide (manque .data ou .run)`);
                continue;
            }

            commands.push(command.data.toJSON());
            client.commands.set(command.data.name, command);

            log.success(`${config.BLUE}✅ Commande ${config.GREEN}${file.replace('.js', '')}${config.WHITE} chargée.`);
        } catch (error) {
            log.error(`❌ Erreur chargement ${file} :`, error);
        }
    }

    // 📡 Enregistrement auprès de l'API Discord
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        log.success(`🔄 Mise à jour des commandes (API Discord)...`);
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), // Pour guild uniquement
            { body: commands }
        );
        log.success(`✅ Commandes enregistrées avec succès.`);
    } catch (error) {
        log.error(`❌ Échec de l'enregistrement des commandes :`, error);
    }

    return commands;
};
