// 📦 Imports nécessaires
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { getEpicFreeGames } = require("epic-games-free");         // Lib externe
const formatDate = require("./formatDate");                      // Helper isolé
const sanitizeGame = require("./sanitizeGame");                  // Helper isolé

/**
 * 🧹 Supprime les anciens messages du bot dans un salon
 * @param {Client} client
 * @param {TextChannel} channel
 */
async function clearChannelMessages(client, channel) {
  if (!channel?.isTextBased()) return;

  try {
    // 🔄 Récupère les 100 derniers messages du salon
    const messages = await channel.messages.fetch({ limit: 100 });

    // 🤖 Filtre les messages envoyés par le bot lui-même
    const botMessages = messages.filter(m => m.author.id === client.user.id);

    // ✅ Supprime les messages en bulk (si possible)
    if (botMessages.size > 0) {
      const deleted = await channel.bulkDelete(botMessages, true); // true = ignore messages >14j
      log.debug(`🧹 ${deleted.size} message(s) supprimé(s) dans #${channel.name}`);
    }

  } catch (err) {
    // 👇 Ignore juste l’erreur "Unknown Message" pour éviter le spam
    if (err.code === 10008) {
      log.warn(`⚠️ Tentative de suppression échouée : message inconnu (probablement déjà supprimé)`);
    } else {
      log.error(`❌ Erreur nettoyage de #${channel.name} : ${err.message}`);
    }
  }
}

/**
 * 📤 Envoie les jeux Epic Games (actuels et à venir) dans les salons configurés
 * @param {Client} client
 * @param {string} currentChannelId - Salon pour les jeux actuels
 * @param {string} nextChannelId - Salon pour les jeux à venir
 */
module.exports = async function sendEpicGamesEmbed(client, currentChannelId, nextChannelId) {
  const { currentGames, nextGames } = await getEpicFreeGames();

  const currentChannel = await client.channels.fetch(currentChannelId).catch(() => null);
  const nextChannel = await client.channels.fetch(nextChannelId).catch(() => null);

  // 🧽 Nettoyage des messages existants
  await clearChannelMessages(client, currentChannel);
  await clearChannelMessages(client, nextChannel);

  /**
   * 🧱 Construit et envoie un embed pour un jeu
   * @param {Object} game - Jeu Epic Games
   * @param {string} channelId - ID du salon ciblé
   */
  async function sendEmbed(game, channelId) {
    sanitizeGame(game); // 🧼 Nettoyage des données

    if (game.offerType === 'BASE_GAME') game.offerType = 'JEU';
    if (game.price === '0') game.price = 'Gratuit';

    // 🖼️ Construction de l’embed
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

    // 🔘 Bouton pour accéder au jeu (si dispo)
    const button = new ButtonBuilder()
      .setLabel("Ajouter à Epic Games")
      .setStyle(ButtonStyle.Link)
      .setURL(game.url)
      .setEmoji("🏷️");

    const row = new ActionRowBuilder().addComponents(button);

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.isTextBased()) return;

      await channel.send({
        embeds: [embed],
        components: game.status === "currentGames" ? [row] : []
      });
    } catch (err) {
      console.error(`❌ Erreur d’envoi pour ${game.title} : ${err.message}`);
    }
  }

  // ▶️ Jeux actuels
  for (const game of currentGames) {
    await sendEmbed(game, currentChannelId);
  }

  // ⏳ Jeux à venir
  for (const game of nextGames) {
    await sendEmbed(game, nextChannelId);
  }
};
