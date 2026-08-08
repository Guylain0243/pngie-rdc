// ==============================================================
// PILOTE Government Meta Platform - Moteur de WORKFLOW
//
// Cree la table meta_workflow_transition : les transitions d'etat
// valides pour une entite sont DECRITES en donnees, pas codees en dur.
// Toute transition non enumeree ici est REFUSEE par defaut.
//
// Complementaire (pas redondant) avec le moteur de regles :
// - meta_rule bloque des actions selon l'etat ACTUEL (ex: "PAYEE => plus modifiable du tout")
// - meta_workflow_transition bloque les CHANGEMENTS D'ETAT non prevus
//   (ex: empecher de sauter direct de BROUILLON a PAYEE)
//
// Usage : node 17-create-workflow-engine.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09-10-11-13-14-15-16
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');

async function main() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS meta_workflow_transition (
            transition_id TEXT PRIMARY KEY,
            entity TEXT NOT NULL,
            from_statut TEXT NOT NULL,
            to_statut TEXT NOT NULL,
            role_code_requis TEXT,
            statut TEXT DEFAULT 'ACTIF',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_transition_entity ON meta_workflow_transition(entity, from_statut, to_statut)`);
    console.log('OK - Table meta_workflow_transition creee (ou deja existante).');

    // Cycle de vie de demo pour Facture : BROUILLON -> EMISE -> PAYEE (ou EMISE -> ANNULEE)
    // Aucune transition directe BROUILLON -> PAYEE : elle sera donc refusee.
    const transitions = [
        ['facture', 'BROUILLON', 'EMISE', null],
        ['facture', 'EMISE', 'PAYEE', null],
        ['facture', 'EMISE', 'ANNULEE', null]
    ];

    for (const [entity, from, to, role] of transitions) {
        const existante = await db.get(
            'SELECT transition_id FROM meta_workflow_transition WHERE entity = ? AND from_statut = ? AND to_statut = ?',
            [entity, from, to]
        );
        if (existante) {
            console.log(`(i) Transition ${entity} ${from}->${to} existe deja - ignoree`);
            continue;
        }
        await db.run(
            `INSERT INTO meta_workflow_transition (transition_id, entity, from_statut, to_statut, role_code_requis)
             VALUES (?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), entity, from, to, role]
        );
        console.log(`+-- Transition autorisee : ${entity} ${from} -> ${to}`);
    }

    console.log('\nOK - Cycle de vie de "facture" enregistre.');
    console.log('Rappel : BROUILLON -> PAYEE directement N\'EST PAS defini, donc sera refuse.');
    console.log('\nProchaine etape : node government-builder.js facture (regenere avec workflow branche)');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
