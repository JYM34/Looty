/**
 * scheduler.js
 * Planifie et surveille les offres Epic Games :
 *  - récupère les jeux via `epic-games-free`
 *  - planifie un poll minute par minute jusqu'à 2h max après la détection d'un changement
 *  - déclenche `sendEmbeds` pour chaque guilde configurée
 *
 * Notes importantes :
 *  - Utilise `shared/guilds.json` pour parcourir toutes les guildes configurées.
 *  - Evite les doublons avec `waitUntil17hTimeout` et `pollTimeout`.
 */
const { getEpicFreeGames } = require("epic-games-free");
const updateStatus = require("./updateStatus");
const guilds = require("../../../shared/guilds.json");

// 🧷 Variables pour éviter les doubles exécutions
let waitUntil17hTimeout = null; // timeout pour attendre 17h (Paris) le jour de la fin
let pollTimeout = null;         // timeout pour la boucle de vérification minute par minute

module.exports = async function scheduleTask(client) {
  const ONE_MINUTE = 60_000;
  const MAX_WAIT_TIME = 2 * 60 * 60 * 1000; // ⛔️ Max 2h d'attente (en ms)

  /**
   * 📅 Calcule combien de millisecondes il reste jusqu'à 17h (heure de Paris)
   * le jour exact de la fin de la promo actuelle.
   * ⚠️ Paris = UTC+2 en été, donc 17h Paris = 15h UTC
   * @param {number} endTimestamp - timestamp (en ms) de fin de promo
   * @returns {number} - délai restant jusqu’à 17h ce jour-là
   */
  function getDelayUntil17hOnEndDate(endTimestamp) {
    const endDate = new Date(endTimestamp);     // Date exacte de fin
    const target = new Date(endDate);           // On clone pour modifier l'heure

    target.setUTCHours(15, 0, 0, 0);            // 15h UTC = 17h Paris
    return target.getTime() - Date.now();       // Retourne le délai restant
  }

  /**
   * 🔁 Vérifie toutes les minutes si de nouveaux jeux sont apparus sur Epic Games
   * S'arrête automatiquement après 2h si rien ne change
   * @param {string[]} previousGameIds - Liste d'identifiants ou titres des jeux déjà connus
   * @param {number} startTime - Timestamp de début du polling (pour le timeout)
   */
  async function pollForNewGames(previousGameIds = [], startTime = Date.now()) {
    const { currentGames } = await getEpicFreeGames();
    log.debug("👀 on récupère les jeux actuellement en promo...", currentGames);

    if (!currentGames.length) {
      // Aucun jeu disponible pour le moment
      log.info("⏳ Aucun jeu détecté. Nouvelle vérif dans 1 min...");
    } else {
      // On extrait les ID ou titres des jeux pour comparer
      log.debug("👀 On extrait les ID ou titres des jeux pour comparer...");
      const newGameIds = currentGames.map(g => g.id || g.title);

      // Si la liste de jeux a changé (un ID ou titre est nouveau), on agit !
      const isNew = previousGameIds.length === 0 || newGameIds.some(id => !previousGameIds.includes(id));

      if (isNew) {
        log.success("🎉 Nouveaux jeux détectés sur Epic Games !");

        // ✅ On importe dynamiquement l'envoi des embeds
        const sendEpicGamesEmbed = require("./sendEmbeds");
        log.debug("👀 On importe dynamiquement l'envoi des embeds...");

        // 📁 On récupère la config des salons
        for (const guildId in guilds) {
          const config = guilds[guildId];
          if (!config.epic) continue;

          const { currentGamesChannelId, nextGamesChannelId } = config.epic;

          log.debug(`Guild: ${guildId} - current: ${currentGamesChannelId} | next: ${nextGamesChannelId}`);

          if (!currentGamesChannelId || !nextGamesChannelId) {
            log.warn(`Guild ${guildId}: currentGamesChannelId ou nextGamesChannelId manquant, on skip`);
            continue;
          }

          // 📤 Envoie les nouveaux jeux dans les salons configurés
          await sendEpicGamesEmbed(client, currentGamesChannelId, nextGamesChannelId);
          log.debug("👀 Envoie les nouveaux jeux dans les salons configurés...");
        }  

        // 🕹️ Met à jour le statut du bot avec la date de fin du nouveau jeu
        const newEnd = new Date(currentGames[0].expiryDate).getTime();
        updateStatus(client, newEnd);
        log.debug("👀 Met à jour le statut du bot avec la date de fin du nouveau jeu...", newEnd);

        // 🛑 Nettoie tout polling actif pour éviter les doublons
        if (pollTimeout) clearTimeout(pollTimeout);
        pollTimeout = null;

        // 🔁 Relance le système avec la nouvelle promo
        return scheduleTask(client);
      } else {
        log.info("👀 Toujours les mêmes jeux. Nouvelle vérif dans 1 min...");
        previousGameIds = newGameIds; // On conserve la dernière version
      }
    }

    // ⛔️ Si 2h se sont écoulées sans nouveau jeu → arrêt automatique
    const now = Date.now();
    const elapsed = now - startTime;

    if (elapsed >= MAX_WAIT_TIME) {
      log.warn("⏱️ Temps limite atteint (2h). Fin de la vérification.");
      pollTimeout = null;
      return;
    }

    // 🔁 On programme une nouvelle vérification dans 1 minute (et on annule l’ancienne si existante)
    if (pollTimeout) clearTimeout(pollTimeout);
    pollTimeout = setTimeout(() => pollForNewGames(previousGameIds, startTime), ONE_MINUTE);
  }

  // 📥 Étape 1 : on récupère les jeux actuellement en promo
  const { currentGames } = await getEpicFreeGames();
  log.debug("👀 Étape 1 : on récupère les jeux actuellement en promo...", currentGames);

  if (!currentGames.length) {
    log.warn(" Aucun jeu Epic actuellement détecté.");
    return;
  }

  // 📆 Étape 2 : on récupère la date de fin de la promo
  // ⛔ TEST : FAUSSE DATE → aujourd'hui, 1 minute dans le futur
  const end = new Date(currentGames[0].expiryDate).getTime();

  // 🕹️ Étape 3 : mise à jour immédiate du statut du bot
  updateStatus(client, end);

  // ⏳ Étape 4 : on calcule combien de temps il reste jusqu'à 17h (jour de fin)
  const delay = getDelayUntil17hOnEndDate(end);

  if (delay > 0) {
    // 🔁 On s’assure qu’on n’a pas déjà un timeout actif
    if (waitUntil17hTimeout) clearTimeout(waitUntil17hTimeout);

    // ➡️ Ajoute ça pour afficher la date cible, heure Paris
    const scheduled = new Date(Date.now() + delay);
    const scheduledParis = scheduled.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });
    log.timer(`🕔 Mise a jour programmée pour : ${scheduledParis}`);

    // ✅ Programmation unique du démarrage à 17h
    waitUntil17hTimeout = setTimeout(() => {
      waitUntil17hTimeout = null; // nettoyage
      pollForNewGames(currentGames.map(g => g.id || g.title)); // 🚀 on démarre le polling
    }, delay);
  } else {
    // 🧯 Si 17h est déjà passé, on commence la vérif immédiatement
    log.warn("⏱️ 17h déjà dépassé ! Lancement immédiat de la vérification.");
    pollForNewGames(currentGames.map(g => g.id || g.title));
  }
};
