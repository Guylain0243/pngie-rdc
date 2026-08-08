const db = require("./src/db");

const sections = [
  { code: "01", titre: "Documentation de gouvernance et pilotage strategique", items: [
    "Compte-rendu du Conseil des ministres","Rapport annuel de politique generale","Plan strategique national","Note de politique publique","Rapport de suivi-evaluation","Acte reglementaire officiel","Communique gouvernemental","Rapport de mission diplomatique","Rapport de gestion de crise","Note de veille strategique","Rapport de performance publique","Correspondance officielle interinstitutionnelle","Protocole d'accord de cooperation","Rapport de coordination interministerielle","Journal officiel"
  ]},
  { code: "02", titre: "Documentation financiere publique", items: [
    "Loi de finances","Rapport d'execution budgetaire","Declaration fiscale","Declaration douaniere","Bon de commande public","Contrat de marche public","Etat financier de l'Etat","Rapport d'audit financier","Bordereau de transfert financier","Rapport de la Cour des comptes","Titre de creance publique","Bulletin de tresorerie","Rapport de politique monetaire","Rapport de supervision bancaire","Rapport financier international"
  ]},
  { code: "03", titre: "Documentation de ressources humaines publiques", items: [
    "Dossier individuel d'agent","Bulletin de paie","Acte de nomination","Fiche de poste","Rapport d'evaluation de performance","Notification disciplinaire","Attestation de formation","Dossier de pension","Contrat de travail d'agent contractuel","Registre des effectifs","Proces-verbal de concours de recrutement","Certificat de mobilite","Accord social","Attestation de service","Fiche de competences"
  ]},
  { code: "04", titre: "Documentation de securite et defense nationale", items: [
    "Rapport de renseignement","Ordre de mission militaire","Rapport de securite","Registre penitentiaire","Plan de protection civile","Accord de cooperation militaire","Rapport d'incident de securite","Inventaire d'armement","Certificat de formation militaire","Dossier de justice militaire","Rapport d'operation de securite","Registre des frontieres","Rapport de desarmement et reinsertion","Rapport de cybersecurite","Plan de securisation d'institution"
  ]},
  { code: "05", titre: "Documentation de justice et Etat de droit", items: [
    "Jugement civil","Jugement penal","Arret de la Cour Constitutionnelle","Extrait de casier judiciaire","Acte de greffe","Proces-verbal d'execution","Accord de mediation","Rapport de lutte contre la corruption","Dossier de reinsertion penitentiaire","Certificat de formation de magistrat","Dossier d'assistance juridique","Accord de cooperation judiciaire","Projet de loi","Rapport de controle de constitutionnalite","Registre des droits humains"
  ]},
  { code: "06", titre: "Documentation de sante publique", items: [
    "Dossier medical du patient","Carnet de vaccination","Rapport de surveillance epidemiologique","Fiche d'urgence sanitaire","Registre de sante maternelle et infantile","Rapport de lutte contre les maladies transmissibles","Ordonnance medicale","Rapport d'approvisionnement pharmaceutique","Rapport de financement de la sante","Autorisation d'exercice sanitaire prive","Rapport de sante communautaire","Rapport de recherche en sante publique","Accord de cooperation sanitaire","Rapport d'inspection sanitaire","Certificat medical"
  ]},
  { code: "07", titre: "Documentation d'education et formation", items: [
    "Bulletin scolaire","Diplome","Certificat de scolarite","Curriculum officiel","Rapport d'evaluation scolaire","Attestation d'alphabetisation","Convention de bourse d'etudes","Rapport de recherche scientifique","Rapport d'education inclusive","Rapport de financement de l'education","Registre des infrastructures scolaires","Accord de cooperation academique","Rapport d'education civique","Contrat d'enseignant","Rapport d'inspection scolaire"
  ]},
  { code: "08", titre: "Documentation economique et de developpement", items: [
    "Plan de developpement economique","Certificat d'investissement","Licence d'exportation","Registre des entreprises et PME","Rapport de politique industrielle","Rapport de politique agricole","Rapport de developpement rural","Titre minier","Contrat energetique","Bulletin statistique economique","Rapport d'inclusion financiere","Rapport de protection des consommateurs","Rapport de politique de l'emploi","Accord de cooperation economique regionale","Rapport de conjoncture economique"
  ]},
  { code: "09", titre: "Documentation d'infrastructures et amenagement", items: [
    "Plan d'urbanisme","Permis de construire","Titre foncier","Certificat cadastral","Rapport de construction routiere","Contrat de partenariat public-prive","Rapport de gestion de l'energie electrique","Rapport de gestion de l'eau et assainissement","Autorisation telecom","Rapport de grand projet d'infrastructure","Rapport de maintenance des infrastructures","Certificat de securite d'infrastructure critique","Plan de financement d'infrastructure","Rapport d'inspection d'infrastructure","Plan d'amenagement du territoire"
  ]},
  { code: "10", titre: "Documentation environnementale", items: [
    "Etude d'impact environnemental","Permis d'exploitation forestiere","Certificat d'aire protegee","Rapport de gestion des ressources en eau","Rapport de gestion des dechets","Rapport de controle de pollution","Rapport de catastrophe naturelle","Certificat de projet d'energie renouvelable","Permis de peche","Rapport de reboisement","Certificat de credit carbone","Rapport d'education environnementale","Accord de cooperation environnementale","Rapport de surveillance satellitaire","Rapport climatique national"
  ]},
  { code: "11", titre: "Documentation sociale et humanitaire", items: [
    "Dossier de beneficiaire de protection sociale","Rapport d'assistance aux personnes vulnerables","Rapport de promotion du genre","Dossier de protection de l'enfance","Carte d'invalidite","Dossier de refugie et deplace interne","Rapport de reponse humanitaire","Rapport de promotion de la jeunesse","Rapport de cohesion sociale","Rapport de lutte contre la pauvrete","Dossier de logement social","Rapport de securite alimentaire","Contrat de travail","Rapport d'insertion socio-economique","Accord de cooperation humanitaire"
  ]},
  { code: "12", titre: "Documentation de gouvernance territoriale", items: [
    "Rapport de decentralisation","Rapport d'administration provinciale","Rapport de relations centre-provinces","Avis d'imposition locale","Rapport d'amenagement local","Registre de participation citoyenne","Dossier de conflit foncier local","Registre des services publics de proximite","Acte d'etat civil","Rapport de securite locale","Registre de gouvernance coutumiere","Rapport de renforcement des capacites locales","Rapport de suivi-evaluation de la decentralisation","Convention intercommunale","Registre des ETD"
  ]},
  { code: "13", titre: "Documentation numerique et technologique", items: [
    "Carte d'identite numerique","Rapport de gouvernance numerique","Certificat d'infrastructure numerique","Catalogue de services publics numeriques","Rapport de cybersecurite nationale","Jeu de donnees ouvertes","Rapport d'interoperabilite","Rapport de projet d'intelligence artificielle","Rapport d'inclusion numerique","Certificat de formation numerique","Rapport d'economie numerique","Recu de paiement electronique","Certificat de signature numerique","Bulletin statistique numerique","Accord de cooperation numerique"
  ]},
  { code: "14", titre: "Documentation de gestion des entreprises et patrimoine publics", items: [
    "Statuts d'entreprise publique","Rapport de gestion du portefeuille de l'Etat","Dossier de privatisation","Contrat de concession publique","Inventaire du patrimoine public","Rapport de participation de l'Etat","Rapport de performance d'entreprise publique","Rapport de restructuration","Rapport de regie financiere","Rapport de la banque centrale","Inventaire d'actifs strategiques","Rapport d'audit d'entreprise publique","Rapport au Ministere du Portefeuille","Contrat de gestion d'entreprise publique","Rapport de supervision du secteur financier"
  ]},
  { code: "15", titre: "Documentation de gouvernance electorale et democratique", items: [
    "Carte d'electeur","Liste electorale","Proces-verbal de bureau de vote","Rapport de resultat electoral","Statuts de parti politique","Rapport de financement de parti politique","Requete en contentieux electoral","Rapport d'observation electorale","Rapport de consultation citoyenne","Rapport de transparence publique","Rapport de lutte contre la desinformation","Rapport de participation politique","Rapport d'institution democratique","Accord avec la societe civile","Rapport d'engagement international democratique"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNDOC", "Referentiel National de la Documentation Officielle", "Referentiel national cartographiant les types de documents administratifs, formulaires, actes et pieces officielles produits ou requis dans l'exercice des capacites de l'Etat congolais", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNDOC-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNDOC", parseInt(s.code), "RNDOC-" + s.code, s.titre, "Section " + s.code + " du RNDOC : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNDOC cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
