const express = require("express");
const router = express.Router();
require("dotenv").config();

router.get("/", (req, res) => {
  const clientId = process.env.CLIENT_ID;
  const permissions = "274877975552";
  const scopes = ["bot", "applications.commands"].join("%20");
  //const state = encodeURIComponent("returnToDashboard");
  //const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}&state=${state}`;
  const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}`;

  // Envoie une page HTML qui fait l’ouverture du lien d’invite + redirection
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Redirection...</title>
        <script>
          window.open("${inviteUrl}", "_blank");
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 1000);
        </script>
      </head>
      <body>
        <p>🔁 Redirection en cours...</p>
      </body>
    </html>
  `);
});

module.exports = router;

