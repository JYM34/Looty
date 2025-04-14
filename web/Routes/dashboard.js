// 📁 web/Routes/dashboard.js

const express = require("express");
const router = express.Router();
const authGuard = require("../Middlewares/authGuard");
const { getGuildConfig, setGuildConfig } = require("../Utils/db"); // 💾 Base JSON
const { getGuildData, setGuildData } = require("../Utils/guildsFile");

const path = require("path");
//const { log } = require("console");

// 📊 GET /dashboard → Liste des serveurs gérables par l'utilisateur
router.get("/", authGuard, async (req, res) => {
  const user = req.user;

  // 🔍 On filtre les serveurs où l'utilisateur a MANAGE_GUILD (0x20)
  const managedGuilds = user.guilds.filter(g =>
    (g.permissions & 0x20) === 0x20
  );

   // 🧠 Liste des serveurs où le bot est déjà présent
   const botGuilds = req.client.guilds.cache.map(g => g.id);

  res.render("dashboard", {
    user,
    guilds: managedGuilds,
    guildsInBot: botGuilds
  });
});

// ⚙️ GET /dashboard/:guildId → Page de config d’un serveur
router.get("/:guildId", authGuard, async (req, res) => {
  const user = req.user;
  const guildId = req.params.guildId;

  // 📦 Lecture config personnalisée (ex: prefix/modération)
  const config = await getGuildConfig(guildId);

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
            avatar: member.user.displayAvatarURL({ size: 64, extension: 'png' }) // ou .jpg
          };
      }
    }
  
    // 💡 Enrichir les infractions pour le tableau
    const infractions = config.infractions || {};
    for (const [userId, entries] of Object.entries(config.infractions || {})) {
      const tag = enrichedUsers[userId]?.tag || userId;
      const avatar = enrichedUsers[userId]?.avatar || null;
    
      enrichedInfractions[userId] = {
        tag,
        avatar,
        entries
      };
    }
  }
  

  // ✅ Vérifie si l'utilisateur a accès à ce serveur
  const guild = user.guilds.find(g => g.id === guildId);
  if (!guild) return res.redirect("/dashboard");

  // 🔎 Est-ce que le bot est présent dans ce serveur ?
  const guildInCache = req.client.guilds.cache.get(guildId);

  // 📺 On regroupe les salons textuels par catégorie
  const groupedChannels = {};

  if (guildInCache) {
    guildInCache.channels.cache
      .filter(c => c.type === 0) // 🧵 GUILD_TEXT uniquement
      .forEach(channel => {
        const category = channel.parent?.name || "Sans catégorie";
        if (!groupedChannels[category]) groupedChannels[category] = [];
        groupedChannels[category].push({ id: channel.id, name: channel.name });
      });
  }

  res.render("guild-dashboard", {
    user,
    guild,
    config,
    groupedChannels, // ✅ Pour optgroup côté EJS
    enrichedInfractions,
    enrichedUsers
  });
});

// 💾 POST /dashboard/:guildId → Enregistre les salons sélectionnés dans shared/channels.json
router.post("/:guildId", authGuard, async (req, res) => {
  const guildId = req.params.guildId;
  const form = req.body;

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
  
    log.success(`Nouvelle infraction ajoutée pour ${userId} dans ${guildId}`);
    return res.redirect(`/dashboard/${guildId}`);
  }

  if (form.action === "deleteInfraction") {
    const { userId, index } = form;
  
    const guildData = getGuildData(guildId);
    if (
      guildData.infractions &&
      guildData.infractions[userId] &&
      guildData.infractions[userId][index]
    ) {
      guildData.infractions[userId].splice(index, 1); // supprime l’infraction ciblée
  
      // S'il ne reste rien, on nettoie
      if (guildData.infractions[userId].length === 0) {
        delete guildData.infractions[userId];
      }
  
      setGuildData(guildId, guildData);
      log.success(`Infraction supprimée pour ${userId} dans ${guildId}`);
    } else {
      log.warn(`Tentative de suppression invalide pour ${userId} @${index}`);
    }
  
    return res.redirect(`/dashboard/${guildId}`);
  }
  

  const guild = req.client.guilds.cache.get(guildId);
  const guildName = guild?.name || "Nom inconnu";

  // 🔄 Mise à jour
  setGuildData(guildId, {
    name: guildName,
    prefix: form.prefix || "!",
    moderation: form.moderation === "true",
    currentGamesChannelId: form.epicChannel,
    nextGamesChannelId: form.epicComingSoonChannel,
    logsChannelId: form.epicLogsChannel
  });

  log.success(`Synchro enregistrée dans shared/guilds.json pour ${guildId}`);
  res.redirect(`/dashboard/${guildId}`);
});

module.exports = router;
