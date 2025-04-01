const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const config = require("./Config/config");

passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new DiscordStrategy({
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackURL,
    scope: ["identify", "guilds"] // déjà bon
  }, (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken; // ⬅️ utile plus tard
    return done(null, profile);
  }));

module.exports = passport;
