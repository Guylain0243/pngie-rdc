const crypto = require('crypto');
const db = require('./src/db');
const uuid = () => crypto.randomUUID();

async function creerEntite(nomTable, libelle, pkColumn) {
    const existant = await db.get('SELECT entity_id FROM meta_entity WHERE nom_table = ?', [nomTable]);
    if (existant) {
        console.log(`(i) Entite "${libelle}" existe deja - ignoree`);
        return existant.entity_id;
    }
    const id = uuid();
    await db.run(
        `INSERT INTO meta_entity (entity_id, nom_table, pk_column, libelle) VALUES (?, ?, ?, ?)`,
        [id, nomTable, pkColumn, libelle]
    );
    console.log(`+-- Entite "${libelle}" creee (table cible: ${nomTable})`);
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

const CHAMPS = [
    ['Type de relation', 'type_relation', 'TEXT', 100, true, false, null],
    ['Objet de la relation', 'objet', 'TEXT', null, true, false, null],
    ['Date de debut', 'date_debut', 'TEXT', null, false, false, null],
    ['Date de fin', 'date_fin', 'TEXT', null, false, false, null],
    ['Statut', 'statut', 'TEXT', 20, true, false, 'ACTIVE'],
];

async function main() {
    const entityId = await creerEntite('relations', 'Relation Inter-Institutionnelle', 'relations_id');
    let ordre = 1;
    for (const [nomChamp, colonne, type, longueur, obligatoire, unique_, defaut] of CHAMPS) {
        await creerAttribut(entityId, nomChamp, colonne, type, longueur, obligatoire, unique_, defaut, ordre++);
    }
    console.log('\nOK - entite "relations" decrite en metadonnees.');
    console.log('Prochaine etape : node government-builder.js relations');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
