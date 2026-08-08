// ==============================================================
// MOTEUR DE REGLES - module reutilisable, generique pour toutes les entites
// Utilise par les routeurs generes (government-builder.js) avant
// d'executer une modification.
// ==============================================================
const db = require('./db');

function evaluerConditionUnique(cond, existant, nouveau) {
    const source = cond.source === 'nouveau' ? nouveau : existant;
    if (!source || !(cond.champ in source)) return false;
    const valeurChamp = source[cond.champ];
    switch (cond.operateur) {
        case '=': return String(valeurChamp) === String(cond.valeur);
        case '!=': return String(valeurChamp) !== String(cond.valeur);
        case '>': return Number(valeurChamp) > Number(cond.valeur);
        case '<': return Number(valeurChamp) < Number(cond.valeur);
        case '>=': return Number(valeurChamp) >= Number(cond.valeur);
        case '<=': return Number(valeurChamp) <= Number(cond.valeur);
        default: return false;
    }
}

function evaluerConditions(conditions, existant, nouveau) {
    // Toutes les conditions doivent etre vraies (ET) pour que la regle declenche un blocage
    return conditions.every(c => evaluerConditionUnique(c, existant, nouveau));
}

/**
 * Verifie les regles actives pour une entite/evenement donnes.
 * Retourne un tableau de violations (vide si aucune regle enfreinte).
 */
async function verifierRegles(nomTable, evenement, existant, nouveau) {
    const regles = await db.all(
        `SELECT * FROM meta_rule WHERE entite = ? AND evenement = ? AND statut = 'ACTIF'`,
        [nomTable, evenement]
    );
    const violations = [];
    for (const regle of regles) {
        let conditions;
        try {
            // PostgreSQL (colonne JSONB) renvoie deja un objet JavaScript ; SQLite
            // (colonne TEXT) renvoie une chaine a parser. Meme garde-fou que
            // notification-engine.js et event-engine.js, pour un comportement
            // identique sur les deux moteurs.
            conditions = typeof regle.condition_json === 'string'
                ? JSON.parse(regle.condition_json)
                : regle.condition_json;
        } catch (e) {
            continue; // condition mal formee - on ignore plutot que de planter
        }
        if (evaluerConditions(conditions, existant, nouveau)) {
            violations.push({ regle: regle.nom, message: regle.message_erreur });
        }
    }
    return violations;
}

module.exports = { verifierRegles };
