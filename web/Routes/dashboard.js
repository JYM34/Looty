// 📁 web/Routes/dashboard.js

const express = require("express");
const router = express.Router();
const authGuard = require("../Middlewares/authGuard");
const { getGuildConfig, setGuildConfig } = require("../Utils/db"); // 💾 Base JSON

const fs = require("fs");
const path = require("path");
//const { log } = require("console");

// 📂 Fichier partagé entre le dashboard et le bot
const channelsFilePath = path.join(__dirname, "../../shared/guilds.json");

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
    groupedChannels // ✅ Pour optgroup côté EJS
  });
});

// 💾 POST /dashboard/:guildId → Enregistre les salons sélectionnés dans shared/channels.json
router.post("/:guildId", authGuard, async (req, res) => {
  const guildId = req.params.guildId;
  const form = req.body;

  // ✅ Lecture de l’ancien fichier
  let raw = "{}";
  if (fs.existsSync(channelsFilePath)) {
    raw = fs.readFileSync(channelsFilePath, "utf8");
  }

  const channelsJson = JSON.parse(raw);
  log.debug("/var/www/Looty/web/Routes/dashboard.js : ", JSON.stringify(channelsJson, null, 2));

  // 🧠 On récupère le nom de la guilde si le bot y est encore
  const guild = req.client.guilds.cache.get(guildId);
  const guildName = guild?.name || "Nom inconnu";

  // 🔄 Écriture des nouveaux salons dans la bonne clé
  channelsJson[guildId] = {
    name: guildName,
    prefix: form.prefix || "!",
    moderation: form.moderation === "true",
    currentGamesChannelId: form.epicChannel,
    nextGamesChannelId: form.epicComingSoonChannel,
    logsChannelId: form.epicLogsChannel
  };

  // 💾 Sauvegarde dans le fichier partagé
  fs.writeFileSync(
    channelsFilePath,
    JSON.stringify(channelsJson, null, 2),
    "utf8"
  );

  log.success(`Synchro enregistrée dans shared/guilds.json pour ${guildId}`);

  res.redirect(`/dashboard/${guildId}`);
});

module.exports = router;
