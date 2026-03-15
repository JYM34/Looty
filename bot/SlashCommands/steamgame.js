// ============================================
// IMPORTS ET CONFIGURATION
// ============================================

// Import des classes nécessaires de discord.js et googleapis
const { SlashCommandBuilder } = require("discord.js");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const { buildSteamEmbed, buildSteamButtons, buildProtectionEmbeds } = require("../Fonctions/steamMessage");

// --- Authentification Google Drive via JWT (compte de service) ---
// On utilise un JWT avec clé privée et email du compte de service, permissions lecture seule
// ATTENTION: `process.env.GOOGLE_PRIVATE_KEY` doit être stockée dans `.env` avec les sauts de ligne
// remplacés par `\n`. Le code appelle `replace(/\\n/g, '\n')` pour restaurer la clé.
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
const DEPOTBOX_PROXY_URL = process.env.DEPOTBOX_PROXY_URL || "http://127.0.0.1:3001/api/depotbox";
const DEPOTBOX_API_KEY = process.env.DEPOTBOX_API_KEY || process.env.DEPOTBOX_KEY || process.env.API_KEY || "";
const MANUAL_PROTECTION_BY_APPID = {
  "1808500": { drm: "TAGES", account: "EPIC" },
};

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
 * Formate proprement le DRM depuis l'API Steam (string, array ou absent)
 * @param {string|string[]|undefined} drmNotice
 * @returns {string}
 */
function formatDrm(drmNotice) {
  if (!drmNotice) return "-";
  if (Array.isArray(drmNotice)) return drmNotice.join(", ") || "-";
  return String(drmNotice).trim() || "-";
}

/**
 * Nettoie les chaînes Steam (HTML + espaces)
 * @param {any} value
 * @returns {string}
 */
function cleanSteamText(value) {
  if (value == null) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripParenthesisNote(value) {
  return cleanSteamText(value).replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function detectProtectionInfo(game) {
  let drmInfo = game?.drm_notice ?? null;
  let accountInfo = game?.ext_user_account_notice ?? null;

  const knownKeys = [
    "third_party",
    "thirdparty",
    "third_party_drm",
    "third_party_account",
    "third_party_accounts",
    "3rd_party",
    "3rd_party_drm",
    "drm",
    "requires_third_party_account",
    "3rd-party",
    "3rdparty",
    "3rd",
  ];
  const knownAccountKeys = [
    "third_party_account",
    "third_party_accounts",
    "requires_third_party_account",
    "requires_third_party_accounts",
    "thirdpartyaccount",
    "3rd_party_account",
    "required_account",
    "ext_user_account_notice",
  ];
  const knownDrmKeys = ["third_party_drm", "thirdpartydrm", "3rd_party_drm", "drm", "has_drm"];
  const drmPatterns = [
    /\b3rd[\W_]*party\b/i,
    /\bthird[\W_]*party\b/i,
    /\bdrm\b/i,
    /\bdenuvo\b/i,
    /\bvmprotect\b/i,
    /\barxan\b/i,
    /\bxigncode\b/i,
    /\bdnas\b/i,
    /\bsecurom\b/i,
    /\btages\b/i,
    /easy\s*anti\s*cheat/i,
    /eac\b/i,
  ];
  const accountPatterns = [
    /\b(account|compte)\b/i,
    /(?:require|requires|required|requiert|necessite|necessitent).{0,40}\b(account|compte)\b/i,
    /\b(account|compte).{0,40}(?:required|requiert|necessite|requires)\b/i,
    /(?:3rd[\W_]*party|third[\W_]*party).{0,40}\b(account|compte)\b/i,
    /(?:ubisoft|ea|ea app|origin|epic|battle\.net|riot|gog|rockstar|uplay).{0,40}\b(account|compte)\b/i,
  ];

  const pickInfo = (current, nextValue, type) => {
    if (current) return current;
    if (nextValue == null) return current;
    if (nextValue === true) return type === "drm" ? "DRM tiers detecte" : "Compte tiers requis";
    if (nextValue === false) return current;
    return nextValue;
  };

  const inspectCandidate = (key, value) => {
    const keyText = cleanSteamText(key || "").toLowerCase();
    const rawValue = typeof value === "string" ? value : JSON.stringify(value);
    const valueText = cleanSteamText(rawValue);
    const merged = `${keyText} ${valueText}`.trim();

    if (!accountInfo && knownAccountKeys.some(sub => keyText.includes(sub))) {
      accountInfo = pickInfo(accountInfo, value, "account");
    }
    if (!drmInfo && knownDrmKeys.some(sub => keyText.includes(sub))) {
      drmInfo = pickInfo(drmInfo, value, "drm");
    }

    if (!drmInfo && knownKeys.some(sub => keyText.includes(sub)) && drmPatterns.some(re => re.test(merged))) {
      drmInfo = valueText || merged;
    }
    if (!accountInfo && knownKeys.some(sub => keyText.includes(sub)) && accountPatterns.some(re => re.test(merged))) {
      accountInfo = valueText || merged;
    }

    if (!drmInfo && drmPatterns.some(re => re.test(merged))) {
      drmInfo = valueText || merged;
    }
    if (!accountInfo && accountPatterns.some(re => re.test(merged))) {
      accountInfo = valueText || merged;
    }
  };

  const walk = (node, pathKey = "") => {
    if (drmInfo && accountInfo) return;
    if (node == null) return;

    if (typeof node === "string" || typeof node === "number" || typeof node === "boolean") {
      inspectCandidate(pathKey, node);
      return;
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i += 1) {
        walk(node[i], `${pathKey}[${i}]`);
        if (drmInfo && accountInfo) return;
      }
      return;
    }

    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        inspectCandidate(k, v);
        walk(v, k);
        if (drmInfo && accountInfo) return;
      }
    }
  };

  walk(game);

  const fullDump = cleanSteamText(JSON.stringify(game || {})).toLowerCase();
  const accountVendors = [
    { label: "EPIC", re: /\bepic(?:\s+games)?\b/i },
    { label: "UBISOFT", re: /\bubisoft(?:\s+connect)?\b|\buplay\b/i },
    { label: "EA APP", re: /\bea(?:\s+app)?\b|\borigin\b/i },
    { label: "ROCKSTAR", re: /\brockstar\b/i },
    { label: "BATTLE.NET", re: /\bbattle\.net\b/i },
    { label: "RIOT", re: /\briot\b/i },
  ];
  const drmVendors = [
    { label: "DENUVO", re: /\bdenuvo\b/i },
    { label: "TAGES", re: /\btages\b/i },
    { label: "SECUROM", re: /\bsecurom\b/i },
    { label: "XIGNCODE", re: /\bxigncode\b/i },
    { label: "VMPROTECT", re: /\bvmprotect\b/i },
    { label: "ARXAN", re: /\barxan\b/i },
    { label: "EAC", re: /\beasy\s*anti\s*cheat\b|\beac\b/i },
  ];

  const drmCurrentText = cleanSteamText(typeof drmInfo === "string" ? drmInfo : JSON.stringify(drmInfo || ""));
  const accountCurrentText = cleanSteamText(typeof accountInfo === "string" ? accountInfo : JSON.stringify(accountInfo || ""));

  const foundAccountVendor = accountVendors.find(v => v.re.test(accountCurrentText))
    || accountVendors.find(v => v.re.test(fullDump));
  const foundDrmVendor = drmVendors.find(v => v.re.test(drmCurrentText))
    || drmVendors.find(v => v.re.test(fullDump));

  if (!accountInfo && foundAccountVendor) {
    accountInfo = foundAccountVendor.label;
  }

  // Always prefer a clean DRM vendor label over long marketing/legal text.
  if (foundDrmVendor) {
    drmInfo = foundDrmVendor.label;
  }

  let drmDisplay = stripParenthesisNote(formatDrm(drmInfo));
  let accountDisplay = stripParenthesisNote(cleanSteamText(accountInfo || ""));

  if (!accountDisplay) accountDisplay = "-";
  if (!drmDisplay) drmDisplay = "-";

  if (drmDisplay.length > 350) drmDisplay = `${drmDisplay.slice(0, 347)}...`;
  if (accountDisplay.length > 350) accountDisplay = `${accountDisplay.slice(0, 347)}...`;

  return {
    drm: drmDisplay,
    account: accountDisplay,
  };
}

/**
 * Détecte et formate l'info "compte tiers requis" depuis les données Steam
 * @param {Object} game
 * @returns {string}
 */
function formatThirdPartyAccount(game) {
  return detectProtectionInfo(game).account;
}

function buildProtectionTopText(protectionInfo) {
  const lines = [];
  if (protectionInfo?.drm && protectionInfo.drm !== "-") {
    lines.push(`⚠️ 3rd-Party DRM: ${protectionInfo.drm}`);
  }
  if (protectionInfo?.account && protectionInfo.account !== "-") {
    lines.push(`🔗 3rd-Party Account: ${protectionInfo.account}`);
  }
  return lines.join("\n");
}

function applyManualProtectionFallback(appid, protectionInfo) {
  const manual = MANUAL_PROTECTION_BY_APPID[String(appid)];
  if (!manual) return protectionInfo;

  return {
    drm: protectionInfo?.drm && protectionInfo.drm !== "-" ? protectionInfo.drm : (manual.drm || "-"),
    account: protectionInfo?.account && protectionInfo.account !== "-" ? protectionInfo.account : (manual.account || "-"),
  };
}

async function fetchDepotboxProtectionInfo(appid) {
  if (!DEPOTBOX_API_KEY) return null;

  try {
    const url = `${DEPOTBOX_PROXY_URL}/${encodeURIComponent(appid)}?key=${encodeURIComponent(DEPOTBOX_API_KEY)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.error) return null;

    const info = detectProtectionInfo(data);
    if (info.drm === "-" && info.account === "-") return null;
    return info;
  } catch (error) {
    console.warn("DepotBox fallback lookup failed:", error.message || error);
    return null;
  }
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

// NOTE: cette commande dépend fortement des variables d'environnement Google.
// Vérifiez `.env` et que `STEAMTOOLS_FOLDER_ID` et les clés Google sont bien renseignés.

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

    console.log("🔥 STEAMGAME MODIFIÉ - VERSION 2 🔥");

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
      let protectionInfo = detectProtectionInfo(game);

      if (protectionInfo.drm === "-" || protectionInfo.account === "-") {
        const depotboxInfo = await fetchDepotboxProtectionInfo(appid);
        if (depotboxInfo) {
          protectionInfo = {
            drm: protectionInfo.drm === "-" ? depotboxInfo.drm : protectionInfo.drm,
            account: protectionInfo.account === "-" ? depotboxInfo.account : protectionInfo.account,
          };
        }
      }

      protectionInfo = applyManualProtectionFallback(appid, protectionInfo);

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

        const notFoundEmbed = buildSteamEmbed({
          game,
          appid,
          protectionInfo,
          isAvailable: false,
          requesterTag: interaction.user.tag,
        });
        const notFoundButtons = buildSteamButtons({ appid, onlySteam: true });

        // Envoi du message dans le salon "non trouvé"
        const protectionEmbeds = buildProtectionEmbeds(protectionInfo);
        await notFoundChannel.send({ 
          embeds: [...protectionEmbeds, notFoundEmbed], 
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

      const embed = buildSteamEmbed({
        game,
        appid,
        protectionInfo,
        isAvailable: true,
        requesterTag: interaction.user.tag,
      });
      const buttons = buildSteamButtons({ appid, files });

      const protectionEmbeds = buildProtectionEmbeds(protectionInfo);
      // Envoi du message dans le salon principal
      await channel.send({ 
        content: `🎮 Disponible sur SteamLuaManager **${game.name}**, demandé par ${interaction.user.tag} !`,
        embeds: [...protectionEmbeds, embed], 
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
