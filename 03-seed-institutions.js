// ============================================================
// Peuple la table institutions avec 5 ministeres et leurs
// organismes sous tutelle, + un compte de connexion par organisme
// Usage : node 03-seed-institutions.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 02-apply-migration.js
// ============================================================

const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'db', 'pngie.db');
const MOT_DE_PASSE_DEFAUT = 'Organisme#2027';

const db = new Database(DB_PATH);

// --- Hachage de mot de passe (scrypt, natif Node, pas de dependance) ---
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { hash, salt };
}

const insertInstitution = db.prepare(`
    INSERT INTO institutions (nom, sigle, type, parent_id, ministere_racine_id, mission)
    VALUES (@nom, @sigle, @type, @parent_id, @ministere_racine_id, @mission)
`);

const insertCompte = db.prepare(`
    INSERT INTO comptes_institution (institution_id, identifiant, mot_de_passe_hash, salt, role)
    VALUES (@institution_id, @identifiant, @mot_de_passe_hash, @salt, @role)
`);

function creerInstitution({ nom, sigle, type, parentId, ministereRacineId, mission }) {
    const info = insertInstitution.run({
        nom,
        sigle: sigle || null,
        type,
        parent_id: parentId || null,
        ministere_racine_id: ministereRacineId || null,
        mission: mission || null
    });
    return info.lastInsertRowid;
}

function creerCompte(institutionId, identifiant, role = 'organisme') {
    const { hash, salt } = hashPassword(MOT_DE_PASSE_DEFAUT);
    insertCompte.run({
        institution_id: institutionId,
        identifiant,
        mot_de_passe_hash: hash,
        salt,
        role
    });
}

// --- Definition des 5 ministeres et de leurs organismes ---
const MINISTERES = [
    {
        nom: 'Ministere des Finances',
        sigle: 'MIN-FIN',
        identifiant: 'finances@rdc.gouv.cd',
        mission: 'Mobilisation des recettes, gestion de la tresorerie, comptabilite publique, dette publique, paiement des depenses, controle financier.',
        organismes: [
            { nom: 'Direction Generale des Impots', sigle: 'DGI', type: 'direction_generale', identifiant: 'dgi@rdc.gouv.cd' },
            { nom: 'Direction Generale des Douanes et Accises', sigle: 'DGDA', type: 'direction_generale', identifiant: 'dgda@rdc.gouv.cd' },
            { nom: 'Direction Generale des Recettes Administratives, Judiciaires, Domaniales et de Participations', sigle: 'DGRAD', type: 'direction_generale', identifiant: 'dgrad@rdc.gouv.cd' },
            { nom: 'Tresor Public', sigle: 'TP', type: 'direction_generale', identifiant: 'tresor@rdc.gouv.cd' },
            { nom: 'Direction de la Dette Publique', sigle: 'DDP', type: 'direction', identifiant: 'dette-publique@rdc.gouv.cd' },
            { nom: 'Cellule Nationale des Renseignements Financiers', sigle: 'CENAREF', type: 'agence_nationale', identifiant: 'cenaref@rdc.gouv.cd' }
        ]
    },
    {
        nom: 'Ministere de la Sante',
        sigle: 'MIN-SANTE',
        identifiant: 'sante@rdc.gouv.cd',
        mission: 'Soins, prevention, vaccination, surveillance epidemiologique, gestion pharmaceutique, sante numerique.',
        organismes: [
            { nom: 'Programme National de Lutte contre le Paludisme', sigle: 'PNLP', type: 'programme_national', identifiant: 'pnlp@rdc.gouv.cd' },
            { nom: 'Programme Elargi de Vaccination', sigle: 'PEV', type: 'programme_national', identifiant: 'pev@rdc.gouv.cd' },
            { nom: 'Programme National de Lutte contre le VIH/SIDA', sigle: 'PNLS', type: 'programme_national', identifiant: 'pnls@rdc.gouv.cd' },
            { nom: 'Institut National de Sante Publique', sigle: 'INSP', type: 'etablissement_public', identifiant: 'insp@rdc.gouv.cd' },
            { nom: 'Laboratoires Nationaux', sigle: 'LABO-NAT', type: 'laboratoire', identifiant: 'labo-national@rdc.gouv.cd' },
            { nom: 'Hopitaux Nationaux', sigle: 'HN', type: 'hopital_centre_hospitalier', identifiant: 'hopitaux-nationaux@rdc.gouv.cd' }
        ]
    },
    {
        nom: 'Ministere de l\'Agriculture',
        sigle: 'MIN-AGRI',
        identifiant: 'agriculture@rdc.gouv.cd',
        mission: 'Production, recherche, encadrement, vulgarisation, irrigation, securite alimentaire.',
        organismes: [
            { nom: 'Institut National pour l\'Etude et la Recherche Agronomiques', sigle: 'INERA', type: 'etablissement_public', identifiant: 'inera@rdc.gouv.cd' },
            { nom: 'Services Agricoles', sigle: 'SA', type: 'service', identifiant: 'services-agricoles@rdc.gouv.cd' },
            { nom: 'Centres Semenciers', sigle: 'CS', type: 'etablissement_public', identifiant: 'centres-semenciers@rdc.gouv.cd' },
            { nom: 'Offices Agricoles', sigle: 'OA', type: 'office_national', identifiant: 'offices-agricoles@rdc.gouv.cd' }
        ]
    },
    {
        nom: 'Ministere des Mines',
        sigle: 'MIN-MINES',
        identifiant: 'mines@rdc.gouv.cd',
        mission: 'Permis miniers, controle, certification, tracabilite, inspection, fiscalite miniere.',
        organismes: [
            { nom: 'Cadastre Minier', sigle: 'CAMI', type: 'etablissement_public', identifiant: 'cami@rdc.gouv.cd' },
            { nom: 'Service d\'Assistance et d\'Encadrement de l\'Exploitation Miniere Artisanale et a Petite Echelle', sigle: 'SAEMAPE', type: 'service', identifiant: 'saemape@rdc.gouv.cd' },
            { nom: 'Centre d\'Expertise, d\'Evaluation et de Certification', sigle: 'CEEC', type: 'etablissement_public', identifiant: 'ceec@rdc.gouv.cd' },
            { nom: 'Services Geologiques', sigle: 'SG', type: 'service', identifiant: 'services-geologiques@rdc.gouv.cd' }
        ]
    },
    {
        nom: 'Ministere du Numerique',
        sigle: 'MIN-NUM',
        identifiant: 'numerique@rdc.gouv.cd',
        mission: 'Cloud gouvernemental, identite numerique, interoperabilite, cybersecurite, intelligence artificielle, donnees publiques, archivage electronique.',
        organismes: [
            { nom: 'Centre National de Donnees', sigle: 'CND', type: 'etablissement_public', identifiant: 'cnd@rdc.gouv.cd' },
            { nom: 'CERT National', sigle: 'CERT-RDC', type: 'autorite_regulation', identifiant: 'cert@rdc.gouv.cd' },
            { nom: 'Autorite de Certification Electronique', sigle: 'ACE', type: 'autorite_regulation', identifiant: 'ace@rdc.gouv.cd' },
            { nom: 'Centre National de Cybersecurite', sigle: 'CNC', type: 'etablissement_public', identifiant: 'cybersecurite@rdc.gouv.cd' }
        ]
    }
];

const dejaExistant = db.prepare('SELECT COUNT(*) AS n FROM institutions').get();
if (dejaExistant.n > 0) {
    console.log('ATTENTION : la table institutions contient deja ' + dejaExistant.n + ' ligne(s).');
    console.log('Ce script va ajouter de nouvelles lignes sans supprimer les existantes.');
}

const transaction = db.transaction(() => {
    for (const ministere of MINISTERES) {
        const ministereId = creerInstitution({
            nom: ministere.nom,
            sigle: ministere.sigle,
            type: 'ministere',
            parentId: null,
            ministereRacineId: null,
            mission: ministere.mission
        });
        // Un ministere est sa propre racine
        db.prepare('UPDATE institutions SET ministere_racine_id = ? WHERE id = ?').run(ministereId, ministereId);
        creerCompte(ministereId, ministere.identifiant, 'ministere');

        console.log('Cree : ' + ministere.nom + ' (' + ministere.sigle + ') -> ' + ministere.identifiant);

        for (const organisme of ministere.organismes) {
            const organismeId = creerInstitution({
                nom: organisme.nom,
                sigle: organisme.sigle,
                type: organisme.type,
                parentId: ministereId,
                ministereRacineId: ministereId,
                mission: null
            });
            creerCompte(organismeId, organisme.identifiant, 'organisme');
            console.log('   +-- ' + organisme.nom + ' (' + organisme.sigle + ') -> ' + organisme.identifiant);
        }
    }
});

try {
    transaction();
    console.log('');
    console.log('OK - Seed termine avec succes.');
    console.log('Mot de passe par defaut pour tous les nouveaux comptes : ' + MOT_DE_PASSE_DEFAUT);
    console.log('(A faire changer par chaque organisme des la premiere connexion, en production.)');
} catch (err) {
    console.error('ERREUR pendant le seed :', err.message);
    process.exit(1);
} finally {
    db.close();
}
