/**
 * messageCreate
 * Gère les messages entrants :
 *  - applique la modération (si activée)
 *  - détecte automatiquement les Steam IDs dans un salon dédié et publie les fichiers associés
 *
 * IMPORTANT : cette commande utilise l'API Google Drive via un compte de service. Les variables
 * d'environnement `GOOGLE_CLIENT_EMAIL` et `GOOGLE_PRIVATE_KEY` doivent être présentes et valides.
 */
// 📁 bot/Events/messageCreate.js

const { getGuildData } = require("../../web/Utils/guildsFile");
const { handleMessageModeration } = require("../Modules/moderation");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { google } = require("googleapis");

// ============================================
// CONFIGURATION GOOGLE DRIVE
// ============================================

const drive = google.drive({
  version: "v3",
  auth: new google.auth.JWT(
    process.env.GOOGLE_CLIENT_EMAIL,
    null, 
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ["https://www.googleapis.com/auth/drive.readonly"]
  ),
});

const STEAMTOOLS_FOLDER_ID = process.env.STEAMTOOLS_FOLDER_ID || "";

// ============================================
// FONCTIONS UTILITAIRES STEAM
// ============================================

/**
 * Génère une couleur hex selon les genres du jeu
 * @param {Array|string} genres
 * @returns {string}
 */
function genreColor(genres) {
  if (!genres || genres.length === 0) return "#5865F2";
  if (genres.includes("Action")) return "#FF0000";
  if (genres.includes("Adventure")) return "#00FF00";
  return "#5865F2";
}

/**
 * Recherche les fichiers Steam (ZIP et .lua) dans Google Drive
 */
async function findSteamFiles(appid, gameName) {
  try {
    const sanitizedGameName = gameName
      .replace(/'/g, "'")
      .replace(/[™®:]/g, "")
      .trim();

    // Recherche du ZIP
    const zipFileName = `${sanitizedGameName} - ${appid}.zip`;
    const escapedZipName = zipFileName.replace(/'/g, "\\'");
    const zipQuery = `'${STEAMTOOLS_FOLDER_ID}' in parents and trashed = false and name = '${escapedZipName}'`;
    
    const zipRes = await drive.files.list({
      q: zipQuery,
      fields: 'files(id, name, webViewLink, webContentLink)',
      spaces: 'drive',
      pageSize: 1,
    });

    // Recherche du fichier .lua
    const luaQuery = `'${STEAMTOOLS_FOLDER_ID}' in parents and trashed = false and name contains '${appid}' and name contains '.lua'`;
    
    const luaRes = await drive.files.list({
      q: luaQuery,
      fields: 'files(id, name, webViewLink, webContentLink)',
      spaces: 'drive',
      pageSize: 1,
    });

    return {
      zip: zipRes.data.files.length ? zipRes.data.files[0] : null,
      lua: luaRes.data.files.length ? luaRes.data.files[0] : null
    };

  } catch (error) {
    console.error("Google Drive API error:", error);
    return { zip: null, lua: null };
  }
}

/**
 * Gère la détection et le traitement des Steam IDs
 */
async function handleSteamIdDetection(message, config) {
  // Configuration des salons
  const targetChannelId = "1436106258091475005";    
  const notFoundChannelId = "1438955095692939415";  
  const allowedChannelId = "1436103924825456660";

  // Limite la détection à un salon spécifique
  if (message.channel.id !== allowedChannelId) return false;

  // Regex pour détecter un Steam ID
  const steamIdRegex = /\b(\d{4,7})\b/g;
  const matches = message.content.match(steamIdRegex);

  if (!matches) return false;

  const appid = matches[0];

  // Réaction pour indiquer que le bot traite la demande
  await message.react("🎮");

  try {
    // APPEL API STEAM STORE
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=french`);
    const json = await res.json();

    if (!json[appid]?.success) {
      await message.react("❌");
      await message.reply("❌ Ce n'est pas un ID Steam valide ou le jeu n'existe plus.");
      // ⚠️ SUPPRESSION DU MESSAGE UTILISATEUR
      await message.delete().catch(err => console.error("Impossible de supprimer le message:", err));
      return true;
    }

    const game = json[appid].data;
    const files = await findSteamFiles(appid, game.name);

    // CAS 1 : AUCUN FICHIER TROUVÉ
    if (!files.zip && !files.lua) {
      const notFoundChannel = await message.client.channels.fetch(notFoundChannelId);
      if (!notFoundChannel) {
        console.error(`Erreur : Le salon "non trouvé" avec l'ID ${notFoundChannelId} est introuvable.`);
        await message.reply("⚠️ Jeu trouvé sur Steam mais pas encore disponible au téléchargement.");
        // ⚠️ SUPPRESSION DU MESSAGE UTILISATEUR
        await message.delete().catch(err => console.error("Impossible de supprimer le message:", err));
        return true;
      }

      const thumbnail = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`;
      const banner = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
      const price = game.price_overview 
        ? `${(game.price_overview.final / 100).toFixed(2)} ${game.price_overview.currency}` 
        : "Gratuit / N/A";
      const releaseDate = game.release_date?.date || "Inconnue";

      const notFoundEmbed = new EmbedBuilder()
        .setColor("#FF6B6B")
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
        .setFooter({ text: `Demandé par ${message.author.tag}` })
        .setTimestamp();

      const notFoundButtons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel("🔍 Voir sur Steam")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://store.steampowered.com/app/${appid}`)
        );

      await notFoundChannel.send({ 
        content: `⚠️ **${game.name}** a été demandé mais n'est pas encore disponible au téléchargement.`,
        embeds: [notFoundEmbed], 
        components: [notFoundButtons] 
      });

      await message.react("⚠️");
      // ⚠️ SUPPRESSION DU MESSAGE UTILISATEUR
      await message.delete().catch(err => console.error("Impossible de supprimer le message:", err));
      return true;
    }

    // CAS 2 : AU MOINS UN FICHIER TROUVÉ
    const channel = await message.client.channels.fetch(targetChannelId);
    if (!channel) {
      console.error(`Erreur : Le salon avec l'ID ${targetChannelId} est introuvable.`);
      await message.reply("Oups, je n'ai pas trouvé le salon de destination. Contacte un admin.");
      // ⚠️ SUPPRESSION DU MESSAGE UTILISATEUR
      await message.delete().catch(err => console.error("Impossible de supprimer le message:", err));
      return true;
    }

    const thumbnail = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`;
    const banner = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
    const price = game.price_overview 
      ? `${(game.price_overview.final / 100).toFixed(2)} ${game.price_overview.currency}` 
      : "Gratuit / N/A";
    const releaseDate = game.release_date?.date || "Inconnue";

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

    const buttons = new ActionRowBuilder();

    if (files.zip) {
      buttons.addComponents(
        new ButtonBuilder()
          .setLabel("📦 Télécharger ZIP")
          .setStyle(ButtonStyle.Link)
          .setURL(files.zip.webViewLink)
      );
    }

    if (files.lua) {
      const luaDirectDownload = `https://drive.google.com/uc?export=download&id=${files.lua.id}`;
      buttons.addComponents(
        new ButtonBuilder()
          .setLabel("📄 Télécharger .lua")
          .setStyle(ButtonStyle.Link)
          .setURL(luaDirectDownload)
      );
    }

    buttons.addComponents(
      new ButtonBuilder()
        .setLabel("🔍 Voir sur Steam")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://store.steampowered.com/app/${appid}`)
    );

    await channel.send({ 
      content: `🎮 Voici les infos pour **${game.name}**, demandé par ${message.author.tag} !`,
      embeds: [embed], 
      components: [buttons] 
    });

    await message.react("✅");
    
    // ⚠️ SUPPRESSION DU MESSAGE UTILISATEUR (après avoir envoyé l'embed)
    await message.delete().catch(err => console.error("Impossible de supprimer le message:", err));
    
    return true;

  } catch (err) {
    console.error("Erreur détection Steam ID:", err);
    await message.react("❌");
    await message.reply("❌ Une erreur est survenue lors de la récupération des données.");
    // ⚠️ SUPPRESSION DU MESSAGE UTILISATEUR
    await message.delete().catch(err => console.error("Impossible de supprimer le message:", err));
    return true;
  }
}


// ============================================
// EXPORT DU MODULE
// ============================================

module.exports = {
  name: 'messageCreate',

  execute: async (message) => {
    // Ignorer les messages envoyés par des bots
    if (message.author.bot) return;

    // Ignorer les messages dans les DMs
    if (message.channel.type === 'dm') return;

    // ⚙️ Chargement de la config du serveur
    const config = getGuildData(message.guild.id);

    // 👮‍♂️ Vérifie et applique la modération si activée
    await handleMessageModeration(message, config);

    // 🎮 NOUVEAU : Détection automatique des Steam IDs
    const steamIdHandled = await handleSteamIdDetection(message, config);
    
    // Si un Steam ID a été détecté et traité, on arrête ici pour éviter les autres réponses
    if (steamIdHandled) return;

    // 🤖 Exemple simple : répondre à un mot-clé
    if (message.content.includes('hello')) {
      await message.reply('Hello! How can I assist you today?');
    }

    // 🐛 Logger tous les messages (utile en dev)
    log.info(`${message.author.tag} a envoyé un message dans ${message.channel.name}: ${message.content}`);
  }
};
