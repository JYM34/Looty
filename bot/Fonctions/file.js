/**
 * Module de gestion du fichier `games.json`.
 * Fournit des utilitaires pour vérifier, créer et sauvegarder le fichier JSON
 * utilisé par certaines fonctionnalités du bot.
 *
 * Export : { TestFile, SaveFile }
 */
// 🔧 Dépendances
const fs = require('fs');
const path = require('path');

// ==============================
//   EXPORT DES FONCTIONS PUBLIQUES
// ==============================
module.exports = {
  TestFile,
  SaveFile
};

// ==============================
//   CHEMIN RELATIF DU FICHIER
// ==============================
// games.json est attendu à la racine du projet (au-dessus du dossier courant)
const filePath = path.join(__dirname, '..', 'games.json');

/**
 * Vérifie que le fichier `games.json` existe et contient un tableau JSON valide.
 * Si le fichier est manquant ou invalide, il est réinitialisé avec `[]`.
 */
function TestFile() {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      // 📁 Fichier manquant ou erreur de lecture (permissions, chemin, etc.)
      log.warn('[TestFile] games.json introuvable ou inaccessible.');
      return WriteFile();
    }

    try {
      const parsed = JSON.parse(data);

      // 🔍 Vérifie que le contenu est bien un tableau (structure attendue)
      if (!Array.isArray(parsed)) {
        throw new Error('Le contenu JSON n’est pas un tableau.');
      }

      // ✅ Tout est OK
      log.success('[TestFile] games.json initialisé avec succès.');

    } catch (parseErr) {
      // 🛑 Le fichier existe mais contient un contenu JSON invalide
      log.warn('[TestFile] games.json existe mais contient un JSON invalide. Réinitialisation...');
      WriteFile();
    }
  });
}

/**
 * 🆕 Crée ou réinitialise le fichier games.json avec un tableau vide.
 * Utilisé en fallback par TestFile().
 */
function WriteFile() {
  const defaultContent = JSON.stringify([], null, 2); // Tableau vide avec indentation 2 espaces

  fs.writeFile(filePath, defaultContent, 'utf8', (err) => {
    if (err) {
      // 💥 Échec lors de la création/écriture du fichier
      log.error('[WriteFile] ERREUR : Impossible d\'initialiser games.json', err);
    } else {
      // ✅ Fichier bien écrit
      log.maj('[WriteFile] Initialisation réussie de games.json.');
    }
  });
}

/**
 * 💾 Enregistre un objet JavaScript (ou tableau) dans le fichier games.json.
 * @param {Object|Array} obj - L'objet ou tableau à sauvegarder.
 */
function SaveFile(obj) {
  try {
    const json = JSON.stringify(obj, null, 2); // JSON formaté pour lisibilité

    fs.writeFile(filePath, json, 'utf8', (err) => {
      if (err) {
        // 💥 Échec d'écriture
        log.error('[SaveFile] ERREUR lors de la sauvegarde de games.json', err);
      } else {
        // ✅ Sauvegarde OK
        log.success('[SaveFile] Sauvegarde des données réussie.');
        log.info('[SaveFile] -------------------------');
      }
    });

  } catch (stringifyError) {
    // 🔥 L'objet n'est pas sérialisable (circular structure, etc.)
    log.error('[SaveFile] ERREUR : Données non sérialisables !', stringifyError);
  }
}
