const { ActivityType } = require("discord.js");
const config = require('../config');
const log = require('../Fonctions/log');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        // Définir le statut du bot
        client.user.setPresence({
            activities: [{
                name: 'en ligne',
                type: ActivityType.Custom,
            }],
            status: 'online',
        });

        // Log simple quand le bot est prêt
        log.success(`✅ ${config.GREEN}Bot opérationnel !${config.WHITE}`);
    }
};
