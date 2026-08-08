const db = require("./src/db");

const sections = [
  { code: "01", titre: "Politiques et orientations de gouvernance et pilotage strategique", items: [
    "Constitution de la Republique","Loi organique sur l'organisation du Gouvernement","Loi sur le statut des institutions politiques","Plan national de developpement","Strategie de reforme de l'Etat","Ordonnance portant organisation de la Presidence","Decret portant organisation de la Primature","Loi sur les relations entre pouvoirs publics","Politique nationale de gestion des crises","Strategie de cooperation internationale","Loi sur la fonction de communication gouvernementale","Politique de gestion du changement institutionnel","Ordonnance sur la coordination interministerielle","Strategie de souverainete numerique","Politique de suivi-evaluation des politiques publiques"
  ]},
  { code: "02", titre: "Politiques et orientations financieres publiques", items: [
    "Loi de finances annuelle","Loi organique relative aux finances publiques","Politique fiscale nationale","Loi sur la douane","Loi sur les marches publics","Politique de gestion de la dette publique","Loi sur la Cour des comptes","Loi sur la comptabilite publique","Politique de transferts financiers aux provinces","Loi organique sur la Banque centrale","Politique monetaire nationale","Loi sur la supervision bancaire","Strategie de mobilisation des recettes","Politique de gestion du Tresor public","Loi anti-blanchiment"
  ]},
  { code: "03", titre: "Politiques et orientations de ressources humaines publiques", items: [
    "Statut general de la fonction publique","Loi sur les pensions civiles et militaires","Politique nationale de l'emploi public","Grille salariale de la fonction publique","Loi sur le recrutement dans la fonction publique","Politique de formation des agents publics","Reglement disciplinaire de la fonction publique","Loi sur le dialogue social","Politique de gestion des carrieres","Loi sur la protection sociale des agents publics","Politique de gestion des competences numeriques","Politique de diversite et inclusion","Statut des hauts fonctionnaires","Loi sur les agents contractuels de l'Etat","Politique de sante et securite au travail"
  ]},
  { code: "04", titre: "Politiques et orientations de securite et defense nationale", items: [
    "Loi de programmation militaire","Loi organique sur la defense nationale","Politique nationale de securite","Loi sur la police nationale","Loi sur le regime penitentiaire","Politique nationale de protection civile","Loi sur le desarmement, demobilisation et reinsertion","Strategie de cooperation militaire internationale","Loi sur la gestion des frontieres","Strategie nationale de cybersecurite","Loi sur le controle des armements","Politique de formation militaire et policiere","Code de justice militaire","Loi sur les etats d'urgence et de siege","Politique de securisation des institutions"
  ]},
  { code: "05", titre: "Politiques et orientations de justice et Etat de droit", items: [
    "Code civil","Code penal","Code de procedure civile","Code de procedure penale","Loi organique sur le Conseil superieur de la magistrature","Loi organique sur la Cour constitutionnelle","Loi organique sur la Cour de cassation","Loi anti-corruption","Politique nationale des droits humains","Loi sur l'aide juridictionnelle","Loi sur la reforme penitentiaire","Politique de formation des magistrats","Loi sur la mediation et l'arbitrage","Strategie de cooperation judiciaire internationale","Programme national de reforme du secteur de la justice"
  ]},
  { code: "06", titre: "Politiques et orientations de sante publique", items: [
    "Loi organique sur la sante publique","Politique nationale de sante","Loi sur la couverture sante universelle","Plan national de developpement sanitaire","Loi sur les medicaments et produits pharmaceutiques","Politique nationale de sante maternelle et infantile","Strategie de lutte contre les maladies transmissibles","Strategie de lutte contre les maladies non transmissibles","Loi sur l'exercice des professions de sante","Politique de financement de la sante","Loi sur les etablissements de sante prives","Politique de sante communautaire","Strategie nationale de recherche en sante","Loi sur la surveillance epidemiologique","Politique de cooperation sanitaire internationale"
  ]},
  { code: "07", titre: "Politiques et orientations d'education et formation", items: [
    "Loi-cadre de l'enseignement national","Politique nationale d'education","Loi sur l'enseignement superieur et universitaire","Loi sur la gratuite de l'enseignement primaire","Politique nationale d'alphabetisation","Strategie de formation professionnelle et technique","Loi sur le statut des enseignants","Politique des curricula nationaux","Loi sur les bourses d'etudes","Politique d'education inclusive","Strategie nationale de recherche scientifique","Loi sur l'education civique","Politique de financement de l'education","Strategie de cooperation academique internationale","Politique d'infrastructures scolaires"
  ]},
  { code: "08", titre: "Politiques et orientations economiques et de developpement", items: [
    "Plan national strategique de developpement","Code des investissements","Loi sur le commerce exterieur","Politique de promotion des exportations","Loi sur les PME","Politique industrielle nationale","Politique agricole nationale","Code minier","Code des hydrocarbures","Politique energetique nationale","Loi sur l'inclusion financiere","Loi sur la protection des consommateurs","Politique nationale de l'emploi","Strategie de cooperation economique regionale","Politique de developpement rural"
  ]},
  { code: "09", titre: "Politiques et orientations d'infrastructures et amenagement", items: [
    "Loi sur l'amenagement du territoire","Politique nationale du logement","Code foncier","Loi sur le cadastre","Politique nationale des transports","Loi sur l'electricite","Politique nationale de l'eau et assainissement","Loi sur les telecommunications","Politique de partenariat public-prive","Loi sur les marches d'infrastructure","Strategie de financement des infrastructures","Politique de maintenance des infrastructures","Loi sur la protection des infrastructures critiques","Plan national d'urbanisme","Politique de developpement des infrastructures rurales"
  ]},
  { code: "10", titre: "Politiques et orientations environnementales", items: [
    "Loi-cadre sur l'environnement","Code forestier","Loi sur les aires protegees","Politique nationale de l'eau","Loi sur la gestion des dechets","Politique nationale de lutte contre le changement climatique","Loi sur les etudes d'impact environnemental","Politique de gestion des catastrophes naturelles","Strategie nationale des energies renouvelables","Loi sur la peche et l'aquaculture","Politique de reboisement national","Loi sur les credits carbone","Strategie d'education environnementale","Accord-cadre de cooperation environnementale internationale","Politique de surveillance environnementale"
  ]},
  { code: "11", titre: "Politiques et orientations sociales et humanitaires", items: [
    "Loi sur la protection sociale","Politique nationale de lutte contre la pauvrete","Loi sur la promotion du genre","Loi sur la protection de l'enfant","Loi sur la protection des personnes handicapees","Politique nationale des refugies et deplaces internes","Strategie nationale de reponse humanitaire","Politique nationale de la jeunesse","Strategie de cohesion sociale","Politique de logement social","Loi sur la securite alimentaire","Code du travail","Politique d'insertion socio-economique","Strategie de cooperation humanitaire internationale","Politique de protection sociale des groupes vulnerables"
  ]},
  { code: "12", titre: "Politiques et orientations de gouvernance territoriale", items: [
    "Loi organique sur la decentralisation","Loi sur les provinces","Loi sur l'organisation territoriale et administrative","Loi sur la fiscalite locale","Politique de participation citoyenne locale","Loi sur les conflits fonciers","Politique des services publics de proximite","Loi sur l'etat civil","Loi sur la securite locale","Politique de reconnaissance de la gouvernance coutumiere","Strategie de renforcement des capacites locales","Politique de suivi-evaluation de la decentralisation","Loi sur les conventions intercommunales","Politique de transfert de competences aux ETD","Strategie d'amenagement territorial local"
  ]},
  { code: "13", titre: "Politiques et orientations numeriques et technologiques", items: [
    "Loi sur le numerique et la protection des donnees personnelles","Strategie nationale de transformation numerique","Loi sur l'identite numerique","Politique des services publics numeriques","Loi sur la cybersecurite","Politique de donnees ouvertes gouvernementales","Loi sur l'interoperabilite des systemes d'information","Strategie nationale d'intelligence artificielle","Politique d'inclusion numerique","Strategie de formation aux competences numeriques","Loi sur l'economie numerique","Loi sur les paiements et transactions electroniques","Loi sur la signature electronique","Politique de statistiques numeriques nationales","Strategie de cooperation numerique internationale"
  ]},
  { code: "14", titre: "Politiques et orientations de gestion des entreprises et patrimoine publics", items: [
    "Loi sur le portefeuille de l'Etat","Loi sur les entreprises publiques","Loi sur la privatisation","Loi sur les partenariats strategiques","Loi sur les concessions publiques","Politique de valorisation du patrimoine public","Loi sur les participations de l'Etat","Politique de performance des entreprises publiques","Loi sur la restructuration des entreprises publiques","Loi organique sur les regies financieres","Loi organique sur la Banque centrale du Congo","Loi sur la supervision du secteur financier","Politique de gestion des actifs strategiques","Loi sur l'audit des entreprises publiques","Politique de reporting au Ministere du Portefeuille"
  ]},
  { code: "15", titre: "Politiques et orientations de gouvernance electorale et democratique", items: [
    "Loi electorale","Loi organique sur la CENI","Loi sur les partis politiques","Loi sur le financement des partis politiques","Loi sur la presse et la communication","Politique nationale des droits humains democratiques","Loi sur le contentieux electoral","Loi sur l'observation electorale","Politique de consultation citoyenne","Loi sur l'acces a l'information publique","Loi sur la lutte contre la desinformation","Politique de participation politique","Strategie de renforcement des institutions democratiques","Politique de cooperation avec la societe civile","Accord-cadre sur les engagements democratiques internationaux"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNPOL", "Referentiel National des Politiques et Orientations Legislatives", "Referentiel national cartographiant les cadres legaux, orientations politiques et instruments normatifs fondant juridiquement les capacites de l'Etat congolais", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNPOL-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNPOL", parseInt(s.code), "RNPOL-" + s.code, s.titre, "Section " + s.code + " du RNPOL : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNPOL cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
