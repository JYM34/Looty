/**
 * web/Routes/auth.js
 * Routes d'authentification via Discord (passport-discord)
 * - GET /auth/login     -> redirige vers Discord
 * - GET /auth/callback  -> callback OAuth2
 * - GET /auth/logout    -> déconnexion
 *
 * Note: `state` est transmis en query pour redirections spécifiques (ex: `returnToDashboard`).
 */
// 📦 Importation du routeur Express
const router = require("express").Router();

// 🔐 Importation de Passport.js pour l'authentification Discord
const passport = require("passport");

// 🔑 Route pour démarrer l'authentification via Discord
router.get("/login", (req, res, next) => {
  const state = req.query.state || ""; // récupère l'état demandé dans l'URL
  log.debug("🔐 [LOGIN] Redirection vers Discord pour authentification...");
  log.debug("🌐 [LOGIN] Paramètre 'state' reçu : ", state);

  // On appelle manuellement passport.authenticate avec le paramètre `state`
  passport.authenticate("discord", { state })(req, res, next);
});

// 🎯 Callback appelé automatiquement par Discord après le login
router.get("/callback", passport.authenticate("discord", {
  failureRedirect: "/" // ❌ Redirige vers la page d'accueil en cas d'échec
}), (req, res) => {
  const state = req.query.state;

  log.debug("✅ [CALLBACK] Authentification réussie !");
  log.debug("🧑 [CALLBACK] Utilisateur : ", req.user?.username || "Inconnu");
  log.debug("🌐 [CALLBACK] Paramètre 'state' : ", state);

  if (state === "returnToDashboard") {
    log.debug("➡️  [CALLBACK] Redirection vers /dashboard");
    return res.redirect("/dashboard");
  }

  log.debug("➡️  [CALLBACK] Redirection vers la page d'accueil");
  res.redirect("/");
});


// 🚪 Route de déconnexion
router.get("/logout", (req, res) => {
  log.debug("🚪 [LOGOUT] Tentative de déconnexion...");

  req.logout(err => {
    if (err) {
      log.error("🔐 [LOGOUT] Erreur lors de la déconnexion :", err);
    } else {
      log.debug("🔐 [LOGOUT] Déconnexion réussie.");
    }
    res.redirect("/"); // 🔁 Redirige vers l'accueil après logout
  });
});

// 📤 Export du routeur pour l’utiliser dans l'app principale
module.exports = router;

