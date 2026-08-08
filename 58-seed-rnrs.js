const db = require("./src/db");

const sections = [
  { code: "01", titre: "Regles et standards de gouvernance et pilotage strategique", items: [
    "Regle de validation des politiques publiques","Standard de planification strategique","Regle de coordination interministerielle","Standard de reporting de performance","Regle d'approbation des reformes institutionnelles","Standard de gestion des relations parlementaires","Regle de protocole diplomatique","Standard de coordination de l'aide au developpement","Regle de gestion de crise nationale","Standard de veille strategique","Regle de gestion du changement institutionnel","Standard de communication gouvernementale","Regle de cooperation internationale","Standard de gestion de la souverainete numerique","Regle de tenue des seances du Conseil des ministres"
  ]},
  { code: "02", titre: "Regles et standards financiers publics", items: [
    "Regle d'elaboration budgetaire","Standard d'execution budgetaire","Regle de mobilisation des recettes fiscales","Standard de mobilisation des recettes douanieres","Regle de gestion de la tresorerie publique","Standard de gestion de la dette publique","Regle de controle financier public","Standard d'audit des finances publiques","Regle de passation des marches publics","Standard de comptabilite publique","Regle de transfert financier aux provinces et ETD","Standard de gestion des recettes non fiscales","Regle de politique monetaire et de change","Standard de supervision bancaire et financiere","Regle de reporting financier international"
  ]},
  { code: "03", titre: "Regles et standards de ressources humaines publiques", items: [
    "Regle de recrutement de la fonction publique","Standard de gestion de la paie","Regle de gestion des carrieres et promotions","Standard de formation et developpement des competences","Regle d'evaluation de la performance des agents","Standard de gestion des pensions et retraites","Regle de gestion disciplinaire","Standard de dialogue social","Regle de gestion des effectifs et de la masse salariale","Standard de mobilite des agents","Regle de sante et securite au travail","Standard de gestion des competences numeriques des agents","Regle de gestion de la diversite et de l'inclusion","Standard de gestion des hauts fonctionnaires","Regle de gestion des agents contractuels et temporaires"
  ]},
  { code: "04", titre: "Regles et standards de securite et defense nationale", items: [
    "Regle de defense du territoire national","Standard de maintien de l'ordre public","Regle de renseignement et securite nationale","Standard de gestion des frontieres","Regle de lutte contre le terrorisme","Standard de gestion penitentiaire","Regle de protection civile et gestion des catastrophes","Standard de desarmement, demobilisation et reinsertion","Regle de cooperation militaire internationale","Standard de securite maritime et fluviale","Regle de cybersecurite nationale","Standard de gestion des armements","Regle de formation militaire et policiere","Standard de justice militaire","Regle de securite des institutions et personnalites"
  ]},
  { code: "05", titre: "Regles et standards de justice et Etat de droit", items: [
    "Regle d'administration de la justice civile","Standard d'administration de la justice penale","Regle d'administration de la justice constitutionnelle","Standard de gestion des greffes","Regle d'execution des decisions de justice","Standard de gestion du casier judiciaire","Regle de mediation et resolution alternative des conflits","Standard de protection des droits humains","Regle de lutte contre la corruption","Standard de gestion penitentiaire et reinsertion","Regle de formation des magistrats","Standard d'assistance juridique aux citoyens","Regle de cooperation judiciaire internationale","Standard de reforme legislative","Regle de controle de constitutionnalite"
  ]},
  { code: "06", titre: "Regles et standards de sante publique", items: [
    "Regle de prevention et promotion de la sante","Standard de soins de sante primaires","Regle de soins hospitaliers specialises","Standard de surveillance epidemiologique","Regle de gestion des urgences sanitaires","Standard de sante maternelle et infantile","Regle de lutte contre les maladies transmissibles","Standard de lutte contre les maladies non transmissibles","Regle de gestion des ressources humaines sanitaires","Standard d'approvisionnement pharmaceutique","Regle de financement de la sante","Standard de regulation du secteur sanitaire prive","Regle de sante communautaire","Standard de recherche en sante publique","Regle de cooperation sanitaire internationale"
  ]},
  { code: "07", titre: "Regles et standards d'education et formation", items: [
    "Regle d'enseignement primaire","Standard d'enseignement secondaire","Regle d'enseignement superieur et universitaire","Standard de formation professionnelle et technique","Regle d'alphabetisation des adultes","Standard de gestion des enseignants","Regle d'elaboration des curricula","Standard d'evaluation et certification scolaire","Regle de recherche scientifique","Standard d'education inclusive","Regle de financement de l'education","Standard des infrastructures scolaires et universitaires","Regle de gestion des bourses et aides aux etudiants","Standard d'education civique et citoyennete","Regle de cooperation academique internationale"
  ]},
  { code: "08", titre: "Regles et standards economiques et de developpement", items: [
    "Regle de planification du developpement economique","Standard de promotion des investissements","Regle de regulation du commerce exterieur","Standard de promotion des exportations","Regle de developpement du secteur prive et des PME","Standard de politique industrielle","Regle de politique agricole","Standard de developpement rural","Regle de gestion des ressources minieres","Standard de gestion des ressources energetiques","Regle de production des statistiques economiques","Standard d'inclusion financiere","Regle de protection des consommateurs","Standard de politique de l'emploi","Regle de cooperation economique regionale"
  ]},
  { code: "09", titre: "Regles et standards d'infrastructures et amenagement", items: [
    "Regle de planification urbaine et territoriale","Standard de construction et entretien routier","Regle de gestion des transports","Standard de gestion de l'energie electrique","Regle de gestion de l'eau et assainissement","Standard de telecommunications et connectivite","Regle d'habitat et logement social","Standard de gestion fonciere et cadastrale","Regle d'amenagement du territoire national","Standard de gestion des infrastructures publiques","Regle de grands projets d'infrastructure","Standard de partenariats public-prive infrastructurels","Regle de maintenance des infrastructures","Standard de securite des infrastructures critiques","Regle de financement des infrastructures"
  ]},
  { code: "10", titre: "Regles et standards environnementaux", items: [
    "Regle de gestion des forets et biodiversite","Standard de lutte contre le changement climatique","Regle de gestion des aires protegees","Standard de gestion des ressources en eau","Regle de gestion des dechets","Standard de controle de la pollution","Regle des etudes d'impact environnemental","Standard de gestion des catastrophes naturelles","Regle de promotion des energies renouvelables","Standard de gestion des ressources halieutiques","Regle de reboisement et restauration des ecosystemes","Standard des credits carbone et finance climatique","Regle d'education environnementale","Standard de cooperation environnementale internationale","Regle de surveillance satellitaire environnementale"
  ]},
  { code: "11", titre: "Regles et standards sociaux et humanitaires", items: [
    "Regle de protection sociale et filets sociaux","Standard d'assistance aux personnes vulnerables","Regle de promotion du genre et egalite","Standard de protection de l'enfance","Regle de prise en charge des personnes handicapees","Standard de gestion des refugies et deplaces internes","Regle de reponse aux urgences humanitaires","Standard de promotion de la jeunesse","Regle de cohesion sociale et prevention des conflits","Standard de lutte contre la pauvrete","Regle de logement social","Standard de securite alimentaire","Regle de protection des travailleurs","Standard d'insertion socio-economique","Regle de cooperation humanitaire internationale"
  ]},
  { code: "12", titre: "Regles et standards de gouvernance territoriale", items: [
    "Regle de decentralisation et deconcentration","Standard d'administration provinciale","Regle de gestion des relations centre-provinces","Standard de perception de la fiscalite locale","Regle d'amenagement du territoire local","Standard de participation citoyenne locale","Regle de gestion des conflits fonciers locaux","Standard des services publics de proximite","Regle de gestion de l'etat civil local","Standard de securite locale","Regle de gouvernance coutumiere","Standard de renforcement des capacites locales","Regle de suivi-evaluation de la decentralisation","Standard des conventions intercommunales","Regle de gestion des ETD"
  ]},
  { code: "13", titre: "Regles et standards numeriques et technologiques", items: [
    "Regle de gouvernance de la transformation numerique","Standard d'infrastructure numerique nationale","Regle d'identification numerique des citoyens","Standard de services publics numeriques","Regle de cybersecurite nationale","Standard de donnees ouvertes gouvernementales","Regle d'interoperabilite des systemes d'information","Standard d'innovation et intelligence artificielle","Regle d'inclusion numerique","Standard de formation aux competences numeriques","Regle d'economie numerique","Standard de paiements electroniques","Regle de signature et confiance numerique","Standard de statistiques nationales numeriques","Regle de cooperation numerique internationale"
  ]},
  { code: "14", titre: "Regles et standards de gestion des entreprises et patrimoine publics", items: [
    "Regle de gouvernance des entreprises publiques","Standard de gestion du portefeuille de l'Etat","Regle de privatisation et partenariats strategiques","Standard de regulation des secteurs strategiques","Regle de gestion des concessions publiques","Standard de valorisation du patrimoine public","Regle de gestion des participations de l'Etat","Standard de performance des entreprises publiques","Regle de restructuration des entreprises publiques","Standard de gestion des regies financieres","Regle de gestion de la banque centrale","Standard de supervision du secteur financier public","Regle de gestion des actifs strategiques (mines, energie)","Standard d'audit des entreprises publiques","Regle de reporting au Ministere du Portefeuille"
  ]},
  { code: "15", titre: "Regles et standards de gouvernance electorale et democratique", items: [
    "Regle d'organisation des elections","Standard de gestion du fichier electoral","Regle de regulation des medias et de la communication","Standard de promotion des droits humains","Regle d'education civique et electorale","Standard de financement des partis politiques","Regle de traitement du contentieux electoral","Standard d'observation electorale","Regle de consultation citoyenne","Standard de transparence et redevabilite publique","Regle de lutte contre la desinformation","Standard de promotion de la participation politique","Regle de renforcement des institutions democratiques","Standard de cooperation avec la societe civile","Regle de suivi des engagements internationaux democratiques"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNRS", "Referentiel National des Regles et Standards", "Referentiel national cartographiant les regles metier, contraintes de gestion et normes techniques encadrant l'exercice des capacites de l'Etat congolais", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNRS-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNRS", parseInt(s.code), "RNRS-" + s.code, s.titre, "Section " + s.code + " du RNRS : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNRS cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
