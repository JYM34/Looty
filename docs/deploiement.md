# 🚀 Déploiement de Looty (Bot + Dashboard Web)

Ce guide explique comment déployer le bot Discord Looty ainsi que son dashboard web basé sur Express.

---

## 📁 Structure du projet

```
Looty/
├── bot/               # Code principal du bot Discord
├── web/               # Dashboard Express.js + EJS
│   ├── Views/         # Vues EJS
│   ├── Routes/        # Routes Express
│   ├── Public/        # CSS, images, JS client
│   └── app.js         # Entrée du dashboard
├── .env               # Variables d’environnement
├── package.json
└── ecosystem.config.js (optionnel pour PM2)
```

---

## 🌐 Prérequis serveur

- Ubuntu 20.04+
- Node.js v18+
- `pm2` installé globalement (`npm i -g pm2`)
- Un nom de domaine pointé vers votre VPS
- (Facultatif) `nginx` pour reverse proxy + HTTPS

---

## 🧪 Étapes d’installation

### 1. Installation des dépendances

```bash
git clone https://github.com/votre-projet/looty.git
cd looty
cp .env.example .env
npm install
```

---

### 2. Configuration de l’environnement (`.env`)

```env
TOKEN=your_discord_token
CLIENT_ID=your_discord_app_id
GUILD_ID=your_test_guild_id
LOG_CHANNEL_ID=...

DOMAIN=https://looty.mondomaine.com
SESSION_SECRET=randomSecretString
CALLBACK_URL=https://looty.mondomaine.com/login/callback
```

---

### 3. Lancement avec PM2

```bash
pm2 start bot/index.js --name Looty
pm2 start web/app.js --name eLooty
pm2 save
```

Pour les logs :
```bash
pm2 logs
```

---

### 4. (Facultatif) Configuration NGINX (reverse proxy)

```nginx
server {
    listen 80;
    server_name looty.mondomaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛡️ Conseils

- Utilisez `pm2 save && pm2 startup` pour redémarrage automatique
- Changez `SESSION_SECRET` dans `.env` pour production
- Utilisez HTTPS via Certbot ou nginx proxy manager
- Vérifiez les logs Discord + Web avec `pm2 logs`

---

## ✅ Looty est prêt à être déployé en prod !