const router = require("express").Router();
const passport = require("passport");

router.get("/login", passport.authenticate("discord"));

router.get("/callback", passport.authenticate("discord", {
  failureRedirect: "/"
}), (req, res) => {
  const state = req.query.state;
  if (state === "returnToDashboard") {
    return res.redirect("/dashboard");
  }
  res.redirect("/");
});

router.get("/logout", (req, res) => {
  req.logout(err => {
    if (err) console.error(err);
    res.redirect("/");
  });
});

module.exports = router;
