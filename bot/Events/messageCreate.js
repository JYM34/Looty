module.exports = {
    name: 'messageCreate',

    execute: async (message) => {
        // Ignorer les messages envoyés par des bots
        if (message.author.bot) return;

        // Ignorer les messages dans les messages directs (DMs)
        if (message.channel.type === 'dm') return;

        // Vous pouvez ajouter des actions supplémentaires ici, par exemple :
        // - Vérifier le contenu du message
        // - Réagir à certains messages ou mots-clés
        // - Exécuter des commandes si un certain préfixe est détecté
        // Exemple : répondre à un message contenant un mot spécifique
        if (message.content.includes('hello')) {
            await message.reply('Hello! How can I assist you today?');
        }

        // Exemple : logger chaque message dans la console (utile pour le débogage)
        log.info(`${message.author.tag} a envoyé un message dans ${message.channel.name}: ${message.content}`);
    }
};
