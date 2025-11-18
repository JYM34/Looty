/**
 * web/Routes/dashboard.js
 * Routes du dashboard d'administration : affichage des guildes, configuration Epic,
 * et outils SteamTools.
 * Toutes ces routes sont protégées par `authGuard`.
 */
const express = require("express");
const router = express.Router();
const authGuard = require("../Middlewares/authGuard");
const { getGuildData, setGuildData } = require("../Utils/guildsFile");


// ---------------------------------------------
// 📊 GET /dashboard → Liste des serveurs accessibles par l'utilisateur
// ---------------------------------------------
router.get("/", authGuard, async (req, res) => {
  const user = req.user;

  // 🔎 Filtre les serveurs que l'utilisateur peut gérer
  const managedGuilds = user.guilds.filter(g => (g.permissions & 0x20) === 0x20);
  const botGuilds = req.client.guilds.cache.map(g => g.id); // serveurs où le bot est présent

  res.render("dashboard", {
    user,
    guilds: managedGuilds,
    guildsInBot: botGuilds
  });
});

// ---------------------------------------------
// ⚙️ GET /dashboard/:guildId → Affiche la config d’un serveur
// ---------------------------------------------
router.get("/:guildId", authGuard, async (req, res) => {
  const user = req.user;
  const guildId = req.params.guildId;

  const config = getGuildData(guildId); // 📦 Config complète du serveur (unique fichier)
  const epicConfig = config.epic || {}; // 🎮 Sous-bloc Epic Games

  const enrichedUsers = {};
  const enrichedInfractions = {};

  const guildInstance = req.client.guilds.cache.get(guildId);
  if (guildInstance) {
    const members = await guildInstance.members.fetch();
    for (const [id, member] of members) {
      if (!member.user.bot) {
        const hasDiscriminator = member.user.discriminator !== "0";
        const tag = hasDiscriminator
          ? `${member.user.username}#${member.user.discriminator}`
          : `@${member.user.globalName || member.user.username}`;

        enrichedUsers[id] = {
          tag,
          avatar: member.user.displayAvatarURL({ size: 64, extension: "png" })
        };
      }
    }

    const infractions = config.infractions || {};
    for (const [userId, entries] of Object.entries(infractions)) {
      const tag = enrichedUsers[userId]?.tag || userId;
      const avatar = enrichedUsers[userId]?.avatar || null;

      enrichedInfractions[userId] = {
        tag,
        avatar,
        config,
        entries
      };
    }
  }

  const guild = user.guilds.find(g => g.id === guildId);
  if (!guild) return res.redirect("/dashboard");

  // 🔄 Organisation des salons par catégorie
  const guildInCache = req.client.guilds.cache.get(guildId);
  const groupedChannels = {};

  if (guildInCache) {
    guildInCache.channels.cache
      .filter(c => c.type === 0)
      .forEach(channel => {
        const category = channel.parent?.name || "Sans catégorie";
        if (!groupedChannels[category]) groupedChannels[category] = [];
        groupedChannels[category].push({ id: channel.id, name: channel.name });
      });
  }

  res.render("guild-dashboard", {
    user,
    guild,
    config,        // Config complète (modération, prefix, infractions, etc.)
    epic: epicConfig, // Spécifiquement pour Epic Games
    groupedChannels,
    enrichedInfractions,
    enrichedUsers
  });
});

// ---------------------------------------------
// 💾 POST /dashboard/:guildId → Sauvegarde centralisée
// ---------------------------------------------
router.post("/:guildId", authGuard, async (req, res) => {
  const guildId = req.params.guildId;
  const form = req.body;

  // 🎮 Enregistrement des paramètres Epic Games
  if (form.action === "saveConfig") {
    const oldConfig = getGuildData(guildId) || {};

    setGuildData(guildId, {
      ...oldConfig, // 🔄 On conserve tout le reste
      epic: {
        country: form.country || "FR",
        locale: form.locale || "fr-FR",
        currentGamesChannelId: form.epicChannel,
        nextGamesChannelId: form.epicComingSoonChannel,
        logsChannelId: form.epicLogsChannel
      }
    });

    log.success(`Epic Games : configuration mise à jour pour ${guildId}`);
    return res.redirect(`/dashboard/${guildId}#bloc-epic`);
  }

  // ➕ Ajout d'une infraction
  if (form.action === "addInfraction") {
    const { userId, reason } = form;
    const guildData = getGuildData(guildId);

    if (!guildData.infractions) guildData.infractions = {};
    if (!guildData.infractions[userId]) guildData.infractions[userId] = [];

    guildData.infractions[userId].push({
      reason,
      date: new Date().toISOString()
    });

    setGuildData(guildId, guildData);
    log.success(`➕ Infraction ajoutée pour ${userId} dans ${guildId}`);
    return res.redirect(`/dashboard/${guildId}#bloc-infractions`);
  }

  // ❌ Suppression d'une infraction
  if (form.action === "deleteInfraction") {
    const { userId, index } = form;
    const guildData = getGuildData(guildId);

    if (
      guildData.infractions &&
      guildData.infractions[userId] &&
      guildData.infractions[userId][index]
    ) {
      guildData.infractions[userId].splice(index, 1);
      if (guildData.infractions[userId].length === 0) {
        delete guildData.infractions[userId];
      }
      setGuildData(guildId, guildData);
      log.success(`🗑️ Infraction supprimée pour ${userId} dans ${guildId}`);
    } else {
      log.warn(`❗ Suppression d’infraction invalide pour ${userId} @${index}`);
    }

    return res.redirect(`/dashboard/${guildId}#bloc-infractions`);
  }

  // ⚙️ Enregistrement des modules généraux (modération, préfixe)
  const guild = req.client.guilds.cache.get(guildId);
  const guildName = guild?.name || "Nom inconnu";
  const oldConfig = getGuildData(guildId) || {};

  setGuildData(guildId, {
    ...oldConfig, // 🔁 Ne perd rien d’autre (ex: epic, infractions)
    name: guildName,
    prefix: form.prefix || oldConfig.prefix || "!",
    moderation: form.moderation === "true"
  });

  log.success(`✅ Modules sauvegardés pour ${guildId}`);
  res.redirect(`/dashboard/${guildId}`);
});

module.exports = router;
