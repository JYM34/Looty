const express = require("express");
const router = express.Router();
require("dotenv").config();

router.get("/invite", (req, res) => {
  const clientId = process.env.CLIENT_ID;
  const permissions = "274877975552"; // tu peux adapter les permissions ici
  const scopes = ["bot", "applications.commands"].join("%20");

  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}`;

  res.redirect(inviteUrl);
});

module.exports = router;
