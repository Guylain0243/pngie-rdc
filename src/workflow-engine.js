// ==============================================================
// MOTEUR DE WORKFLOW - module reutilisable, generique pour toutes les entites
// Politique : REFUS PAR DEFAUT (toute transition non enumeree est refusee).
// ==============================================================

const db = require('./db');

/**
 * Verifie si le passage de fromStatut a toStatut est autorise pour cette entite.
 * Retourne { autorise: boolean, message?: string }
 */
async function verifierTransition(entity, fromStatut, toStatut, roleCode) {
    if (fromStatut === toStatut) {
        return { autorise: true }; // pas de changement d'etat, rien a verifier
    }

    const transition = await db.get(
        `SELECT * FROM meta_workflow_transition
         WHERE entite = ? AND from_statut = ? AND to_statut = ? AND statut = 'ACTIF'`,
        [entity, fromStatut, toStatut]
    );

    if (!transition) {
        return {
            autorise: false,
            message: `Transition non autorisee : "${fromStatut}" -> "${toStatut}" n'est pas un changement d'etat valide pour "${entity}".`
        };
    }

    if (transition.role_code_requis && transition.role_code_requis !== roleCode) {
        return {
            autorise: false,
            message: `Transition "${fromStatut}" -> "${toStatut}" reservee au role "${transition.role_code_requis}".`
        };
    }

    return { autorise: true };
}

module.exports = { verifierTransition };

