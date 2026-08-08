const db = require("./src/db");

const sections = [
  { code: "01", titre: "Principes directeurs de l'architecture d'entreprise", items: [
    "Principe de souverainete numerique","Principe d'interoperabilite par defaut","Principe de reutilisation avant creation","Principe de donnee unique et autoritaire (source of truth)","Principe de securite by design","Principe d'accessibilite universelle","Principe de transparence algorithmique","Principe de sobriete numerique","Principe d'ouverture des standards","Principe de modularite des systemes","Principe de resilience et continuite","Principe de gouvernance partagee","Principe de protection de la vie privee","Principe d'evolutivite (scalabilite)","Principe de traçabilite des decisions architecturales"
  ]},
  { code: "02", titre: "Couche metier (Business Architecture)", items: [
    "Cartographie des processus metier","Chaine de valeur institutionnelle","Modele operationnel cible","Capacites metier transverses","Organigramme fonctionnel de l'Etat","Matrice RACI institutionnelle","Catalogue des services publics","Parcours usager de bout en bout","Indicateurs de performance metier","Gouvernance des processus","Referentiel des roles et responsabilites","Cartographie des partenaires et parties prenantes","Modele de creation de valeur publique","Cycle de vie des politiques publiques","Alignement strategie-operations"
  ]},
  { code: "03", titre: "Couche donnees (Data Architecture)", items: [
    "Modele conceptuel de donnees national","Dictionnaire de donnees gouvernemental","Cartographie des flux de donnees","Gouvernance des donnees maitres (MDM)","Classification de sensibilite des donnees","Cycle de vie des donnees","Qualite et fiabilite des donnees","Referentiel des identifiants uniques","Architecture de stockage des donnees","Strategie de donnees ouvertes (open data)","Interoperabilite semantique des donnees","Lignage des donnees (data lineage)","Politique de retention et archivage","Catalogue de donnees national","Gouvernance de la donnee geospatiale"
  ]},
  { code: "04", titre: "Couche applicative (Application Architecture)", items: [
    "Cartographie du parc applicatif de l'Etat","Registre national des applications","Architecture de reference des applications","Standards de developpement logiciel","Cycle de vie applicatif (SDLC)","Strategie de modernisation applicative","Applications mutualisees transverses","Gestion du portefeuille applicatif","Architecture microservices gouvernementale","Bus d'integration applicatif (ESB)","Gestion des API gouvernementales","Strategie low-code/no-code","Applications mobiles gouvernementales","Gouvernance des licences logicielles","Rationalisation applicative"
  ]},
  { code: "05", titre: "Couche technologique (Technology Architecture)", items: [
    "Infrastructure reseau nationale","Datacenters gouvernementaux","Strategie cloud gouvernemental (souverain, prive, hybride)","Standards materiels et logiciels","Architecture de virtualisation","Plan de continuite d'activite (PCA)","Plan de reprise apres sinistre (PRA)","Gestion des identites et acces (IAM)","Infrastructure de telecommunications","Architecture reseau des ETD et provinces","Connectivite des zones enclavees","Capacite de calcul et stockage","Gestion du cycle de vie des equipements","Standards d'interconnexion inter-institutionnelle","Observabilite et supervision des systemes"
  ]},
  { code: "06", titre: "Couche securite (Security Architecture)", items: [
    "Politique nationale de cybersecurite","Architecture de defense en profondeur","Gestion des identites numeriques citoyennes","Chiffrement des donnees sensibles","Centre national de reponse aux incidents (CERT)","Gestion des vulnerabilites","Controle d'acces base sur les roles (RBAC)","Audit de securite des systemes","Plan de gestion de crise cyber","Certification de securite des applications","Securite des infrastructures critiques","Sensibilisation a la cybersecurite","Conformite reglementaire (protection des donnees)","Gestion des tiers et sous-traitants","Souverainete des cles de chiffrement"
  ]},
  { code: "07", titre: "Gouvernance de l'architecture d'entreprise", items: [
    "Comite national d'architecture d'entreprise","Instance de validation architecturale","Processus de revue architecturale","Cadre de conformite architecturale (compliance)","Cycle de gouvernance TOGAF/FEAF adapte RDC","Gestion des exceptions architecturales","Feuille de route architecturale nationale","Cartographie de la dette technique","Comite de pilotage du PNGIE","Reporting architectural aux autorites","Gestion du changement architectural","Coordination interministerielle sur l'architecture","Budgetisation des investissements architecturaux","Suivi de maturite architecturale","Benchmark international des architectures d'Etat"
  ]},
  { code: "08", titre: "Interoperabilite institutionnelle", items: [
    "Cadre national d'interoperabilite","Bus d'echange de donnees interministeriel","Standards de messages inter-applicatifs","Registre des services interoperables","Annuaire national des services publics numeriques","Protocoles d'echange securise","Gouvernance des conventions de service (SLA)","Interoperabilite avec les provinces et ETD","Interoperabilite avec le secteur prive","Interoperabilite regionale (CEEAC, SADC)","Interoperabilite internationale (standards ISO, ONU)","Normes de qualite de service","Gestion des versions des interfaces","Documentation des contrats d'interface","Certification d'interoperabilite"
  ]},
  { code: "09", titre: "Urbanisme des systemes d'information", items: [
    "Plan d'urbanisation du systeme d'information de l'Etat","Zonage fonctionnel des systemes","Cartographie des zones (front, middle, back office)","Regles d'urbanisme applicatif","Trajectoire de transformation numerique","Blocs fonctionnels reutilisables (briques socles)","Referentiel des briques d'identite numerique","Referentiel des briques de paiement numerique","Referentiel des briques de notification","Referentiel des briques documentaires","Gouvernance des socles numeriques mutualises","Plan de convergence des systemes existants","Strategie de decommissionnement des systemes legacy","Feuille de route de dematerialisation","Priorisation des chantiers d'urbanisation"
  ]},
  { code: "10", titre: "Referentiels et standards nationaux", items: [
    "Referentiel general d'interoperabilite (RGI)","Referentiel general de securite (RGS)","Referentiel general d'accessibilite (RGAA adapte RDC)","Standards de nommage et codification","Normes de documentation technique","Normes de qualite logicielle","Standards d'echange de fichiers","Standards cartographiques nationaux","Standards de metadonnees documentaires","Standards d'accessibilite numerique","Normes ergonomiques des services numeriques","Charte graphique numerique de l'Etat","Glossaire officiel des termes numeriques","Normes linguistiques (langues nationales)","Certification de conformite aux standards"
  ]},
  { code: "11", titre: "Gestion du portefeuille de projets numeriques", items: [
    "Portefeuille national des projets numeriques","Priorisation des investissements numeriques","Gouvernance de projet PNGIE","Methodologie de gestion de projet (agile, cascade)","Gestion des risques projets","Suivi budgetaire des projets numeriques","Gestion des marches publics numeriques","Coordination des bailleurs de fonds","Gestion du changement organisationnel","Formation et accompagnement des utilisateurs","Evaluation post-implementation","Capitalisation des retours d'experience","Gestion des dependances inter-projets","Comites de pilotage projets","Tableau de bord de pilotage du portefeuille"
  ]},
  { code: "12", titre: "Architecture des identites numeriques", items: [
    "Systeme national d'identification unique","Registre national des personnes physiques","Registre national des personnes morales","Carte d'identite numerique nationale","Authentification forte multi-facteurs","Federation d'identites inter-institutionnelle","Signature electronique qualifiee","Certificats numeriques nationaux","Autorite de certification racine","Interoperabilite avec l'identite biometrique","Gestion du cycle de vie des identites","Protection contre l'usurpation d'identite","Identite numerique des agents publics","Identite numerique des entreprises","Portabilite de l'identite numerique"
  ]},
  { code: "13", titre: "Architecture des paiements et transactions", items: [
    "Plateforme nationale de paiement electronique","Interoperabilite des moyens de paiement","Standards de transaction financiere publique","Architecture de la monnaie numerique de banque centrale","Securisation des transactions gouvernementales","Reconciliation financiere automatisee","Architecture de facturation electronique","Gestion des guichets uniques de paiement","Tracabilite des flux financiers publics","Lutte contre la fraude transactionnelle","Interfaces avec le systeme bancaire national","Interfaces avec les operateurs mobile money","Normes de securite des paiements (PCI-DSS adapte)","Gouvernance des frais de transaction","Inclusion financiere numerique des zones rurales"
  ]},
  { code: "14", titre: "Architecture de la donnee ouverte et de la transparence", items: [
    "Portail national d'open data","Politique de publication des donnees publiques","Licence nationale de reutilisation des donnees","Standards de format de donnees ouvertes","Gouvernance de la qualite des donnees ouvertes","API publiques de consultation citoyenne","Tableau de bord de transparence budgetaire","Suivi ouvert des marches publics","Cartographie ouverte des projets d'investissement","Statistiques publiques accessibles","Mecanismes de retroaction citoyenne","Journalisme de donnees et societe civile","Indicateurs de transparence gouvernementale","Coordination avec les organisations de la societe civile","Conformite aux standards internationaux d'open data"
  ]},
  { code: "15", titre: "Evaluation et evolution de l'architecture", items: [
    "Indicateurs de maturite architecturale","Audit periodique de l'architecture d'entreprise","Benchmark avec les architectures d'autres Etats","Evaluation du retour sur investissement numerique","Analyse des ecarts (gap analysis) architecturaux","Plan d'evolution triennal de l'architecture","Veille technologique architecturale","Gestion de l'obsolescence technologique","Revision periodique des principes directeurs","Formation continue des architectes d'entreprise","Communaute de pratique des architectes","Documentation vivante de l'architecture","Outils de modelisation architecturale (ArchiMate)","Gouvernance du changement de version architecturale","Rapport annuel sur l'etat de l'architecture nationale"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNAGI", "Referentiel National de l'Architecture Generale d'Information", "Referentiel national cartographiant les principes, couches et gouvernance de l'architecture d'entreprise du PNGIE-RDC (metier, donnees, applicative, technologique, securite)", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNAGI-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNAGI", parseInt(s.code), "RNAGI-" + s.code, s.titre, "Section " + s.code + " du RNAGI : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNAGI cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
