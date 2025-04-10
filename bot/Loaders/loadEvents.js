const { readdirSync, existsSync } = require('fs');
const path = require('path');


module.exports = client => {
    // 📁 Chemin absolu vers le dossier des événements
    const eventsPath = path.join(__dirname, '..', 'Events');

    // 🛡️ Vérifie que le dossier existe
    if (!existsSync(eventsPath)) {
        log.warn(`${config.YELLOW} Dossier 'Events' introuvable.${config.WHITE}`);
        return;
    }

    // 📜 Lecture et chargement des fichiers .js
    readdirSync(eventsPath)
        .filter(file => file.endsWith('.js'))
        .forEach(file => {

            try {
                const event = require(path.join(eventsPath, file));

                if (event?.name && typeof event.execute === 'function') {
                    if (event.once) {
                        client.once(event.name, (...args) => event.execute(...args, client));
                    } else {
                        client.on(event.name, (...args) => event.execute(...args, client));
                    }

                    log.success(`${config.BLUE}Événement ${config.GREEN}${file.replace('.js', '')}${config.WHITE} chargé avec succès.`);
                } else {
                    log.warn(`${config.YELLOW} Le fichier ${file} ne contient pas un événement valide.${config.WHITE}`);
                }
            } catch (err) {
                log.error(`${config.RED}Erreur lors du chargement de ${file} : ${err.message}${config.WHITE}`);
            }
        });
};
