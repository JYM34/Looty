const express = require("express");
const session = require("express-session");
const passport = require("./passport");
const path = require("path");
const expressLayouts = require("express-ejs-layouts"); // 🧩 Pour les layouts globaux EJS

const app = express();

// 🖼️ EJS + Layouts
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "Views"));
app.use(expressLayouts); // ⚙️ Active express-ejs-layouts
app.set("layout", "Partials/layout"); // 📄 Définit le layout par défaut (sans extension .ejs)

// 🗂️ Fichiers statiques (CSS, images, JS client)
app.use(express.static(path.join(__dirname, "Public")));

// 🧠 Middleware pour lire les données des formulaires (POST)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // utile si tu acceptes aussi du JSON

// 🔐 Sessions utilisateur
app.use(session({
  secret: "lootySecret", // 🔐 À stocker en variable d'environnement en prod
  resave: false,
  saveUninitialized: false
}));

// 🔐 Initialisation de Passport (auth Discord)
app.use(passport.initialize());
app.use(passport.session());

// 📍 Middleware global : injection du chemin courant dans chaque vue
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

// 🌐 Routes principales
app.use("/", require("./Routes/index"));
app.use("/auth", require("./Routes/auth"));
app.use("/dashboard", require("./Routes/dashboard"));
app.use("/", require("./Routes/invite")); // 🧭 Peut être regroupé si besoin

// ❌ Page 404 (à placer tout en bas)
app.use((req, res) => {
  res.status(404).render("404");
});

// 🚀 Lancement du serveur
app.listen(3000, () => {
  console.log("🌐 Dashboard en ligne : http://localhost:3000");
});
