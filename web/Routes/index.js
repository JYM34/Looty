// Web/Routes/index.js
const router = require("express").Router();

router.get("/", (req, res) => {
  res.render("home", { user: req.user });
});

router.get("/debug-sidebar", (req, res) => {
    res.render("debug-sidebar");
  });

module.exports = router;
