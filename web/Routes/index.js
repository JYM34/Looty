/**
 * web/Routes/index.js
 * Routes publiques du site : page d'accueil et pages de debug
 */
const router = require("express").Router();

router.get("/", (req, res) => {
  res.render("home", { user: req.user });
});

router.get("/debug-sidebar", (req, res) => {
    res.render("debug-sidebar");
  });

module.exports = router;
