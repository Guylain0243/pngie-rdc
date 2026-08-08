// ==============================================================
// DEMO du moteur de relations : Facture -> emise_par -> Organisation
//
// Cree une relation entre une facture existante (creee via l'API
// generee a l'etape precedente) et une organisation reelle deja
// en base (ex: le ministere des Finances).
//
// Usage : node 12-demo-relation-facture-organisation.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 11
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');

async function main() {
    // 1) Recuperer (ou creer) une facture de test
    let facture = await db.get('SELECT * FROM facture LIMIT 1');
    if (!facture) {
        const id = crypto.randomUUID();
        await db.run(
            `INSERT INTO facture (facture_id, numero, fournisseur, montant, devise, date_emission, statut)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, 'F-DEMO-001', 'Demo Fournisseur', 1000, 'USD', '2027-01-01', 'BROUILLON']
        );
        facture = await db.get('SELECT * FROM facture WHERE facture_id = ?', [id]);
        console.log(`(+) Facture de demo creee : ${facture.numero}`);
    } else {
        console.log(`(i) Facture existante reutilisee : ${facture.numero}`);
    }

    // 2) Recuperer une organisation reelle (ministere des Finances)
    const organisation = await db.get(
        `SELECT * FROM organization WHERE nom = 'Finances' AND type_id = 4`
    );
    if (!organisation) {
        console.error('ERREUR : organisation "Finances" introuvable. db/seed.js a-t-il bien tourne ?');
        process.exitCode = 1;
        return;
    }
    console.log(`(i) Organisation cible : ${organisation.nom} (${organisation.organization_id})`);

    // 3) Verifier si la relation existe deja (idempotent)
    const existante = await db.get(
        `SELECT * FROM entity_relation
         WHERE source_entity = 'facture' AND source_id = ? AND relation = 'emise_par'
           AND target_entity = 'organization' AND target_id = ? AND date_fin IS NULL`,
        [facture.facture_id, organisation.organization_id]
    );
    if (existante) {
        console.log('\n(i) Relation deja existante - rien a faire.');
    } else {
        const relationId = crypto.randomUUID();
        await db.run(
            `INSERT INTO entity_relation (relation_id, source_entity, source_id, relation, target_entity, target_id)
             VALUES (?, 'facture', ?, 'emise_par', 'organization', ?)`,
            [relationId, facture.facture_id, organisation.organization_id]
        );
        console.log(`\nOK - Relation creee : Facture(${facture.numero}) -- emise_par --> Organisation(${organisation.nom})`);
    }

    // 4) Verification : relire la relation via le "graphe"
    const relations = await db.all(
        `SELECT * FROM entity_relation WHERE source_entity = 'facture' AND source_id = ?`,
        [facture.facture_id]
    );
    console.log(`\n--- Relations sortantes de la facture ${facture.numero} ---`);
    relations.forEach(r => console.log(`  ${r.source_entity}(${r.source_id}) --${r.relation}--> ${r.target_entity}(${r.target_id})`));
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
