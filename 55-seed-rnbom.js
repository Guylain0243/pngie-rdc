const db = require("./src/db");

const sections = [
  { code: "01", titre: "Objets de gouvernance et pilotage strategique", items: [
    "Politique publique","Plan strategique national","Reforme institutionnelle","Indicateur de performance publique","Rapport de suivi-evaluation","Decision gouvernementale","Acte reglementaire","Accord de cooperation internationale","Projet de reforme","Tableau de bord gouvernemental","Crise nationale","Plan de gestion de crise","Correspondance officielle","Seance du Conseil des ministres","Dossier de politique sectorielle"
  ]},
  { code: "02", titre: "Objets financiers publics", items: [
    "Budget national","Ligne budgetaire","Recette fiscale","Recette douaniere","Recette non fiscale","Dette publique","Marche public","Contrat de marche public","Compte public","Etat financier","Rapport d'audit financier","Transfert financier aux provinces","Titre de tresorerie","Rapport de la Cour des comptes","Instrument de politique monetaire"
  ]},
  { code: "03", titre: "Objets de ressources humaines publiques", items: [
    "Agent public","Poste de travail","Carriere administrative","Bulletin de paie","Dossier de pension","Evaluation de performance","Dossier disciplinaire","Plan de formation","Contrat d'agent contractuel","Grille salariale","Concours de recrutement","Dossier de mobilite","Accord social","Registre des effectifs","Certificat de competence"
  ]},
  { code: "04", titre: "Objets de securite et defense nationale", items: [
    "Unite militaire","Dossier de renseignement","Frontiere nationale","Rapport de securite","Dossier penitentiaire","Plan de protection civile","Dossier de desarmement et demobilisation","Accord de cooperation militaire","Zone maritime et fluviale","Incident de cybersecurite","Inventaire d'armement","Dossier de formation militaire","Dossier de justice militaire","Plan de securisation d'institution","Rapport d'operation de securite"
  ]},
  { code: "05", titre: "Objets de justice et Etat de droit", items: [
    "Dossier judiciaire civil","Dossier judiciaire penal","Decision de justice constitutionnelle","Acte de greffe","Dossier d'execution de decision","Casier judiciaire","Dossier de mediation","Plainte pour violation des droits humains","Dossier de lutte contre la corruption","Dossier de reinsertion penitentiaire","Dossier de formation de magistrat","Dossier d'assistance juridique","Accord de cooperation judiciaire","Proposition de reforme legislative","Rapport de controle de constitutionnalite"
  ]},
  { code: "06", titre: "Objets de sante publique", items: [
    "Dossier patient","Etablissement de sante","Rapport de surveillance epidemiologique","Dossier d'urgence sanitaire","Dossier de sante maternelle et infantile","Dossier de maladie transmissible","Dossier de maladie non transmissible","Personnel de sante","Stock pharmaceutique","Budget de sante","Autorisation de secteur sanitaire prive","Programme de sante communautaire","Projet de recherche en sante","Accord de cooperation sanitaire","Rapport d'inspection sanitaire"
  ]},
  { code: "07", titre: "Objets d'education et formation", items: [
    "Etablissement scolaire et universitaire","Eleve et etudiant","Enseignant","Curriculum","Diplome et certification","Programme d'alphabetisation","Programme de formation professionnelle","Dossier de recherche scientifique","Dossier d'education inclusive","Budget de l'education","Infrastructure scolaire","Bourse d'etudes","Programme d'education civique","Accord de cooperation academique","Rapport d'evaluation scolaire"
  ]},
  { code: "08", titre: "Objets economiques et de developpement", items: [
    "Plan de developpement economique","Dossier d'investissement","Licence d'exportation","Entreprise privee et PME","Politique industrielle","Politique agricole","Projet de developpement rural","Titre minier","Contrat energetique","Statistique economique","Dossier d'inclusion financiere","Dossier de protection des consommateurs","Politique de l'emploi","Accord de cooperation economique regionale","Rapport de conjoncture economique"
  ]},
  { code: "09", titre: "Objets d'infrastructures et amenagement", items: [
    "Plan d'urbanisme","Projet routier","Reseau de transport","Infrastructure energetique","Reseau d'eau et assainissement","Reseau de telecommunications","Projet de logement social","Titre foncier","Plan d'amenagement du territoire","Projet d'infrastructure publique","Contrat de partenariat public-prive","Dossier de maintenance d'infrastructure","Infrastructure critique","Plan de financement d'infrastructure","Rapport d'inspection d'infrastructure"
  ]},
  { code: "10", titre: "Objets environnementaux", items: [
    "Zone forestiere","Aire protegee","Dossier de changement climatique","Ressource en eau","Dossier de gestion des dechets","Rapport de pollution","Etude d'impact environnemental","Dossier de catastrophe naturelle","Projet d'energie renouvelable","Ressource halieutique","Projet de reboisement","Credit carbone","Programme d'education environnementale","Accord de cooperation environnementale","Rapport de surveillance satellitaire"
  ]},
  { code: "11", titre: "Objets sociaux et humanitaires", items: [
    "Beneficiaire de protection sociale","Dossier d'assistance sociale","Programme de promotion du genre","Dossier de protection de l'enfance","Dossier de personne handicapee","Dossier de refugie et deplace interne","Plan de reponse humanitaire","Programme de promotion de la jeunesse","Dossier de cohesion sociale","Programme de lutte contre la pauvrete","Dossier de logement social","Dossier de securite alimentaire","Dossier de protection des travailleurs","Programme d'insertion socio-economique","Accord de cooperation humanitaire"
  ]},
  { code: "12", titre: "Objets de gouvernance territoriale", items: [
    "Province","Entite territoriale decentralisee","Dossier de decentralisation","Dossier fiscal local","Plan d'amenagement local","Dossier de participation citoyenne","Dossier de conflit foncier local","Service public de proximite","Acte d'etat civil","Dossier de securite locale","Instance de gouvernance coutumiere","Programme de renforcement des capacites locales","Rapport de suivi de la decentralisation","Convention intercommunale","Dossier de relation centre-provinces"
  ]},
  { code: "13", titre: "Objets numeriques et technologiques", items: [
    "Systeme d'information gouvernemental","Infrastructure numerique nationale","Identite numerique","Service public numerique","Dossier de cybersecurite nationale","Jeu de donnees ouvertes","Interface d'interoperabilite","Projet d'intelligence artificielle","Programme d'inclusion numerique","Programme de formation numerique","Dossier d'economie numerique","Transaction de paiement electronique","Certificat de signature numerique","Statistique numerique nationale","Accord de cooperation numerique"
  ]},
  { code: "14", titre: "Objets de gestion des entreprises et patrimoine publics", items: [
    "Entreprise publique","Portefeuille de l'Etat","Dossier de privatisation","Concession publique","Actif du patrimoine public","Participation de l'Etat","Rapport de performance d'entreprise publique","Dossier de restructuration","Regie financiere","Actif de la banque centrale","Actif strategique (mines, energie)","Rapport d'audit d'entreprise publique","Rapport au Ministere du Portefeuille","Contrat de gestion d'entreprise publique","Dossier de supervision du secteur financier"
  ]},
  { code: "15", titre: "Objets de gouvernance electorale et democratique", items: [
    "Electeur","Fichier electoral","Bureau de vote","Resultat electoral","Parti politique","Dossier de financement de parti politique","Contentieux electoral","Rapport d'observation electorale","Dossier de consultation citoyenne","Dossier de transparence publique","Dossier de lutte contre la desinformation","Programme de participation politique","Institution democratique","Engagement de la societe civile","Engagement international democratique"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNBOM", "Referentiel National des Objets Metier", "Referentiel national cartographiant les objets metier manipules par les capacites de l'Etat congolais, independamment des structures organisationnelles qui les portent", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNBOM-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNBOM", parseInt(s.code), "RNBOM-" + s.code, s.titre, "Section " + s.code + " du RNBOM : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNBOM cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
