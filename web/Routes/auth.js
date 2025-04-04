const router = require("express").Router();
const passport = require("passport");

router.get("/login", passport.authenticate("discord"));

router.get("/callback", passport.authenticate("discord", {
  failureRedirect: "/"
}), (req, res) => {
  res.redirect("/dashboard");
});

router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

module.exports = router;
