/**
 * ⏳ Formate une durée en millisecondes en texte lisible : "Xj Hh Mmn"
 * Affiche toujours heures et minutes, mais seulement les jours si > 0
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Formaté en "2j 3h 15mn", "3h 0mn", ou "0h 0mn"
 */
module.exports = function formatTimeLeft(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  let timeParts = [];
  if (days > 0) timeParts.push(`${days}j`);
  timeParts.push(`${hours}h`);
  timeParts.push(`${minutes}min`);

  return timeParts.join(' ');
};
