/**
 * ⏳ Formate une durée en millisecondes en texte lisible : "Xj HHh MMmn"
 * @param {number} ms - Durée en millisecondes
 * @returns {string} - Formaté en "2j 03h 15mn"
 */
module.exports = function formatTimeLeft(ms) {
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
  
    return `${days}j ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}mn`;
  };
  