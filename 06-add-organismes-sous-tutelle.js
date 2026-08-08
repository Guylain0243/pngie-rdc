// ==============================================================
// Ajoute les organismes sous tutelle pour 5 ministeres
// (Finances, Sante, Agriculture, Mines, Numerique)
// Reutilise le schema EXISTANT : organization, unit, position,
// person, person_role, assignment, mission, organization_mission
// Type utilise : AGENCE (type_id=7, "Agence / Direction Generale")
//
// Usage : node 06-add-organismes-sous-tutelle.js
// A executer depuis C:\pngie-rdc\pngie-backend
// APRES que db\seed.js ait deja tourne (42 ministeres presents)
//
// CORRECTIF : verifie si le code (sigle) existe deja dans la table
// organization avant d'inserer, pour permettre de relancer le
// script sans planter sur "UNIQUE constraint failed: organization.code"
// ==============================================================

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('./src/db');

const MOT_DE_PASSE_DEFAUT = 'Organisme#2027';
const uuid = () => crypto.randomUUID();
const slugify = (s) => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const TYPE_AGENCE_ID = 7; // 'AGENCE' - Agence / Direction Generale, deja defini dans organization_type

// Nom exact des ministeres tel qu'insere par db/seed.js (colonne organization.nom)
const ORGANISMES_PAR_MINISTERE = {
    'Finances': [
        { nom: 'Direction Generale des Impots', sigle: 'DGI' },
        { nom: 'Direction Generale des Douanes et Accises', sigle: 'DGDA' },
        { nom: 'Direction Generale des Recettes Administratives, Judiciaires, Domaniales et de Participations', sigle: 'DGRAD' },
        { nom: 'Tresor Public', sigle: 'TP' },
        { nom: 'Direction de la Dette Publique', sigle: 'DDP' },
        { nom: 'Cellule Nationale des Renseignements Financiers', sigle: 'CENAREF' }
    ],
    'Santé publique, Hygiène et Prévention': [
        { nom: 'Programme National de Lutte contre le Paludisme', sigle: 'PNLP' },
        { nom: 'Programme Elargi de Vaccination', sigle: 'PEV' },
        { nom: 'Programme National de Lutte contre le VIH/SIDA', sigle: 'PNLS' },
        { nom: 'Institut National de Sante Publique', sigle: 'INSP' },
        { nom: 'Laboratoires Nationaux', sigle: 'LABO-NAT' },
        { nom: 'Hopitaux Nationaux', sigle: 'HN' }
    ],
    'Agriculture et Sécurité alimentaire': [
        { nom: 'Institut National pour l\'Etude et la Recherche Agronomiques', sigle: 'INERA' },
        { nom: 'Services Agricoles', sigle: 'SA' },
        { nom: 'Centres Semenciers', sigle: 'CS' },
        { nom: 'Offices Agricoles', sigle: 'OA' }
    ],
    'Mines': [
        { nom: 'Cadastre Minier', sigle: 'CAMI' },
        { nom: 'Service d\'Assistance et d\'Encadrement de l\'Exploitation Miniere Artisanale et a Petite Echelle', sigle: 'SAEMAPE' },
        { nom: 'Centre d\'Expertise, d\'Evaluation et de Certification', sigle: 'CEEC' },
        { nom: 'Services Geologiques', sigle: 'SG' }
    ],
    'Économie numérique': [
        { nom: 'Centre National de Donnees', sigle: 'CND' },
        { nom: 'CERT National', sigle: 'CERT-RDC' },
        { nom: 'Autorite de Certification Electronique', sigle: 'ACE' },
        { nom: 'Centre National de Cybersecurite', sigle: 'CNC' }
    ]
};

async function trouverRoleId(code) {
    const row = await db.get('SELECT role_id FROM role WHERE code = ?', [code]);
    if (!row) throw new Error(`Role introuvable : ${code} (le seed.js doit avoir tourne avant ce script)`);
    return row.role_id;
}

async function trouverMinistere(nom) {
    const row = await db.get(
        'SELECT organization_id, niveau FROM organization WHERE nom = ? AND type_id = 4',
        [nom]
    );
    return row || null;
}

async function creerOrganisme(nom, sigle, parentId, parentNiveau, roleId) {
    const existant = await db.get(
        `SELECT organization_id FROM organization WHERE code = ?`,
        [sigle]
    );
    if (existant) {
        console.log(`    (i) ${nom} (${sigle}) existe deja - ignore`);
        return null;
    }

    const orgId = uuid();
    await db.run(
        `INSERT INTO organization (organization_id, code, nom, type_id, parent_id, niveau, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orgId, sigle, nom, TYPE_AGENCE_ID, parentId, parentNiveau + 1, `Organisme sous tutelle - ${sigle}`]
    );

    const unitId = uuid();
    await db.run(
        `INSERT INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [unitId, orgId, null, 'DIR', 'Direction / Cabinet', 'Cabinet', 1]
    );
    const posId = uuid();
    await db.run(
        `INSERT INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [posId, unitId, `Directeur General - ${sigle}`, 2, roleId, 'decisionnelle']
    );

    const personId = uuid();
    const pwdHash = await bcrypt.hash(MOT_DE_PASSE_DEFAUT, 12);
    const email = `${slugify(sigle).slice(0, 30)}@rdc.gouv.cd`;
    await db.run(
        `INSERT INTO person (person_id, nom, email, password_hash) VALUES (?, ?, ?, ?)`,
        [personId, `Demo ${sigle}`, email, pwdHash]
    );
    await db.run(
        `INSERT INTO person_role (person_role_id, person_id, role_id, scope_org_id) VALUES (?, ?, ?, ?)`,
        [uuid(), personId, roleId, orgId]
    );
    await db.run(
        `INSERT INTO assignment (assignment_id, person_id, position_id, date_debut, statut) VALUES (?, ?, ?, CURRENT_DATE, 'ACTIF')`,
        [uuid(), personId, posId]
    );

    const missionId = uuid();
    await db.run(
        `INSERT INTO mission (mission_id, libelle) VALUES (?, ?)`,
        [missionId, `Mission de ${nom}`]
    );
    await db.run(
        `INSERT INTO organization_mission (organization_id, mission_id) VALUES (?, ?)`,
        [orgId, missionId]
    );

    return email;
}

async function main() {
    const roleId = await trouverRoleId('MI');
    let totalCrees = 0;
    let totalIgnores = 0;

    for (const [nomMinistere, organismes] of Object.entries(ORGANISMES_PAR_MINISTERE)) {
        const ministere = await trouverMinistere(nomMinistere);
        if (!ministere) {
            console.warn(`ATTENTION : ministere introuvable dans la base : "${nomMinistere}" - organismes ignores.`);
            continue;
        }

        console.log(`\n${nomMinistere} (id: ${ministere.organization_id})`);
        for (const org of organismes) {
            const email = await creerOrganisme(
                org.nom, org.sigle, ministere.organization_id, ministere.niveau, roleId
            );
            if (email) {
                console.log(`    +-- ${org.nom} (${org.sigle}) -> ${email}`);
                totalCrees++;
            } else {
                totalIgnores++;
            }
        }
    }

    console.log(`\nOK - ${totalCrees} organisme(s) sous tutelle cree(s).`);
    if (totalIgnores > 0) {
        console.log(`(i) ${totalIgnores} organisme(s) deja existant(s) - ignore(s).`);
    }
    console.log(`Mot de passe pour ces nouveaux comptes : ${MOT_DE_PASSE_DEFAUT}`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('ERREUR :', err.message);
        process.exit(1);
    });
