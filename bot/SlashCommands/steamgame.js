// ============================================
// IMPORTS ET CONFIGURATION
// ============================================

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

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Génère une couleur hex selon les genres du jeu
 * @param {Array} genres - Liste des genres du jeu
 * @returns {string} Code couleur hex
 */
function genreColor(genres) {
  if (!genres || genres.length === 0) return "#5865F2"; // Bleu discord par défaut
  if (genres.includes("Action")) return "#FF0000"; // Rouge pour Action
  if (genres.includes("Adventure")) return "#00FF00"; // Vert pour Adventure
  return "#5865F2"; // Bleu par défaut sinon
}

/**
 * Recherche les fichiers Steam (ZIP et .lua) dans Google Drive
 * @param {string} appid - ID Steam du jeu
 * @param {string} gameName - Nom du jeu
 * @returns {Object} Objet contenant les fichiers trouvés { zip: File|null, lua: File|null }
 */
async function findSteamFiles(appid, gameName) {
  try {
    // Nettoyage du nom du jeu pour correspondre au format de fichier standard
    const sanitizedGameName = gameName
      .replace(/'/g, "'")        // Remplace l'apostrophe typographique par apostrophe droite
      .replace(/[™®:]/g, "")      // Supprime caractères spéciaux invalides (™, ®, :)
      .trim();                    // Supprime les espaces au début/fin

    // --- RECHERCHE DU FICHIER ZIP ---
    const zipFileName = `${sanitizedGameName} - ${appid}.zip`;
    const escapedZipName = zipFileName.replace(/'/g, "\\'"); // Échappement pour la requête Drive
    const zipQuery = `'${STEAMTOOLS_FOLDER_ID}' in parents and trashed = false and name = '${escapedZipName}'`;
    
    const zipRes = await drive.files.list({
      q: zipQuery,
      fields: 'files(id, name, webViewLink, webContentLink)', // Récupère ID, nom et liens
      spaces: 'drive',
      pageSize: 1, // On veut seulement le premier résultat
    });

    // --- RECHERCHE DU FICHIER .LUA ---
    // On cherche tous les fichiers .lua qui contiennent l'appid dans leur nom
    const luaQuery = `'${STEAMTOOLS_FOLDER_ID}' in parents and trashed = false and name contains '${appid}' and name contains '.lua'`;
    
    const luaRes = await drive.files.list({
      q: luaQuery,
      fields: 'files(id, name, webViewLink, webContentLink)',
      spaces: 'drive',
      pageSize: 1,
    });

    // Retourne un objet avec les deux fichiers (null si non trouvés)
    return {
      zip: zipRes.data.files.length ? zipRes.data.files[0] : null,
      lua: luaRes.data.files.length ? luaRes.data.files[0] : null
    };

  } catch (error) {
    console.error("Google Drive API error:", error);
    return { zip: null, lua: null }; // En cas d'erreur, on retourne null pour les deux
  }
}

// ============================================
// EXPORT DE LA COMMANDE DISCORD
// ============================================

module.exports = {
  // Définition de la commande slash avec paramètre obligatoire appid (ID Steam)
  data: new SlashCommandBuilder()
    .setName("steamgame")
    .setDescription("🎮 Affiche les infos d'un jeu Steam par son ID et bouton téléchargement")
    .addStringOption(opt =>
      opt.setName("appid")
        .setDescription("ID du jeu Steam")
        .setRequired(true)
    ),

  /**
   * Fonction principale qui s'exécute à chaque appel de la commande
   * @param {Client} client - Instance du bot Discord
   * @param {CommandInteraction} interaction - Interaction de la commande
   */
  async run(client, interaction) {
    // --- Configuration des salons cibles ---
    const targetChannelId = "1436106258091475005";    // Salon pour les jeux trouvés
    const notFoundChannelId = "1438955095692939415";  // Salon pour les jeux non trouvés

    // Réponse éphémère immédiate (visible uniquement par le demandeur)
    await interaction.reply({ 
      content: "🎮 Recherche en cours... Je vais poster le résultat dans le salon dédié si je trouve le jeu !",
      flags: 64 // Flag pour message éphémère
    });

    // Récupération de l'ID du jeu Steam passé en paramètre
    const appid = interaction.options.getString("appid");

    try {
      // ============================================
      // APPEL API STEAM STORE
      // ============================================
      
      // Récupération des infos du jeu depuis l'API Steam en français
      const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=french`);
      const json = await res.json();

      // Si le jeu n'existe pas sur Steam, on arrête ici
      if (!json[appid]?.success) {
        return interaction.editReply("❌ Jeu introuvable sur Steam !");
      }

      // Extraction des données du jeu
      const game = json[appid].data;

      // ============================================
      // RECHERCHE DES FICHIERS SUR GOOGLE DRIVE
      // ============================================
      
      // Recherche simultanée du ZIP et du fichier .lua
      const files = await findSteamFiles(appid, game.name);

      // ============================================
      // CAS 1 : AUCUN FICHIER TROUVÉ
      // ============================================
      
      // Si ni le ZIP ni le .lua ne sont disponibles
      if (!files.zip && !files.lua) {
        // Récupération du salon pour les jeux non trouvés
        const notFoundChannel = await client.channels.fetch(notFoundChannelId);
        if (!notFoundChannel) {
          console.error(`Erreur : Le salon "non trouvé" avec l'ID ${notFoundChannelId} est introuvable.`);
          return interaction.editReply("⚠️ Jeu trouvé sur Steam mais pas encore disponible au téléchargement.");
        }

        // --- Préparation des URLs images Steam ---
        const thumbnail = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`;
        const banner = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
        
        // Récupération du prix et de la date de sortie avec valeurs de repli
        const price = game.price_overview 
          ? `${(game.price_overview.final / 100).toFixed(2)} ${game.price_overview.currency}` 
          : "Gratuit / N/A";
        const releaseDate = game.release_date?.date || "Inconnue";

        // --- Construction de l'embed pour jeu NON trouvé ---
        const notFoundEmbed = new EmbedBuilder()
          .setColor("#FF6B6B") // Rouge pour signaler l'absence
          .setTitle(`❌ ${game.name} - Non disponible`)
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
          )
          .setFooter({ text: `Demandé par ${interaction.user.tag}` })
          .setTimestamp();

        // --- Bouton Steam uniquement (pas de téléchargement) ---
        const notFoundButtons = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setLabel("🔍 Voir sur Steam")
              .setStyle(ButtonStyle.Link)
              .setURL(`https://store.steampowered.com/app/${appid}`)
          );

        // Envoi du message dans le salon "non trouvé"
        await notFoundChannel.send({ 
          content: `⚠️ **${game.name}** a été demandé mais n'est pas encore disponible au téléchargement.`,
          embeds: [notFoundEmbed], 
          components: [notFoundButtons] 
        });

        // Suppression de la réponse éphémère initiale
        await interaction.deleteReply();
        return; // On arrête ici
      }

      // ============================================
      // CAS 2 : AU MOINS UN FICHIER TROUVÉ
      // ============================================
      
      // Récupération du salon principal pour les jeux trouvés
      const channel = await client.channels.fetch(targetChannelId);
      if (!channel) {
        console.error(`Erreur : Le salon avec l'ID ${targetChannelId} est introuvable.`);
        return interaction.followUp({ 
          content: "Oups, je n'ai pas trouvé le salon de destination. Contacte un admin.", 
          ephemeral: true 
        });
      }

      // --- Préparation des URLs images Steam ---
      const thumbnail = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`;
      const banner = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
      
      // Récupération du prix et de la date de sortie avec valeurs de repli
      const price = game.price_overview 
        ? `${(game.price_overview.final / 100).toFixed(2)} ${game.price_overview.currency}` 
        : "Gratuit / N/A";
      const releaseDate = game.release_date?.date || "Inconnue";

      // --- Construction de l'embed principal ---
      const embed = new EmbedBuilder()
        .setColor(genreColor(game.genres?.map(g => g.description))) // Couleur dynamique selon le genre
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

      // --- Construction des boutons (conditionnels) ---
      const buttons = new ActionRowBuilder();

      // Bouton ZIP si disponible
      if (files.zip) {
        buttons.addComponents(
          new ButtonBuilder()
            .setLabel("📦 Télécharger ZIP")
            .setStyle(ButtonStyle.Link)
            .setURL(files.zip.webViewLink) // Lien de partage Google Drive
        );
      }

      // Bouton LUA direct download si disponible
      if (files.lua) {
        // Conversion en lien de téléchargement direct Google Drive
        // Format : https://drive.google.com/uc?export=download&id=FILE_ID
        const luaDirectDownload = `https://drive.google.com/uc?export=download&id=${files.lua.id}`;
        
        buttons.addComponents(
          new ButtonBuilder()
            .setLabel("📄 Télécharger .lua")
            .setStyle(ButtonStyle.Link)
            .setURL(luaDirectDownload) // Lien téléchargement direct
        );
      }

      // Bouton Steam (toujours présent)
      buttons.addComponents(
        new ButtonBuilder()
          .setLabel("🔍 Voir sur Steam")
          .setStyle(ButtonStyle.Link)
          .setURL(`https://store.steampowered.com/app/${appid}`)
      );

      // Envoi du message dans le salon principal
      await channel.send({ 
        content: `🎮 Voici les infos pour **${game.name}**, demandé par ${interaction.user.tag} !`,
        embeds: [embed], 
        components: [buttons] 
      });

      // Suppression de la réponse éphémère initiale
      await interaction.deleteReply();

    } catch (err) {
      // ============================================
      // GESTION DES ERREURS
      // ============================================
      
      console.error("Erreur commande steamgame:", err);
      await interaction.editReply("❌ Une erreur est survenue lors de la récupération des données.");
    }
  },
};
