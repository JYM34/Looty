/**
 * 🧼 Nettoyage et validation des données de jeu Epic Games
 * @param {Object} game - Objet brut d'un jeu
 * @returns {Object} Données nettoyées avec types sûrs
 */
function sanitizeGame(game) {
  const safeDate = (str) => {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  const parsePrice = (str) => {
    if (typeof str !== "string") return null;
    const clean = str.replace(/[^\d,.-]/g, "").replace(",", ".");
    const num = parseFloat(clean);
    return isNaN(num) ? null : num;
  };

  const cleaned = {
    ...game,
    effectiveDate: safeDate(game.effectiveDate),
    expiryDate: safeDate(game.expiryDate),
    price: parsePrice(game.price), // ⚠️ suppose que `game.price` = prix d’origine
    promoPrice: 0 // Tous les jeux listés ici sont gratuits
  };

  // 🛑 Log des incohérences de parsing
  if (!cleaned.effectiveDate) log.warn(` Date de début invalide pour "${game.title}"`);
  if (!cleaned.expiryDate) log.warn(` Date de fin invalide pour "${game.title}"`);
  if (cleaned.price === null) log.warn(` Prix original non numérique pour "${game.title}"`);
  if (cleaned.promoPrice === null) log.warn(` Prix promo non numérique pour "${game.title}"`);

  return cleaned;
}

module.exports = sanitizeGame;
