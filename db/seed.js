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
    const db0 = require('../src/db');
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

for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {
  for (const p of pages) {
    await db.run(
      'INSERT INTO role_permission (role_id, permission_id) VALUES (?,?)',
      [roleIds[roleCode], permIds[roleCode + ':' + p]]
    );
  }
}
  const DEMO_PASSWORD = 'Pngie#2027';
  const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
  for (const [code, nom] of ROLES) {
    const pid = uuid();
    await db.run(`INSERT INTO person (person_id,matricule,nom,prenom,email,password_hash) VALUES (?,?,?,?,?,?)`,
      [pid, 'AG-'+code, nom, 'Démo', code.toLowerCase()+'@rdc.gouv.cd', hash]);
    await db.run('INSERT INTO person_role (person_role_id,person_id,role_id,scope_org_id) VALUES (?,?,?,?)', [uuid(), pid, roleIds[code], null]);
  }

  const AGENT_SQL = `INSERT INTO ai_agent (agent_id,organization_id,nom,role_ia,modele,system_prompt,permission_code,statut) VALUES (?,?,?,?,?,?,?,?)`;
  await db.run(AGENT_SQL, [uuid(), presidenceId, 'ARIA — Assistant Présidentiel','assistant','claude-sonnet-5', null, 'page:dashboard:read','ACTIF']);
  await db.run(AGENT_SQL, [uuid(), null, 'Agent Anti-fraude National','detection_fraude','claude-sonnet-5', null, 'page:ia:read','ACTIF']);
  await db.run(AGENT_SQL, [uuid(), null, 'Agent Prévision Budgétaire','prevision','claude-sonnet-5', null, 'page:budget:read','ACTIF']);

  const financesId = ministereIds[5];
  const igfId = controlIds["Inspection Générale des Finances (IGF)"];

  const instrId = uuid();
  await db.run(`INSERT INTO instruction (instruction_id,emetteur_org_id,destinataire_org_id,titre,contenu,type,echeance,statut) VALUES (?,?,?,?,?,?,?,?)`,
    [instrId, primatureId, financesId, "Accélérer le recouvrement des recettes DGI T1 2027",
     "Mettre en œuvre un plan de relance des recettes fiscales pour le premier trimestre.",
     "CIRCULAIRE", "2027-03-31", "EN_COURS"]);

  const planId = uuid();
  await db.run(`INSERT INTO plan_action (plan_action_id,instruction_id,organization_id,titre,statut) VALUES (?,?,?,?,?)`,
    [planId, instrId, financesId, "Plan de relance recouvrement DGI", "EN_COURS"]);

  const rapportId = uuid();
  await db.run(`INSERT INTO rapport (rapport_id,organization_id,destinataire_org_id,instruction_id,plan_action_id,titre,synthese,periode) VALUES (?,?,?,?,?,?,?,?)`,
    [rapportId, financesId, primatureId, instrId, planId, "Rapport d'exécution T1 2027 — Recouvrement DGI",
     "78% de l'objectif de recettes atteint ; retard localisé sur 4 provinces.", "2027-T1"]);

  const controleId = uuid();
  await db.run(`INSERT INTO controle (controle_id,organe_controle_id,organisation_controlee_id,type,objet,statut) VALUES (?,?,?,?,?,?)`,
    [controleId, igfId, financesId, "FINANCIER", "Vérification des recettes DGI déclarées T1 2027", "CLOTURE"]);

  const auditId = uuid();
  await db.run(`INSERT INTO audit_mission (audit_id,controle_id,perimetre,conclusion,rapport_final) VALUES (?,?,?,?,?)`,
    [auditId, controleId, "Recettes DGI — 4 provinces", "RESERVES",
     "Écarts constatés entre recettes déclarées et versements Trésor sur 2 provinces."]);

  const recoId = uuid();
  await db.run(`INSERT INTO recommandation (recommandation_id,audit_id,libelle,priorite,organisation_responsable_id) VALUES (?,?,?,?,?)`,
    [recoId, auditId, "Renforcer les contrôles de rapprochement DGI ↔ Trésor dans les provinces concernées.", "HAUTE", financesId]);

  const decisionId = uuid();
  await db.run(`INSERT INTO decision (decision_id,organization_id,recommandation_id,rapport_id,titre,type) VALUES (?,?,?,?,?,?)`,
    [decisionId, primatureId, recoId, rapportId, "Mise en place d'un rapprochement mensuel DGI-Trésor obligatoire", "MESURE_CORRECTIVE"]);

  await db.run(`INSERT INTO suivi (suivi_id,recommandation_id,decision_id,statut,commentaire) VALUES (?,?,?,?,?)`,
    [uuid(), recoId, decisionId, "EN_COURS", "Procédure de rapprochement en cours de déploiement dans les 2 provinces concernées."]);

  const SYSTEMES = [
    ["Microsoft Outlook / Exchange","Collaboration","Microsoft","REST","CONFIGURE",null],
    ["Microsoft Teams","Collaboration","Microsoft","REST","CONFIGURE",null],
    ["SharePoint","Collaboration","Microsoft","REST","CONFIGURE",null],
    ["Microsoft 365","Collaboration","Microsoft","REST","CONFIGURE",null],
    ["Kolecto","ERP_Finances","Kolecto","REST","NON_CONNECTE",financesId],
    ["Cegid XRP","ERP_Finances","Cegid","REST","NON_CONNECTE",financesId],
    ["Cegid Loop","ERP_Finances","Cegid","REST","NON_CONNECTE",financesId],
    ["SAP S/4HANA","ERP_Finances","SAP","SOAP","NON_CONNECTE",null],
    ["Oracle ERP / Oracle Financials","ERP_Finances","Oracle","REST","NON_CONNECTE",null],
    ["Sage","ERP_Finances","Sage","REST","NON_CONNECTE",null],
    ["Odoo","ERP_Finances","Odoo","REST","NON_CONNECTE",null],
    ["TeamMate+","Audit","Wolters Kluwer","REST","NON_CONNECTE",igfId],
    ["AuditBoard","Audit","AuditBoard","REST","NON_CONNECTE",igfId],
    ["CaseWare","Audit","CaseWare","REST","NON_CONNECTE",igfId],
    ["Pentana Audit","Audit","Ideagen","REST","NON_CONNECTE",igfId],
    ["Galvanize HighBond","Audit","Diligent","REST","NON_CONNECTE",igfId],
    ["OpenText","GED","OpenText","REST","NON_CONNECTE",null],
    ["Alfresco","GED","Alfresco","REST","NON_CONNECTE",null],
    ["Nuxeo","GED","Nuxeo","REST","NON_CONNECTE",null],
    ["DocuWare","GED","DocuWare","REST","NON_CONNECTE",null],
    ["Archivematica","Archivage","Artefactual","REST","NON_CONNECTE",null],
    ["Everteam IG Suite","Archivage","Everteam (Groupe Kyocera)","REST","NON_CONNECTE",null],
    ["PostgreSQL national (Data Platform)","BDD","PostgreSQL","SQL","ACTIF",null],
    ["Oracle Database","BDD","Oracle","SQL","NON_CONNECTE",null],
    ["Microsoft SQL Server","BDD","Microsoft","SQL","NON_CONNECTE",null],
    ["MySQL / MariaDB","BDD","Oracle/MariaDB","SQL","NON_CONNECTE",null],
    ["MongoDB","BDD","MongoDB","REST","NON_CONNECTE",null],
    ["Neo4j (graphe institutionnel)","BDD","Neo4j","Bolt/REST","NON_CONNECTE",null],
    ["Active Directory / Entra ID","Cybersecurite","Microsoft","LDAP/REST","CONFIGURE",null],
    ["Microsoft Defender","Cybersecurite","Microsoft","REST","NON_CONNECTE",null],
    ["CrowdStrike","Cybersecurite","CrowdStrike","REST","NON_CONNECTE",null],
    ["Palo Alto Networks","Cybersecurite","Palo Alto","REST","NON_CONNECTE",null],
    ["Fortinet","Cybersecurite","Fortinet","REST","NON_CONNECTE",null],
    ["Splunk (SIEM)","Cybersecurite","Splunk","REST","NON_CONNECTE",null],
    ["IBM QRadar (SIEM)","Cybersecurite","IBM","REST","NON_CONNECTE",null],
    ["Microsoft Power BI","Decisionnel","Microsoft","REST","NON_CONNECTE",null],
    ["Tableau","Decisionnel","Salesforce","REST","NON_CONNECTE",null],
    ["Qlik Sense","Decisionnel","Qlik","REST","NON_CONNECTE",null],
    ["Apache Superset","Decisionnel","Apache (open-source)","REST","NON_CONNECTE",null],
    ["GitHub Enterprise","DevOps","GitHub","REST","NON_CONNECTE",null],
    ["GitLab","DevOps","GitLab","REST","NON_CONNECTE",null],
    ["Azure DevOps","DevOps","Microsoft","REST","NON_CONNECTE",null],
    ["Docker / Kubernetes","DevOps","CNCF (open-source)","REST","NON_CONNECTE",null],
    ["OpenShift","DevOps","Red Hat","REST","NON_CONNECTE",null],
  ];
  const sysIds = {};
  for (const [nom,cat,fourn,proto,statut,orgId] of SYSTEMES) {
    const id = uuid(); sysIds[nom] = id;
    await db.run(`INSERT INTO systeme_externe (systeme_id,nom,categorie,fournisseur,protocole,statut_connexion,organization_id) VALUES (?,?,?,?,?,?,?)`,
      [id,nom,cat,fourn,proto,statut,orgId]);
  }
  const FLUX_SQL = `INSERT INTO integration_flux (flux_id,systeme_id,sens,objet,frequence) VALUES (?,?,?,?,?)`;
  const FLUX = [
    [sysIds["Kolecto"], "ENTRANT", "Factures fournisseurs et factures clients", "temps réel"],
    [sysIds["Kolecto"], "SORTANT", "Facturation électronique vers les usagers/entreprises", "temps réel"],
    [sysIds["Kolecto"], "BIDIRECTIONNEL", "Trésorerie et rapprochement bancaire", "journalier"],
    [sysIds["Kolecto"], "SORTANT", "Pré-comptabilité vers Cegid XRP (export d'écritures)", "journalier"],
    [sysIds["Cegid XRP"], "BIDIRECTIONNEL", "Écritures comptables et exécution budgétaire", "journalier"],
    [sysIds["Cegid Loop"], "ENTRANT", "Notes de frais et gestion des dépenses des agents", "temps réel"],
    [sysIds["Everteam IG Suite"], "ENTRANT", "Archivage à valeur probatoire des documents administratifs engageants", "journalier"],
    [sysIds["Microsoft Outlook / Exchange"], "SORTANT", "Notifications d'instructions et de rapports", "temps réel"],
    [sysIds["Splunk (SIEM)"], "ENTRANT", "Alertes de sécurité et journaux d'accès", "temps réel"],
    [sysIds["Active Directory / Entra ID"], "BIDIRECTIONNEL", "Authentification unique (SSO) des agents", "temps réel"],
    [sysIds["Microsoft Power BI"], "ENTRANT", "Tableaux de bord exécutifs alimentés par la Data Platform", "temps réel"],
  ];
  for (const [sysId, sens, objet, freq] of FLUX) await db.run(FLUX_SQL, [uuid(), sysId, sens, objet, freq]);

  console.log('✓ Cycle de gouvernance de démonstration inséré (instruction → ... → suivi)');
  console.log('✓', SYSTEMES.length, 'systèmes externes enregistrés dans le registre d\'intégration');

  const nocodeSchema = {
    titre: "Demande de mission de contrôle — IGF",
    description: "Formulaire de saisine pour déclencher une mission de vérification.",
    bouton: "Soumettre la demande",
    champs: [
      { id: "organisation_cible", label: "Organisation à contrôler", type: "text", required: true },
      { id: "type_controle", label: "Type de contrôle", type: "select", required: true,
        options: ["ADMINISTRATIF","FINANCIER","CONFORMITE","PERFORMANCE"] },
      { id: "motif", label: "Motif de la saisine", type: "textarea", required: true },
      { id: "echeance", label: "Échéance souhaitée", type: "date", required: false },
    ],
  };
  await db.run(`INSERT INTO nocode_app (app_id,organization_id,nom,type,definition_json,statut) VALUES (?,?,?,?,?,?)`,
    [uuid(), igfId, "Saisine — Mission de contrôle IGF", "formulaire", JSON.stringify(nocodeSchema), "PUBLIE"]);

  // ── Extension du catalogue agents IA + no-code à tous les domaines de la base ──
  // (catalogue uniquement — pas de clé API Anthropic configurée, donc pas de réponses réelles pour l'instant)
  const justiceOrg = await db.get(`SELECT organization_id FROM organization WHERE code='COUR_CASS'`);
  const santeOrg = await db.get(`SELECT organization_id FROM organization WHERE nom LIKE 'Santé publique%'`);
  const economieOrg = await db.get(`SELECT organization_id FROM organization WHERE nom LIKE 'Économie numérique%'`);

  const NEW_AGENTS = [
    [justiceOrg?.organization_id ?? null, "Agent Assistant Judiciaire", "assistant", "page:justice:read"],
    [santeOrg?.organization_id ?? null, "Agent Veille Sanitaire", "detection_fraude", "page:sante:read"],
    [economieOrg?.organization_id ?? null, "Agent Analyse Économique et Ressources", "prevision", "page:economie:read"],
    [null, "Agent Supervision Sécurité MFA/PKI", "detection_fraude", "page:securite:read"],
  ];
  for (const [orgId, nom, roleIa, permCode] of NEW_AGENTS) {
    await db.run(AGENT_SQL, [uuid(), orgId, nom, roleIa, 'claude-sonnet-5', null, permCode, 'ACTIF']);
  }

  const NEW_APPS = [
    [justiceOrg?.organization_id, "Saisine — Ouverture d'un dossier judiciaire", {
      titre: "Ouverture d'un dossier judiciaire", bouton: "Enregistrer le dossier",
      champs: [
        { id: "tribunal", label: "Tribunal compétent", type: "text", required: true },
        { id: "nature", label: "Nature du dossier", type: "select", required: true,
          options: ["CIVIL","PENAL","COMMERCIAL","ADMINISTRATIF","SOCIAL"] },
        { id: "objet", label: "Objet de la saisine", type: "textarea", required: true },
      ]}],
    [santeOrg?.organization_id, "Signalement — Alerte sanitaire", {
      titre: "Signalement d'une alerte sanitaire", bouton: "Envoyer le signalement",
      champs: [
        { id: "etablissement", label: "Établissement concerné", type: "text", required: true },
        { id: "type_alerte", label: "Type d'alerte", type: "select", required: true,
          options: ["EPIDEMIE","RUPTURE_STOCK","INCIDENT_GRAVE","AUTRE"] },
        { id: "description", label: "Description de la situation", type: "textarea", required: true },
        { id: "date_constat", label: "Date du constat", type: "date", required: true },
      ]}],
    [economieOrg?.organization_id, "Déclaration — Nouveau permis minier", {
      titre: "Demande de permis minier", bouton: "Soumettre la demande",
      champs: [
        { id: "entreprise", label: "Entreprise demandeuse", type: "text", required: true },
        { id: "substance", label: "Substance visée", type: "text", required: true },
        { id: "localisation", label: "Localisation du site", type: "text", required: true },
        { id: "justification", label: "Justification de la demande", type: "textarea", required: false },
      ]}],
    [presidenceId, "Demande — Émission d'un certificat PKI", {
      titre: "Demande de certificat PKI", bouton: "Soumettre la demande",
      champs: [
        { id: "agent_concerne", label: "Agent concerné", type: "text", required: true },
        { id: "usage", label: "Usage prévu", type: "select", required: true,
          options: ["SIGNATURE_DOCUMENT","AUTHENTIFICATION","CHIFFREMENT"] },
        { id: "duree", label: "Durée de validité souhaitée", type: "select", required: true,
          options: ["1_AN","2_ANS","3_ANS"] },
      ]}],
  ];
  for (const [orgId, nom, schema] of NEW_APPS) {
    await db.run(`INSERT INTO nocode_app (app_id,organization_id,nom,type,definition_json,statut) VALUES (?,?,?,?,?,?)`,
      [uuid(), orgId ?? presidenceId, nom, "formulaire", JSON.stringify(schema), "PUBLIE"]);
  }
  console.log('✓ Catalogue étendu : 4 nouveaux agents IA + 4 nouvelles applications no-code (Justice, Santé, Économie, Sécurité)');
  console.log('✓ 5 applications no-code publiées au total');

  const paysId = uuid();
  await db.run(`INSERT INTO lieu (lieu_id,parent_lieu_id,nom,type,organization_id) VALUES (?,?,?,?,?)`,
    [paysId, null, "République Démocratique du Congo", "PAYS", null]);
  const provinceOrgs = await db.all(`SELECT organization_id,nom FROM organization o
    JOIN organization_type ot ON ot.id=o.type_id WHERE ot.code='PROVINCE'`);
  const lieuProvinceIds = {};
  for (const p of provinceOrgs) {
    const id = uuid(); lieuProvinceIds[p.nom] = id;
    await db.run(`INSERT INTO lieu (lieu_id,parent_lieu_id,nom,type,organization_id) VALUES (?,?,?,?,?)`,
      [id, paysId, p.nom, "PROVINCE", p.organization_id]);
  }
  if (lieuProvinceIds["Kinshasa"]) {
    for (const c of ["Gombe","Lemba","Ngaliema","Kalamu","Limete","Masina"]) {
      await db.run(`INSERT INTO lieu (lieu_id,parent_lieu_id,nom,type,organization_id) VALUES (?,?,?,?,?)`,
        [uuid(), lieuProvinceIds["Kinshasa"], c, "COMMUNE", null]);
    }
  }
  if (lieuProvinceIds["Kongo Central"]) {
    for (const v of ["Matadi","Boma","Mbanza-Ngungu"]) {
      await db.run(`INSERT INTO lieu (lieu_id,parent_lieu_id,nom,type,organization_id) VALUES (?,?,?,?,?)`,
        [uuid(), lieuProvinceIds["Kongo Central"], v, "VILLE", null]);
    }
  }

  const EMPLOIS = [["SG","Secrétaire Général","Direction"],["DG","Directeur Général","Direction"],
    ["DIR","Directeur","Encadrement"],["CDIV","Chef de Division","Encadrement"],
    ["CBUR","Chef de Bureau","Encadrement"],["AG1","Agent de 1ère classe","Exécution"],
    ["AG2","Agent de 2ème classe","Exécution"],["ATT","Attaché de bureau","Support"],
    ["SEC","Secrétaire","Support"]];
  for (const [code,intitule,cat] of EMPLOIS) {
    await db.run(`INSERT INTO emploi_type (emploi_id,code,intitule,categorie) VALUES (?,?,?,?)`, [uuid(),code,intitule,cat]);
  }

  const compIds = {};
  const COMPETENCES = [["Gestion budgétaire","Finances"],["Audit financier","Contrôle"],["Marchés publics","Finances"],
    ["Analyse de données","Numérique"],["Cybersécurité","Numérique"],["Rédaction administrative","Transversal"],
    ["Management d'équipe","Transversal"],["Droit administratif","Juridique"]];
  for (const [nom,cat] of COMPETENCES) {
    const id = uuid(); compIds[nom] = id;
    await db.run(`INSERT INTO competence (competence_id,nom,categorie) VALUES (?,?,?)`, [id,nom,cat]);
  }

  const DOC_TYPES = [["Décret présidentiel",99,"Archivage permanent — Archives Nationales"],
    ["Circulaire ministérielle",10,"Archivage courant puis intermédiaire"],
    ["Rapport d'audit",30,"Conservation légale renforcée (contentieux possible)"],
    ["Acte d'état civil",99,"Archivage permanent — valeur probatoire"],
    ["Facture / pièce comptable",10,"Conservation légale fiscale/comptable"]];
  for (const [nom,duree,regle] of DOC_TYPES) {
    await db.run(`INSERT INTO document_type (document_type_id,nom,duree_conservation_ans,regle_archivage) VALUES (?,?,?,?)`,
      [uuid(),nom,duree,regle]);
  }

  const SERVICE_SQL = `INSERT INTO service_numerique (service_id,organization_id,nom,description,statut) VALUES (?,?,?,?,?)`;
  await db.run(SERVICE_SQL, [uuid(), financesId, "Télédéclaration fiscale DGI", "Déclaration et paiement en ligne des impôts.", "ACTIF"]);
  await db.run(SERVICE_SQL, [uuid(), igfId, "Saisine en ligne des missions de contrôle", "Formulaire no-code de demande de contrôle.", "ACTIF"]);
  await db.run(SERVICE_SQL, [uuid(), presidenceId, "Portail Citoyen national", "Accès aux démarches administratives en ligne.", "ACTIF"]);

  console.log('✓ Référentiels transversaux peuplés : géographie, fonction publique, compétences, documents, services numériques');

  const cabinetPM = uuid();
  await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
    [cabinetPM, primatureId, null, 'CAB', 'Cabinet de la Première Ministre', 'Cabinet', 1]);
  const sgPM = uuid();
  await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
    [sgPM, primatureId, null, 'SG', 'Secrétariat Général du Gouvernement', 'Secrétariat Général', 2]);
  const dirFin = uuid();
  await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
    [dirFin, financesId, null, 'DIR-BUDGET', 'Direction du Budget', 'Direction', 1]);
  const divRecouv = uuid();
  await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
    [divRecouv, financesId, dirFin, 'DIV-RECOUV', 'Division Recouvrement', 'Division', 1]);

  const posPM = uuid();
  await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
    [posPM, cabinetPM, 'Première Ministre, Chef du Gouvernement', 1, roleIds['PM'], 'décisionnelle']);
  const posDirBudget = uuid();
  await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
    [posDirBudget, dirFin, 'Directeur du Budget', 3, roleIds['MI'], 'exécutive']);
  const posChefDiv = uuid();
  await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
    [posChefDiv, divRecouv, 'Chef de Division Recouvrement', 5, null, 'exécutive']);

  const pmPerson = await db.get(`SELECT person_id FROM person WHERE email='pm@rdc.gouv.cd'`);
  const miPerson = await db.get(`SELECT person_id FROM person WHERE email='mi@rdc.gouv.cd'`);
  await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
    [uuid(), pmPerson.person_id, posPM]);
  await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
    [uuid(), miPerson.person_id, posDirBudget]);

  await db.run(`INSERT INTO position_competence (position_id,competence_id,niveau_requis) VALUES (?,?,?)`,
    [posDirBudget, compIds["Gestion budgétaire"], "Expert"]);
  await db.run(`INSERT INTO position_competence (position_id,competence_id,niveau_requis) VALUES (?,?,?)`,
    [posDirBudget, compIds["Analyse de données"], "Maîtrise"]);

  // ── Comblement : affectations manquantes pour Présidence, Sénat, AN, Gouvernorat ──
  const kinshasaOrg = provinceOrgs.find(p => p.nom === 'Kinshasa');

  const cabinetPresidence = uuid();
  await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
    [cabinetPresidence, presidenceId, null, 'CAB-PR', 'Cabinet du Président de la République', 'Cabinet', 1]);
  const cabinetSenat = uuid();
  await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
    [cabinetSenat, senatId, null, 'CAB-SN', 'Cabinet du Président du Sénat', 'Cabinet', 1]);
  const cabinetAN = uuid();
  await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
    [cabinetAN, anId, null, 'CAB-AN', "Cabinet du Président de l'Assemblée Nationale", 'Cabinet', 1]);
  let cabinetGouverneur = null;
  if (kinshasaOrg) {
    cabinetGouverneur = uuid();
    await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
      [cabinetGouverneur, kinshasaOrg.organization_id, null, 'CAB-GOUV', 'Cabinet du Gouverneur', 'Cabinet', 1]);
  }

  const posPresident = uuid();
  await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
    [posPresident, cabinetPresidence, 'Président de la République', 0, roleIds['PR'], 'décisionnelle']);
  const posPresidentSenat = uuid();
  await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
    [posPresidentSenat, cabinetSenat, 'Président du Sénat', 1, roleIds['SN'], 'décisionnelle']);
  const posPresidentAN = uuid();
  await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
    [posPresidentAN, cabinetAN, "Président de l'Assemblée Nationale", 1, roleIds['AN'], 'décisionnelle']);
  let posGouverneur = null;
  if (cabinetGouverneur) {
    posGouverneur = uuid();
    await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
      [posGouverneur, cabinetGouverneur, 'Gouverneur de Province', 2, roleIds['GV'], 'exécutive']);
  }

  const prPerson = await db.get(`SELECT person_id FROM person WHERE email='pr@rdc.gouv.cd'`);
  const snPerson = await db.get(`SELECT person_id FROM person WHERE email='sn@rdc.gouv.cd'`);
  const anPerson = await db.get(`SELECT person_id FROM person WHERE email='an@rdc.gouv.cd'`);
  const gvPerson = await db.get(`SELECT person_id FROM person WHERE email='gv@rdc.gouv.cd'`);
  await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
    [uuid(), prPerson.person_id, posPresident]);
  await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
    [uuid(), snPerson.person_id, posPresidentSenat]);
  await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
    [uuid(), anPerson.person_id, posPresidentAN]);
  if (posGouverneur) {
    await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
      [uuid(), gvPerson.person_id, posGouverneur]);
  }
  console.log('✓ Affectations comblées : Présidence, Sénat, Assemblée Nationale, Gouvernorat (Kinshasa) ont désormais un vrai poste');

  const missionPrimatureId = uuid();
  await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`,
    [missionPrimatureId, "Exécuter le Programme du Gouvernement et coordonner l'action interministérielle."]);
  await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`,
    [primatureId, missionPrimatureId]);

  const missionFinancesId = uuid();
  await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`,
    [missionFinancesId, "Mobiliser les recettes publiques et gérer le Trésor de l'État."]);
  await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`,
    [financesId, missionFinancesId]);

  const missionPresidenceId = uuid();
  await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`,
    [missionPresidenceId, "Définir la vision nationale, arbitrer les grandes orientations et garantir la continuité de l'État."]);
  await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`,
    [presidenceId, missionPresidenceId]);

  const missionSenatId = uuid();
  await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`,
    [missionSenatId, "Représenter les provinces, voter les lois et contrôler l'action du Gouvernement (2ᵉ chambre)."]);
  await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`,
    [senatId, missionSenatId]);

  const missionANId = uuid();
  await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`,
    [missionANId, "Représenter la Nation, voter les lois et le budget, contrôler l'action du Gouvernement (1ʳᵉ chambre)."]);
  await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`,
    [anId, missionANId]);

  if (kinshasaOrg) {
    const missionProvinceId = uuid();
    await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`,
      [missionProvinceId, "Administrer le territoire provincial et assurer l'exécution locale des politiques nationales."]);
    await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`,
      [kinshasaOrg.organization_id, missionProvinceId]);
  }
  console.log('✓ Missions comblées : Présidence, Sénat, Assemblée Nationale, Province de Kinshasa');

  // ── Ajout de vraies agences avec leur propre compte (DGI, DGRAD, Inspection Générale du Travail) ──
  const emploiOrg = await db.get(`SELECT organization_id FROM organization WHERE nom LIKE 'Emploi et Travail%'`);
  const agenceTypeId = 7; // 'AGENCE' déjà défini dans TYPES

  const AGENCES = [
    ['DGI', 'Direction Générale des Impôts', financesId, 'dgi@rdc.gouv.cd', 'Directeur Général des Impôts',
     "Asseoir, contrôler et recouvrer les impôts et taxes dus à l'État."],
    ['DGRAD', 'Direction Générale des Recettes Administratives, Domaniales et de Participations', financesId, 'dgrad@rdc.gouv.cd', 'Directeur Général de la DGRAD',
     "Mobiliser les recettes non fiscales de l'État (administratives, domaniales, judiciaires, de participations)."],
    ['IGTRAVAIL', 'Inspection Générale du Travail', emploiOrg?.organization_id ?? null, 'igtravail@rdc.gouv.cd', 'Inspecteur Général du Travail',
     "Contrôler l'application de la législation du travail et de la sécurité sociale dans les entreprises."],
  ];

  for (const [code, nom, parentId, email, titrePoste, missionLibelle] of AGENCES) {
    const orgId = uuid();
    await db.run(ORG_SQL, [orgId, code, nom, agenceTypeId, parentId, 2, `Agence rattachée : ${nom}.`]);

    const unitId = uuid();
    await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
      [unitId, orgId, null, 'DG', 'Direction Générale', 'Direction', 1]);

    const posId = uuid();
    await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
      [posId, unitId, titrePoste, 2, roleIds['MI'], 'exécutive']);

    const personId = uuid();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await db.run(`INSERT INTO person (person_id,nom,email,password_hash) VALUES (?,?,?,?)`,
      [personId, `Démo ${nom}`, email, passwordHash]);
    await db.run(`INSERT INTO person_role (person_role_id,person_id,role_id,scope_org_id) VALUES (?,?,?,?)`,
      [uuid(), personId, roleIds['MI'], orgId]);
    await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
      [uuid(), personId, posId]);

    const missionId = uuid();
    await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`, [missionId, missionLibelle]);
    await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`, [orgId, missionId]);
  }
  console.log('✓ 3 agences ajoutées avec leur propre compte, poste et mission : DGI, DGRAD, Inspection Générale du Travail');

  // ── Traitement systématique des organisations restantes sans compte ──
  // (Ministères, Provinces, institutions de contrôle, hautes juridictions)
  const TITRE_PAR_TYPE = {
    MINISTERE: 'Ministre',
    PROVINCE: 'Gouverneur de Province',
    INSTITUTION_CONTROLE: 'Responsable Général',
    COUR_CONSTITUTIONNELLE: 'Président de la Cour Constitutionnelle',
    COUR_CASSATION: 'Premier Président de la Cour de Cassation',
    CONSEIL_ETAT: "Premier Président du Conseil d'État",
  };
  const ROLE_PAR_TYPE = {
    MINISTERE: 'MI', PROVINCE: 'GV', INSTITUTION_CONTROLE: 'MI',
    COUR_CONSTITUTIONNELLE: 'MI', COUR_CASSATION: 'MI', CONSEIL_ETAT: 'MI',
  };

  const orgsSansCompte = await db.all(`
    SELECT o.organization_id, o.code, o.nom, o.description, ot.code AS type_code
    FROM organization o
    JOIN organization_type ot ON ot.id = o.type_id
    WHERE NOT EXISTS (
      SELECT 1 FROM unit u JOIN position pos ON pos.unit_id=u.unit_id JOIN assignment a ON a.position_id=pos.position_id
      WHERE u.organization_id = o.organization_id
    )
    AND ot.code IN ('MINISTERE','PROVINCE','INSTITUTION_CONTROLE','COUR_CONSTITUTIONNELLE','COUR_CASSATION','CONSEIL_ETAT')
  `);

  let comptesCrees = 0;
  for (const org of orgsSansCompte) {
    const titre = TITRE_PAR_TYPE[org.type_code] || 'Responsable';
    const roleCode = ROLE_PAR_TYPE[org.type_code] || 'MI';
    const email = `${slugify(org.code)}@rdc.gouv.cd`;

    const unitId = uuid();
    await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
      [unitId, org.organization_id, null, 'DIR', 'Direction / Cabinet', 'Cabinet', 1]);

    const posId = uuid();
    await db.run(`INSERT INTO position (position_id,unit_id,titre,niveau,role_defaut_id,autorite) VALUES (?,?,?,?,?,?)`,
      [posId, unitId, titre, 2, roleIds[roleCode], 'décisionnelle']);

    const personId = uuid();
    const pwdHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    await db.run(`INSERT INTO person (person_id,nom,email,password_hash) VALUES (?,?,?,?)`,
      [personId, `Démo ${org.nom}`, email, pwdHash]);
    await db.run(`INSERT INTO person_role (person_role_id,person_id,role_id,scope_org_id) VALUES (?,?,?,?)`,
      [uuid(), personId, roleIds[roleCode], org.organization_id]);
    await db.run(`INSERT INTO assignment (assignment_id,person_id,position_id,date_debut,statut) VALUES (?,?,?,CURRENT_DATE,'ACTIF')`,
      [uuid(), personId, posId]);

    const missionLibelle = org.description
      ? `Assurer, au nom de l'État, la mission suivante : ${org.description}`
      : `Assurer la mission de service public relevant de ${org.nom}.`;
    const missionId = uuid();
    await db.run(`INSERT INTO mission (mission_id,libelle) VALUES (?,?)`, [missionId, missionLibelle]);
    await db.run(`INSERT INTO organization_mission (organization_id,mission_id) VALUES (?,?)`, [org.organization_id, missionId]);

    comptesCrees++;
  }
  console.log(`✓ ${comptesCrees} organisations supplémentaires dotées d'un compte, d'un poste et d'une mission (mot de passe identique : ${DEMO_PASSWORD})`);

  // ── Comblement de deux catégories manquantes : ETD (type vide) et Entreprise publique (type inexistant) ──
  await db.run('INSERT INTO organization_type VALUES (?,?,?,?)', [12, 'ENTREPRISE_PUBLIQUE', 'Entreprise publique', 1]);

  const kwiluOrg = provinceOrgs.find(p => p.nom === 'Kwilu');
  const hautKatangaOrg = provinceOrgs.find(p => p.nom === 'Haut-Katanga');
  const portefeuilleOrg = await db.get(`SELECT organization_id FROM organization WHERE nom = 'Portefeuille'`);

  const ETDS = [
    ['ETD-GOMBE', 'Commune de la Gombe', kinshasaOrg?.organization_id, 'Bourgmestre'],
    ['ETD-LEMBA', 'Commune de Lemba', kinshasaOrg?.organization_id, 'Bourgmestre'],
    ['ETD-LUBUM', 'Ville de Lubumbashi', hautKatangaOrg?.organization_id, 'Maire'],
    ['ETD-KWILU-T', 'Territoire de Bulungu', kwiluOrg?.organization_id, 'Administrateur du Territoire'],
  ];
  const ENTREPRISES_PUB = [
    ['EP-GECAMINES', 'Gécamines', "Extraction et valorisation des ressources minières de l'État (cuivre, cobalt)."],
    ['EP-SNEL', 'SNEL — Société Nationale d\'Électricité', "Production, transport et distribution de l'électricité sur le territoire national."],
    ['EP-REGIDESO', 'REGIDESO — Régie de Distribution d\'Eau', "Production et distribution de l'eau potable dans les centres urbains et ruraux."],
    ['EP-SNCC', 'SNCC — Société Nationale des Chemins de fer du Congo', "Exploitation du réseau ferroviaire national de transport de personnes et de marchandises."],
  ];

  let etdEtEpCrees = 0;
  for (const [code, nom, parentId, titre] of ETDS) {
    if (!parentId) continue;
    const orgId = uuid();
    await db.run(ORG_SQL, [orgId, code, nom, 6, parentId, 3, `Entité territoriale décentralisée : ${nom}.`]);
    await creerCompteInstitution(orgId, nom, titre, 'GV', `Administrer localement le territoire de ${nom} et exécuter les politiques publiques nationales et provinciales.`);
    etdEtEpCrees++;
  }
  for (const [code, nom, missionTxt] of ENTREPRISES_PUB) {
    const orgId = uuid();
    await db.run(ORG_SQL, [orgId, code, nom, 12, portefeuilleOrg?.organization_id ?? null, 2, `Entreprise publique : ${nom}.`]);
    await creerCompteInstitution(orgId, nom, 'Directeur Général', 'MI', missionTxt);
    etdEtEpCrees++;
  }
  console.log(`✓ ${etdEtEpCrees} organisations ajoutées pour combler ETD et Entreprise publique (catégories vides ou inexistantes avant)`);

  // ── Institutions nationales majeures encore manquantes (liste détaillée fournie) ──
  const NOUVELLES_INSTITUTIONS = [
    ['CSM', 'Conseil Supérieur de la Magistrature', 'INSTITUTION_CONTROLE', null, 'MI',
     "Garantir l'indépendance du pouvoir judiciaire et gérer la carrière des magistrats."],
    ['CSAC', "Conseil Supérieur de l'Audiovisuel et de la Communication", 'INSTITUTION_CONTROLE', null, 'MI',
     "Réguler le secteur de l'audiovisuel et de la communication, garantir le pluralisme des médias."],
    ['CES', 'Conseil Économique et Social', 'INSTITUTION_CONTROLE', null, 'MI',
     "Conseiller les pouvoirs publics sur les questions économiques et sociales."],
    ['ARMP', 'Autorité de Régulation des Marchés Publics', 'INSTITUTION_CONTROLE', null, 'MI',
     "Réguler et contrôler la passation des marchés publics."],
    ['BCC', 'Banque Centrale du Congo', 'AGENCE', null, 'MI',
     "Émettre la monnaie nationale, conduire la politique monétaire et superviser le secteur bancaire."],
    ['TRESOR', 'Trésor Public', 'AGENCE', financesId, 'MI',
     "Exécuter les opérations de recettes et de dépenses de l'État, gérer la trésorerie nationale."],
    ['DGDA', 'Direction Générale des Douanes et Accises', 'AGENCE', financesId, 'MI',
     "Percevoir les droits de douane et accises, contrôler les échanges commerciaux transfrontaliers."],
    ['FARDC', 'Forces Armées de la République Démocratique du Congo', 'AGENCE', null, 'MI',
     "Assurer la défense de l'intégrité du territoire national et de la souveraineté de l'État."],
    ['PNC', 'Police Nationale Congolaise', 'AGENCE', null, 'MI',
     "Assurer la sécurité publique, l'ordre public et l'application des lois sur le territoire national."],
    ['DGM', 'Direction Générale de Migration', 'AGENCE', null, 'MI',
     "Contrôler les mouvements migratoires et la police des frontières."],
  ];

  let nouvellesInstitutionsCrees = 0;
  for (const [code, nom, typeCode, parentId, roleCode, missionTxt] of NOUVELLES_INSTITUTIONS) {
    const typeRow = await db.get(`SELECT id FROM organization_type WHERE code=?`, [typeCode]);
    const orgId = uuid();
    await db.run(ORG_SQL, [orgId, code, nom, typeRow.id, parentId, 1, `Institution nationale : ${nom}.`]);
    await creerCompteInstitution(orgId, nom, 'Directeur Général', roleCode, missionTxt);
    nouvellesInstitutionsCrees++;
  }
  console.log(`✓ ${nouvellesInstitutionsCrees} institutions nationales majeures ajoutées (CSM, CSAC, CES, ARMP, BCC, Trésor Public, DGDA, FARDC, PNC, DGM)`);

  const processId = uuid();
  await db.run(`INSERT INTO process (process_id,organization_id,nom,version) VALUES (?,?,?,?)`,
    [processId, financesId, "Élaboration et exécution du budget", "1.0"]);
  const STEPS = [[1,"Cadrage macro-budgétaire","Ministère du Budget"],[2,"Arbitrages sectoriels","Primature"],
    [3,"Vote du budget","Assemblée Nationale / Sénat"],[4,"Exécution des dépenses","Ministères"],
    [5,"Contrôle et audit","IGF / Cour des Comptes"]];
  for (const [ordre,nom,acteur] of STEPS) {
    await db.run(`INSERT INTO process_step (step_id,process_id,ordre,nom,acteur_role) VALUES (?,?,?,?,?)`,
      [uuid(), processId, ordre, nom, acteur]);
  }

  const portalId = uuid();
  await db.run(`INSERT INTO portal (portal_id,organization_id,nom,theme_couleur) VALUES (?,?,?,?)`,
    [portalId, financesId, "Portail Ministère des Finances", "#1A6B3C"]);
  const dashId = uuid();
  await db.run(`INSERT INTO dashboard (dashboard_id,portal_id,nom,type) VALUES (?,?,?,?)`,
    [dashId, portalId, "Tableau de bord Finances", "ministeriel"]);
  const moduleId = uuid();
  await db.run(`INSERT INTO module (module_id,dashboard_id,nom,categorie) VALUES (?,?,?,?)`,
    [moduleId, dashId, "Budget", "Finances Publiques"]);
  const menuId = uuid();
  await db.run(`INSERT INTO menu (menu_id,module_id,parent_menu_id,libelle,icone,ordre) VALUES (?,?,?,?,?,?)`,
    [menuId, moduleId, null, "Recettes DGI", "ti-file-invoice", 1]);
  const pageId = uuid();
  await db.run(`INSERT INTO page (page_id,menu_id,nom,route,composant,permission_code) VALUES (?,?,?,?,?,?)`,
    [pageId, menuId, "Recettes DGI", "/finances/recettes-dgi", "RecettesDGIPage", "page:fiscalite:read"]);
  const widgetId = uuid();
  await db.run(`INSERT INTO widget (widget_id,page_id,type,position,largeur,hauteur) VALUES (?,?,?,?,?,?)`,
    [widgetId, pageId, "kpi", 1, 3, 1]);
  await db.run(`INSERT INTO kpi (kpi_id,widget_id,nom,formule,source,frequence) VALUES (?,?,?,?,?,?)`,
    [uuid(), widgetId, "Recettes DGI du mois", "SUM(recette.montant) WHERE mois=courant", "systeme_fiscal_dgi", "journalier"]);

  console.log('✓ Structures internes peuplées : unités, postes, affectations, missions, processus, chaîne portail→KPI');

  // Catalogue de responsabilités — réutilisable, une même responsabilité peut être
  // partagée entre plusieurs institutions (ex. "Contrôler" : Sénat ET Assemblée Nationale)
  const RESP_CATALOGUE = [
    ["Gouverner", "Gouverner"],
    ["Superviser", "Contrôler"],
    ["Coordonner", "Coordonner"],
    ["Exécuter le Programme du Gouvernement", "Exécuter"],
    ["Contrôler l'action gouvernementale", "Contrôler"],
    ["Exécuter la politique fiscale", "Exécuter"],
    ["Auditer les finances publiques", "Contrôler"],
  ];
  const respIds = {};
  for (const [libelle, cat] of RESP_CATALOGUE) {
    const id = uuid();
    respIds[libelle] = id;
    await db.run(`INSERT INTO responsabilite (responsabilite_id,libelle,categorie) VALUES (?,?,?)`, [id, libelle, cat]);
  }
  const RESP_LINKS = [
    [presidenceId, "Gouverner"], [presidenceId, "Superviser"],
    [primatureId, "Coordonner"], [primatureId, "Exécuter le Programme du Gouvernement"],
    // "Contrôler l'action gouvernementale" est une VRAIE responsabilité partagée : les deux
    // chambres du Parlement l'exercent, chacune de son côté — exactement ce que le modèle
    // many-to-many permet de représenter, sans dupliquer le libellé.
    [senatId, "Contrôler l'action gouvernementale"],
    [anId, "Contrôler l'action gouvernementale"],
    [financesId, "Exécuter la politique fiscale"],
    [igfId, "Auditer les finances publiques"],
  ];
  for (const [orgId, libelle] of RESP_LINKS) {
    await db.run(`INSERT INTO organization_responsabilite (organization_id,responsabilite_id) VALUES (?,?)`,
      [orgId, respIds[libelle]]);
  }

  const GOV_RELS = [
    [primatureId, presidenceId, "RENDCOMPTE_A"], [financesId, primatureId, "RATTACHE_A"],
    [primatureId, financesId, "COORDONNE"], [senatId, primatureId, "CONTROLE"],
    [anId, primatureId, "CONTROLE"], [igfId, financesId, "CONTROLE"], [igfId, presidenceId, "APPUIE"],
  ];
  for (const [src, tgt, type] of GOV_RELS) {
    await db.run(`INSERT INTO gov_relation (gov_relation_id,source_org_id,target_org_id,type_relation) VALUES (?,?,?,?)`,
      [uuid(), src, tgt, type]);
  }

  // ── Relations structurelles systématiques : tous les ministères et provinces rattachés à la Primature,
  // sous le contrôle de l'IGF — puis un vrai cycle de gouvernance (instruction→...→suivi) par ministère ──
  for (const minId of ministereIds) {
    if (minId === financesId) continue; // déjà relié plus haut
    await db.run(`INSERT INTO gov_relation (gov_relation_id,source_org_id,target_org_id,type_relation) VALUES (?,?,?,?)`,
      [uuid(), minId, primatureId, 'RATTACHE_A']);
    await db.run(`INSERT INTO gov_relation (gov_relation_id,source_org_id,target_org_id,type_relation) VALUES (?,?,?,?)`,
      [uuid(), igfId, minId, 'CONTROLE']);
  }
  const allProvinceOrgIds = provinceOrgs.map(p => p.organization_id);
  for (const provId of allProvinceOrgIds) {
    await db.run(`INSERT INTO gov_relation (gov_relation_id,source_org_id,target_org_id,type_relation) VALUES (?,?,?,?)`,
      [uuid(), provId, primatureId, 'RATTACHE_A']);
  }
  console.log(`✓ Relations structurelles ajoutées : ${ministereIds.length - 1} ministères + ${allProvinceOrgIds.length} provinces rattachés à la Primature, sous contrôle IGF`);

  // Cycle de gouvernance complet (instruction → plan_action → activité → rapport →
  // contrôle → audit → recommandation → décision → suivi) pour chacun des 42 ministères.
  // Contenu générique et systématique — pas individuellement rédigé comme l'exemple DGI plus haut.
  for (let i = 0; i < MINISTERES.length; i++) {
    const [nomMin] = MINISTERES[i];
    const minId = ministereIds[i];

    const instrId2 = uuid();
    await db.run(`INSERT INTO instruction (instruction_id,emetteur_org_id,destinataire_org_id,titre,contenu,type,echeance,statut) VALUES (?,?,?,?,?,?,?,?)`,
      [instrId2, primatureId, minId, `Mise en œuvre du plan d'action sectoriel 2027 — ${nomMin}`,
       `Exécuter les priorités du portefeuille ${nomMin} conformément au Programme du Gouvernement.`,
       'CIRCULAIRE', '2027-12-31', 'EN_COURS']);

    const planId2 = uuid();
    await db.run(`INSERT INTO plan_action (plan_action_id,instruction_id,organization_id,titre,statut) VALUES (?,?,?,?,?)`,
      [planId2, instrId2, minId, `Plan d'action ${nomMin} — 2027`, 'EN_COURS']);

    await db.run(`INSERT INTO activite (activite_id,plan_action_id,nom,avancement_pct) VALUES (?,?,?,?)`,
      [uuid(), planId2, `Mise en œuvre des priorités sectorielles — ${nomMin}`, 45]);

    const rapportId2 = uuid();
    await db.run(`INSERT INTO rapport (rapport_id,organization_id,destinataire_org_id,instruction_id,plan_action_id,titre,synthese,periode) VALUES (?,?,?,?,?,?,?,?)`,
      [rapportId2, minId, primatureId, instrId2, planId2, `Rapport d'exécution T1 2027 — ${nomMin}`,
       `Exécution du plan d'action en cours, globalement conforme au calendrier prévisionnel.`, '2027-T1']);

    const controleId2 = uuid();
    await db.run(`INSERT INTO controle (controle_id,organe_controle_id,organisation_controlee_id,type,objet,statut) VALUES (?,?,?,?,?,?)`,
      [controleId2, igfId, minId, 'ADMINISTRATIF', `Contrôle de routine — ${nomMin}`, 'CLOTURE']);

    const auditId2 = uuid();
    await db.run(`INSERT INTO audit_mission (audit_id,controle_id,perimetre,conclusion,rapport_final) VALUES (?,?,?,?,?)`,
      [auditId2, controleId2, nomMin, 'CONFORME', `Aucune anomalie majeure détectée sur le périmètre contrôlé.`]);

    const recoId2 = uuid();
    await db.run(`INSERT INTO recommandation (recommandation_id,audit_id,libelle,priorite,organisation_responsable_id) VALUES (?,?,?,?,?)`,
      [recoId2, auditId2, `Poursuivre le suivi budgétaire trimestriel — ${nomMin}.`, 'MOYENNE', minId]);

    const decisionId2 = uuid();
    await db.run(`INSERT INTO decision (decision_id,organization_id,recommandation_id,rapport_id,titre,type) VALUES (?,?,?,?,?,?)`,
      [decisionId2, primatureId, recoId2, rapportId2, `Validation du rapport d'exécution — ${nomMin}`, 'ORIENTATION']);

    await db.run(`INSERT INTO suivi (suivi_id,recommandation_id,decision_id,statut,commentaire) VALUES (?,?,?,?,?)`,
      [uuid(), recoId2, decisionId2, 'EN_COURS', `Mise en œuvre conforme au calendrier — ${nomMin}.`]);
  }
  console.log(`✓ Cycle de gouvernance complet (instruction→...→suivi) créé pour les ${MINISTERES.length} ministères`);

  // ── Enrichissement Mission + Responsabilités par ministère, à partir du contenu réel fourni ──
  // (contenu explicitement donné dans le document ; les ministères non couverts par le
  // document gardent leur mission générique déjà attribuée, pas de contenu inventé)
  const FICHES_MINISTERES = [
    ["Intérieur", "Garantir la sécurité intérieure, l'administration du territoire et la protection des populations.",
      ["Maintenir l'ordre public.", "Administrer le territoire national.", "Superviser les gouverneurs et les autorités territoriales.",
       "Organiser les élections avec les institutions compétentes.", "Gérer l'état civil.", "Assurer la protection civile.",
       "Gérer les catastrophes naturelles.", "Superviser la Police Nationale.", "Gérer les frontières intérieures.",
       "Coordonner les services de sécurité civile."]],
    ["Défense nationale", "Assurer la défense de la souveraineté nationale.",
      ["Élaborer la politique de défense.", "Commander les Forces Armées.", "Assurer la défense du territoire.",
       "Gérer les équipements militaires.", "Former les militaires.", "Coopération militaire internationale.",
       "Sécurité des frontières.", "Planification stratégique militaire.", "Logistique militaire.", "Cyberdéfense."]],
    ["Justice et Garde des Sceaux", "Garantir l'État de droit.",
      ["Élaborer la politique judiciaire.", "Administrer les établissements pénitentiaires.", "Superviser les professions judiciaires.",
       "Exécuter les décisions de justice.", "Protéger les droits fondamentaux.", "Lutter contre la corruption.",
       "Moderniser la justice.", "Gérer les casiers judiciaires.", "Coopération judiciaire internationale."]],
    ["Affaires Étrangères", "Conduire la politique étrangère.",
      ["Relations diplomatiques.", "Gestion des ambassades.", "Coopération internationale.", "Négociation des traités.",
       "Protection des ressortissants.", "Gestion des organisations internationales.", "Diplomatie économique.", "Diplomatie culturelle."]],
    ["Finances", "Gérer les finances publiques.",
      ["Gestion du Trésor Public.", "Politique fiscale.", "Comptabilité publique.", "Dette publique.", "Paiements de l'État.",
       "Gestion de la trésorerie.", "Supervision bancaire.", "Mobilisation des recettes.", "Prévisions financières."]],
    ["Budget", "Préparer et contrôler le budget national.",
      ["Élaborer le budget de l'État.", "Répartir les crédits.", "Contrôler l'exécution budgétaire.", "Arbitrage budgétaire.",
       "Prévisions budgétaires.", "Évaluation des dépenses.", "Rapports budgétaires."]],
    ["Économie nationale", null,
      ["Politique économique.", "Croissance économique.", "Régulation des marchés.", "Prix.", "Concurrence.", "Consommation.",
       "Promotion des investissements.", "Veille économique.", "Statistiques économiques."]],
    ["Plan et Coordination", null,
      ["Plan National de Développement.", "Programmation des investissements.", "Planification stratégique.",
       "Coordination des projets.", "Statistiques nationales.", "Suivi-évaluation.", "Coopération avec les partenaires."]],
    ["Économie numérique", null,
      ["Transformation numérique.", "Gouvernement électronique.", "Interopérabilité.", "Cybersécurité.", "Intelligence artificielle.",
       "Cloud gouvernemental.", "Centres de données.", "Gouvernance des données.", "Identité numérique.",
       "Signature électronique.", "Archivage électronique.", "Innovation numérique."]],
    ["Santé publique", null,
      ["Politique sanitaire.", "Hôpitaux.", "Vaccination.", "Lutte contre les épidémies.", "Santé maternelle.",
       "Santé infantile.", "Médicaments.", "Assurance maladie.", "Santé numérique."]],
    ["Éducation nationale", null,
      ["Enseignement primaire.", "Enseignement secondaire.", "Programmes scolaires.", "Examens.", "Écoles publiques.",
       "Enseignants.", "Inspection scolaire.", "Numérisation de l'éducation."]],
    ["Enseignement Supérieur", null,
      ["Universités.", "Recherche scientifique.", "Innovation.", "Accréditation.", "Bourses.",
       "Coopération universitaire.", "Transformation numérique des universités."]],
    ["Agriculture et Sécurité alimentaire", null,
      ["Production agricole.", "Sécurité alimentaire.", "Coopératives.", "Irrigation.", "Mécanisation.",
       "Recherche agricole.", "Développement rural."]],
    ["Pêche et Élevage", null,
      ["Ressources halieutiques.", "Aquaculture.", "Contrôle des pêches.", "Protection des lacs et fleuves.",
       "Développement de la pêche artisanale.", "Production animale.", "Santé animale.", "Contrôle vétérinaire.",
       "Filières bovine, ovine et avicole.", "Sécurité sanitaire."]],
    ["Mines", null,
      ["Politique minière.", "Cadastre minier.", "Permis miniers.", "Contrôle de la production.",
       "Traçabilité des minerais.", "Fiscalité minière.", "Inspection des mines."]],
    ["Hydrocarbures", null,
      ["Exploration pétrolière.", "Production.", "Raffinage.", "Distribution.", "Contrats pétroliers.", "Régulation du secteur."]],
    ["Ressources hydrauliques et Électricité", null,
      ["Électricité.", "Énergies renouvelables.", "Réseaux électriques.", "Électrification rurale.", "Production énergétique.",
       "Eau potable.", "Barrages.", "Irrigation.", "Gestion des bassins versants.", "Assainissement."]],
    ["Environnement et Développement durable", null,
      ["Forêts.", "Biodiversité.", "Changement climatique.", "Aires protégées.", "Lutte contre la pollution."]],
    ["Industrie et Développement des PME", null,
      ["Politique industrielle.", "Zones industrielles.", "Transformation locale.", "Normalisation.", "Compétitivité."]],
    ["Commerce Extérieur", null,
      ["Politique commerciale extérieure.", "Exportations.", "Importations.", "Accords commerciaux.", "Promotion des exportations."]],
    ["Entrepreneuriat", null,
      ["Développement des PME.", "Création d'entreprises.", "Financement.", "Incubation.", "Innovation entrepreneuriale."]],
    ["Emploi et Travail", null,
      ["Politique de l'emploi.", "Marché du travail.", "Placement.", "Inspection du travail."]],
    ["Formation professionnelle", null,
      ["Formation technique et professionnelle.", "Certification des compétences.", "Centres de formation.",
       "Apprentissage.", "Insertion professionnelle."]],
    ["Infrastructures et Travaux publics", null,
      ["Routes nationales.", "Ponts.", "Autoroutes.", "Bâtiments publics.", "Grands travaux.", "Entretien des infrastructures.",
       "Construction publique.", "Entretien du patrimoine immobilier de l'État.", "Contrôle des ouvrages publics."]],
    ["Transports et Voies de communication", null,
      ["Transport routier.", "Transport ferroviaire.", "Transport fluvial.", "Transport maritime.",
       "Transport aérien.", "Sécurité des transports."]],
    ["Urbanisme et Habitat", null,
      ["Aménagement urbain.", "Plans directeurs.", "Permis de construire.", "Développement des villes.",
       "Politique du logement.", "Habitat social.", "Normes de construction.", "Programmes immobiliers."]],
    ["Affaires foncières", null,
      ["Cadastre.", "Titres fonciers.", "Conservation foncière.", "Litiges fonciers.", "Domaine de l'État."]],
    ["Tourisme", null,
      ["Promotion touristique.", "Sites touristiques.", "Hôtellerie.", "Investissements touristiques."]],
    ["Culture et Arts", null,
      ["Patrimoine culturel.", "Arts.", "Musées.", "Bibliothèques.", "Industries culturelles."]],
    ["Communication et Médias", null,
      ["Communication gouvernementale.", "Information publique.", "Médias.", "Relations avec la presse.", "Communication numérique."]],
    ["Jeunesse et Éveil Patriotique", null,
      ["Insertion des jeunes.", "Volontariat.", "Entrepreneuriat des jeunes.", "Vie associative."]],
    ["Sports et Loisirs", null,
      ["Politique sportive.", "Fédérations.", "Infrastructures sportives.", "Sport de haut niveau."]],
    ["Affaires sociales", null,
      ["Protection sociale.", "Assistance aux personnes vulnérables.", "Inclusion sociale.", "Aide humanitaire."]],
    ["Genre et Famille", null,
      ["Égalité femmes-hommes.", "Protection des droits des femmes.", "Lutte contre les violences basées sur le genre.",
       "Autonomisation économique."]],
  ];

  const normFR2 = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let ministeresEnrichis = 0, responsabilitesAjoutees = 0;
  for (const [motCle, missionSpecifique, respList] of FICHES_MINISTERES) {
    const idx = MINISTERES.findIndex(([nom]) => normFR2(nom).includes(normFR2(motCle)));
    if (idx === -1) continue;
    const minOrgId = ministereIds[idx];

    if (missionSpecifique) {
      await db.run(`UPDATE mission SET libelle=? WHERE mission_id IN (
        SELECT mission_id FROM organization_mission WHERE organization_id=?
      )`, [missionSpecifique, minOrgId]);
    }
    for (const respLibelle of respList) {
      const respId = uuid();
      await db.run(`INSERT INTO responsabilite (responsabilite_id,libelle,categorie) VALUES (?,?,?)`,
        [respId, respLibelle, 'Sectoriel']);
      await db.run(`INSERT INTO organization_responsabilite (organization_id,responsabilite_id) VALUES (?,?)`,
        [minOrgId, respId]);
      responsabilitesAjoutees++;
    }
    ministeresEnrichis++;
  }

  // Directions réelles pour le Ministère de l'Intérieur, seul à en avoir une liste explicite fournie
  const interieurIdx = MINISTERES.findIndex(([nom]) => normFR2(nom).includes('interieur'));
  if (interieurIdx !== -1) {
    const interieurId = ministereIds[interieurIdx];
    const DIRECTIONS_INTERIEUR = [
      'Direction de l\'Administration Territoriale', 'Direction des Affaires Politiques',
      'Direction de l\'État Civil', 'Direction de la Protection Civile', 'Direction des Collectivités Locales',
    ];
    for (let i = 0; i < DIRECTIONS_INTERIEUR.length; i++) {
      await db.run(`INSERT INTO unit (unit_id,organization_id,parent_unit_id,code,nom,type,ordre) VALUES (?,?,?,?,?,?,?)`,
        [uuid(), interieurId, null, 'DIR-'+i, DIRECTIONS_INTERIEUR[i], 'Direction', i+1]);
    }
  }

  console.log(`✓ ${ministeresEnrichis} ministères enrichis avec mission et responsabilités réelles (${responsabilitesAjoutees} responsabilités ajoutées), 5 directions réelles pour l'Intérieur`);

  const pngieProgId = uuid();
  await db.run(`INSERT INTO programme (programme_id,organization_id,nom,description,date_debut,date_fin,statut,budget_usd) VALUES (?,?,?,?,?,?,?,?)`,
    [pngieProgId, presidenceId, "Programme National de Gouvernance Numérique (PNGIE-RDC)",
     "Schéma directeur national de digitalisation de l'État — 2027-2032.", "2027-01-01", "2032-12-31", "EN_COURS", 750000000]);

  const PROJETS = [
    ["Plateforme de gestion des identités et de l'état civil", null, 25],
    ["Système intégré de gestion des finances publiques", financesId, 15],
    ["Portail national des services numériques citoyens", null, 5],
  ];
  for (const [nom, orgId, avancement] of PROJETS) {
    await db.run(`INSERT INTO projet (projet_id,programme_id,organization_id,nom,date_debut,avancement_pct,statut,budget_usd) VALUES (?,?,?,?,?,?,?,?)`,
      [uuid(), pngieProgId, orgId, nom, "2027-01-01", avancement, "EN_COURS", 50000000]);
  }
  console.log('✓ Programme PNGIE-RDC et 3 projets rattachés peuplés');

  console.log('✓ Responsabilités et relations de gouvernance peuplées');

  await db.run(`INSERT INTO activite (activite_id,plan_action_id,nom,avancement_pct) VALUES (?,?,?,?)`,
    [uuid(), planId, "Rapprochement DGI-Trésor — 2 provinces pilotes", 60]);
  await db.run(`INSERT INTO activite (activite_id,plan_action_id,nom,avancement_pct) VALUES (?,?,?,?)`,
    [uuid(), planId, "Formation des agents DGI au nouveau protocole", 100]);

  const kpiRow = await db.get(`SELECT kpi_id FROM kpi LIMIT 1`);
  if (kpiRow) {
    await db.run(`INSERT INTO kpi_valeur (kpi_valeur_id,kpi_id,organization_id,valeur,periode) VALUES (?,?,?,?,?)`,
      [uuid(), kpiRow.kpi_id, financesId, 78, '2027-T1']);
    await db.run(`INSERT INTO kpi_valeur (kpi_valeur_id,kpi_id,organization_id,valeur,periode) VALUES (?,?,?,?,?)`,
      [uuid(), kpiRow.kpi_id, financesId, 82, '2027-T2']);
  }
  console.log('✓ Activités et valeurs de KPI dans le temps peuplées');
  console.log('✓', MINISTERES.length, 'ministères,', PROVINCES.length, 'provinces,', ROLES.length, 'rôles');
  console.log(`✓ Moteur de base de données : ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);
  console.log('✓ Comptes démo (mot de passe pour tous : "'+DEMO_PASSWORD+'") :');
  for (const [code] of ROLES) console.log('   -', code.toLowerCase()+'@rdc.gouv.cd');

  const seedExtension = require('./seed-extension');
  await seedExtension();

  await db.close();
}

main().catch(e => { console.error('Échec du seed:', e); process.exit(1); });
