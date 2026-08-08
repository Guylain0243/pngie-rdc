const db = require("./src/db");

const sections = [
  { code: "01", titre: "Exceptions de gouvernance et pilotage strategique", items: [
    "Regime d'exception en cas de crise majeure","Derogation aux procedures de validation en urgence","Cas particulier de vacance institutionnelle","Exception de coordination en periode de transition","Derogation aux delais de reporting en crise","Cas particulier de suspension d'accord international","Regime special de gestion de catastrophe nationale","Derogation aux procedures de communication en crise","Exception de gouvernance en periode electorale","Cas particulier de conflit interinstitutionnel","Regime d'exception pour les zones en conflit","Derogation aux seances ordinaires du Conseil des ministres","Exception de gestion du changement en urgence","Cas particulier de rupture diplomatique","Regime special de gouvernance en etat de siege"
  ]},
  { code: "02", titre: "Exceptions financieres publiques", items: [
    "Regime de credits d'urgence hors budget","Derogation aux procedures de marches publics en urgence","Cas particulier de gel budgetaire","Exception de decaissement d'urgence","Derogation au plafond de la dette publique","Cas particulier de defaut de paiement","Regime special de gestion de tresorerie en crise","Derogation aux delais d'audit financier","Exception de transfert financier hors calendrier","Cas particulier de suspension de decaissement","Regime d'exception pour les recettes exceptionnelles","Derogation au controle financier prealable","Exception de politique monetaire en crise","Cas particulier de moratoire sur la dette","Regime special de mobilisation de recettes"
  ]},
  { code: "03", titre: "Exceptions de ressources humaines publiques", items: [
    "Regime de recrutement d'urgence","Derogation au plafond des effectifs","Cas particulier de mise en disponibilite","Exception de promotion exceptionnelle","Derogation aux delais de gestion des pensions","Cas particulier de suspension d'agent","Regime special de gestion des greves","Derogation aux procedures disciplinaires standard","Exception de mobilite d'urgence","Cas particulier de conflit de competence","Regime d'exception pour les agents en zone de conflit","Derogation au regime salarial standard","Exception de formation d'urgence","Cas particulier de reintegration d'agent","Regime special des agents en mission exceptionnelle"
  ]},
  { code: "04", titre: "Exceptions de securite et defense nationale", items: [
    "Regime de l'etat d'urgence securitaire","Derogation aux procedures de commandement en crise","Cas particulier de mobilisation generale","Exception de deploiement d'urgence","Derogation aux regles d'engagement standard","Cas particulier de rupture de cooperation militaire","Regime special de gestion des zones de conflit","Derogation aux procedures penitentiaires standard","Exception de gestion de frontiere fermee","Cas particulier d'incident diplomatique-militaire","Regime d'exception pour la cybersecurite en crise","Derogation aux procedures de justice militaire","Exception de gestion des refugies militaires","Cas particulier de trahison ou desertion","Regime special de securite en periode electorale"
  ]},
  { code: "05", titre: "Exceptions de justice et Etat de droit", items: [
    "Regime de justice d'exception","Derogation aux delais de procedure standard","Cas particulier d'immunite juridictionnelle","Exception de procedure acceleree","Derogation aux regles de competence territoriale","Cas particulier de conflit de juridiction","Regime special de traitement des affaires sensibles","Derogation aux procedures de greffe standard","Exception de grace presidentielle","Cas particulier d'amnistie","Regime d'exception pour la justice transitionnelle","Derogation aux delais de recours","Exception de saisine directe de la Cour Constitutionnelle","Cas particulier de conflit entre pouvoirs","Regime special de protection des temoins"
  ]},
  { code: "06", titre: "Exceptions de sante publique", items: [
    "Regime de l'urgence sanitaire","Derogation aux procedures d'autorisation de medicaments","Cas particulier d'epidemie declaree","Exception de mobilisation sanitaire d'urgence","Derogation aux normes de construction hospitaliere en crise","Cas particulier de penurie de medicaments essentiels","Regime special de quarantaine","Derogation aux procedures de recrutement sanitaire","Exception de soins gratuits en urgence","Cas particulier de refus de soins","Regime d'exception pour l'aide medicale internationale","Derogation aux delais d'inspection sanitaire","Exception de vaccination obligatoire","Cas particulier de fermeture d'etablissement de sante","Regime special de gestion de pandemie"
  ]},
  { code: "07", titre: "Exceptions d'education et formation", items: [
    "Regime de fermeture d'ecoles en urgence","Derogation aux calendriers scolaires standard","Cas particulier d'examen en circonstances exceptionnelles","Exception d'admission hors delai","Derogation aux curricula standard en zone de conflit","Cas particulier de reconnaissance de diplome etranger","Regime special d'education en situation de crise","Derogation aux normes d'infrastructure scolaire en urgence","Exception de bourse exceptionnelle","Cas particulier de fraude academique","Regime d'exception pour l'education a distance","Derogation aux procedures de recrutement d'enseignants","Exception de validation d'acquis exceptionnelle","Cas particulier de fermeture d'etablissement","Regime special d'education pour zones sinistrees"
  ]},
  { code: "08", titre: "Exceptions economiques et de developpement", items: [
    "Regime d'exception fiscale pour investissement strategique","Derogation aux procedures d'agrement d'entreprise","Cas particulier de faillite d'entreprise strategique","Exception de licence d'exportation exceptionnelle","Derogation au code minier pour projet special","Cas particulier de suspension d'activite economique","Regime special de zone economique speciale","Derogation aux normes de commerce exterieur en crise","Exception de subvention exceptionnelle","Cas particulier de monopole temporaire","Regime d'exception pour l'aide economique d'urgence","Derogation aux procedures de protection des consommateurs","Exception de politique de l'emploi en crise","Cas particulier de rupture d'accord commercial","Regime special de developpement en zone post-conflit"
  ]},
  { code: "09", titre: "Exceptions d'infrastructures et amenagement", items: [
    "Regime de reconstruction d'urgence","Derogation aux normes de construction en urgence","Cas particulier d'expropriation exceptionnelle","Exception de permis de construire accelere","Derogation aux procedures de marches d'infrastructure en urgence","Cas particulier de sinistre infrastructurel majeur","Regime special de gestion de penurie energetique","Derogation aux normes d'amenagement en zone a risque","Exception de raccordement d'urgence","Cas particulier de litige foncier majeur","Regime d'exception pour infrastructure critique menacee","Derogation aux delais de maintenance","Exception de financement d'urgence infrastructurel","Cas particulier de rupture de partenariat prive","Regime special d'amenagement post-catastrophe"
  ]},
  { code: "10", titre: "Exceptions environnementales", items: [
    "Regime de catastrophe environnementale","Derogation aux etudes d'impact en urgence","Cas particulier de deversement de polluant majeur","Exception d'exploitation forestiere exceptionnelle","Derogation aux quotas de peche en crise","Cas particulier d'espece menacee critique","Regime special de gestion de secheresse","Derogation aux normes de gestion des dechets en urgence","Exception d'autorisation environnementale acceleree","Cas particulier d'incendie de foret majeur","Regime d'exception pour aide climatique internationale","Derogation aux procedures de surveillance environnementale","Exception de protection d'urgence d'aire naturelle","Cas particulier de conflit d'usage des ressources","Regime special de gestion d'inondation"
  ]},
  { code: "11", titre: "Exceptions sociales et humanitaires", items: [
    "Regime d'urgence humanitaire","Derogation aux procedures d'assistance sociale standard","Cas particulier d'afflux massif de refugies","Exception d'aide d'urgence exceptionnelle","Derogation aux criteres d'eligibilite en crise","Cas particulier de deplacement massif de population","Regime special de protection en situation de conflit","Derogation aux procedures de protection de l'enfance en urgence","Exception de logement d'urgence","Cas particulier de famine declaree","Regime d'exception pour l'aide humanitaire internationale","Derogation aux delais de traitement des dossiers sociaux","Exception d'insertion acceleree","Cas particulier de discrimination avere","Regime special d'assistance en catastrophe"
  ]},
  { code: "12", titre: "Exceptions de gouvernance territoriale", items: [
    "Regime de tutelle provinciale exceptionnelle","Derogation aux procedures de decentralisation standard","Cas particulier de conflit intercommunautaire","Exception de fiscalite locale exceptionnelle","Derogation aux delais de suivi-evaluation local","Cas particulier de vacance de mandat local","Regime special d'administration en zone de conflit","Derogation aux procedures d'etat civil en urgence","Exception de securite locale exceptionnelle","Cas particulier de dissolution d'entite locale","Regime d'exception pour ETD en crise","Derogation aux conventions intercommunales standard","Exception de participation citoyenne acceleree","Cas particulier de conflit foncier majeur","Regime special de gouvernance coutumiere en crise"
  ]},
  { code: "13", titre: "Exceptions numeriques et technologiques", items: [
    "Regime de coupure numerique d'urgence","Derogation aux procedures de cybersecurite standard","Cas particulier de cyberattaque majeure","Exception d'acces d'urgence aux donnees","Derogation aux normes d'interoperabilite en crise","Cas particulier de panne systemique majeure","Regime special de continuite numerique","Derogation aux procedures de certification numerique","Exception de deploiement technologique accelere","Cas particulier de fuite de donnees massive","Regime d'exception pour l'aide numerique internationale","Derogation aux delais de traitement des demandes numeriques","Exception de paiement electronique exceptionnel","Cas particulier de fraude numerique majeure","Regime special de gestion de crise numerique"
  ]},
  { code: "14", titre: "Exceptions de gestion des entreprises et patrimoine publics", items: [
    "Regime de sauvetage d'entreprise publique","Derogation aux procedures de gouvernance standard","Cas particulier de faillite d'entreprise publique","Exception de privatisation acceleree","Derogation aux normes de concession en urgence","Cas particulier de fraude dans une entreprise publique","Regime special de restructuration d'urgence","Derogation aux procedures d'audit standard","Exception de cession exceptionnelle d'actifs","Cas particulier de conflit d'interet majeur","Regime d'exception pour actifs strategiques menaces","Derogation aux delais de reporting au Portefeuille","Exception de recapitalisation d'urgence","Cas particulier de contentieux majeur","Regime special de gestion de crise financiere d'entreprise publique"
  ]},
  { code: "15", titre: "Exceptions de gouvernance electorale et democratique", items: [
    "Regime de report electoral exceptionnel","Derogation aux delais du calendrier electoral standard","Cas particulier d'annulation d'election","Exception d'inscription electorale tardive","Derogation aux procedures de financement des partis en crise","Cas particulier de contestation majeure de resultats","Regime special d'observation electorale renforcee","Derogation aux regles de campagne standard","Exception de consultation citoyenne exceptionnelle","Cas particulier de dissolution de parti politique","Regime d'exception pour securite electorale renforcee","Derogation aux delais de traitement du contentieux electoral","Exception de suspension de media en periode electorale","Cas particulier de fraude electorale averee","Regime special de transition democratique"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNEX", "Referentiel National des Exceptions et Cas Particuliers", "Referentiel national cartographiant les regimes derogatoires, situations d'exception et cas particuliers s'ecartant des regles standard dans l'exercice des capacites de l'Etat congolais", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNEX-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNEX", parseInt(s.code), "RNEX-" + s.code, s.titre, "Section " + s.code + " du RNEX : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNEX cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
