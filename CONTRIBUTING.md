# Contribuer à Looty

Merci pour votre intérêt ! Ce guide rapide explique comment contribuer, ajouter une commande slash et les bonnes pratiques à respecter.

1) Bien démarrer
- Clonez le dépôt et installez les dépendances :

```bash
git clone <repo-url>
cd Looty
npm install
cp .env.example .env
```

2) Exécuter localement
- Démarrage simple (sans PM2) :

```bash
node start.js
```

- Si vous voulez un redémarrage automatique pendant le développement, utilisez `nodemon` (à installer globalement ou en devDependency).

3) Ajouter une commande slash

- Emplacement : `bot/SlashCommands/`
- Exemple minimal :

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Pong!'),
  async run(client, interaction) {
    await interaction.reply('Pong');
  }
};
```

- Après ajout, vous pouvez déployer les commandes (si nécessaire) :

```bash
node deploy-commands.js
```

4) Conventions & bonnes pratiques
- Stockez les secrets dans `.env` et ne les commitez jamais.
- `shared/guilds.json` est le fichier de configuration par serveur :
  - Évitez les modifications concurrentes (le dashboard et les commandes lisent/écrivent ce fichier synchronement).
  - Faire une sauvegarde avant modifications massives.
- Utiliser des logs clairs (`log.success`, `log.warn`, `log.error`) — respectez les niveaux.

5) Tests & CI
- Ce dépôt n'a pas de tests automatisés actuellement ; si vous ajoutez des modules critiques (loaders, parsers), ajoutez des tests unitaires (`jest`/`vitest`) et configurez une action GitHub pour exécuter les tests.

6) Pull Request checklist
- Décrire clairement l'objectif de la PR.
- Lister les fichiers modifiés et la raison.
- Pour les changements de config, documenter les variables `.env` requises.

7) Sécurité
- Remplacez la valeur par défaut de `SESSION_SECRET` en production.
- Limitez les logs sensibles (ne loggez pas de tokens ou clés privées).

Merci — pour toute question, ouvrez une issue en précisant le contexte et je vous aiderai à reproduire/localiser le code.
