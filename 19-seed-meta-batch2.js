// ==============================================================
// TEST DE GENERALISATION - Batch 2 : 5 entites metier, 5 domaines
// (Mines, Sante, Justice, Cybersecurite, Finances)
//
// Objectif : verifier que le socle meta_entity/meta_attribute et le
// Government Builder fonctionnent pour AUTRE CHOSE que "Facture",
// sans modifier une seule ligne des moteurs generiques.
//
// Usage : node 19-seed-meta-batch2.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09-18
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
        `INSERT INTO meta_entity (entity_id, nom, nom_table, categorie, description, module, pk_column, origine)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'GENERE')`,
        [id, nom, nomTable, categorie, description, module, `${nomTable}_id`]
    );
    console.log(`+-- Entite "${nom}" creee (table cible: ${nomTable})`);
    return id;
}

async function creerAttribut(entityId, nom, nomColonne, type, longueur, obligatoire, unique_, defaut, ordre) {
    const existant = await db.get(
        'SELECT attribute_id FROM meta_attribute WHERE entity_id = ? AND nom_colonne = ?',
        [entityId, nomColonne]
    );
    if (existant) return;
    await db.run(
        `INSERT INTO meta_attribute (attribute_id, entity_id, nom, nom_colonne, type, longueur, obligatoire, unique_flag, valeur_defaut, ordre)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), entityId, nom, nomColonne, type, longueur || null, obligatoire ? 1 : 0, unique_ ? 1 : 0, defaut || null, ordre]
    );
    console.log(`    +-- champ "${nom}" (${nomColonne} : ${type}) ajoute`);
}

async function main() {
    // --- 1) Permis Minier (domaine Mines) ---
    const eMinier = await creerEntite('Permis Minier', 'permis_minier', 'Mines',
        'Demande de permis d\'exploitation ou de prospection miniere', 'Mines');
    await creerAttribut(eMinier, 'Entreprise demandeuse', 'entreprise', 'TEXT', 200, true, false, null, 1);
    await creerAttribut(eMinier, 'Substance visee', 'substance', 'TEXT', 100, true, false, null, 2);
    await creerAttribut(eMinier, 'Localisation du site', 'localisation', 'TEXT', 200, true, false, null, 3);
    await creerAttribut(eMinier, 'Justification', 'justification', 'TEXT', null, false, false, null, 4);
    await creerAttribut(eMinier, 'Statut', 'statut', 'TEXT', 20, true, false, 'BROUILLON', 5);

    // --- 2) Signalement Sanitaire (domaine Sante) ---
    const eSante = await creerEntite('Signalement Sanitaire', 'signalement_sanitaire', 'Sante',
        'Alerte sanitaire remontee par un etablissement de sante', 'Sante');
    await creerAttribut(eSante, 'Etablissement concerne', 'etablissement', 'TEXT', 200, true, false, null, 1);
    await creerAttribut(eSante, 'Type d\'alerte', 'type_alerte', 'TEXT', 50, true, false, null, 2);
    await creerAttribut(eSante, 'Description', 'description', 'TEXT', null, true, false, null, 3);
    await creerAttribut(eSante, 'Date du constat', 'date_constat', 'DATE', null, true, false, null, 4);
    await creerAttribut(eSante, 'Statut', 'statut', 'TEXT', 20, true, false, 'SIGNALE', 5);

    // --- 3) Dossier Judiciaire (domaine Justice) ---
    const eJustice = await creerEntite('Dossier Judiciaire', 'dossier_judiciaire', 'Justice',
        'Ouverture et suivi d\'un dossier judiciaire', 'Justice');
    await creerAttribut(eJustice, 'Tribunal competent', 'tribunal', 'TEXT', 150, true, false, null, 1);
    await creerAttribut(eJustice, 'Nature du dossier', 'nature', 'TEXT', 50, true, false, null, 2);
    await creerAttribut(eJustice, 'Objet de la saisine', 'objet', 'TEXT', null, true, false, null, 3);
    await creerAttribut(eJustice, 'Statut', 'statut', 'TEXT', 20, true, false, 'OUVERT', 4);

    // --- 4) Demande de Certificat PKI (domaine Cybersecurite) ---
    const ePki = await creerEntite('Demande Certificat PKI', 'certificat_pki', 'Cybersecurite',
        'Demande d\'emission d\'un certificat PKI pour un agent', 'Cybersecurite');
    await creerAttribut(ePki, 'Agent concerne', 'agent_concerne', 'TEXT', 200, true, false, null, 1);
    await creerAttribut(ePki, 'Usage prevu', 'usage', 'TEXT', 50, true, false, null, 2);
    await creerAttribut(ePki, 'Duree de validite', 'duree', 'TEXT', 20, true, false, null, 3);
    await creerAttribut(ePki, 'Statut', 'statut', 'TEXT', 20, true, false, 'DEMANDE', 4);

    // --- 5) Dossier de Recouvrement DGI (domaine Finances) ---
    const eRecouv = await creerEntite('Dossier Recouvrement DGI', 'dossier_recouvrement', 'Finances',
        'Dossier de recouvrement fiscal suivi par la DGI', 'Finances');
    await creerAttribut(eRecouv, 'Contribuable', 'contribuable', 'TEXT', 200, true, false, null, 1);
    await creerAttribut(eRecouv, 'Montant du', 'montant_du', 'DECIMAL', null, true, false, '0', 2);
    await creerAttribut(eRecouv, 'Province', 'province', 'TEXT', 100, true, false, null, 3);
    await creerAttribut(eRecouv, 'Statut', 'statut', 'TEXT', 20, true, false, 'OUVERT', 4);

    console.log('\nOK - 5 entites metier decrites en metadonnees (5 domaines differents).');
    console.log('Prochaine etape : node 20-seed-workflow-batch2.js');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
