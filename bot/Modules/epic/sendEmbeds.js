// 📦 Imports nécessaires
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { getEpicFreeGames } = require("epic-games-free");
const formatDate = require("./formatDate");     // 🔠 Formatage des dates
const sanitizeGame = require("./sanitizeGame"); // 🧼 Nettoyage des données jeu

/**
 * 🧹 Supprime les anciens messages du bot dans un salon
 * @param {Client} client - Instance du bot
 * @param {TextChannel} channel - Salon cible
 */
async function clearChannelMessages(client, channel) {
  if (!channel?.isTextBased()) return;

  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const botMessages = messages.filter(m => m.author.id === client.user.id);

    if (botMessages.size > 0) {
      const deleted = await channel.bulkDelete(botMessages, true);
      log.debug(`🧹 ${deleted.size} message(s) supprimé(s) dans #${channel.name}`);
    }
  } catch (err) {
    // 🧯 Erreur connue → silencieuse
    if (err.code === 10008) {
      log.warn(`Tentative de suppression échouée : message inconnu (déjà supprimé ?)`);
    } else {
      log.error(`Erreur nettoyage de #${channel?.name || "inconnu"} : `, err.message);
    }
  }
}

/**
 * 📤 Envoie les jeux Epic Games (actuels et à venir) dans les salons configurés
 * @param {Client} client - Instance du bot
 * @param {string} currentChannelId - Salon pour les jeux gratuits actuels
 * @param {string} nextChannelId - Salon pour les jeux gratuits à venir
 * @param {string} [logsChannelId] - (optionnel) Salon de logs à notifier
 * @param {Object} guildConfig - Contient country/locale pour l’API Epic
 */
module.exports = async function sendEpicGamesEmbed(
  client,
  currentChannelId,
  nextChannelId,
  logsChannelId = null,
  guildConfig = { country: "FR", locale: "fr-FR" }
) {
  // 🎮 Récupère les jeux gratuits depuis l’API Epic (selon country/locale)
  const { currentGames, nextGames } = await getEpicFreeGames({ guildConfig });

  // 🔎 Récupération des salons à partir de leurs IDs
  const currentChannel = await client.channels.fetch(currentChannelId).catch(() => null);
  const nextChannel = await client.channels.fetch(nextChannelId).catch(() => null);

  // 🧽 Nettoyage des anciens messages dans les deux salons
  await clearChannelMessages(client, currentChannel);
  await clearChannelMessages(client, nextChannel);

  /**
   * 📦 Construit et envoie un embed pour un jeu donné
   * @param {Object} game - Jeu Epic formaté
   * @param {string} channelId - Salon dans lequel envoyer l'embed
   */
  async function sendEmbed(game, channelId) {
    sanitizeGame(game); // 🔧 Nettoie les champs du jeu

    // 🎮 Traduction / fallback
    if (game.offerType === 'BASE_GAME') game.offerType = 'JEU';
    if (game.price === '0') game.price = 'Gratuit';

    // 🎨 Construction de l’embed principal
    const embed = new EmbedBuilder()
      .setColor(game.color)
      .setTitle(game.title)
      .setURL(game.url)
      .setAuthor({ name: `${game.author} (${game.offerType})`, iconURL: "https://ftp.nkconcept.fr/logoNK.png" })
      .setDescription(game.description?.slice(0, 200) || "Pas de description disponible.")
      .setThumbnail(game.thumbnail)
      .addFields(
        { name: "💰 Prix original", value: `${game.price}`, inline: true },
        { name: "📅 Début", value: formatDate(game.effectiveDate), inline: false },
        { name: "📅 Fin", value: formatDate(game.expiryDate), inline: false }
      )
      .setImage(game.image)
      .setTimestamp()
      .setFooter({ text: "Envoyé par EpicGames Bot", iconURL: "https://ftp.nkconcept.fr/logoNK.png" });

    // 🔘 Bouton d’accès au jeu Epic
    const button = new ButtonBuilder()
      .setLabel("Ajouter à Epic Games")
      .setStyle(ButtonStyle.Link)
      .setURL(game.url)
      .setEmoji("🏷️");

    const row = new ActionRowBuilder().addComponents(button);

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.isTextBased()) return;

      // 📩 Envoi de l’embed (avec bouton uniquement pour jeux en cours)
      await channel.send({
        embeds: [embed],
        components: game.status === "currentGames" ? [row] : []
      });

      // 📝 Log facultatif dans le salon de logs
      if (logsChannelId) {
        const logsChannel = await client.channels.fetch(logsChannelId).catch(() => null);
        if (logsChannel?.isTextBased()) {
          await logsChannel.send(`✅ Jeu **${game.title}** envoyé dans <#${channelId}> (${game.status})`);
        } else {
          log.warn(`⚠️ Aucun salon log configuré pour le channel ${channelId}`);
        }
      }

    } catch (err) {
      log.error(`❌ Erreur d’envoi pour ${game.title} : `, err.message);
    }
  }

  // ▶️ Jeux en cours
  for (const game of currentGames) {
    await sendEmbed(game, currentChannelId);
  }

  // ⏳ Jeux à venir
  for (const game of nextGames) {
    await sendEmbed(game, nextChannelId);
  }
};
