const db = require("./src/db");

const sections = [
  { code: "01", titre: "Flux inter-institutionnels au niveau central", items: [
    "Flux Présidence vers Primature","Flux Primature vers Ministères","Flux Assemblée Nationale vers Gouvernement","Flux Sénat vers Gouvernement","Flux Cour Constitutionnelle vers institutions","Flux Gouvernement vers Parlement (projets de loi)","Flux interministériel de coordination","Flux Conseil des Ministres vers Ministères","Flux Secrétariat Général du Gouvernement","Flux de transmission des décrets","Flux de transmission des ordonnances","Flux de rapports d'activite institutionnels","Flux de notifications officielles","Flux de correspondance administrative","Flux d'archivage institutionnel"
  ]},
  { code: "02", titre: "Flux intra-ministeriels", items: [
    "Flux Cabinet vers Secretariat General","Flux Secretariat General vers Directions","Flux Direction vers Divisions","Flux Division vers Bureaux","Flux Inspection Generale vers Cabinet","Flux de reporting hierarchique","Flux d'instructions descendantes","Flux de remontee d'information","Flux budgetaire interne","Flux des ressources humaines","Flux documentaire interne","Flux de validation des actes","Flux de courrier interne","Flux des reunions de coordination","Flux d'evaluation de performance"
  ]},
  { code: "03", titre: "Flux entre pouvoir central et provinces", items: [
    "Flux Ministere de l'Interieur vers Gouverneurs","Flux Gouverneurs vers Ministere de l'Interieur","Flux de transferts budgetaires aux provinces","Flux de rapports provinciaux","Flux de directives sectorielles vers provinces","Flux de statistiques provinciales","Flux de nomination des autorites provinciales","Flux de controle de legalite","Flux de rapports d'execution budgetaire provinciale","Flux de remontee des donnees de securite","Flux de remontee des donnees sanitaires","Flux de remontee des donnees educatives","Flux de coordination des investissements","Flux de gestion des crises provinciales","Flux d'evaluation des performances provinciales"
  ]},
  { code: "04", titre: "Flux entre provinces et ETD", items: [
    "Flux Gouverneur vers Maires/Bourgmestres","Flux Gouverneur vers Administrateurs de Territoire","Flux ETD vers Province (rapports)","Flux de transferts financiers aux ETD","Flux de remontee des recettes locales","Flux de gestion de l'etat civil local","Flux de securite locale","Flux de sante communautaire","Flux d'education de base","Flux d'infrastructures locales","Flux agricoles locaux","Flux fonciers locaux","Flux de gestion des marches locaux","Flux de participation citoyenne","Flux de reddition des comptes locaux"
  ]},
  { code: "05", titre: "Flux fiscaux et financiers", items: [
    "Flux de declaration fiscale DGI","Flux de recouvrement douanier DGDA","Flux de recettes administratives DGRAD","Flux budgetaires Ministere des Finances","Flux de tresorerie","Flux de la Banque Centrale","Flux bancaires interbancaires","Flux de paiement des salaires publics","Flux de la dette publique","Flux d'execution budgetaire","Flux de controle financier","Flux d'audit financier public","Flux de statistiques financieres","Flux de reporting au FMI/Banque Mondiale","Flux de gestion des marches publics"
  ]},
  { code: "06", titre: "Flux de donnees d'etat civil", items: [
    "Flux de declaration de naissance","Flux de declaration de deces","Flux de declaration de mariage","Flux d'enregistrement des divorces","Flux de delivrance des actes d'etat civil","Flux vers le fichier electoral","Flux vers l'identification nationale","Flux entre communes et bureaux d'etat civil","Flux de statistiques demographiques","Flux de coordination avec la CENI","Flux de verification d'identite","Flux de duplicata d'actes","Flux de transcription d'actes etrangers","Flux d'archivage des registres","Flux de numerisation de l'etat civil"
  ]},
  { code: "07", titre: "Flux de securite et defense", items: [
    "Flux Etat-Major vers unites militaires","Flux Police Nationale vers commissariats","Flux de renseignement","Flux de gestion des frontieres","Flux de coordination FARDC-Police","Flux d'alerte securitaire","Flux de gestion des crises","Flux de rapatriement de refugies","Flux de desarmement et demobilisation","Flux de gestion penitentiaire","Flux de statistiques de criminalite","Flux de cooperation militaire internationale","Flux de gestion des armements","Flux de protection civile","Flux de lutte anti-terroriste"
  ]},
  { code: "08", titre: "Flux judiciaires", items: [
    "Flux Parquet vers tribunaux","Flux tribunaux vers Cour d'Appel","Flux Cour d'Appel vers Cour de Cassation","Flux Cour Constitutionnelle","Flux de casier judiciaire","Flux de gestion des dossiers penaux","Flux de gestion des dossiers civils","Flux d'execution des jugements","Flux de statistiques judiciaires","Flux du Conseil Superieur de la Magistrature","Flux de nomination des magistrats","Flux de gestion des greffes","Flux de mandats d'arret","Flux d'entraide judiciaire internationale","Flux de mediation et arbitrage"
  ]},
  { code: "09", titre: "Flux electoraux", items: [
    "Flux CENI vers bureaux de vote","Flux de compilation des resultats","Flux d'enrolement electoral","Flux de mise a jour du fichier electoral","Flux de contentieux electoral","Flux vers la Cour Constitutionnelle (validation)","Flux de financement des partis politiques","Flux d'observation electorale","Flux de logistique electorale","Flux de securisation des scrutins","Flux de proclamation des resultats","Flux de publication au Journal Officiel","Flux de formation des agents electoraux","Flux de sensibilisation civique","Flux de coordination avec le CSAC"
  ]},
  { code: "10", titre: "Flux de sante publique", items: [
    "Flux Ministere de la Sante vers zones de sante","Flux de surveillance epidemiologique","Flux de gestion des vaccinations","Flux de gestion pharmaceutique","Flux hospitalier","Flux de statistiques sanitaires","Flux de gestion des ressources humaines sanitaires","Flux de financement de la sante","Flux de coordination avec les partenaires (OMS, UNICEF)","Flux de gestion des urgences sanitaires","Flux de sante maternelle et infantile","Flux de lutte contre les maladies tropicales","Flux d'assurance maladie","Flux de laboratoires de reference","Flux de telemedecine"
  ]},
  { code: "11", titre: "Flux d'education", items: [
    "Flux Ministere de l'EPST vers ecoles","Flux Ministere de l'ESU vers universites","Flux de gestion des enseignants","Flux d'evaluation scolaire (examens d'Etat)","Flux de statistiques scolaires","Flux de manuels scolaires","Flux de financement de l'education","Flux de bourses d'etudes","Flux de certification des diplomes","Flux de recherche universitaire","Flux d'infrastructures scolaires","Flux de cantines scolaires","Flux d'alphabetisation","Flux de formation professionnelle","Flux d'education inclusive"
  ]},
  { code: "12", titre: "Flux economiques et commerciaux", items: [
    "Flux de commerce exterieur","Flux douanier import/export","Flux d'investissement etranger","Flux de licences commerciales","Flux de normes et controle qualite OCC","Flux de statistiques economiques (BCC, INS)","Flux de gestion des entreprises publiques","Flux de partenariat public-prive","Flux de zones economiques speciales","Flux de propriete industrielle","Flux de concurrence et protection des consommateurs","Flux de microfinance","Flux de commerce informel","Flux de chaine d'approvisionnement","Flux de promotion des exportations"
  ]},
  { code: "13", titre: "Flux d'infrastructures et transport", items: [
    "Flux de gestion routiere","Flux de transport ferroviaire (SNCC)","Flux de transport aerien (RVA)","Flux de transport fluvial et maritime","Flux de gestion de l'electricite (SNEL)","Flux de gestion de l'eau (REGIDESO)","Flux de telecommunications","Flux de permis de construire","Flux d'urbanisme","Flux de cadastre","Flux de maintenance des infrastructures","Flux de projets d'infrastructure","Flux de partenariats de financement d'infrastructures","Flux de securite routiere","Flux de logistique portuaire"
  ]},
  { code: "14", titre: "Flux environnementaux", items: [
    "Flux de gestion forestiere","Flux de surveillance de la deforestation","Flux de gestion des aires protegees","Flux de changement climatique","Flux d'exploitation miniere et environnement","Flux de gestion des dechets","Flux de qualite de l'eau et de l'air","Flux de biodiversite","Flux de credits carbone","Flux de gestion des catastrophes naturelles","Flux de reboisement","Flux d'etudes d'impact environnemental","Flux de peche et ressources aquatiques","Flux de coordination avec les ONG environnementales","Flux de rapportage climatique international"
  ]},
  { code: "15", titre: "Flux de gouvernance numerique et interoperabilite", items: [
    "Flux d'echange de donnees inter-applicatif","Flux d'authentification unique (SSO)","Flux d'identification numerique nationale","Flux de signature electronique","Flux d'API gouvernementales","Flux de cybersecurite","Flux de sauvegarde et continuite","Flux d'audit des systemes d'information","Flux de gouvernance des donnees","Flux de dematerialisation des procedures","Flux de plateforme de paiement electronique","Flux d'open data gouvernemental","Flux de reporting statistique national (INS)","Flux de coordination interministerielle numerique","Flux de formation au numerique"
  ]}
];

async function main() {
  await db.run(
    "INSERT OR IGNORE INTO referentiel_national (code, nom, description, date_creation) VALUES (?, ?, ?, ?)",
    ["RNFI", "Referentiel National des Flux d'Information", "Referentiel national cartographiant les flux d'information entre institutions, niveaux de gouvernance et secteurs de la RDC", new Date().toISOString()]
  );

  let totalItems = 0;
  for (const s of sections) {
    const sectionId = "RNFI-SEC-" + s.code;
    await db.run(
      "INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre, contenu_texte, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sectionId, "RNFI", parseInt(s.code), "RNFI-" + s.code, s.titre, "Section " + s.code + " du RNFI : " + s.titre, new Date().toISOString()]
    );
    for (let i = 0; i < s.items.length; i++) {
      await db.run(
        "INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle, created_at) VALUES (?, ?, ?, ?, ?)",
        [sectionId + "-ITEM-" + (i+1), sectionId, i+1, s.items[i], new Date().toISOString()]
      );
      totalItems++;
    }
  }

  console.log("OK: RNFI cree avec " + sections.length + " sections et " + totalItems + " items");
}

main().catch(err => { console.error(err); process.exit(1); });
