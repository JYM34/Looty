/**
 * 📆 Formate une date ISO ou objet Date au format français lisible
 * Ex: "03 avril 2025 à 17:00"
 * 
 * @param {string|Date} d - Date à formater
 * @returns {string} - Date formatée en fr-FR, timezone Paris
 */
module.exports = function FormatDate(d) {
    const date = new Date(d);
  
    // ⏰ Format personnalisé avec heure + minutes
    const formattedDate = date.toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  
    return formattedDate; // 📤 Ex: "03 avril 2025 à 17:00"
  };
  