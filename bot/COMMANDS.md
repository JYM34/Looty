# Commandes Slash (Looty)

Ce fichier référence les commandes slash détectées dans le dossier `bot/SlashCommands`.

- `/force-check` — (admin) Force un check immédiat de l'API Epic Games et envoie les embeds.
  - Handler : `bot/SlashCommands/force-check.js`

- `/get-epic` — (admin) Commande utilitaire de test qui imprime les jeux récupérés via `epic-games-free`.
  - Handler : `bot/SlashCommands/get-epic.js`

- `/clear` — (manage messages) Supprime un nombre de messages dans le salon courant.
  - Handler : `bot/SlashCommands/clear.js`

- `/ping` — (admin) Affiche le ping WebSocket et quelques infos de debug.
  - Handler : `bot/SlashCommands/ping.js`

- `/steamgame` — Recherche un jeu Steam par son appid, publie les infos et propose des boutons
  - Intègre Google Drive (compte de service) pour proposer des téléchargements (.zip, .lua)
  - Handler : `bot/SlashCommands/steamgame.js`

Notes
- Pour ajouter une commande : créer un fichier dans `bot/SlashCommands/` qui exporte `data` (SlashCommandBuilder) et `run(client, interaction)`.
- Les commandes sont enregistrées automatiquement en local via `bot/Loaders/loadCommands.js` et lors du `clientReady` pour chaque guilde.
