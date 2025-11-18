/**
 * passport.js
 * Configuration Passport.js pour l'authentification Discord (passport-discord).
 * Utilise les identifiants définis dans `web/Config/config.js` qui lit `.env`.
 */
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const config = require("./Config/config");

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Strategy Discord
passport.use(new DiscordStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL,
    scope: ["identify", "guilds"] // déjà bon
  }, (accessToken, refreshToken, profile, done) => {
    // On attache l'accessToken au profil pour utilisation ultérieure côté serveur
    profile.accessToken = accessToken; // ⬅️ utile plus tard
    return done(null, profile);
  }));

module.exports = passport;
