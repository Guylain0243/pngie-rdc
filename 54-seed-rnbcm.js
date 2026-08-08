const db = require("./src/db");

const sections = [
  { code: "01", titre: "Capacites de gouvernance et pilotage strategique", items: [
    "Elaboration de la politique nationale","Planification strategique nationale","Coordination interministerielle","Suivi-evaluation des politiques publiques","Gestion des reformes institutionnelles","Pilotage de la performance publique","Gestion des relations avec le Parlement","Gestion des relations diplomatiques","Coordination de l'aide au developpement","Gestion des crises nationales","Veille strategique et prospective","Gestion du changement institutionnel","Communication gouvernementale","Coordination de la cooperation internationale","Gestion de la souverainete numerique"
  ]},
  { code: "02", titre: "Capacites de gestion des finances publiques", items: [
    "Elaboration du budget national","Execution budgetaire","Mobilisation des recettes fiscales","Mobilisation des recettes douanieres","Gestion de la tresorerie publique","Gestion de la dette publique","Controle financier public","Audit des finances publiques","Gestion des marches publics","Comptabilite publique","Gestion des transferts aux provinces et ETD","Gestion des recettes non fiscales","Politique monetaire et de change","Supervision bancaire et financiere","Reporting financier international"
  ]},
  { code: "03", titre: "Capacites de gestion des ressources humaines publiques", items: [
    "Recrutement de la fonction publique","Gestion de la paie des agents publics","Gestion des carrieres et promotions","Formation et developpement des competences","Evaluation de la performance des agents","Gestion des pensions et retraites","Gestion disciplinaire","Gestion du dialogue social","Gestion des effectifs et de la masse salariale","Gestion de la mobilite des agents","Sante et securite au travail","Gestion des competences numeriques des agents","Gestion de la diversite et de l'inclusion","Gestion des hauts fonctionnaires","Gestion des agents contractuels et temporaires"
  ]},
  { code: "04", titre: "Capacites de securite et defense nationale", items: [
    "Defense du territoire national","Maintien de l'ordre public","Renseignement et securite nationale","Gestion des frontieres","Lutte contre le terrorisme","Gestion penitentiaire","Protection civile et gestion des catastrophes","Desarmement, demobilisation et reinsertion","Cooperation militaire internationale","Securite maritime et fluviale","Cybersecurite nationale","Gestion des armements","Formation militaire et policiere","Justice militaire","Securite des institutions et personnalites"
  ]},
  { code: "05", titre: "Capacites de justice et Etat de droit", items: [
    "Administration de la justice civile","Administration de la justice penale","Administration de la justice constitutionnelle","Gestion des greffes","Execution des decisions de justice","Gestion du casier judiciaire","Mediation et resolution alternative des conflits","Protection des droits humains","Lutte contre la corruption","Gestion penitentiaire et reinsertion","Formation des magistrats","Assistance juridique aux citoyens","Cooperation judiciaire internationale","Reforme legislative","Controle de constitutionnalite"
  ]},
  { code: "06", titre: "Capacites de sante publique", items: [
    "Prevention et promotion de la sante","Soins de sante primaires","Soins hospitaliers specialises","Surveillance epidemiologique","Gestion des urgences sanitaires","Sante maternelle et infantile","Lutte contre les maladies transmissibles","Lutte contre les maladies non transmissibles","Gestion des ressources humaines sanitaires","Approvisionnement pharmaceutique","Financement de la sante","Regulation du secteur sanitaire prive","Sante communautaire","Recherche en sante publique","Cooperation sanitaire internationale"
  ]},
  { code: "07", titre: "Capacites d'education et formation", items: [
    "Enseignement primaire","Enseignement secondaire","Enseignement superieur et universitaire","Formation professionnelle et technique","Alphabetisation des adultes","Gestion des enseignants","Elaboration des curricula","Evaluation et certification scolaire","Recherche scientifique","Education inclusive","Financement de l'education","Infrastructures scolaires et universitaires","Bourses et aides aux etudiants","Education civique et citoyennete","Cooperation academique internationale"
  ]},
  { code: "08", titre: "Capacites economiques et de developpement", items: [
    "Planification du developpement economique","Promotion des investissements","Regulation du commerce exterieur","Promotion des exportations","Developpement du secteur prive et des PME","Politique industrielle","Politique agricole","Developpement rural","Gestion des ressources minieres","Gestion des ressources energetiques","Statistiques economiques nationales","Inclusion financiere","Protection des consommateurs","Politique de l'emploi","Cooperation economique regionale"
  ]},
  { code: "09", titre: "Capacites d'infrastructures et amenagement", items: [
    "Planification urbaine et territoriale","Construction et entretien routier","Gestion des transports (route, rail, air, fleuve)","Gestion de l'energie electrique","Gestion de l'eau et assainissement","Telecommunications et connectivite","Habitat et logement social","Gestion fonciere et cadastrale","Amenagement du territoire national","Gestion des infrastructures publiques","Grands projets d'infrastructure","Partenariats public-prive infrastructurels","Maintenance des infrastructures","Securite des infrastructures critiques","Financement des infrastructures"
  ]},
  { code: "10", titre: "Capacites environnementales", items: [
    "Gestion des forets et biodiversite","Lutte contre le changement climatique","Gestion des aires protegees","Gestion des ressources en eau","Gestion des dechets","Controle de la pollution","Etudes d'impact environnemental","Gestion des catastrophes naturelles","Promotion des energies renouvelables","Gestion des ressources halieutiques","Reboisement et restauration des ecosystemes","Credits carbone et finance climatique","Education environnementale","Cooperation environnementale internationale","Surveillance satellitaire environnementale"
  ]},
  { code: "11", titre: "Capacites sociales et humanitaires", items: [
    "Protection sociale et filets sociaux","Assistance aux personnes vulnerables","Promotion du genre et egalite","Protection de l'enfance","Prise en charge des personnes handicapees","Gestion des refugies et deplaces internes","Reponse aux urgences humanitaires","Promotion de la jeunesse","Cohesion sociale et prevention des conflits","Lutte contre la pauvrete","Logement social","Securite alimentaire","Protection des travailleurs","Insertion socio-economique","Cooperation humanitaire internationale"
  ]},
  { code: "12", titre: "Capacites de gouvernance territoriale", items: [
    "Decentralisation et deconcentration","Administration provinciale","Administration des ETD","Gestion des relations centre-provinces","Peracion de la fiscalite locale","Amenagement du territoire local","Participation citoyenne locale","Gestion des conflits fonciers locaux","Developpement economique local","Services publics de proximite","Gestion de l'etat civil local","Securite locale","Gouvernance coutumiere","Renforcement des capacites locales","Suivi-evaluation de la decentralisation"
  ]},
  { code: "13", titre: "Capacites numeriques et technologiques", items: [
    "Gouvernance de la transformation numerique","Infrastructure numerique nationale","Identification numerique des citoyens","Services publics numeriques","Cybersecurite nationale","Donnees ouvertes gouvernementales","Interoperabilite des systemes d'information","Innovation et intelligence artificielle","Inclusion numerique","Formation aux competences numeriques","Economie numerique","Paiements electroniques","Signature et confiance numerique","Statistiques nationales numeriques","Cooperation numerique internationale"
  ]},
  { code: "14", titre: "Capacites de gestion des entreprises et patrimoine publics", items: [
    "Gouvernance des entreprises publiques","Gestion du portefeuille de l'Etat","Privatisation et partenariats strategiques","Regulation des secteurs strategiques","Gestion des concessions publiques","Valorisation du patrimoine public","Gestion des participations de l'Etat","Performance des entreprises publiques","Restructuration des entreprises publiques","Gestion des regies financieres","Gestion de la banque centrale","Supervision du secteur financier public","Gestion des actifs strategiques (mines, energie)","Audit des entreprises publiques","Reporting au Ministere du Portefeuille"
  ]},
  { code: "15", titre: "Capacites de gouvernance electorale et democratique", items: [
    "Organisation des elections","Gestion du fichier electoral","Regulation des medias et de la communication","Promotion des droits humains","Education civique et electorale","Financement des partis politiques","Contentieux electoral","Observation electorale","Consultation citoyenne","Transparence et redevabilite publique","Lutte contre la desinformation","Promotion de la participation politique","Renforcement des institutions democratiques","Cooperation avec la societe civile","Suivi des engagements internationaux democratiques"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNBCM", "Referentiel National des Business Capabilities Metier", "Referentiel national cartographiant les capacites metier transverses de l'Etat congolais, independamment des structures organisationnelles qui les portent", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNBCM-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNBCM", parseInt(s.code), "RNBCM-" + s.code, s.titre, "Section " + s.code + " du RNBCM : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNBCM cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
