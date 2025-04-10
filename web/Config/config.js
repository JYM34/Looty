require('dotenv').config();

module.exports = {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.REDIRECT_URI,
    scope: ["identify", "guilds"],
  };


