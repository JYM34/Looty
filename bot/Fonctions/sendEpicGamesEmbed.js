// 📦 Imports Discord + modules maison
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { getEpicFreeGames } = require("epic-games-free");          // Récupère les jeux gratuits
const formatDate = require("./formatDate");                       // Formate les dates façon FR
const sanitizeGame = require("./sanitizeGame");                   // Nettoie les données du jeu

/**
 * 🧹 Supprime les anciens messages du bot dans un salon donné
 * @param {Client} client - Le client Discord
 * @param {TextChannel} channel - Le salon à nettoyer
 */
async function clearChannelMessages(client, channel) {
  if (!channel || !channel.isTextBased()) return;

  try {
    const messages = await channel.messages.fetch({ limit: 100 });
    const botMessages = messages.filter(m => m.author.id === client.user.id); // 🔍 On garde que les messages du bot

    if (botMessages.size > 0) {
      await channel.bulkDelete(botMessages, true);
      log.debug(`🧹 ${botMessages.size} message(s) supprimé(s) dans #${channel.name}`);
    }
  } catch (err) {
    console.error(`❌ Erreur lors du nettoyage de #${channel.name} : ${err.message}`);
  }
}

/**
 * 📤 Envoie les jeux gratuits Epic dans deux salons distincts (actuels / à venir)
 * @param {Client} client - Instance du bot Discord
 * @param {string} currentChannelId - ID du salon pour les jeux actuels
 * @param {string} nextChannelId - ID du salon pour les prochains jeux
 */
module.exports = async function sendEpicGamesEmbed(client, currentChannelId, nextChannelId) {
  // 🔁 On récupère les jeux en cours et ceux à venir
  const { currentGames, nextGames } = await getEpicFreeGames();

  // 📡 On récupère les objets "salon" via leurs ID
  const currentChannel = await client.channels.fetch(currentChannelId).catch(() => null);
  const nextChannel = await client.channels.fetch(nextChannelId).catch(() => null);

  // 🧼 Nettoyage des anciens messages envoyés par le bot
  await clearChannelMessages(client, currentChannel);
  await clearChannelMessages(client, nextChannel);

  /**
   * 📦 Crée et envoie un embed pour un jeu donné
   * @param {Object} game - Les données d'un jeu (nettoyé)
   * @param {string} channelId - ID du salon dans lequel envoyer l'embed
   */
  async function sendEmbed(game, channelId) {
    sanitizeGame(game); // 🧼 On nettoie les dates/prix avant de les utiliser

    if (game.offerType === 'BASE_GAME') {
      game.offerType = 'JEU'; // Pour le côté FR + clair
    }

    if (game.price === '0') game.price = 'Gratuit';

    // 🧩 Construction de l'embed
    const embed = new EmbedBuilder()
      .setColor(game.color)
      .setTitle(game.title)
      .setURL(game.url)
      .setAuthor({
        name: `${game.author} (${game.offerType})`,
        iconURL: "https://ftp.nkconcept.fr/faviconLooty.png"
      })
      .setDescription(game.description?.slice(0, 200) || "Pas de description disponible.")
      .setThumbnail(game.thumbnail)
      .addFields(
        { name: "💰 Prix original", value: `${game.price}`, inline: true },
        { name: "📅 Début", value: formatDate(game.effectiveDate), inline: false },
        { name: "📅 Fin", value: formatDate(game.expiryDate), inline: false }
      )
      .setImage(game.image)
      .setTimestamp()
      .setFooter({
        text: "Envoyé par Looty",
        iconURL: "https://ftp.nkconcept.fr/faviconLooty.png"
      });

    // 🔘 Bouton d'action (si jeu en cours uniquement)
    const button = new ButtonBuilder()
      .setLabel("Ajouter à Epic Games")
      .setStyle(ButtonStyle.Link)
      .setURL(game.url)
      .setEmoji("🏷️"); // 💡 Tu peux remplacer par 🎁 ou 🛒 si tu préfères !

    const row = new ActionRowBuilder().addComponents(button);

    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        console.warn(`❌ Canal invalide ou non textuel : ${channelId}`);
        return;
      }

      await channel.send({
        embeds: [embed],
        components: game.status === "currentGames" ? [row] : [] // 🎮 Ajout du bouton uniquement pour les jeux en cours
      });
    } catch (err) {
      console.error(`❌ Erreur d’envoi du jeu "${game.title}" : ${err.message}`);
    }
  }

  // ▶️ Envoi des jeux actuellement gratuits
  for (const game of currentGames) {
    await sendEmbed(game, currentChannelId);
  }

  // ⏳ Envoi des jeux à venir (sans bouton)
  for (const game of nextGames) {
    await sendEmbed(game, nextChannelId);
  }
};
