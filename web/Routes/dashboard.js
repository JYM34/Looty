// 📁 web/Routes/dashboard.js

const express = require("express");
const router = express.Router();
const authGuard = require("../Middlewares/authGuard"); // 🔐 Auth middleware
const { getGuildConfig, setGuildConfig } = require("../Utils/db"); // 💾 Base JSON

// 🧭 Route GET /dashboard → liste des serveurs gérables par l'utilisateur
router.get("/", authGuard, (req, res) => {
  const user = req.user;

  // 🎯 On filtre les serveurs où l'utilisateur a MANAGE_GUILD (0x20)
  const managedGuilds = user.guilds.filter(g => (g.permissions & 0x20) === 0x20);

  res.render("dashboard", {
    user,
    guilds: managedGuilds
  });
});

// ⚙️ Route GET /dashboard/:guildId → affichage de la config du serveur
router.get("/:guildId", authGuard, async (req, res) => {
  const user = req.user;
  const guildId = req.params.guildId;
  const config = await getGuildConfig(guildId);

  const guild = user.guilds.find(g => g.id === guildId);
  if (!guild) return res.redirect("/dashboard");

  // ✅ Récupération du serveur dans le cache du bot
  const guildInCache = req.client.guilds.cache.get(guildId);

  let groupedChannels = {};

  if (guildInCache) {
    const textChannels = guildInCache.channels.cache
      .filter(c => c.type === 0 && c.viewable); // texte + visible

    textChannels.forEach(channel => {
      const parent = channel.parent || { id: "none", name: "📁 Sans catégorie" };
      if (!groupedChannels[parent.id]) {
        groupedChannels[parent.id] = {
          name: parent.name,
          channels: []
        };
      }
      groupedChannels[parent.id].channels.push({
        id: channel.id,
        name: channel.name
      });
    });
  }

  res.render("guild-dashboard", {
    user,
    guild,
    config,
    groupedChannels
  });
});

// 💾 Route POST /dashboard/:guildId → enregistre la config
router.post("/:guildId", authGuard, async (req, res) => {
  const guildId = req.params.guildId;
  const form = req.body;

  // 💾 Nouvelle configuration à sauvegarder
  const newConfig = {
    prefix: form.prefix || "!",
    moderation: form.moderation === "true",
    epicChannel: form.epicChannel,
    epicComingSoonChannel: form.epicComingSoonChannel,
    epicLogsChannel: form.epicLogsChannel
  };

  await setGuildConfig(guildId, newConfig);
  res.redirect(`/dashboard/${guildId}`);
});

module.exports = router;
