const db = require("./src/db");

const sections = [
  { code: "01", titre: "Canaux de gouvernance et pilotage strategique", items: [
    "Portail de la Presidence","Portail de la Primature","Canal parlementaire officiel","Circuit de transmission des decisions gouvernementales","Canal de communication interministerielle","Circuit diplomatique","Canal de coordination de l'aide au developpement","Circuit de gestion de crise","Canal de veille strategique","Circuit de communication gouvernementale publique","Canal de reporting de performance publique","Circuit de coordination avec les provinces","Canal des seances du Conseil des ministres","Circuit de cooperation internationale","Canal de gestion du changement institutionnel"
  ]},
  { code: "02", titre: "Canaux financiers publics", items: [
    "Guichet du Tresor public","Portail de declaration fiscale","Guichet douanier","Canal de paiement des marches publics","Circuit bancaire du Tresor","Canal de reporting budgetaire","Circuit d'audit financier","Guichet de recouvrement des recettes non fiscales","Canal de transfert aux provinces et ETD","Circuit de la Cour des comptes","Canal de communication avec les institutions financieres internationales","Guichet de gestion de la dette publique","Circuit de politique monetaire","Canal de supervision bancaire","Circuit de reporting financier international"
  ]},
  { code: "03", titre: "Canaux de ressources humaines publiques", items: [
    "Portail de recrutement de la fonction publique","Guichet de gestion de la paie","Canal de gestion des carrieres","Circuit d'evaluation de performance","Guichet de gestion des pensions","Canal de gestion disciplinaire","Circuit de dialogue social","Canal de formation continue","Guichet de mobilite des agents","Circuit de gestion des competences numeriques","Canal syndical","Portail des concours de recrutement","Circuit de gestion des contractuels","Canal de sante et securite au travail","Guichet des hauts fonctionnaires"
  ]},
  { code: "04", titre: "Canaux de securite et defense nationale", items: [
    "Circuit de commandement militaire","Canal de renseignement","Circuit de gestion des frontieres","Canal de coordination policiere","Circuit penitentiaire","Canal de protection civile","Circuit de cooperation militaire internationale","Canal de securite maritime et fluviale","Circuit de cybersecurite nationale","Canal de gestion des armements","Circuit de formation militaire et policiere","Canal de justice militaire","Circuit de securisation des institutions","Canal d'alerte securitaire","Circuit de gestion des operations de securite"
  ]},
  { code: "05", titre: "Canaux de justice et Etat de droit", items: [
    "Guichet judiciaire civil","Guichet judiciaire penal","Circuit de la Cour Constitutionnelle","Canal de gestion des greffes","Circuit d'execution des decisions de justice","Guichet du casier judiciaire","Canal de mediation","Circuit de lutte contre la corruption","Canal de reinsertion penitentiaire","Circuit de formation des magistrats","Guichet d'assistance juridique aux citoyens","Canal de cooperation judiciaire internationale","Circuit de reforme legislative","Canal de controle de constitutionnalite","Circuit de protection des droits humains"
  ]},
  { code: "06", titre: "Canaux de sante publique", items: [
    "Guichet de soins de sante primaires","Circuit hospitalier specialise","Canal de surveillance epidemiologique","Circuit d'urgence sanitaire","Canal de sante maternelle et infantile","Circuit de lutte contre les maladies transmissibles","Guichet pharmaceutique","Canal de financement de la sante","Circuit du secteur sanitaire prive","Canal de sante communautaire","Circuit de recherche en sante publique","Guichet de gestion du personnel de sante","Circuit de cooperation sanitaire internationale","Canal d'inspection sanitaire","Circuit de vaccination"
  ]},
  { code: "07", titre: "Canaux d'education et formation", items: [
    "Guichet d'inscription scolaire","Portail d'evaluation et certification","Canal de formation des enseignants","Circuit d'elaboration des curricula","Canal d'alphabetisation des adultes","Guichet de bourses et aides aux etudiants","Circuit de recherche scientifique","Canal d'education civique","Circuit d'education inclusive","Portail des etablissements scolaires et universitaires","Canal de cooperation academique internationale","Guichet de financement de l'education","Circuit de gestion des infrastructures scolaires","Canal de formation professionnelle et technique","Circuit d'evaluation scolaire"
  ]},
  { code: "08", titre: "Canaux economiques et de developpement", items: [
    "Guichet unique de promotion des investissements","Canal de regulation du commerce exterieur","Circuit de promotion des exportations","Guichet d'appui aux PME","Canal de politique industrielle","Circuit de politique agricole","Canal de developpement rural","Guichet des titres miniers","Circuit de gestion des ressources energetiques","Canal de statistiques economiques","Guichet d'inclusion financiere","Circuit de protection des consommateurs","Canal de politique de l'emploi","Circuit de cooperation economique regionale","Portail des chambres de commerce"
  ]},
  { code: "09", titre: "Canaux d'infrastructures et amenagement", items: [
    "Guichet de planification urbaine","Circuit de construction et entretien routier","Canal de gestion des transports","Circuit de gestion de l'energie electrique","Canal de gestion de l'eau et assainissement","Circuit telecom","Guichet du logement social","Canal de gestion fonciere et cadastrale","Circuit d'amenagement du territoire","Canal de grands projets d'infrastructure","Circuit de partenariat public-prive","Guichet de maintenance des infrastructures","Canal de securite des infrastructures critiques","Circuit de financement des infrastructures","Portail des infrastructures publiques"
  ]},
  { code: "10", titre: "Canaux environnementaux", items: [
    "Guichet de gestion des forets et biodiversite","Canal de lutte contre le changement climatique","Circuit de gestion des aires protegees","Canal de gestion des ressources en eau","Circuit de gestion des dechets","Guichet de controle de la pollution","Canal des etudes d'impact environnemental","Circuit de gestion des catastrophes naturelles","Canal de promotion des energies renouvelables","Circuit de gestion des ressources halieutiques","Canal de reboisement et restauration","Guichet des credits carbone","Circuit d'education environnementale","Canal de cooperation environnementale internationale","Circuit de surveillance satellitaire"
  ]},
  { code: "11", titre: "Canaux sociaux et humanitaires", items: [
    "Guichet de protection sociale","Circuit d'assistance aux personnes vulnerables","Canal de promotion du genre","Guichet de protection de l'enfance","Circuit de prise en charge des personnes handicapees","Canal de gestion des refugies et deplaces internes","Circuit de reponse aux urgences humanitaires","Canal de promotion de la jeunesse","Guichet de cohesion sociale","Circuit de lutte contre la pauvrete","Canal de logement social","Guichet de securite alimentaire","Circuit de protection des travailleurs","Canal d'insertion socio-economique","Circuit de cooperation humanitaire internationale"
  ]},
  { code: "12", titre: "Canaux de gouvernance territoriale", items: [
    "Guichet de decentralisation et deconcentration","Circuit d'administration provinciale","Canal de gestion des relations centre-provinces","Guichet fiscal local","Circuit d'amenagement du territoire local","Canal de participation citoyenne locale","Circuit de gestion des conflits fonciers locaux","Guichet des services publics de proximite","Canal de gestion de l'etat civil local","Circuit de securite locale","Canal de gouvernance coutumiere","Circuit de renforcement des capacites locales","Canal de suivi-evaluation de la decentralisation","Circuit des conventions intercommunales","Guichet des ETD"
  ]},
  { code: "13", titre: "Canaux numeriques et technologiques", items: [
    "Portail unique des services publics numeriques","Canal d'identification numerique des citoyens","Circuit de cybersecurite nationale","Portail de donnees ouvertes gouvernementales","Canal d'interoperabilite des systemes d'information","Circuit d'innovation et intelligence artificielle","Canal d'inclusion numerique","Circuit de formation aux competences numeriques","Canal de l'economie numerique","Circuit de paiements electroniques","Canal de signature et confiance numerique","Circuit de statistiques nationales numeriques","Canal de cooperation numerique internationale","Application mobile de services publics","Guichet electronique unique"
  ]},
  { code: "14", titre: "Canaux de gestion des entreprises et patrimoine publics", items: [
    "Guichet de gouvernance des entreprises publiques","Canal de gestion du portefeuille de l'Etat","Circuit de privatisation et partenariats strategiques","Canal de regulation des secteurs strategiques","Circuit de gestion des concessions publiques","Canal de valorisation du patrimoine public","Circuit de gestion des participations de l'Etat","Canal de performance des entreprises publiques","Circuit de restructuration des entreprises publiques","Canal des regies financieres","Circuit de la banque centrale","Canal de supervision du secteur financier public","Circuit de gestion des actifs strategiques","Canal d'audit des entreprises publiques","Circuit de reporting au Ministere du Portefeuille"
  ]},
  { code: "15", titre: "Canaux de gouvernance electorale et democratique", items: [
    "Guichet d'organisation des elections","Portail du fichier electoral","Canal de regulation des medias et de la communication","Circuit de promotion des droits humains","Canal d'education civique et electorale","Circuit de financement des partis politiques","Guichet du contentieux electoral","Canal d'observation electorale","Circuit de consultation citoyenne","Canal de transparence et redevabilite publique","Circuit de lutte contre la desinformation","Canal de promotion de la participation politique","Circuit de renforcement des institutions democratiques","Canal de cooperation avec la societe civile","Circuit de suivi des engagements internationaux democratiques"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNCC", "Referentiel National des Canaux et Circuits", "Referentiel national cartographiant les canaux de prestation et circuits de transmission par lesquels les capacites de l'Etat congolais atteignent leurs usagers et parties prenantes", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNCC-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNCC", parseInt(s.code), "RNCC-" + s.code, s.titre, "Section " + s.code + " du RNCC : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNCC cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
