const db = require("./src/db");

const sections = [
  { code: "01", titre: "Donnees maitres de gouvernance et pilotage strategique", items: [
    "Referentiel des institutions publiques","Referentiel des politiques publiques","Nomenclature des reformes institutionnelles","Referentiel des indicateurs de performance","Nomenclature des actes reglementaires","Referentiel des accords internationaux","Nomenclature des projets de reforme","Referentiel des seances du Conseil des ministres","Nomenclature des crises nationales","Referentiel des partenaires diplomatiques","Nomenclature des correspondances officielles","Referentiel des organes de coordination","Nomenclature des priorites strategiques","Referentiel des zones de cooperation internationale","Nomenclature des risques institutionnels"
  ]},
  { code: "02", titre: "Donnees maitres financieres publiques", items: [
    "Referentiel du plan comptable de l'Etat","Nomenclature budgetaire","Referentiel des lignes budgetaires","Nomenclature des recettes fiscales","Referentiel des recettes douanieres","Nomenclature des marches publics","Referentiel des fournisseurs de l'Etat","Nomenclature de la dette publique","Referentiel des comptes du Tresor","Nomenclature des transferts financiers","Referentiel des devises et taux de change","Nomenclature des audits financiers","Referentiel des regies financieres","Nomenclature des instruments monetaires","Referentiel des institutions financieres"
  ]},
  { code: "03", titre: "Donnees maitres de ressources humaines publiques", items: [
    "Referentiel des agents publics","Nomenclature des postes de travail","Referentiel des grades et fonctions","Nomenclature des grilles salariales","Referentiel des carrieres administratives","Nomenclature des competences","Referentiel des formations","Nomenclature des sanctions disciplinaires","Referentiel des pensions et retraites","Nomenclature des syndicats","Referentiel des concours de recrutement","Nomenclature des contrats de travail","Referentiel des unites administratives","Nomenclature des mobilites","Referentiel des hauts fonctionnaires"
  ]},
  { code: "04", titre: "Donnees maitres de securite et defense nationale", items: [
    "Referentiel des unites militaires","Nomenclature des grades militaires","Referentiel des frontieres nationales","Nomenclature des zones de securite","Referentiel des etablissements penitentiaires","Nomenclature des types d'armement","Referentiel des accords de cooperation militaire","Nomenclature des incidents de securite","Referentiel des zones maritimes et fluviales","Nomenclature des infractions penitentiaires","Referentiel des forces de police","Nomenclature des operations de securite","Referentiel des juridictions militaires","Nomenclature des risques securitaires","Referentiel des centres de formation militaire"
  ]},
  { code: "05", titre: "Donnees maitres de justice et Etat de droit", items: [
    "Referentiel des juridictions","Nomenclature des infractions penales","Referentiel des magistrats","Nomenclature des types de decisions de justice","Referentiel des greffes","Nomenclature des procedures judiciaires","Referentiel des avocats et auxiliaires de justice","Nomenclature des peines","Referentiel des etablissements penitentiaires civils","Nomenclature des mediations","Referentiel des accords judiciaires internationaux","Nomenclature des reformes legislatives","Referentiel des textes de loi","Nomenclature des droits humains","Referentiel des organes de controle de constitutionnalite"
  ]},
  { code: "06", titre: "Donnees maitres de sante publique", items: [
    "Referentiel des etablissements de sante","Nomenclature des pathologies","Referentiel du personnel de sante","Nomenclature des medicaments","Referentiel des patients","Nomenclature des actes medicaux","Referentiel des programmes de sante","Nomenclature des maladies transmissibles","Referentiel des zones sanitaires","Nomenclature des indicateurs epidemiologiques","Referentiel des fournisseurs pharmaceutiques","Nomenclature des vaccins","Referentiel des laboratoires de sante","Nomenclature des urgences sanitaires","Referentiel des partenaires sanitaires internationaux"
  ]},
  { code: "07", titre: "Donnees maitres d'education et formation", items: [
    "Referentiel des etablissements scolaires et universitaires","Nomenclature des filieres d'etude","Referentiel des enseignants","Nomenclature des diplomes et certifications","Referentiel des eleves et etudiants","Nomenclature des curricula","Referentiel des programmes de formation","Nomenclature des bourses d'etudes","Referentiel des infrastructures scolaires","Nomenclature des niveaux d'enseignement","Referentiel des centres de recherche","Nomenclature des competences academiques","Referentiel des partenaires academiques internationaux","Nomenclature des evaluations scolaires","Referentiel des programmes d'alphabetisation"
  ]},
  { code: "08", titre: "Donnees maitres economiques et de developpement", items: [
    "Referentiel des entreprises","Nomenclature des secteurs economiques","Referentiel des investisseurs","Nomenclature des produits d'exportation","Referentiel des PME","Nomenclature des titres miniers","Referentiel des zones industrielles","Nomenclature des indicateurs economiques","Referentiel des institutions financieres privees","Nomenclature des politiques sectorielles","Referentiel des partenaires economiques regionaux","Nomenclature des emplois","Referentiel des chambres de commerce","Nomenclature des filieres agricoles","Referentiel des zones rurales de developpement"
  ]},
  { code: "09", titre: "Donnees maitres d'infrastructures et amenagement", items: [
    "Referentiel des infrastructures routieres","Nomenclature des reseaux de transport","Referentiel des infrastructures energetiques","Nomenclature des reseaux d'eau et assainissement","Referentiel des infrastructures telecom","Nomenclature des titres fonciers","Referentiel du cadastre national","Nomenclature des zones d'amenagement","Referentiel des projets d'infrastructure","Nomenclature des contrats de partenariat public-prive","Referentiel des infrastructures critiques","Nomenclature des zones urbaines et rurales","Referentiel des operateurs d'infrastructure","Nomenclature des normes de construction","Referentiel des bassins d'amenagement du territoire"
  ]},
  { code: "10", titre: "Donnees maitres environnementales", items: [
    "Referentiel des zones forestieres","Nomenclature des especes protegees","Referentiel des aires protegees","Nomenclature des ressources en eau","Referentiel des sites de gestion des dechets","Nomenclature des types de pollution","Referentiel des etudes d'impact environnemental","Nomenclature des catastrophes naturelles","Referentiel des projets d'energie renouvelable","Nomenclature des ressources halieutiques","Referentiel des zones de reboisement","Nomenclature des credits carbone","Referentiel des partenaires environnementaux internationaux","Nomenclature des indicateurs climatiques","Referentiel des stations de surveillance satellitaire"
  ]},
  { code: "11", titre: "Donnees maitres sociales et humanitaires", items: [
    "Referentiel des beneficiaires de protection sociale","Nomenclature des programmes d'assistance sociale","Referentiel des personnes vulnerables","Nomenclature des types de handicap","Referentiel des refugies et deplaces internes","Nomenclature des urgences humanitaires","Referentiel des organisations de jeunesse","Nomenclature des indicateurs de cohesion sociale","Referentiel des menages en situation de pauvrete","Nomenclature des programmes de logement social","Referentiel des zones a risque de securite alimentaire","Nomenclature des droits des travailleurs","Referentiel des partenaires humanitaires internationaux","Nomenclature des programmes d'insertion socio-economique","Referentiel des associations de la societe civile"
  ]},
  { code: "12", titre: "Donnees maitres de gouvernance territoriale", items: [
    "Referentiel des provinces","Nomenclature des entites territoriales decentralisees","Referentiel des ETD","Nomenclature de la fiscalite locale","Referentiel des autorites coutumieres","Nomenclature des zones de participation citoyenne","Referentiel des conflits fonciers locaux","Nomenclature des services publics de proximite","Referentiel de l'etat civil","Nomenclature des zones de securite locale","Referentiel des instances de gouvernance coutumiere","Nomenclature des programmes de renforcement des capacites locales","Referentiel des indicateurs de decentralisation","Nomenclature des conventions intercommunales","Referentiel des relations centre-provinces"
  ]},
  { code: "13", titre: "Donnees maitres numeriques et technologiques", items: [
    "Referentiel des systemes d'information gouvernementaux","Nomenclature des infrastructures numeriques","Referentiel des identites numeriques","Nomenclature des services publics numeriques","Referentiel des incidents de cybersecurite","Nomenclature des jeux de donnees ouvertes","Referentiel des interfaces d'interoperabilite","Nomenclature des projets d'intelligence artificielle","Referentiel des programmes d'inclusion numerique","Nomenclature des competences numeriques","Referentiel des acteurs de l'economie numerique","Nomenclature des transactions electroniques","Referentiel des certificats de signature numerique","Nomenclature des statistiques numeriques nationales","Referentiel des partenaires numeriques internationaux"
  ]},
  { code: "14", titre: "Donnees maitres de gestion des entreprises et patrimoine publics", items: [
    "Referentiel des entreprises publiques","Nomenclature du portefeuille de l'Etat","Referentiel des dossiers de privatisation","Nomenclature des concessions publiques","Referentiel des actifs du patrimoine public","Nomenclature des participations de l'Etat","Referentiel des auditeurs d'entreprises publiques","Nomenclature des indicateurs de performance des entreprises publiques","Referentiel des regies financieres","Nomenclature des actifs de la banque centrale","Referentiel des actifs strategiques (mines, energie)","Nomenclature des contrats de gestion","Referentiel des rapports au Ministere du Portefeuille","Nomenclature du secteur financier public","Referentiel des restructurations d'entreprises publiques"
  ]},
  { code: "15", titre: "Donnees maitres de gouvernance electorale et democratique", items: [
    "Referentiel des electeurs","Nomenclature du fichier electoral","Referentiel des bureaux de vote","Nomenclature des resultats electoraux","Referentiel des partis politiques","Nomenclature du financement des partis politiques","Referentiel des contentieux electoraux","Nomenclature des observateurs electoraux","Referentiel des consultations citoyennes","Nomenclature des indicateurs de transparence publique","Referentiel des cas de desinformation","Nomenclature des programmes de participation politique","Referentiel des institutions democratiques","Nomenclature des engagements de la societe civile","Referentiel des engagements internationaux democratiques"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNMDM", "Referentiel National des Donnees Maitres Metier", "Referentiel national cartographiant les donnees de reference pivot que chaque capacite et objet metier de l'Etat congolais doit partager entre systemes d'information", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNMDM-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNMDM", parseInt(s.code), "RNMDM-" + s.code, s.titre, "Section " + s.code + " du RNMDM : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNMDM cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
