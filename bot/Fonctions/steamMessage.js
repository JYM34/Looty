const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

function genreColor(genres) {
  if (!genres || genres.length === 0) return "#5865F2";
  if (genres.includes("Action")) return "#FF0000";
  if (genres.includes("Adventure")) return "#00FF00";
  return "#5865F2";
}

function getPrice(game) {
  return game?.price_overview
    ? `${(game.price_overview.final / 100).toFixed(2)} ${game.price_overview.currency}`
    : "Gratuit / N/A";
}

function getReleaseDate(game) {
  return game?.release_date?.date || "Inconnue";
}

function buildSteamEmbed({ game, appid, protectionInfo, isAvailable, requesterTag }) {
  const thumbnail = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`;
  const banner = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;

  const embed = new EmbedBuilder()
    .setColor(isAvailable ? genreColor(game.genres?.map(g => g.description)) : "#FF6B6B")
    .setTitle(isAvailable ? game.name : `❌ ${game.name} - Non disponible`)
    .setURL(`https://store.steampowered.com/app/${appid}`)
    .setDescription(game.short_description || "Pas de description disponible.")
    .setThumbnail(thumbnail)
    .setImage(banner)
    .addFields(
      { name: "🎮 Genre(s)", value: game.genres?.map(g => g.description).join(", ") || "Inconnu", inline: false },
      { name: "🛠 Développeur(s)", value: game.developers?.join(", ") || "Inconnu", inline: false },
      { name: "🏢 Éditeur(s)", value: game.publishers?.join(", ") || "Inconnu", inline: false },
      { name: "📅 Date de sortie", value: getReleaseDate(game), inline: true },
      { name: "💰 Prix", value: getPrice(game), inline: true },
      { name: "Steam ID", value: appid, inline: true },
    )
    .setFooter({ text: `Demandé par ${requesterTag}` })
    .setTimestamp();

  return embed;
}

function buildSteamButtons({ appid, files, onlySteam = false }) {
  const buttons = new ActionRowBuilder();

  if (!onlySteam && files?.zip) {
    buttons.addComponents(
      new ButtonBuilder()
        .setLabel("📦 Télécharger ZIP")
        .setStyle(ButtonStyle.Link)
        .setURL(files.zip.webViewLink)
    );
  }

  if (!onlySteam && files?.lua) {
    const luaDirectDownload = `https://drive.google.com/uc?export=download&id=${files.lua.id}`;
    buttons.addComponents(
      new ButtonBuilder()
        .setLabel("📄 Télécharger .lua")
        .setStyle(ButtonStyle.Link)
        .setURL(luaDirectDownload)
    );
  }

  buttons.addComponents(
    new ButtonBuilder()
      .setLabel("🔍 Voir sur Steam")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://store.steampowered.com/app/${appid}`)
  );

  return buttons;
}

function buildProtectionEmbeds(protectionInfo) {
  const embeds = [];

  if (protectionInfo?.drm && protectionInfo.drm !== "-") {
    embeds.push(
      new EmbedBuilder()
        .setColor("#C44F5A")
        .setDescription(`⚠️ **3rd-Party DRM**\n${protectionInfo.drm}`)
    );
  }

  if (protectionInfo?.account && protectionInfo.account !== "-") {
    embeds.push(
      new EmbedBuilder()
        .setColor("#C2A24D")
        .setDescription(`🔗 **3rd-Party Account**\n${protectionInfo.account}`)
    );
  }

  return embeds;
}

module.exports = {
  buildSteamEmbed,
  buildSteamButtons,
  buildProtectionEmbeds,
};
