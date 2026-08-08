// ==============================================================
// PILOTE Government Meta Platform - Moteur de RELATIONS
//
// Cree la table generique entity_relation (equivalent ENTITY_RELATION
// du document de reference) : elle capture les liens transverses entre
// N'IMPORTE QUELS objets (Facture -> Organisation, Budget -> Projet, etc.)
// sans creer de nouvelle cle etrangere SQL a chaque fois.
//
// IMPORTANT : ce moteur s'AJOUTE aux cles etrangeres existantes, il ne
// les remplace pas. Les tables "classiques" (organization, position...)
// gardent leurs FK normales. entity_relation sert uniquement pour les
// liens transverses qui n'ont pas de FK dediee.
//
// Garde-fou : on ne peut creer une relation qu'entre des entites
// enregistrees dans meta_entity (avec leur cle primaire declaree),
// pour eviter de pointer vers des tables ou ID inexistants.
//
// Usage : node 11-create-relation-engine.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09 et 10
// ==============================================================

const db = require('./src/db');

async function ensureColumn(table, colDef) {
    try {
        await db.run(`ALTER TABLE ${table} ADD COLUMN ${colDef}`);
        console.log(`    (+) colonne ajoutee : ${colDef}`);
    } catch (err) {
        // La colonne existe deja tres probablement - on ignore silencieusement
    }
}

async function enregistrerEntite(nom, nomTable, pkColumn, origine, categorie, description, module) {
    const existant = await db.get('SELECT entity_id FROM meta_entity WHERE nom_table = ?', [nomTable]);
    if (existant) {
        await db.run(
            `UPDATE meta_entity SET pk_column = ?, origine = ? WHERE nom_table = ?`,
            [pkColumn, origine, nomTable]
        );
        console.log(`(i) Entite "${nom}" deja enregistree - pk_column/origine mis a jour`);
        return;
    }
    const crypto = require('crypto');
    await db.run(
        `INSERT INTO meta_entity (entity_id, nom, nom_table, categorie, description, module, pk_column, origine)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [crypto.randomUUID(), nom, nomTable, categorie, description, module, pkColumn, origine]
    );
    console.log(`+-- Entite "${nom}" enregistree (table: ${nomTable}, pk: ${pkColumn}, origine: ${origine})`);
}

async function main() {
    console.log('=== Etape 1 : extension du schema meta_entity ===\n');
    await ensureColumn('meta_entity', 'pk_column TEXT');
    await ensureColumn('meta_entity', "origine TEXT DEFAULT 'GENERE'");

    console.log('\n=== Etape 2 : creation de la table entity_relation ===\n');
    await db.run(`
        CREATE TABLE IF NOT EXISTS entity_relation (
            relation_id TEXT PRIMARY KEY,
            source_entity TEXT NOT NULL,
            source_id TEXT NOT NULL,
            relation TEXT NOT NULL,
            target_entity TEXT NOT NULL,
            target_id TEXT NOT NULL,
            date_debut TEXT DEFAULT CURRENT_TIMESTAMP,
            date_fin TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_relation_source ON entity_relation(source_entity, source_id)`);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_relation_target ON entity_relation(target_entity, target_id)`);
    console.log('OK - Table entity_relation creee (avec index source/target).');

    console.log('\n=== Etape 3 : enregistrement des entites existantes ===\n');

    // Facture : deja creee par 10-seed-meta-facture.js + government-builder.js
    await enregistrerEntite(
        'Facture', 'facture', 'facture_id', 'GENERE',
        'Finances', 'Facture pilote generee par le Government Builder', 'Finances'
    );

    // Organisation : table NATIVE deja peuplee par db/seed.js (122 lignes)
    await enregistrerEntite(
        'Organisation', 'organization', 'organization_id', 'NATIF',
        'Organisationnel', 'Institutions, ministeres, provinces, organismes sous tutelle', 'Organisationnel'
    );

    console.log('\nOK - Moteur de relations pret.');
    console.log('Prochaine etape : node 12-demo-relation-facture-organisation.js');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
