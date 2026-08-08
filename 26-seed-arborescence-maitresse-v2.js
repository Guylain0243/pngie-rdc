// ==============================================================
// ARBORESCENCE MAITRESSE DEFINITIVE - PNGIE-RDC (v2)
//
// Reconstruit entierement la table referentiel_arborescence selon
// le schema maitre definitif (15 sections, 00 a 14), puis RATTACHE
// tout ce qui avait deja ete construit (32 domaines, 9 plateformes,
// 35 entites fonctionnelles, referentiels, registres, moteurs,
// niveaux de decomposition) aux bons noeuds de cette structure.
//
// ATTENTION : ce script VIDE la table referentiel_arborescence
// avant de la reconstruire (nomenclature uniquement - aucune
// donnee metier reelle n'est touchee : meta_entity, les tables
// generees, les enregistrements crees restent intacts).
//
// Usage : node 26-seed-arborescence-maitresse-v2.js
// A executer depuis C:\pngie-rdc\pngie-backend
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');
const uuid = () => crypto.randomUUID();

async function creerTable() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS referentiel_arborescence (
            noeud_id TEXT PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            nom TEXT NOT NULL,
            type TEXT NOT NULL,
            parent_code TEXT,
            niveau INTEGER NOT NULL,
            description TEXT,
            statut TEXT DEFAULT 'ACTIF',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function reinitialiser() {
    await db.run('DELETE FROM referentiel_arborescence');
    console.log('OK - Table "referentiel_arborescence" reinitialisee (nomenclature uniquement).');
}

async function noeud(code, nom, type, parentCode, niveau, description) {
    await db.run(
        `INSERT INTO referentiel_arborescence (noeud_id, code, nom, type, parent_code, niveau, description)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), code, nom, type, parentCode || null, niveau, description || null]
    );
    console.log(`+-- [${type}] ${code} : ${nom}`);
}

// Insere une section maitresse (00-14) et ses sous-elements directs
async function section(code, nom, sousElements) {
    await noeud(code, nom, 'SECTION_MAITRESSE', 'ROOT', 1, null);
    let i = 1;
    const codesEnfants = [];
    for (const item of sousElements) {
        const sousCode = `${code}-${i++}`;
        await noeud(sousCode, item, 'SOUS_SECTION', code, 2, null);
        codesEnfants.push(sousCode);
    }
    return codesEnfants; // utile pour rattacher du contenu plus loin
}

async function main() {
    await creerTable();
    await reinitialiser();

    await noeud('ROOT', 'PNGIE-RDC', 'PROGRAMME', null, 0,
        "Plateforme Nationale de Gestion Integree de l'Etat de la RDC - Arborescence maitresse definitive");

    // ============================================================
    // LES 15 SECTIONS MAITRESSES (00 A 14) - structure exacte fournie
    // ============================================================

    await section('SEC-00', 'Vision Nationale',
        ['Vision', 'Mission', 'Objectifs', 'Stratégie', 'Gouvernance', 'Roadmap']);

    await section('SEC-01', "Architecture d'Entreprise",
        ['Principes', 'Urbanisation', 'Cartographie', 'Capacités', 'Gouvernance']);

    const enfants02 = await section('SEC-02', 'Architecture Organisationnelle',
        ['État', 'Organigrammes', 'Structures', 'Directions', 'Services', 'Agents']);
    // Sous-elements de "État" (SEC-02-1)
    const sousEtat = ['Présidence', 'Primature', 'Parlement', 'Justice',
        'Institutions Constitutionnelles', 'Ministères', 'Provinces', 'ETD'];
    let i02 = 1;
    for (const item of sousEtat) {
        await noeud(`SEC-02-1-${i02++}`, item, 'COMPOSANT', 'SEC-02-1', 3, null);
    }

    const enfants03 = await section('SEC-03', 'Architecture Métier',
        ['Domaines', 'Sous-domaines', 'Capacités', 'Services', 'Processus',
         'Sous-processus', 'Procédures', 'Activités', 'Tâches']);

    const enfants04 = await section('SEC-04', 'Architecture Fonctionnelle',
        ['Plateformes', 'Modules', 'Sous-modules', 'Fonctions', "Cas d'utilisation",
         'Écrans', 'Formulaires', 'Rapports', 'Tableaux de bord', 'KPI']);

    const enfants05 = await section('SEC-05', 'Architecture Applicative',
        ['Applications', 'Microservices', 'API', 'GraphQL', 'ESB', 'API Gateway',
         'Event Bus', 'Workflows BPMN', 'Notifications', 'Intégrations']);

    const enfants06 = await section('SEC-06', 'Architecture des Données',
        ['Référentiels Nationaux', 'Registres Nationaux', 'Dictionnaire de données',
         'MCD', 'MLD', 'MPD', 'PostgreSQL', 'Neo4j', 'Redis', 'Data Warehouse',
         'Data Lake', 'Métadonnées', 'Historisation', 'Archivage', 'Gouvernance des données']);

    await section('SEC-07', 'Architecture Technique',
        ['Infrastructure', 'Datacenters', 'Cloud Gouvernemental', 'Réseau National',
         'Docker', 'Kubernetes', 'Kafka', 'Elastic', 'Monitoring', 'Observabilité',
         'DevSecOps', 'CI/CD']);

    await section('SEC-08', 'Architecture Sécurité',
        ['IAM', 'RBAC', 'ABAC', 'MFA', 'PKI', 'Signature électronique', 'Chiffrement',
         'Journalisation', 'Audit', 'SIEM', 'SOC', 'CERT', 'Gestion des risques', 'PCA', 'PRA']);

    await section('SEC-09', "Architecture d'Interopérabilité",
        ['API', 'Services', 'Échanges', 'Standards', 'Connecteurs', 'Synchronisation']);

    await section('SEC-10', 'Architecture Décisionnelle',
        ['BI', 'Data Warehouse', 'Analytics', 'IA', 'Machine Learning', 'Prévisions', 'Dashboards', 'KPI']);

    await section('SEC-11', 'Architecture Documentaire',
        ['GED', 'Documents', 'OCR', 'Archivage', 'Recherche', 'Signature']);

    await section('SEC-12', "Architecture d'Exploitation",
        ['Déploiement', 'Exploitation', 'Supervision', 'Sauvegarde', 'Maintenance',
         'Support', 'Qualité', 'Tests', 'Formation']);

    const enfants13 = await section('SEC-13', 'Référentiels Nationaux',
        ['Institutions', 'Organigrammes', 'Agents', 'Citoyens', 'Entreprises', 'Fournisseurs',
         'Budgets', 'Comptabilité', 'Fiscalité', 'Douanes', 'Patrimoine', 'Documents',
         'Lois', 'Paramètres', 'Codes Nationaux']);

    await section('SEC-14', 'Documentation',
        ['Architecture', 'SFG', 'SFD', 'DCD', 'BPMN', 'UML', 'OpenAPI', 'Guides',
         'Procédures', 'Tests', 'Exploitation']);

    console.log('\nOK - Les 15 sections maitresses (00-14) sont en place.\n');

    // ============================================================
    // RATTACHEMENT DE L'EXISTANT AUX BONS NOEUDS
    // ============================================================

    // --- 32 domaines metier -> sous SEC-03-1 (Domaines) ---
    const DOMAINES = [
        'Gouvernance', 'Administration', 'Citoyens', 'Entreprises', 'Ressources Humaines',
        'Budget', 'Trésor', 'Comptabilité', 'Fiscalité', 'Douanes', 'Patrimoine',
        'Marchés Publics', 'Investissements / Projets', 'Justice', 'Sécurité', 'Défense',
        'Santé', 'Éducation', 'Agriculture', 'Mines', 'Énergie', 'Commerce', 'Industrie',
        'Transport', 'Télécommunications', 'Environnement', 'Culture', 'Sports',
        'Recherche', 'Coopération', 'Planification', 'Statistiques',
    ];
    let iDom = 1;
    for (const nom of DOMAINES) {
        await noeud(`SEC-03-1-${iDom++}`, nom, 'DOMAINE', 'SEC-03-1', 3, `Domaine metier rattache a Architecture Metier > Domaines`);
    }

    // --- 9 plateformes nationales (+ composants) -> sous SEC-04-1 (Plateformes) ---
    const PLATEFORMES = [
        ["Plateforme Nationale d'Identité (PNI)", [
            'CNI','Passeport','Permis','Électeur','Fonctionnaire','Militaire','Policier','Magistrat','Étudiant','Entreprise','Résident étranger']],
        ['Plateforme Nationale des Finances (PNF)', [
            'Budget','Trésor','BCC','DGI','DGDA','DGRAD','Marchés Publics','Dette','Subventions','Provinces','ETD']],
        ['Plateforme Nationale RH (PNRH)', [
            'Recrutement','Nomination','Mutation','Promotion','Paie','Retraite','Discipline','Présence','Formation','Évaluation']],
        ['Plateforme Nationale du Patrimoine', [
            'Terrains','Immeubles','Véhicules','Routes','Ponts','Écoles','Hôpitaux','Barrages','Réseaux','Matériels']],
        ['Plateforme Nationale des Projets', [
            'Étude','Budget','Appel d\'offres','Contrat','Exécution','Paiement','Contrôle','Réception','Maintenance']],
        ['Plateforme Nationale des Contrôles', [
            'IGF','Cour des Comptes','Inspection Interne','Audit','Contrôle Financier','Contrôle Qualité','Anti-Fraude']],
        ['Plateforme Nationale de Sécurité', [
            'Cybersécurité','Gestion des accès','Authentification','Biométrie','Journal','Alertes','SOC','CERT']],
        ['Plateforme Nationale des Données', [
            'PostgreSQL','Neo4j','Data Warehouse','Data Lake','IA','Big Data','API','Open Data']],
        ['Plateforme Nationale de Gouvernance', [
            'Finances','Budget','Santé','Justice','Éducation','Agriculture','Mines','Énergie','Numérique','Sécurité','Provinces','ETD']],
    ];
    let iPlat = 1;
    for (const [nomPlat, composants] of PLATEFORMES) {
        const codePlat = `SEC-04-1-${iPlat++}`;
        await noeud(codePlat, nomPlat, 'PLATEFORME', 'SEC-04-1', 3, null);
        let iComp = 1;
        for (const comp of composants) {
            await noeud(`${codePlat}-${iComp++}`, comp, 'COMPOSANT_PLATEFORME', codePlat, 4, null);
        }
    }

    // --- Registres nationaux -> sous SEC-06-2 (Registres Nationaux) ---
    const REGISTRES = [
        'Registre National des Personnes','Registre CNI','Registre Biométrique',
        'Registre National des Agents Publics','Registre des Institutions',
        'Registre des Comptes Publics','Registre des Actifs','Registre des Véhicules',
        'Registre des Bâtiments','Registre des Terrains','Registre des Contrats',
        'Registre des Fournisseurs','Registre des Projets','Registre des Décisions',
        'Registre des Journaux','Registre des Autorisations',
    ];
    let iReg = 1;
    for (const nom of REGISTRES) {
        await noeud(`SEC-06-2-${iReg++}`, nom, 'REGISTRE', 'SEC-06-2', 3, null);
    }

    // --- Complements aux Referentiels Nationaux (SEC-13) non deja listes ---
    const REFERENTIELS_COMPLEMENT = [
        'Comptes / Plans comptables','Programmes / Actions','Contrats','Marchés publics',
        'Décisions','Processus','KPI','Risques','Contrôles','API / Échanges','Incidents',
    ];
    let iRefC = 16; // suite de SEC-13-1 a SEC-13-15 deja utilises par les sous-elements
    for (const nom of REFERENTIELS_COMPLEMENT) {
        await noeud(`SEC-13-${iRefC++}`, nom, 'REFERENTIEL', 'SEC-13', 2, 'Complement au referentiel national de base');
    }

    // --- Moteurs transversaux -> repartis selon leur section naturelle ---
    // (Workflows/Notifications/Integrations sous SEC-05, IAM/Securite deja
    // couverts par SEC-08 ; on rattache ici les moteurs non deja nommes)
    const MOTEURS_A_RATTACHER = [
        ['GED / OCR / Recherche', 'SEC-11'],       // Architecture Documentaire
        ['Audit / Journalisation', 'SEC-08'],       // Architecture Securite
        ['BI / IA', 'SEC-10'],                      // Architecture Decisionnelle
        ['Cache / Synchronisation', 'SEC-09'],      // Interoperabilite
        ['Archivage / Sauvegarde', 'SEC-12'],       // Exploitation
        ['Monitoring', 'SEC-07'],                   // Technique
    ];
    let iMot = 1;
    for (const [nom, parent] of MOTEURS_A_RATTACHER) {
        await noeud(`MOT-RATT-${iMot++}`, nom, 'MOTEUR_TRANSVERSAL', parent, 2, 'Moteur transversal rattache a sa section naturelle');
    }

    // --- Methodologie : les 25 niveaux de decomposition -> sous SEC-01-3 (Cartographie) ---
    const NIVEAUX = [
        'ÉTAT','DOMAINES','SOUS-DOMAINES','CAPACITÉS','SERVICES PUBLICS','PROCESSUS',
        'SOUS-PROCESSUS','PROCÉDURES','ACTIVITÉS','TÂCHES',"CAS D'UTILISATION",
        'FONCTIONS','ÉCRANS','COMPOSANTS','API','ÉVÉNEMENTS','DONNÉES',
        'BASES DE DONNÉES','RAPPORTS','KPI','AUDIT','SÉCURITÉ','INFRASTRUCTURE',
        'EXPLOITATION','ÉVOLUTION',
    ];
    for (let idx = 0; idx < NIVEAUX.length; idx++) {
        await noeud(`NIV-${idx}`, `Niveau ${idx} : ${NIVEAUX[idx]}`, 'NIVEAU_DECOMPOSITION', 'SEC-01-3', 3, null);
    }

    // --- Socle technique reellement construit -> sous SEC-05-1 (Applications) ---
    await noeud('SOCLE', 'Government Meta Platform (noyau construit et valide)', 'SOCLE_TECHNIQUE', 'SEC-05-1', 3,
        "Moteur generique : meta_entity, meta_attribute, meta_permission, meta_workflow_transition, entity_event");
    const ENTITES_CONSTRUITES = [
        'Facture', 'Permis Minier', 'Signalement Sanitaire', 'Dossier Judiciaire',
        'Certificat PKI', 'Dossier Recouvrement DGI',
        'Décision Institutionnelle', 'Dossier Administratif', 'Réclamation Citoyenne',
        'Dossier Entreprise', 'Dossier Agent', 'Ligne Budgétaire', 'Ordre de Paiement',
        'Écriture Comptable', 'Déclaration Fiscale', 'Déclaration Douanière',
        'Bien Patrimonial', "Appel d'Offres", 'Dossier Projet', 'Incident Sécuritaire',
        'Dossier Logistique Défense', 'Dossier Scolaire', 'Exploitation Agricole',
        'Raccordement Énergétique', 'Licence Commerciale', 'Autorisation Industrielle',
        'Immatriculation Véhicule', 'Licence Télécom', "Étude d'Impact Environnemental",
        'Bien Culturel Protégé', 'Fédération Sportive', 'Projet de Recherche',
        'Accord de Coopération', 'Plan de Développement', 'Enquête Statistique',
    ];
    let iEnt = 1;
    for (const nom of ENTITES_CONSTRUITES) {
        await noeud(`ENT-${iEnt++}`, nom, 'ENTITE_CONSTRUITE', 'SOCLE', 4,
            'Entite generee et fonctionnelle : table + API + workflow + RBAC + audit');
    }

    const total = await db.get('SELECT COUNT(*) c FROM referentiel_arborescence');
    console.log(`\nOK - Arborescence maitresse definitive reconstruite : ${total.c} noeuds en base.`);
    console.log('Tout l\'existant (32 domaines, 9 plateformes, 35 entites, registres, referentiels, moteurs) est rattache.');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
