// ==============================================================
// PILOTE Government Meta Platform - Moteur de SECURITE / DROITS
//
// Cree la table meta_permission : les droits d'acces sont DECRITS en
// donnees (role_code + entite + action autorisee), pas codes en dur.
//
// POLITIQUE : REFUS PAR DEFAUT. Un role sans permission explicite pour
// une entite/action ne peut RIEN faire sur elle.
//
// IMPORTANT - point a rebrancher plus tard :
// Ce pilote lit le role de l'appelant via l'en-tete HTTP "x-role-code"
// (voir src/security-engine.js). C'est un SUBSTITUT temporaire, choisi
// parce que je n'ai pas vu le code qui verifie votre JWT reel
// (emis par /api/auth/login). Quand vous serez pret, il faudra remplacer
// la lecture de l'en-tete par le decodage du role depuis le JWT verifie
// par votre middleware d'authentification existant.
//
// Usage : node 16-create-security-engine.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09-10-11-13-14-15
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');

async function main() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS meta_permission (
            permission_id TEXT PRIMARY KEY,
            role_code TEXT NOT NULL,
            entity TEXT NOT NULL,
            action TEXT NOT NULL,
            statut TEXT DEFAULT 'ACTIF',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_permission_role_entity ON meta_permission(role_code, entity, action)`);
    console.log('OK - Table meta_permission creee (ou deja existante).');

    // Demo : le role 'MI' (deja utilise reellement chez vous pour les ministeres,
    // voir la connexion pnlp@rdc.gouv.cd testee plus tot) peut lire/creer/modifier
    // des factures, mais N'A PAS le droit de les supprimer (aucune ligne DELETE
    // enregistree = refuse par le refus-par-defaut).
    const permissions = [
        ['MI', 'facture', 'READ'],
        ['MI', 'facture', 'CREATE'],
        ['MI', 'facture', 'UPDATE']
        // Pas de ['MI', 'facture', 'DELETE'] volontairement - pour tester le refus par defaut
    ];

    for (const [roleCode, entity, action] of permissions) {
        const existante = await db.get(
            'SELECT permission_id FROM meta_permission WHERE role_code = ? AND entity = ? AND action = ?',
            [roleCode, entity, action]
        );
        if (existante) {
            console.log(`(i) Permission ${roleCode}/${entity}/${action} existe deja - ignoree`);
            continue;
        }
        await db.run(
            `INSERT INTO meta_permission (permission_id, role_code, entity, action) VALUES (?, ?, ?, ?)`,
            [crypto.randomUUID(), roleCode, entity, action]
        );
        console.log(`+-- Permission accordee : role "${roleCode}" peut "${action}" sur "${entity}"`);
    }

    console.log('\nOK - Permissions de demo enregistrees.');
    console.log('Rappel : le role "MI" n\'a PAS la permission DELETE sur "facture" (refus par defaut).');
    console.log('\nProchaine etape : node government-builder.js facture (regenere avec securite branchee)');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
