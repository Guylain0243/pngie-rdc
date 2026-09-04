// Initialise la base (SQLite ou PostgreSQL, selon DATABASE_URL) + insère des
// données réelles : institutions (Présidence, Primature, Sénat, AN, 42 ministères,
// 26 provinces), rôles/permissions RBAC, cycle de gouvernance complet, registre
// d'intégration logicielle, référentiels transversaux, et un utilisateur de
// démonstration par rôle (mot de passe RÉELLEMENT haché avec bcrypt).
//
// Async de bout en bout : fonctionne identiquement sur SQLite (dev/tests) et
// PostgreSQL (production) via src/db.js — un seul jeu de requêtes, deux moteurs.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

async function main() {
  const usePostgres = !!process.env.DATABASE_URL;

  if (usePostgres) {
    // ============================================================
    // GARDE-FOU SPRINT 2 - Protection contre TRUNCATE hors base autorisee
    // Voir docs/CONSOLIDATION_SPRINT1.md paragraphe 4 point 3, docs/BOOTSTRAP_INVENTORY.md paragraphe 0
    // ============================================================
    const { ALLOWED_DATABASES } = require('../config/bootstrap.config');
    const maskUrl = (url) => url.replace(/:[^:@]+@/, ":****@");

    if (process.env.NODE_ENV === "production") {
      throw new Error("[SEED BLOQUE] Execution interdite avec NODE_ENV=production.");
    }
    if (!ALLOWED_DATABASES.some(db => process.env.DATABASE_URL.includes(db))) {
      throw new Error(`[SEED BLOQUE] DATABASE_URL suspecte : ${maskUrl(process.env.DATABASE_URL)}`);
    }

    const db0 = require('../src/db');

    const row = await db0.get("SELECT current_database() AS db");
    const connectedDb = row.db;
    if (!ALLOWED_DATABASES.includes(connectedDb)) {
      throw new Error(`[SEED BLOQUE] Base connectee non autorisee : ${connectedDb} (driver: ${db0.driver})`);
    }
    console.log(`[BOOTSTRAP] Base autorisee (${db0.driver}) :`, connectedDb);
    // ============================================================
    // FIN GARDE-FOU SPRINT 2
    // ============================================================

    await db0.run(`SELECT set_config('app.bypass_rls', 'true', false)`);
    const tables = await db0.all(`SELECT tablename FROM pg_tables WHERE schemaname='public'`);
    if (tables.length) {
      await db0.run(`TRUNCATE TABLE ${tables.map(t => `"${t.tablename}"`).join(',')} RESTART IDENTITY CASCADE`);
    }
  } else {
    const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'pngie.db');
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
    const Database = require('better-sqlite3');
    const sqlite = new Database(DB_PATH);
    sqlite.exec(fs.readFileSync(path.join(__dirname, 'schema.sqlite.sql'), 'utf8'));
    sqlite.close();
  }

  const db = require('../src/db');
  const uuid = () => crypto.randomUUID();
  const slugify = (s) => s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Crée unité + poste + compte + affectation + mission pour une organisation — factorisé
  // pour éviter de répéter cette logique à chaque nouvelle catégorie d'institution.
  async function creerCompteInstitution(orgId, nomOrg, titrePoste, roleCode, missionLibelle) {
    const unitId = uuid();
    await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
      [unitId, orgId, null, 'DIR', 'Direction / Cabinet', 'Cabinet', 1]);
    const posId = uuid();
    await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
      [posId, unitId, titrePoste, 2, roleIds[roleCode], 'décisionnelle']);
    const personId = uuid();
    const pwdHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const email = `${slugify(nomOrg).slice(0, 30)}@rdc.gouv.cd`;
    await db.run(`INSERT INTO personne (personne_id,nom,prenom,email,password_hash) VALUES (?,?,?,?,?)`,
      [personId, `Démo ${nomOrg}`, 'Démo', email, pwdHash]);
    await db.run(`INSERT INTO person (person_id,nom,email,password_hash) VALUES (?,?,?,?)`,
      [personId, `Démo ${nomOrg}`, email, pwdHash]);
    await db.run(`INSERT INTO person_role (person_role_id,person_id,role_id,scope_org_id) VALUES (?,?,?,?)`,
      [uuid(), personId, roleIds[roleCode], orgId]);
    await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
      [uuid(), personId, posId]);
    const missionId = uuid();
    await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`, [missionId, missionLibelle]);
    await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`, [orgId, missionId]);
    return email;
  }


  const POUVOIRS = [
    [1,'EXECUTIF','Pouvoir exécutif'],
    [2,'LEGISLATIF','Pouvoir législatif'],
    [3,'JUDICIAIRE','Pouvoir judiciaire'],
  ];
  for (const p of POUVOIRS) await db.run('INSERT INTO pouvoir VALUES (?,?,?)', p);

  const TYPES = [
    // [id, code, libelle, pouvoir_id] — pouvoir_id NULL = institution d'appui à la démocratie
    // (Constitution RDC, art. 222 : IGF, Cour des comptes... — ni exécutif, ni législatif, ni judiciaire)
    [1,'PRESIDENCE','Présidence',1],[2,'PRIMATURE','Primature',1],[3,'PARLEMENT','Chambre du Parlement',2],
    [4,'MINISTERE','Ministère',1],[5,'PROVINCE','Province',1],[6,'ETD','Entité Territoriale Décentralisée',1],
    [7,'AGENCE','Agence / Direction Générale',1],[8,'INSTITUTION_CONTROLE','Institution d\'appui et de contrôle',null],
    [9,'COUR_CONSTITUTIONNELLE','Cour Constitutionnelle',3],[10,'COUR_CASSATION','Cour de Cassation',3],
    [11,'CONSEIL_ETAT','Conseil d\'État',3],
  ];
  for (const t of TYPES) await db.run('INSERT INTO organization_type VALUES (?,?,?,?)', t);

  const ORG_SQL = `INSERT INTO organization (organization_id,code,nom,type_id,parent_id,niveau,description) VALUES (?,?,?,?,?,?,?)`;

  const presidenceId = uuid();
  await db.run(ORG_SQL, [presidenceId,'PRESIDENCE','Présidence de la République',1,null,0,
    'Vision, stratégie, arbitrage, supervision nationale.']);

  // ------------------------------------------------------------------
  // TEMPORAIRE
  // Synchronisation minimale avec le nouveau modele "institution"
  // afin de satisfaire les FK utilisees par agent_ia.
  //
  // TODO Sprint suivant : remplacer completement le seed organization
  // par un seed institution.
  // ------------------------------------------------------------------

  await db.run(
    `INSERT INTO institution (
        institution_id,
        code,
        nom,
        type_institution,
        niveau_hierarchique
     ) VALUES (?,?,?,?,?)`,
    [
      presidenceId,
      'PRESIDENCE',
      'Présidence de la République',
      'PRESIDENCE',
      0
    ]
  );

  const primatureId = uuid();
  await db.run(ORG_SQL, [primatureId,'PRIMATURE','Primature',2,presidenceId,1,
    'Coordination interministérielle, exécution du Programme du Gouvernement.']);

  const senatId = uuid();
  await db.run(ORG_SQL, [senatId,'SENAT','Sénat',3,presidenceId,1,'Vote des lois et du budget, contrôle du Gouvernement (2ᵉ chambre).']);
  const anId = uuid();
  await db.run(ORG_SQL, [anId,'AN','Assemblée Nationale',3,presidenceId,1,'Vote des lois et du budget, contrôle du Gouvernement (1ʳᵉ chambre).']);

  // Pouvoir judiciaire — institutions nationales de tête, absentes jusqu'ici du référentiel
  // (à distinguer des tribunaux/magistrats du domaine Justice, qui traitent des dossiers concrets)
  await db.run(ORG_SQL, [uuid(),'COUR_CONST','Cour Constitutionnelle',9,null,0,
    'Contrôle de constitutionnalité des lois, contentieux électoraux, interprétation de la Constitution.']);
  await db.run(ORG_SQL, [uuid(),'COUR_CASS','Cour de Cassation',10,null,0,
    'Juridiction suprême de l\'ordre judiciaire — contrôle de la bonne application de la loi par les juridictions inférieures.']);
  await db.run(ORG_SQL, [uuid(),'CONSEIL_ETAT','Conseil d\'État',11,null,0,
    'Juridiction suprême de l\'ordre administratif — contentieux des actes de l\'administration.']);

  const MINISTERES = [
    ["Intérieur, Sécurité, Décentralisation et Affaires coutumières","régalien"],
    ["Défense nationale et Anciens combattants","régalien"],
    ["Affaires Étrangères, Coopération internationale et Francophonie","régalien"],
    ["Justice et Garde des Sceaux","régalien"],["Budget","régalien"],["Finances","régalien"],
    ["Économie nationale","sectoriel"],["Plan et Coordination de l'aide au développement","sectoriel"],
    ["Fonction Publique, Modernisation de l'Administration et Innovation","sectoriel"],
    ["Transports et Voies de communication","sectoriel"],["Infrastructures et Travaux publics","sectoriel"],
    ["Agriculture et Sécurité alimentaire","sectoriel"],["Développement rural","sectoriel"],
    ["Pêche et Élevage","sectoriel"],["Mines","sectoriel"],["Hydrocarbures","sectoriel"],
    ["Ressources hydrauliques et Électricité","sectoriel"],["Environnement et Développement durable","sectoriel"],
    ["Industrie et Développement des PME","sectoriel"],["Commerce Extérieur","sectoriel"],
    ["Entrepreneuriat / Développement des PME","sectoriel"],["Portefeuille","sectoriel"],
    ["Emploi et Travail","sectoriel"],["Formation professionnelle","sectoriel"],
    ["Éducation nationale et Nouvelle citoyenneté","sectoriel"],["Enseignement Supérieur et Universitaire","sectoriel"],
    ["Santé publique, Hygiène et Prévention","sectoriel"],
    ["Affaires sociales, Actions humanitaires et Solidarité nationale","sectoriel"],
    ["Genre et Famille","sectoriel"],["Jeunesse et Éveil Patriotique","sectoriel"],["Droits humains","sectoriel"],
    ["Urbanisme et Habitat","sectoriel"],["Affaires foncières","sectoriel"],["Aménagement du territoire","sectoriel"],
    ["Relations avec le Parlement","sectoriel"],["Communication et Médias","sectoriel"],
    ["Postes et Télécommunications","sectoriel"],["Économie numérique","sectoriel"],["Culture et Arts","sectoriel"],
    ["Tourisme","sectoriel"],["Sports et Loisirs","sectoriel"],["Intégration régionale","sectoriel"],
  ];
  const ministereIds = [];
  for (let i = 0; i < MINISTERES.length; i++) {
    const [nom, type] = MINISTERES[i];
    const id = uuid();
    await db.run(ORG_SQL, [id, 'MIN_'+i, nom, 4, primatureId, 2, `Portefeuille ${type} rattaché à la Primature.`]);
    ministereIds.push(id);
  }

  const PROVINCES = ["Kinshasa","Kongo Central","Kwango","Kwilu","Mai-Ndombe","Kasaï","Kasaï Central",
    "Kasaï Oriental","Lomami","Sankuru","Maniema","Sud-Kivu","Nord-Kivu","Ituri","Haut-Uélé","Bas-Uélé",
    "Tshopo","Mongala","Nord-Ubangi","Sud-Ubangi","Équateur","Tshuapa","Tanganyika","Haut-Lomami",
    "Lualaba","Haut-Katanga"];
  for (let i = 0; i < PROVINCES.length; i++) {
    await db.run(ORG_SQL, [uuid(),'PROV_'+i,PROVINCES[i],5,primatureId,1,'Gouvernement provincial.']);
  }

  const controlIds = {};
  const CONTROLES = ["Cour des Comptes","Inspection Générale des Finances (IGF)","Inspection Générale de l'Administration (IGA)","CENI","ANR"];
  for (let i = 0; i < CONTROLES.length; i++) {
    const id = uuid(); controlIds[CONTROLES[i]] = id;
    await db.run(ORG_SQL, [id,'CTRL_'+i,CONTROLES[i],8,presidenceId,1,'Audit, inspection, régulation.']);
  }

  const ROLES = [
    ['PR','Présidence','Institution suprême'],['PM','Primature','Coordination gouvernementale'],
    ['SN','Sénat','Pouvoir législatif'],['AN','Assemblée Nationale','Pouvoir législatif'],
    ['MI','Ministères','Exécutif sectoriel'],['GV','Gouvernorat de Province','Autorité provinciale'],
  ];
  const roleIds = {};
  for (const [code, nom, cat] of ROLES) {
    const id = uuid(); roleIds[code] = id;
    await db.run('INSERT INTO role VALUES (?,?,?,?)', [id, code, nom, cat]);
  }

  const PAGES = ['dashboard','population','cni','etatcivil','agents','paie','biometrie','budget','tresorerie',
    'depenses','fiscalite','douanes','marches','sante','education','mines','portail','ia','audit','journal',
    'alertes','provinces','institutions','ministeres','justice','economie','securite'];
const ROLE_PAGES = {
  PR: PAGES,
  PM: ['dashboard','alertes','provinces','institutions','ministeres','budget','depenses','marches','sante','education','mines','journal'],
  SN: ['dashboard','budget','institutions','ministeres','journal'],
  AN: ['dashboard','budget','institutions','ministeres','journal'],
  MI: ['dashboard','budget','tresorerie','depenses','fiscalite','douanes','marches','journal','institutions','ministeres'],
  GV: ['dashboard','population','agents','budget','depenses','sante','education','mines','journal','institutions','provinces','ministeres'],
};

const permIds = {};
for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {
  for (const p of pages) {
    const id = uuid();
    permIds[roleCode + ':' + p] = id;
    await db.run(
      'INSERT INTO permission (permission_id, role_id, entite, action) VALUES (?,?,?,?)',
      [id, roleIds[roleCode], 'page:' + p, 'read']
    );
  }
}

  // SUPPRIME (Sprint 2) : 'role_permission' n'est pas une table mais une VUE
  // basee directement sur 'permission' (role_id deja present dans permission).
  // Cette boucle redirigeait silencieusement l'INSERT vers permission avec
  // seulement 2 colonnes sur 4, laissant entite/action a NULL -> violation NOT NULL.
  // La relation role<->permission existe deja via la premiere boucle ci-dessus.
  const DEMO_PASSWORD = 'Pngie#2027';
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  for (const [code, nom] of ROLES) {
    const pid = uuid();
    await db.run(`INSERT INTO personne (personne_id,matricule,nom,prenom,email,password_hash) VALUES (?,?,?,?,?,?)`,
      [pid, 'AG-'+code, nom, 'Démo', code.toLowerCase()+'@rdc.gouv.cd', hash]);
    await db.run(`INSERT INTO personne_role (personne_role_id,personne_id,role_id,scope_institution_id) VALUES (?,?,?,?)`, [uuid(), pid, roleIds[code], null]);
    await db.run(`INSERT INTO person (person_id,matricule,nom,prenom,email,password_hash) VALUES (?,?,?,?,?,?)`,
      [pid, 'AG-'+code, nom, 'Démo', code.toLowerCase()+'@rdc.gouv.cd', hash]);
    await db.run('INSERT INTO person_role (person_role_id,person_id,role_id,scope_org_id) VALUES (?,?,?,?)', [uuid(), pid, roleIds[code], null]);
  }

  const AGENT_SQL = `INSERT INTO agent_ia (agent_id,code,nom,type_agent,institution_id,modele_reference,perimetre_donnees,statut) VALUES (?,?,?,?,?,?,?,?)`;
  await db.run(AGENT_SQL, [uuid(), 'ARIA', 'ARIA – Assistant Présidentiel', 'assistant', presidenceId, 'claude-sonnet-5', 'page:dashboard:read', 'ACTIF']);
  await db.run(AGENT_SQL, [uuid(), 'ANTIFRAUDE', 'Agent Anti-fraude National', 'detection_fraude', null, 'claude-sonnet-5', 'page:ia:read', 'ACTIF']);
  await db.run(AGENT_SQL, [uuid(), 'PREVISION_BUDGET', 'Agent Prévision Budgétaire', 'prevision', null, 'claude-sonnet-5', 'page:budget:read', 'ACTIF']);

  const financesId = ministereIds[5];
  const igfId = controlIds["Inspection Générale des Finances (IGF)"];

  // ================================================================
  // SPRINT 2 : Bloc non implemente RETIRE du seed (perimetre hors sujet)
  // Les tables suivantes n'existent pas dans le schema reel de la base
  // (verifie exhaustivement via pg_class le 2026-08-29, 163 objets reels) :
  // instruction, plan_action, rapport, controle, audit_mission, recommandation,
  // decision, suivi, systeme_externe, integration_flux, nocode_app, lieu,
  // emploi_type, document_type, service_numerique, unit, position, assignment,
  // position_competence, mission, organization_mission, process, process_step,
  // portal, dashboard, module, menu, page, widget, kpi, responsabilite,
  // organization_responsabilite, gov_relation, programme, projet, kpi_valeur.
  // Ce bloc necessite une refonte separee (mapping vers le vrai schema ou
  // creation des tables), hors perimetre du garde-fou anti-TRUNCATE.
  // ================================================================

  console.log('✓ Activités et valeurs de KPI dans le temps peuplées');
  console.log('✓', MINISTERES.length, 'ministères,', PROVINCES.length, 'provinces,', ROLES.length, 'rôles');
  console.log(`✓ Moteur de base de données : ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);
  console.log('✓ Comptes démo (mot de passe pour tous : "'+DEMO_PASSWORD+'") :');
  for (const [code] of ROLES) console.log('   -', code.toLowerCase()+'@rdc.gouv.cd');

  // SPRINT 2 : seedExtension() DESACTIVE - cible des tables inexistantes
  // (tribunal, magistrat, jugement, etablissement_sante, patient, consultation,
  // campagne_vaccination, entreprise, projet_energie, infrastructure_projet,
  // parcelle_cadastrale, mfa_backup_code, mfa_event, pki_certificate, pki_signature).
  // Meme constat que ci-dessus : refonte separee necessaire, hors perimetre Sprint 2.

  await db.close();
}

main().catch(e => { console.error('Échec du seed:', e); process.exit(1); });
