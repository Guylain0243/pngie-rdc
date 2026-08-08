const db = require("./src/db");

const sections = [
  { code: "01", titre: "Gouvernance de l'intelligence artificielle", items: [
    "Strategie nationale d'IA","Comite national de gouvernance de l'IA","Cadre ethique de l'IA","Politique de protection des donnees personnelles","Cadre reglementaire de l'IA","Certification des systemes d'IA","Audit des algorithmes publics","Transparence algorithmique","Responsabilite en cas de decision automatisee","Comite d'ethique de l'IA","Coordination avec les standards internationaux","Formation des agents publics a l'IA","Sensibilisation citoyenne a l'IA","Cadre de gestion des risques IA","Observatoire national de l'IA"
  ]},
  { code: "02", titre: "Cas d'usage IA dans l'administration", items: [
    "Chatbots de service public","Assistants virtuels administratifs","Traitement automatique des demandes citoyennes","Analyse predictive des recettes fiscales","Detection de la fraude fiscale par IA","Optimisation des flux migratoires aux frontieres","Reconnaissance faciale pour identification","Analyse de sentiment sur les reseaux sociaux","Prevision des besoins en sante publique","Optimisation logistique des services publics","Traduction automatique multilingue","Analyse d'images satellitaires (deforestation, agriculture)","Aide a la decision budgetaire","Systemes de recommandation pour l'education","Detection d'anomalies dans les marches publics"
  ]},
  { code: "03", titre: "Infrastructures et plateformes IA", items: [
    "Datacenter national d'IA","Plateforme de calcul haute performance","Cloud gouvernemental pour l'IA","Environnements de developpement IA (sandbox)","Infrastructure de stockage de donnees massives","Plateforme de MLOps gouvernementale","Environnement de test et validation des modeles","Infrastructure reseau pour l'IA","Capacites GPU/TPU nationales","Partenariats avec fournisseurs cloud IA","Souverainete des infrastructures IA","Continuite et resilience des systemes IA","Securite physique des infrastructures IA","Interoperabilite des plateformes IA","Standards d'interconnexion des systemes IA"
  ]},
  { code: "04", titre: "Donnees et jeux de donnees pour l'IA", items: [
    "Catalogue national des jeux de donnees","Donnees ouvertes gouvernementales (open data)","Qualite et fiabilite des donnees d'entrainement","Annotation et labellisation des donnees","Donnees linguistiques congolaises (langues locales)","Donnees geospatiales nationales","Donnees socio-economiques","Donnees de sante anonymisees","Donnees agricoles et environnementales","Gouvernance des donnees sensibles","Consentement et protection des donnees personnelles","Anonymisation et pseudonymisation","Partage de donnees inter-institutionnel","Standards de metadonnees","Cycle de vie des donnees d'entrainement"
  ]},
  { code: "05", titre: "Modeles et algorithmes", items: [
    "Registre national des modeles d'IA","Modeles de traitement du langage naturel","Modeles de vision par ordinateur","Modeles predictifs socio-economiques","Modeles de classification administrative","Validation et benchmarking des modeles","Versionnement des modeles","Explicabilite des modeles (XAI)","Biais algorithmiques et equite","Robustesse et securite des modeles","Modeles open source vs proprietaires","Cycle de vie des modeles (MLOps)","Reentrainement et mise a jour des modeles","Performance et monitoring des modeles","Documentation technique des modeles"
  ]},
  { code: "06", titre: "Innovation numerique dans l'administration", items: [
    "Laboratoires d'innovation publique (GovLab)","Hackathons gouvernementaux","Programmes d'incubation de startups civic-tech","Partenariats avec les universites","Programmes de bourses d'innovation","Appels a projets d'innovation numerique","Prototypage rapide de services publics","Design thinking applique aux services publics","Innovation ouverte (open innovation)","Coordination avec les incubateurs technologiques","Programmes de mentorat en innovation","Financement de l'innovation publique","Transfert de technologie","Veille technologique","Benchmark international des innovations publiques"
  ]},
  { code: "07", titre: "Innovation dans les services financiers publics", items: [
    "Paiements mobiles gouvernementaux","Monnaie numerique de banque centrale (MNBC)","Inclusion financiere numerique","Innovation dans la collecte fiscale","Plateformes de microfinance numerique","Systemes de credit scoring alternatifs","Innovation dans les transferts sociaux","Portefeuilles electroniques citoyens","Interoperabilite des systemes de paiement","Regulation des fintechs","Bacs a sable reglementaires (regulatory sandbox)","Innovation dans l'assurance publique","Systemes de compensation numeriques","Lutte contre la fraude financiere par IA","Inclusion des zones rurales dans les services financiers numeriques"
  ]},
  { code: "08", titre: "Innovation dans l'education et la formation", items: [
    "Plateformes d'apprentissage en ligne (e-learning)","Contenus educatifs numeriques","Formation a distance dans les zones enclavees","Certification numerique des competences","Ecoles de codage et competences numeriques","Programmes de bourses en IA et sciences des donnees","Partenariats academie-industrie","Recherche appliquee en IA","Centres d'excellence en IA","Curriculum national IA et numerique","Formation continue des enseignants au numerique","Ressources educatives libres (REL)","Evaluation numerique des competences","Programmes de mentorat technologique","Bibliotheques numeriques nationales"
  ]},
  { code: "09", titre: "Innovation dans la sante numerique", items: [
    "Telemedecine et consultations a distance","Dossier medical electronique national","Diagnostic assiste par IA","Systemes d'alerte epidemiologique par IA","Drones medicaux pour zones enclavees","Applications mobiles de sante communautaire","Intelligence artificielle pour la gestion des stocks pharmaceutiques","Plateformes de e-sante","Innovation dans le depistage des maladies","Recherche medicale assistee par IA","Robotisation des services hospitaliers","Innovation dans la logistique des vaccins","Surveillance genomique","Applications de sante maternelle numerique","Partenariats internationaux en sante numerique"
  ]},
  { code: "10", titre: "Innovation dans l'agriculture numerique", items: [
    "Agriculture de precision par IA","Capteurs IoT agricoles","Drones agricoles pour surveillance des cultures","Applications mobiles pour agriculteurs","Prevision des recoltes par IA","Systemes d'alerte climatique agricole","Plateformes de commerce agricole numerique","Cartographie numerique des terres agricoles","Innovation dans la chaine de valeur agricole","Financement numerique des agriculteurs","Optimisation de l'irrigation par IA","Gestion numerique des intrants agricoles","Traçabilite numerique des produits agricoles","Marches numeriques agricoles","Recherche agronomique assistee par donnees"
  ]},
  { code: "11", titre: "Innovation dans les infrastructures intelligentes", items: [
    "Villes intelligentes (smart cities)","Gestion intelligente du trafic","Reseaux electriques intelligents (smart grids)","Gestion intelligente de l'eau","Capteurs IoT urbains","Eclairage public intelligent","Gestion intelligente des dechets","Transport intelligent","Batiments publics intelligents","Surveillance intelligente des infrastructures","Maintenance predictive des infrastructures","Optimisation energetique par IA","Reseaux de capteurs environnementaux","Plateformes de gestion urbaine integree","Innovation dans les infrastructures rurales"
  ]},
  { code: "12", titre: "Cybersecurite et IA", items: [
    "Detection d'intrusion par IA","Analyse comportementale des menaces","Systemes de defense automatises","Intelligence artificielle pour la cyberdefense","Simulation d'attaques (red teaming) assistee par IA","Protection des infrastructures critiques par IA","Chiffrement et securite des donnees IA","Gestion des identites numeriques","Detection de deepfakes et desinformation","Securite des chaines d'approvisionnement logicielles","Formation en cybersecurite","Centre national de reponse aux incidents (CERT)","Cooperation internationale en cybersecurite","Reglementation de la cybersecurite","Resilience des systemes critiques"
  ]},
  { code: "13", titre: "Ethique et droits numeriques", items: [
    "Charte nationale des droits numeriques","Protection de la vie privee numerique","Droit a l'explication des decisions algorithmiques","Non-discrimination algorithmique","Accessibilite numerique pour personnes handicapees","Inclusion numerique des femmes","Inclusion numerique des populations rurales","Droit a la deconnexion","Consentement eclaire pour l'usage de l'IA","Protection des mineurs dans l'espace numerique","Lutte contre la desinformation","Liberte d'expression et moderation de contenu","Souverainete numerique nationale","Coalition internationale pour l'ethique de l'IA","Mecanismes de recours citoyens"
  ]},
  { code: "14", titre: "Ecosysteme et partenariats IA", items: [
    "Partenariats avec les geants technologiques","Cooperation avec les organisations internationales (UIT, UNESCO)","Reseau d'experts nationaux en IA","Cooperation regionale africaine sur l'IA","Programmes d'echange de chercheurs","Financement international de l'IA (Banque Mondiale, BAD)","Partenariats public-prive en IA","Associations professionnelles du numerique","Chambre de commerce numerique","Cooperation universite-entreprise","Fonds souverain d'innovation numerique","Zones economiques speciales technologiques","Programmes de diaspora tech","Salons et conferences nationales sur l'IA","Prix nationaux de l'innovation numerique"
  ]},
  { code: "15", titre: "Suivi, evaluation et impact de l'IA", items: [
    "Indicateurs nationaux de maturite IA","Evaluation d'impact socio-economique de l'IA","Suivi des emplois transformes par l'IA","Mesure de la productivite administrative liee a l'IA","Rapport annuel national sur l'IA","Benchmark international de maturite numerique","Evaluation de la satisfaction citoyenne","Indicateurs de reduction de la fraude","Mesure de l'inclusion numerique","Suivi des investissements en IA","Evaluation des risques emergents","Etudes d'impact environnemental de l'IA","Indicateurs de transparence gouvernementale","Cartographie des competences IA nationales","Revue strategique quinquennale de l'IA"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNIAI", "Referentiel National de l'Intelligence Artificielle et de l'Innovation", "Referentiel national cartographiant la gouvernance, les cas d'usage, les infrastructures et l'ecosysteme de l'intelligence artificielle et de l'innovation numerique en RDC", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNIAI-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNIAI", parseInt(s.code), "RNIAI-" + s.code, s.titre, "Section " + s.code + " du RNIAI : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNIAI cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
