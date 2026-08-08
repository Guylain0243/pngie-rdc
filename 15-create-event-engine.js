// ==============================================================
// PILOTE Government Meta Platform - Moteur d'EVENEMENTS
//
// Cree la table entity_event : chaque creation/modification/suppression
// sur une entite generee (ex: facture) y est enregistree automatiquement,
// avec un snapshot complet AVANT et APRES (pour tout reconstituer plus tard).
//
// utilisateur_id est prevu des maintenant dans le schema (pour eviter une
// migration future) mais reste NULL tant qu'aucune authentification n'est
// branchee sur l'API generee.
//
// Usage : node 15-create-event-engine.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09-10-11-13-14
// ==============================================================

const db = require('./src/db');

async function main() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS entity_event (
            event_id TEXT PRIMARY KEY,
            entity TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            evenement TEXT NOT NULL,
            donnees_avant TEXT,
            donnees_apres TEXT,
            utilisateur_id TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_event_entity ON entity_event(entity, entity_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_event_date ON entity_event(created_at)`);

    console.log('OK - Table entity_event creee (ou deja existante).');
    console.log('Prochaine etape : node government-builder.js facture (regenere avec traçage automatique)');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
