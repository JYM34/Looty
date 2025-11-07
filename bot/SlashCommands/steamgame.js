// Import des classes nécessaires de discord.js et googleapis
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");

// --- Authentification Google Drive via JWT (compte de service) ---
// On utilise un JWT avec clé privée et email du compte de service, permissions lecture seule
const drive = google.drive({
  version: "v3",
  auth: new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL, // Email du compte service (depuis .env)
    null, 
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Clé privée formatée
    ["https://www.googleapis.com/auth/drive.readonly"] // Permissions lecture
  ),
});

// ID du dossier Google Drive SteamTools, à définir dans le .env
const STEAMTOOLS_FOLDER_ID = process.env.STEAMTOOLS_FOLDER_ID || "";

// Fonction utilitaire simple qui renvoie une couleur hex selon les genres du jeu
function genreColor(genres) {
  if (!genres || genres.length === 0) return "#5865F2"; // Bleu discord par défaut
  if (genres.includes("Action")) return "#FF0000"; // Rouge pour Action
  if (genres.includes("Adventure")) return "#00FF00"; // Vert pour Adventure
  return "#5865F2"; // Bleu par défaut sinon
}

// Fonction async pour rechercher un fichier ZIP dans SteamTools correspondant à l’appid et nom du jeu
async function findSteamZipFile(appid, gameName) {
  try {
    // --- LA MODIFICATION EST ICI ---

    // 1. On "nettoie" le nom du jeu pour qu'il corresponde à un nom de fichier standard.
    const sanitizedGameName = gameName
      .replace(/’/g, "'")        // Remplace l'apostrophe typographique par une apostrophe droite
      .replace(/[™®:]/g, "")      // Supprime les caractères ™, ® et : (qui sont invalides ou gênants)
      .trim();                    // Supprime les espaces inutiles au début ou à la fin

    // 2. On construit le nom de fichier attendu avec le nom nettoyé.
    const expectedFileName = `${sanitizedGameName} - ${appid}.zip`;

    // 3. On échappe les apostrophes pour la requête Google Drive (très important).
    const escapedFileNameForQuery = expectedFileName.replace(/'/g, "\\'");

    // 4. On construit la requête de recherche avec le nom de fichier final.
    const q = `'${STEAMTOOLS_FOLDER_ID}' in parents and trashed = false and name = '${escapedFileNameForQuery}'`;
    
    const res = await drive.files.list({
      q,
      fields: 'files(id, name, webViewLink, webContentLink)',
      spaces: 'drive',
      pageSize: 1,
    });

    return res.data.files.length ? res.data.files[0] : null;

  } catch (error) {
    console.error("Google Drive API error:", error);
    return null;
  }
}


// Export de la commande Discord
module.exports = {
  // Définition de la commande slash avec paramètre obligatoire appid (ID Steam)
  data: new SlashCommandBuilder()
    .setName("steamgame")
    .setDescription("🎮 Affiche les infos d’un jeu Steam par son ID et bouton téléchargement")
    .addStringOption(opt =>
      opt.setName("appid")
        .setDescription("ID du jeu Steam")
        .setRequired(true)
    ),

  // Fonction qui s’exécute à chaque appel de la commande
  async run(client, interaction) {

    //On définit l'ID du salon cible ---
    const targetChannelId = "1436106258091475005";

    // On choisit une réponse différée éphémère (visible que par le demandeur)
    await interaction.reply({ 
        content: "🎮 Recherche en cours... Je vais poster le résultat dans le salon dédié si je trouve le jeu !",
        flags: 64 
    });

    // Récupération de l’ID du jeu Steam passé en paramètre
    const appid = interaction.options.getString("appid");

    try {
      
      //On récupère l'objet du salon ---
      const channel = await client.channels.fetch(targetChannelId);
      if (!channel) {
          console.error(`Erreur : Le salon avec l'ID ${targetChannelId} est introuvable.`);
          // On peut aussi notifier l'utilisateur qui a lancé la commande
          await interaction.followUp({ content: "Oups, je n'ai pas trouvé le salon de destination. Contacte un admin.", ephemeral: true });
          return;
      }

      // Appel API Steam Store pour récupérer les infos du jeu en français
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=french`);
      const json = await res.json();

      // Si échec (jeu introuvable), on répond de suite
      if (!json[appid]?.success) {
        return interaction.editReply("❌ Jeu introuvable sur Steam !");
      }

      // Extraction des données du jeu
      const game = json[appid].data;

      // Recherche dans Google Drive du fichier ZIP correspondant
      const file = await findSteamZipFile(appid, game.name);

      // Si le fichier n'est PAS trouvé sur le Drive, on s'arrête là.
      if (!file) {
          return interaction.editReply(`ℹ️ Le jeu **${game.name}** a été trouvé sur Steam, mais il n'est pas encore disponible au téléchargement sur le Drive.`);
      }

      // Si on arrive ici, ça veut dire que le fichier a été trouvé. On peut donc construire l'embed.

      // Préparation des URLs images (avec proxy images.weserv.nl pour éviter blocage referrer)
      const thumbnail = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`;
      const banner = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;

      // Obtention des infos prix et date de sortie avec valeurs de repli
      const price = game.price_overview ? `${(game.price_overview.final / 100).toFixed(2)} ${game.price_overview.currency}` : "Gratuit / N/A";
      const releaseDate = game.release_date?.date || "Inconnue";

      // Construction de l’embed avec toutes les informations renseignées proprement
      const embed = new EmbedBuilder()
        .setColor(genreColor(game.genres?.map(g => g.description)))
        .setTitle(game.name)
        .setURL(`https://store.steampowered.com/app/${appid}`)
        .setDescription(game.short_description || "Pas de description disponible.")
        .setThumbnail(thumbnail)
        .setImage(banner)
        .addFields(
          { name: "🎮 Genre(s)", value: game.genres?.map(g => g.description).join(", ") || "Inconnu", inline: false },
          { name: "🛠 Développeur(s)", value: game.developers?.join(", ") || "Inconnu", inline: false },
          { name: "🏢 Éditeur(s)", value: game.publishers?.join(", ") || "Inconnu", inline: false },
          { name: "📅 Date de sortie", value: releaseDate, inline: true },
          { name: "💰 Prix", value: price, inline: true },
          { name: "Steam ID", value: appid, inline: true },
        );

      // Construction des boutons (row)
      const buttons = new ActionRowBuilder();

      // Bouton de téléchargement (si fichier trouvé)
      if (file) {
        buttons.addComponents(
          new ButtonBuilder()
            .setLabel("📥 Télécharger ZIP")
            .setStyle(ButtonStyle.Link)
            .setURL(file.webViewLink) // Lien partage Google Drive du fichier
        );
      }

      // Bouton pour voir la fiche du jeu sur Steam
      buttons.addComponents(
        new ButtonBuilder()
          .setLabel("🔍 Voir sur Steam")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://store.steampowered.com/app/${appid}`)
      );

      // On envoie la réponse avec embed + boutons
      await channel.send({ 
          content: `🎮 Voici les infos pour **${game.name}**, demandé par ${interaction.user.tag} !`,
          embeds: [embed], 
          components: [buttons] 
      });

      await interaction.deleteReply();

    } catch (err) {
      // Gestion des erreurs génériques (API Steam, Google Drive, Discord...)
      console.error("Erreur commande steamgame:", err);
      await interaction.editReply("❌ Une erreur est survenue lors de la récupération des données.");
    }
  },
};
