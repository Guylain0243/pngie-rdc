// ============================================================================
// PNGIE-RDC — Module d'audit chaîné par hash SHA-256
// Patron "PNGIE Secure API v1" — bloc E
//
// Extraction FIDÈLE de la fonction audit() historique de server.js.
// AUCUN changement de comportement : même calcul de hashPrec, même payload
// JSON, même algorithme SHA-256, même requête d'insertion. Objectif : une
// seule implémentation partagée entre server.js et les routeurs métier
// (dont rni-commandement-routes.js), garantissant la continuité stricte de
// la chaîne d'audit déjà en place.
//
// Usage :
//   const audit = require('../lib/audit');
//   await audit(personneId, 'ACTION_SUCCESS', 'rni_instruction', instructionId, { ... });
// ============================================================================

const crypto = require('crypto');
const db = require('../db');

async function audit(personId, action, entite, entiteId, detail) {
    const last = await db.get('SELECT hash_actuel FROM audit_log ORDER BY log_id DESC LIMIT 1');
    const hashPrec = last ? last.hash_actuel : '0'.repeat(64);
    const payload = JSON.stringify({ personId, action, entite, entiteId, detail, hashPrec, t: Date.now() });
    const hashActuel = crypto.createHash('sha256').update(payload).digest('hex');
    await db.run(
        `INSERT INTO audit_log (person_id,action,entite,entite_id,detail,hash_prec,hash_actuel) VALUES (?,?,?,?,?,?,?)`,
        [personId, action, entite, entiteId, JSON.stringify(detail || {}), hashPrec, hashActuel]
    );
}

module.exports = audit;