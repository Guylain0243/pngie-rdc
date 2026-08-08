// ==============================================================
// PILOTE Government Meta Platform - Etape 2
// Decrit UN objet metier pilote : "Facture" (domaine Finances)
// via les tables meta_entity / meta_attribute, plutot que d'ecrire
// sa table SQL et son API a la main.
//
// C'est cette description que le Government Builder (etape 3) va
// lire pour generer automatiquement la table et l'API CRUD.
//
// Usage : node 10-seed-meta-facture.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09-create-meta-tables.js
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');
const uuid = () => crypto.randomUUID();

async function creerEntite(nom, nomTable, categorie, description, module) {
    const existant = await db.get('SELECT entity_id FROM meta_entity WHERE nom_table = ?', [nomTable]);
    if (existant) {
        console.log(`(i) Entite "${nom}" existe deja - ignoree`);
        return existant.entity_id;
    }
    const id = uuid();
    await db.run(
        `INSERT INTO meta_entity (entity_id, nom, nom_table, categorie, description, module)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, nom, nomTable, categorie, description, module]
    );
    console.log(`+-- Entite "${nom}" creee (table cible: ${nomTable})`);
    return id;
}

async function creerAttribut(entityId, nom, nomColonne, type, longueur, obligatoire, unique_, defaut, ordre) {
    const existant = await db.get(
        'SELECT attribute_id FROM meta_attribute WHERE entity_id = ? AND nom_colonne = ?',
        [entityId, nomColonne]
    );
    if (existant) {
        console.log(`    (i) champ "${nom}" existe deja - ignore`);
        return;
    }
    await db.run(
        `INSERT INTO meta_attribute (attribute_id, entity_id, nom, nom_colonne, type, longueur, obligatoire, unique_flag, valeur_defaut, ordre)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), entityId, nom, nomColonne, type, longueur || null, obligatoire ? 1 : 0, unique_ ? 1 : 0, defaut || null, ordre]
    );
    console.log(`    +-- champ "${nom}" (${nomColonne} : ${type}) ajoute`);
}

async function main() {
    const factureId = await creerEntite(
        'Facture', 'facture', 'Finances',
        'Facture fournisseur ou client, objet pilote du Government Meta Platform',
        'Finances'
    );

    await creerAttribut(factureId, 'Numero de facture', 'numero', 'TEXT', 50, true, true, null, 1);
    await creerAttribut(factureId, 'Fournisseur', 'fournisseur', 'TEXT', 200, true, false, null, 2);
    await creerAttribut(factureId, 'Montant', 'montant', 'DECIMAL', null, true, false, '0', 3);
    await creerAttribut(factureId, 'Devise', 'devise', 'TEXT', 3, true, false, 'CDF', 4);
    await creerAttribut(factureId, 'Date emission', 'date_emission', 'DATE', null, true, false, null, 5);
    await creerAttribut(factureId, 'Date echeance', 'date_echeance', 'DATE', null, false, false, null, 6);
    await creerAttribut(factureId, 'Statut', 'statut', 'TEXT', 20, true, false, 'BROUILLON', 7);

    console.log('\nOK - Objet metier "Facture" decrit en metadonnees.');
    console.log('Prochaine etape : node government-builder.js (genere la table + l\'API)');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
