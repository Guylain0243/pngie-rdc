// ==============================================================
// PILOTE Government Meta Platform - Moteur de REGLES METIER
//
// Cree la table meta_rule : les regles metier sont DECRITES en donnees
// (condition + message d'erreur), pas codees en dur dans les routes.
// Le moteur (src/rule-engine.js) les evalue au moment de l'execution.
//
// Format d'une condition (JSON) :
//   [{ "champ": "statut", "source": "existant", "operateur": "=", "valeur": "PAYEE" }]
// Plusieurs conditions dans le tableau = toutes doivent etre vraies (ET)
// pour que la regle bloque l'action.
//
// source: "existant" = valeur actuelle en base avant modification
//         "nouveau"  = valeur envoyee dans la requete
//
// Usage : node 13-create-rule-engine.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09-10-11
// ==============================================================

const db = require('./src/db');

async function main() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS meta_rule (
            rule_id TEXT PRIMARY KEY,
            entity TEXT NOT NULL,
            nom TEXT NOT NULL,
            description TEXT,
            evenement TEXT NOT NULL,
            condition_json TEXT NOT NULL,
            message_erreur TEXT NOT NULL,
            statut TEXT DEFAULT 'ACTIF',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_rule_entity_event ON meta_rule(entity, evenement, statut)`);

    console.log('OK - Table meta_rule creee (ou deja existante).');
    console.log('Prochaine etape : node 14-demo-regle-facture-payee.js');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
