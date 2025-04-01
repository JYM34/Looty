const express = require("express");
const router = express.Router();
const authGuard = require("../Middlewares/authGuard"); // 🛡️ Protection des routes
const { getGuildConfig, setGuildConfig } = require("../Utils/db"); // 💾 Accès à la base JSON

// 🧭 Route : GET /dashboard
// Liste tous les serveurs où l'utilisateur a les permissions nécessaires
router.get("/", authGuard, (req, res) => {
  const guilds = req.user.guilds;

  // 🎯 On filtre uniquement les serveurs administrables (permission 0x20)
  const managedGuilds = guilds.filter(guild =>
    (guild.permissions & 0x20) === 0x20
  );

  res.render("dashboard", {
    user: req.user,
    guilds: managedGuilds
  });
});

// 🧭 Route : GET /dashboard/:guildId
// Affiche la configuration actuelle du serveur
router.get("/:guildId", authGuard, (req, res) => {
  const guildId = req.params.guildId;
  const guild = req.user.guilds.find(g => g.id === guildId);

  if (!guild) {
    return res.status(403).send("Accès refusé à ce serveur.");
  }

  const config = getGuildConfig(guildId); // 📥 Récupère la config actuelle depuis la "DB"

  res.render("guild-dashboard", {
    user: req.user,
    guild,
    config
  });
});

// 🧭 Route : POST /dashboard/:guildId
// Enregistre les modifications de configuration du serveur
router.post("/:guildId", authGuard, (req, res) => {
  const guildId = req.params.guildId;
  const prefix = req.body.prefix;
  const moderation = req.body.moderation === "true"; // ✅ case cochée = true

  const guild = req.user.guilds.find(g => g.id === guildId);
  if (!guild) {
    return res.status(403).send("Accès refusé à ce serveur.");
  }

  // 💾 On met à jour la config JSON du serveur
  setGuildConfig(guildId, {
    prefix: prefix || "!",
    moderation
  });

  res.redirect(`/dashboard/${guildId}`);
});

module.exports = router;
