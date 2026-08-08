// ==============================================================
// PILOTE Government Meta Platform - Etape 1
// Cree le socle minimal du meta-modele : meta_entity + meta_attribute
//
// Objectif du pilote : prouver qu'on peut DECRIRE un objet metier
// en donnees plutot que de coder sa table/API a la main, puis
// GENERER automatiquement le SQL et l'API a partir de cette description.
//
// Ce n'est PAS le Government Kernel complet (12 moteurs). C'est un
// prototype a un seul domaine, pour valider l'approche avant d'investir
// plus de temps.
//
// Usage : node 09-create-meta-tables.js
// A executer depuis C:\pngie-rdc\pngie-backend
// ==============================================================

const db = require('./src/db');

async function main() {
    // meta_entity : decrit un objet metier (ex: "Facture", "Projet"...)
    await db.run(`
        CREATE TABLE IF NOT EXISTS meta_entity (
            entity_id TEXT PRIMARY KEY,
            nom TEXT NOT NULL UNIQUE,
            nom_table TEXT NOT NULL UNIQUE,
            categorie TEXT,
            description TEXT,
            module TEXT,
            statut TEXT DEFAULT 'ACTIF',
            version INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // meta_attribute : decrit un champ d'un objet metier
    await db.run(`
        CREATE TABLE IF NOT EXISTS meta_attribute (
            attribute_id TEXT PRIMARY KEY,
            entity_id UUID NOT NULL,
            nom TEXT NOT NULL,
            nom_colonne TEXT NOT NULL,
            type TEXT NOT NULL,
            longueur INTEGER,
            obligatoire INTEGER DEFAULT 0,
            unique_flag INTEGER DEFAULT 0,
            valeur_defaut TEXT,
            ordre INTEGER DEFAULT 0,
            FOREIGN KEY (entity_id) REFERENCES meta_entity(entity_id)
        )
    `);

    console.log('OK - Tables meta_entity et meta_attribute creees (ou deja existantes).');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
