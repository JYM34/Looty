// 📦 web/app.js

/**
 * Initialise et démarre l'application Express pour le dashboard.
 * @param {import('discord.js').Client} client - Instance du bot Discord (passée aux routes)
 */
const express = require("express");
const session = require("express-session");
const passport = require("./passport");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");

module.exports = (client) => {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "Views"));
  app.use(expressLayouts);
  app.set("layout", "Partials/layout");

  app.use(express.static(path.join(__dirname, "Public")));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // ⚠️ En production, stocker le `secret` en variable d'environnement
  app.use(session({
    secret: process.env.SESSION_SECRET || "lootySecret",
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // 🔁 Ajoute client + user globalement dans les vues
  app.use((req, res, next) => {
    req.client = client;
    res.locals.user = req.user || null;
    res.locals.currentPath = req.path;
    next();
  });

  // 🌐 Routes
  app.use("/", require("./Routes/index"));
  app.use("/auth", require("./Routes/auth"));
  app.use("/dashboard", require("./Routes/dashboard"));
  app.use("/invite", require("./Routes/invite"));

  // ❌ 404
  app.use((req, res) => {
    res.status(404).render("404");
  });

  // 🚀 Lancement du dashboard
  app.listen(3000, () => {
    log.success("🌐 Dashboard en ligne : ","http://localhost:3000");
  });
};
