const db = require("./src/db");

const sections = [
  { code: "01", titre: "Interactions de gouvernance et pilotage strategique", items: [
    "Interaction Presidence-Primature","Interaction Gouvernement-Parlement","Circuit de validation des reformes","Flux de reporting de performance publique","Interaction avec les partenaires diplomatiques","Circuit de gestion des crises nationales","Flux de veille strategique","Interaction interministerielle","Circuit de communication gouvernementale","Flux de coordination de l'aide au developpement","Interaction avec les provinces","Circuit de decision en Conseil des ministres","Flux de suivi des reformes institutionnelles","Interaction avec les organisations internationales","Circuit de gestion du changement institutionnel"
  ]},
  { code: "02", titre: "Interactions financieres publiques", items: [
    "Circuit d'elaboration budgetaire","Flux d'execution budgetaire","Interaction Tresor-Banque centrale","Circuit de mobilisation des recettes fiscales","Flux de mobilisation des recettes douanieres","Circuit de passation des marches publics","Flux de controle financier","Interaction avec la Cour des comptes","Circuit de transfert aux provinces et ETD","Flux de gestion de la dette publique","Interaction avec les institutions financieres internationales","Circuit de reporting financier","Flux de supervision bancaire","Interaction Regies financieres-Tresor","Circuit d'audit des finances publiques"
  ]},
  { code: "03", titre: "Interactions de ressources humaines publiques", items: [
    "Circuit de recrutement de la fonction publique","Flux de gestion de la paie","Interaction agent-hierarchie","Circuit d'evaluation de performance","Flux de gestion des carrieres","Circuit de gestion disciplinaire","Interaction avec les syndicats","Flux de formation continue","Circuit de gestion des pensions","Interaction inter-services RH","Flux de mobilite des agents","Circuit de dialogue social","Interaction avec les hauts fonctionnaires","Flux de gestion des contractuels","Circuit de gestion des competences numeriques"
  ]},
  { code: "04", titre: "Interactions de securite et defense nationale", items: [
    "Interaction Armee-Police","Circuit de renseignement","Flux de gestion des frontieres","Interaction avec les forces internationales","Circuit de gestion penitentiaire","Flux de protection civile","Interaction avec les services de securite provinciaux","Circuit de desarmement et reinsertion","Flux de cybersecurite nationale","Interaction avec la justice militaire","Circuit de gestion des armements","Flux de formation militaire et policiere","Interaction en cas d'incident de securite","Circuit de securisation des institutions","Flux de cooperation militaire internationale"
  ]},
  { code: "05", titre: "Interactions de justice et Etat de droit", items: [
    "Circuit de traitement judiciaire civil","Flux de traitement judiciaire penal","Interaction Cour Constitutionnelle-Parlement","Circuit d'execution des decisions de justice","Flux de gestion des greffes","Interaction avec les mediateurs","Circuit de lutte contre la corruption","Flux de reinsertion penitentiaire","Interaction avec les magistrats en formation","Circuit d'assistance juridique aux citoyens","Flux de cooperation judiciaire internationale","Interaction Parlement-Cour de Cassation","Circuit de reforme legislative","Flux de controle de constitutionnalite","Interaction avec les organes de protection des droits humains"
  ]},
  { code: "06", titre: "Interactions de sante publique", items: [
    "Circuit de prise en charge patient","Flux de surveillance epidemiologique","Interaction hopital-centre de sante","Circuit de gestion des urgences sanitaires","Flux de sante maternelle et infantile","Interaction avec les organisations sanitaires internationales","Circuit d'approvisionnement pharmaceutique","Flux de financement de la sante","Interaction avec le secteur sanitaire prive","Circuit de sante communautaire","Flux de recherche en sante publique","Interaction Ministere-etablissements de sante","Circuit de lutte contre les maladies transmissibles","Flux de gestion des ressources humaines sanitaires","Circuit d'inspection sanitaire"
  ]},
  { code: "07", titre: "Interactions d'education et formation", items: [
    "Circuit d'inscription scolaire","Flux d'evaluation et certification","Interaction enseignant-eleve","Circuit d'elaboration des curricula","Flux de formation des enseignants","Interaction avec les universites","Circuit d'alphabetisation des adultes","Flux de financement de l'education","Interaction avec les partenaires academiques internationaux","Circuit de gestion des infrastructures scolaires","Flux de bourses et aides aux etudiants","Interaction avec la recherche scientifique","Circuit d'education civique","Flux d'education inclusive","Interaction Ministere-etablissements scolaires"
  ]},
  { code: "08", titre: "Interactions economiques et de developpement", items: [
    "Circuit de planification economique","Flux de promotion des investissements","Interaction Etat-secteur prive","Circuit de regulation du commerce exterieur","Flux de developpement rural","Interaction avec les PME","Circuit de gestion des ressources minieres","Flux de gestion des ressources energetiques","Interaction avec les organismes statistiques","Circuit d'inclusion financiere","Flux de protection des consommateurs","Interaction avec les partenaires economiques regionaux","Circuit de politique de l'emploi","Flux de politique industrielle","Circuit de politique agricole"
  ]},
  { code: "09", titre: "Interactions d'infrastructures et amenagement", items: [
    "Circuit de planification urbaine","Flux de construction et entretien routier","Interaction avec les operateurs de transport","Circuit de gestion de l'energie electrique","Flux de gestion de l'eau et assainissement","Interaction avec les operateurs telecom","Circuit d'habitat et logement social","Flux de gestion fonciere et cadastrale","Interaction avec les partenaires prive-public","Circuit de grands projets d'infrastructure","Flux de maintenance des infrastructures","Interaction Etat-provinces sur l'amenagement","Circuit de securisation des infrastructures critiques","Flux de financement des infrastructures","Circuit d'amenagement du territoire national"
  ]},
  { code: "10", titre: "Interactions environnementales", items: [
    "Circuit de gestion des forets et biodiversite","Flux de lutte contre le changement climatique","Interaction avec les gestionnaires d'aires protegees","Circuit de gestion des ressources en eau","Flux de gestion des dechets","Interaction avec les organismes de controle de pollution","Circuit d'etude d'impact environnemental","Flux de gestion des catastrophes naturelles","Interaction avec les promoteurs d'energies renouvelables","Circuit de gestion des ressources halieutiques","Flux de reboisement et restauration","Interaction avec les marches de credits carbone","Circuit d'education environnementale","Flux de cooperation environnementale internationale","Circuit de surveillance satellitaire"
  ]},
  { code: "11", titre: "Interactions sociales et humanitaires", items: [
    "Circuit de protection sociale","Flux d'assistance aux personnes vulnerables","Interaction avec les organisations de promotion du genre","Circuit de protection de l'enfance","Flux de prise en charge des personnes handicapees","Interaction avec les agences humanitaires","Circuit de gestion des refugies et deplaces","Flux de reponse aux urgences humanitaires","Interaction avec les organisations de jeunesse","Circuit de cohesion sociale et prevention des conflits","Flux de lutte contre la pauvrete","Interaction avec les acteurs du logement social","Circuit de securite alimentaire","Flux de protection des travailleurs","Circuit d'insertion socio-economique"
  ]},
  { code: "12", titre: "Interactions de gouvernance territoriale", items: [
    "Circuit de decentralisation et deconcentration","Flux d'administration provinciale","Interaction centre-provinces","Circuit de gestion des relations avec les ETD","Flux de perception de la fiscalite locale","Interaction avec les autorites coutumieres","Circuit de participation citoyenne locale","Flux de gestion des conflits fonciers locaux","Interaction avec les services publics de proximite","Circuit de gestion de l'etat civil local","Flux de securite locale","Interaction avec les instances de gouvernance coutumiere","Circuit de renforcement des capacites locales","Flux de suivi-evaluation de la decentralisation","Circuit d'amenagement du territoire local"
  ]},
  { code: "13", titre: "Interactions numeriques et technologiques", items: [
    "Circuit de gouvernance de la transformation numerique","Flux de deploiement de l'infrastructure numerique","Interaction entre systemes d'information","Circuit d'identification numerique des citoyens","Flux de services publics numeriques","Interaction avec les operateurs de cybersecurite","Circuit de partage de donnees ouvertes","Flux d'interoperabilite des systemes","Interaction avec les acteurs de l'innovation et IA","Circuit d'inclusion numerique","Flux de formation aux competences numeriques","Interaction avec les acteurs de l'economie numerique","Circuit de paiements electroniques","Flux de signature et confiance numerique","Circuit de cooperation numerique internationale"
  ]},
  { code: "14", titre: "Interactions de gestion des entreprises et patrimoine publics", items: [
    "Circuit de gouvernance des entreprises publiques","Flux de gestion du portefeuille de l'Etat","Interaction Etat-entreprises publiques","Circuit de privatisation et partenariats strategiques","Flux de regulation des secteurs strategiques","Interaction avec les concessionnaires publics","Circuit de valorisation du patrimoine public","Flux de gestion des participations de l'Etat","Interaction avec les auditeurs d'entreprises publiques","Circuit de performance des entreprises publiques","Flux de restructuration des entreprises publiques","Interaction avec les regies financieres","Circuit de gestion de la banque centrale","Flux de supervision du secteur financier public","Circuit de reporting au Ministere du Portefeuille"
  ]},
  { code: "15", titre: "Interactions de gouvernance electorale et democratique", items: [
    "Circuit d'organisation des elections","Flux de gestion du fichier electoral","Interaction avec les medias et la communication","Circuit de promotion des droits humains","Flux d'education civique et electorale","Interaction avec les partis politiques","Circuit de financement des partis politiques","Flux de traitement du contentieux electoral","Interaction avec les observateurs electoraux","Circuit de consultation citoyenne","Flux de transparence et redevabilite publique","Interaction avec la societe civile","Circuit de lutte contre la desinformation","Flux de promotion de la participation politique","Circuit de suivi des engagements internationaux democratiques"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNCIM", "Referentiel National de Cartographie des Interactions Metier", "Referentiel national cartographiant les processus et flux d'interaction entre les capacites et les objets metier de l'Etat congolais", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNCIM-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNCIM", parseInt(s.code), "RNCIM-" + s.code, s.titre, "Section " + s.code + " du RNCIM : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNCIM cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
