const db = require("./src/db");

const sections = [
  { code: "01", titre: "Indicateurs de gouvernance et pilotage strategique", items: [
    "Taux de mise en oeuvre des politiques publiques","Delai moyen d'elaboration des plans strategiques","Taux d'avancement des reformes institutionnelles","Indice de coordination interministerielle","Taux d'execution des decisions du Conseil des ministres","Nombre d'accords de cooperation internationale signes","Delai de reponse aux crises nationales","Indice de veille strategique","Taux de satisfaction des relations avec le Parlement","Indice de communication gouvernementale","Taux d'atteinte des objectifs de reforme","Nombre de correspondances officielles traitees","Indice de gestion du changement institutionnel","Taux de coordination de l'aide au developpement","Indice de souverainete numerique"
  ]},
  { code: "02", titre: "Indicateurs financiers publics", items: [
    "Taux d'execution budgetaire","Taux de mobilisation des recettes fiscales","Taux de mobilisation des recettes douanieres","Ratio dette publique sur PIB","Delai moyen de passation des marches publics","Taux de conformite des audits financiers","Taux de transfert aux provinces et ETD","Delai de production des etats financiers","Taux de recouvrement des recettes non fiscales","Indice de transparence budgetaire","Taux d'execution des recommandations de la Cour des comptes","Volume des reserves de change","Taux d'inflation","Indice de supervision bancaire","Delai de reporting financier international"
  ]},
  { code: "03", titre: "Indicateurs de ressources humaines publiques", items: [
    "Taux de vacance des postes de la fonction publique","Delai moyen de recrutement","Taux de regularite du paiement des salaires","Taux de promotion des agents","Taux de couverture des evaluations de performance","Taux de dossiers disciplinaires traites","Delai de liquidation des pensions","Taux de participation aux formations continues","Taux de mobilite des agents","Indice de dialogue social","Ratio masse salariale sur budget de l'Etat","Taux de feminisation des effectifs","Taux d'agents formes au numerique","Taux de couverture sante et securite au travail","Taux de renouvellement des hauts fonctionnaires"
  ]},
  { code: "04", titre: "Indicateurs de securite et defense nationale", items: [
    "Taux de couverture territoriale des forces de securite","Indice de maintien de l'ordre public","Taux de resolution des incidents de securite","Delai de reponse aux alertes securitaires","Taux de controle des frontieres","Taux d'incidents de cybersecurite resolus","Taux de reinsertion des ex-combattants","Nombre d'accords de cooperation militaire actifs","Indice de securite maritime et fluviale","Taux de couverture penitentiaire","Delai de traitement des dossiers de justice militaire","Taux de formation des forces de securite","Indice de securisation des institutions","Taux de reduction de la criminalite","Taux d'operations de securite reussies"
  ]},
  { code: "05", titre: "Indicateurs de justice et Etat de droit", items: [
    "Delai moyen de traitement des dossiers judiciaires civils","Delai moyen de traitement des dossiers penaux","Taux d'execution des decisions de justice","Taux d'engorgement des greffes","Taux de resolution par mediation","Indice de perception de la corruption","Taux de reinsertion penitentiaire","Nombre de magistrats formes","Taux de couverture de l'assistance juridique","Delai de traitement du contentieux constitutionnel","Nombre d'accords de cooperation judiciaire internationale","Taux d'adoption des reformes legislatives","Indice de protection des droits humains","Taux de conges de peine","Indice d'independance judiciaire"
  ]},
  { code: "06", titre: "Indicateurs de sante publique", items: [
    "Taux de couverture sanitaire","Taux de mortalite maternelle et infantile","Taux de vaccination","Delai de reponse aux urgences sanitaires","Taux de disponibilite des medicaments essentiels","Taux de prevalence des maladies transmissibles","Taux de prevalence des maladies non transmissibles","Ratio personnel de sante par habitant","Taux d'execution du budget de la sante","Taux de couverture en sante communautaire","Nombre de projets de recherche en sante finances","Indice de qualite des soins hospitaliers","Taux de couverture d'assurance maladie","Delai d'inspection sanitaire","Nombre d'accords de cooperation sanitaire internationale"
  ]},
  { code: "07", titre: "Indicateurs d'education et formation", items: [
    "Taux de scolarisation primaire","Taux de scolarisation secondaire","Taux d'acces a l'enseignement superieur","Taux de reussite aux examens","Taux d'alphabetisation des adultes","Ratio enseignant-eleve","Taux de completion des curricula","Taux d'insertion professionnelle des diplomes","Taux de couverture des bourses d'etudes","Indice d'etat des infrastructures scolaires","Nombre de projets de recherche scientifique finances","Taux d'education inclusive","Taux de participation a l'education civique","Nombre d'accords de cooperation academique internationale","Taux d'execution du budget de l'education"
  ]},
  { code: "08", titre: "Indicateurs economiques et de developpement", items: [
    "Taux de croissance du PIB","Volume des investissements directs etrangers","Taux de croissance des exportations","Taux de creation de PME","Indice de developpement industriel","Taux de croissance du secteur agricole","Taux de developpement rural","Volume de production miniere","Taux de couverture energetique","Taux d'inclusion financiere","Indice de protection des consommateurs","Taux de chomage","Taux de croissance du commerce regional","Indice de competitivite economique","Taux de pauvrete"
  ]},
  { code: "09", titre: "Indicateurs d'infrastructures et amenagement", items: [
    "Taux de couverture routiere en bon etat","Taux d'acces aux transports publics","Taux de couverture electrique","Taux d'acces a l'eau potable et assainissement","Taux de couverture telecom","Taux de couverture en logement social","Taux de securisation fonciere","Taux d'avancement des grands projets d'infrastructure","Volume des partenariats public-prive infrastructurels","Taux de maintenance des infrastructures","Indice de securite des infrastructures critiques","Taux de financement des infrastructures mobilise","Taux de conformite a l'amenagement du territoire","Delai moyen de realisation des projets","Indice d'etat des infrastructures publiques"
  ]},
  { code: "10", titre: "Indicateurs environnementaux", items: [
    "Taux de couverture forestiere","Taux de deforestation","Nombre d'aires protegees actives","Indice de qualite de l'eau","Taux de collecte et traitement des dechets","Indice de qualite de l'air","Nombre d'etudes d'impact environnemental realisees","Taux de reponse aux catastrophes naturelles","Taux de croissance des energies renouvelables","Volume des stocks halieutiques","Taux de reboisement","Volume de credits carbone generes","Taux de participation a l'education environnementale","Nombre d'accords environnementaux internationaux","Taux de couverture de la surveillance satellitaire"
  ]},
  { code: "11", titre: "Indicateurs sociaux et humanitaires", items: [
    "Taux de couverture de la protection sociale","Nombre de beneficiaires d'assistance sociale","Indice de promotion du genre","Taux de protection de l'enfance","Taux de prise en charge des personnes handicapees","Nombre de refugies et deplaces assistes","Delai de reponse aux urgences humanitaires","Taux de participation de la jeunesse","Indice de cohesion sociale","Taux de reduction de la pauvrete","Taux de couverture du logement social","Indice de securite alimentaire","Taux de protection des travailleurs","Taux d'insertion socio-economique","Nombre d'accords humanitaires internationaux"
  ]},
  { code: "12", titre: "Indicateurs de gouvernance territoriale", items: [
    "Taux d'avancement de la decentralisation","Indice d'administration provinciale","Taux de perception de la fiscalite locale","Taux de participation citoyenne locale","Nombre de conflits fonciers locaux resolus","Taux de couverture des services publics de proximite","Taux de couverture de l'etat civil","Indice de securite locale","Taux de reconnaissance de la gouvernance coutumiere","Nombre de programmes de renforcement des capacites locales","Indice de suivi-evaluation de la decentralisation","Nombre de conventions intercommunales actives","Taux de transfert de competences aux ETD","Indice de relation centre-provinces","Taux de couverture de l'amenagement local"
  ]},
  { code: "13", titre: "Indicateurs numeriques et technologiques", items: [
    "Taux de couverture de l'identite numerique","Taux d'adoption des services publics numeriques","Indice de cybersecurite nationale","Nombre de jeux de donnees ouvertes publies","Taux d'interoperabilite des systemes d'information","Nombre de projets d'intelligence artificielle deployes","Taux d'inclusion numerique","Taux de formation aux competences numeriques","Taux de croissance de l'economie numerique","Volume des paiements electroniques","Taux d'adoption de la signature numerique","Indice de statistiques numeriques nationales","Nombre d'accords de cooperation numerique internationale","Taux de couverture de l'infrastructure numerique","Indice de gouvernance de la transformation numerique"
  ]},
  { code: "14", titre: "Indicateurs de gestion des entreprises et patrimoine publics", items: [
    "Taux de rentabilite des entreprises publiques","Indice de gouvernance des entreprises publiques","Nombre de dossiers de privatisation aboutis","Taux de regulation des secteurs strategiques","Volume des concessions publiques actives","Indice de valorisation du patrimoine public","Taux de participation de l'Etat dans les entreprises","Taux de performance des entreprises publiques","Nombre de restructurations d'entreprises publiques","Taux de conformite des regies financieres","Indice de solidite de la banque centrale","Taux de supervision du secteur financier public","Valeur des actifs strategiques geres","Taux de conformite des audits d'entreprises publiques","Delai de reporting au Ministere du Portefeuille"
  ]},
  { code: "15", titre: "Indicateurs de gouvernance electorale et democratique", items: [
    "Taux de participation electorale","Taux de couverture du fichier electoral","Indice de regulation des medias","Indice de promotion des droits humains","Taux de participation a l'education civique et electorale","Taux de transparence du financement des partis politiques","Delai de traitement du contentieux electoral","Nombre d'observateurs electoraux deployes","Taux de participation aux consultations citoyennes","Indice de transparence et redevabilite publique","Taux de cas de desinformation traites","Indice de participation politique","Indice de solidite des institutions democratiques","Nombre d'engagements de la societe civile actifs","Taux de suivi des engagements internationaux democratiques"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNIP", "Referentiel National des Indicateurs de Performance", "Referentiel national cartographiant les indicateurs de mesure permettant d'evaluer la performance des capacites de l'Etat congolais", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNIP-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNIP", parseInt(s.code), "RNIP-" + s.code, s.titre, "Section " + s.code + " du RNIP : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNIP cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
