// ==============================================================
// MOTEUR D'EVENEMENTS - module reutilisable, generique pour toutes les entites
// Utilise par les routeurs generes (government-builder.js) apres
// chaque creation/modification/suppression reussie.
// ==============================================================
const crypto = require('crypto');
const db = require('./db');

/**
 * Enregistre un evenement d'audit.
 * @param {string} entity - nom de la table (ex: 'facture')
 * @param {string} entityId - id de l'enregistrement concerne
 * @param {string} evenement - 'CREATION' | 'MODIFICATION' | 'SUPPRESSION'
 * @param {object|null} avant - snapshot avant l'action (null pour une creation)
 * @param {object|null} apres - snapshot apres l'action (null pour une suppression)
 * @param {string|null} utilisateurId - reserve pour plus tard, NULL tant qu'il n'y a pas d'auth
 */
async function enregistrerEvenement(entity, entityId, evenement, avant, apres, utilisateurId = null) {
    await db.run(
        `INSERT INTO entity_event (event_id, entity, entity_id, evenement, donnees_avant, donnees_apres, utilisateur_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            crypto.randomUUID(),
            entity,
            entityId,
            evenement,
            avant ? JSON.stringify(avant) : null,
            apres ? JSON.stringify(apres) : null,
            utilisateurId
        ]
    );
}

// PostgreSQL (colonne JSONB) renvoie deja un objet JavaScript ; SQLite (colonne
// TEXT) renvoie une chaine a parser. Meme garde-fou que parseDefinition() dans
// server.js, pour que le code fonctionne identiquement sur les deux moteurs.
function parseJsonColumn(valeur) {
    if (valeur === null || valeur === undefined) return null;
    return typeof valeur === 'string' ? JSON.parse(valeur) : valeur;
}

/**
 * Recupere l'historique complet d'un enregistrement, du plus recent au plus ancien.
 */
async function historique(entity, entityId) {
    const rows = await db.all(
        `SELECT * FROM entity_event WHERE entity = ? AND entity_id = ? ORDER BY created_at DESC`,
        [entity, entityId]
    );
    return rows.map(r => ({
        ...r,
        donnees_avant: parseJsonColumn(r.donnees_avant),
        donnees_apres: parseJsonColumn(r.donnees_apres)
    }));
}

module.exports = { enregistrerEvenement, historique };
