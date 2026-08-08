const db = require("./src/db");

const chapitres = [
  {
    id: "CH663",
    num: 663,
    titre: "Présentation Générale",
    contenu: `663.1 Définition

Le Ministère de la Pêche et de l'Élevage est l'institution responsable de la conception, de la coordination, de la mise en œuvre et de l'évaluation de la politique nationale relative aux ressources halieutiques, à l'aquaculture, à l'élevage, à la santé animale, à la production animale, à la sécurité sanitaire des produits d'origine animale, à la gestion durable des ressources pastorales, au développement des filières animales et halieutiques ainsi qu'à la souveraineté alimentaire d'origine animale.

Dans l'architecture du PNGIE-RDC, il constitue le Pilier National de Gouvernance de la Pêche, de l'Aquaculture et de l'Élevage, garantissant une gestion intégrée, interopérable, géospatiale, sécurisée et pilotée par les données de l'ensemble des filières animales et halieutiques de la République Démocratique du Congo.`
  },
  {
    id: "CH664",
    num: 664,
    titre: "Architecture Institutionnelle",
    contenu: `Ministre
│
├── Cabinet
├── Vice-Ministre
├── Secrétaire Général
├── Inspection Générale de la Pêche et de l'Élevage
├── Direction Générale de la Pêche
├── Direction Générale de l'Aquaculture
├── Direction Générale de l'Élevage
├── Direction Générale de la Santé Animale
├── Direction Générale des Productions Animales
├── Direction Générale des Ressources Pastorales
├── Direction Générale des Filières Halieutiques
├── Direction Générale de la Transformation Numérique
├── Direction des Systèmes d'Information
├── Direction Administrative et Financière
├── Direction des Ressources Humaines
├── Direction de la Coopération Technique
├── Cellule PNGIE
└── Coordinations Provinciales`
  },
  {
    id: "CH665",
    num: 665,
    titre: "Architecture Fonctionnelle",
    contenu: `MINISTÈRE DE LA PÊCHE ET DE L'ÉLEVAGE
│
├── Gouvernance de la Pêche et de l'Élevage
├── Pêche
├── Aquaculture
├── Élevage
├── Santé Animale
├── Productions Animales
├── Ressources Pastorales
├── Filières Halieutiques
├── Intelligence Halieutique et Zootechnique
├── Transformation Numérique
└── Pilotage National`
  },
  {
    id: "CH666",
    num: 666,
    titre: "Capacités Métier (RNBCM)",
    contenu: `Gouvernance de la pêche et de l'élevage

001 Élaborer la politique nationale de la pêche
002 Élaborer la politique nationale de l'élevage
003 Élaborer les stratégies nationales des productions animales
004 Coordonner les politiques publiques halieutiques et zootechniques
005 Superviser les programmes nationaux de la pêche et de l'élevage
006 Développer les référentiels nationaux des filières animales
007 Évaluer les politiques publiques sectorielles
008 Piloter la gouvernance nationale des ressources halieutiques et animales

Pêche

009 Planifier l'exploitation des ressources halieutiques
010 Gérer les zones de pêche
011 Délivrer les autorisations de pêche
012 Superviser les activités de pêche artisanale
013 Superviser les activités de pêche industrielle
014 Contrôler les captures
015 Produire les statistiques halieutiques
016 Évaluer l'état des ressources halieutiques

Aquaculture

017 Développer les programmes aquacoles
018 Superviser les exploitations aquacoles
019 Gérer les stations piscicoles
020 Développer les écloseries
021 Promouvoir les investissements aquacoles
022 Superviser la production aquacole
023 Produire les statistiques aquacoles
024 Évaluer les performances de l'aquaculture

Élevage

025 Développer les productions bovines
026 Développer les productions porcines
027 Développer les productions avicoles
028 Développer les productions caprines
029 Développer les productions ovines
030 Développer les productions cunicoles
031 Produire les statistiques d'élevage
032 Évaluer les performances zootechniques

Santé animale

033 Surveiller les maladies animales
034 Organiser la surveillance épidémiologique
035 Superviser les campagnes de vaccination
036 Gérer les alertes sanitaires animales
037 Superviser les laboratoires vétérinaires
038 Coordonner les interventions sanitaires
039 Produire les statistiques vétérinaires
040 Évaluer les risques sanitaires

Productions animales

041 Développer les filières animales
042 Développer les unités de transformation animale
043 Promouvoir la qualité des productions animales
044 Superviser les produits d'origine animale
045 Développer les marchés des produits animaux
046 Renforcer les organisations professionnelles
047 Produire les statistiques économiques animales
048 Évaluer les performances des filières

Ressources pastorales

049 Gérer les pâturages
050 Développer les ressources fourragères
051 Planifier les zones pastorales
052 Superviser les infrastructures pastorales
053 Prévenir les conflits pastoraux
054 Développer les systèmes pastoraux
055 Produire les statistiques pastorales
056 Évaluer les ressources pastorales

Gouvernance numérique

057 Administrer le registre national des pêcheurs
058 Administrer le registre national des exploitations aquacoles
059 Administrer le registre national des élevages
060 Administrer le registre national des établissements vétérinaires
061 Administrer le registre national des filières animales
062 Produire les statistiques nationales de la pêche et de l'élevage
063 Développer les tableaux de bord nationaux
064 Assurer l'interopérabilité des systèmes
065 Développer les analyses décisionnelles
066 Administrer les observatoires numériques
067 Piloter les plateformes nationales de la pêche et de l'élevage`
  },
  {
    id: "CH667",
    num: 667,
    titre: "Cartographie des Processus",
    contenu: `Processus stratégiques

gouvernance nationale de la pêche ;
gouvernance nationale de l'élevage ;
gestion durable des ressources halieutiques ;
développement de l'aquaculture ;
développement des productions animales ;
santé animale ;
développement des filières halieutiques ;
développement des ressources pastorales ;
transformation numérique.

Processus métiers

Diagnostic sectoriel → Planification → Programmation → Mobilisation des ressources → Exécution → Contrôle → Suivi → Évaluation

Processus de gestion d'une campagne de pêche

Évaluation des ressources → Planification → Autorisation → Exploitation → Contrôle → Collecte des données → Évaluation

Processus de surveillance sanitaire animale

Observation → Signalement → Diagnostic → Confirmation → Intervention → Suivi → Clôture

Processus de développement d'une exploitation aquacole

Identification → Étude de faisabilité → Autorisation → Construction → Mise en production → Suivi technique → Évaluation

Processus de développement des filières animales

Analyse sectorielle → Organisation → Investissement → Production → Transformation → Commercialisation → Évaluation

Processus support

administration générale ;
gestion des ressources humaines ;
gestion financière ;
passation des marchés publics ;
audit interne ;
communication institutionnelle ;
gestion documentaire ;
gestion des archives ;
systèmes d'information ;
gestion des infrastructures numériques.`
  },
  {
    id: "CH668",
    num: 668,
    titre: "Architecture des Données",
    contenu: `Référentiels des ressources halieutiques

espèces halieutiques ; zones de pêche ; plans d'eau ; lacs ; fleuves ; rivières ; zones maritimes ; stocks halieutiques ; saisons de pêche ; quotas de pêche.

Référentiels de la pêche

pêcheurs artisanaux ; pêcheurs industriels ; embarcations de pêche ; navires de pêche ; licences de pêche ; permis de pêche ; coopératives de pêche ; sites de débarquement ; ports de pêche ; infrastructures halieutiques.

Référentiels aquacoles

exploitations aquacoles ; stations piscicoles ; étangs piscicoles ; cages flottantes ; bassins aquacoles ; écloseries ; espèces aquacoles ; aliments piscicoles ; équipements aquacoles ; producteurs aquacoles.

Référentiels de l'élevage

exploitations d'élevage ; élevages bovins ; élevages porcins ; élevages avicoles ; élevages ovins ; élevages caprins ; élevages cunicoles ; élevages apicoles ; élevages piscicoles intégrés ; unités de production animale.

Référentiels vétérinaires

établissements vétérinaires ; vétérinaires ; auxiliaires vétérinaires ; laboratoires vétérinaires ; vaccins vétérinaires ; médicaments vétérinaires ; maladies animales ; foyers épidémiologiques ; campagnes de vaccination ; certificats sanitaires.

Référentiels pastoraux

zones pastorales ; pâturages ; parcours pastoraux ; ressources fourragères ; points d'abreuvement ; couloirs de transhumance ; infrastructures pastorales ; conflits pastoraux ; organisations pastorales ; programmes pastoraux.

Référentiels économiques

filières animales ; filières halieutiques ; abattoirs ; marchés à bétail ; marchés halieutiques ; unités de transformation ; centres de collecte ; entrepôts frigorifiques ; chaînes logistiques ; opérateurs économiques.

Référentiels analytiques

statistiques halieutiques ; statistiques aquacoles ; statistiques d'élevage ; statistiques vétérinaires ; indicateurs sanitaires ; indicateurs de production ; indicateurs économiques ; tableaux de bord nationaux.

Référentiels PNGIE-RDC

RNI ; RNPM ; RNBCM ; RNBOM ; RNCIM ; RNMDM ; RNSEM ; RNAPI ; RNFI ; RNDEC ; RNDG ; RNIAI ; RNAGI ; RGN ; RNA ; RNP ; Registre National des Pêcheurs ; Registre National des Exploitations Aquacoles ; Registre National des Exploitations d'Élevage ; Registre National des Établissements Vétérinaires ; Référentiel National des Filières Halieutiques et Animales.`
  },
  {
    id: "CH669",
    num: 669,
    titre: "Architecture Applicative",
    contenu: `Gouvernance de la pêche et de l'élevage

Plateforme Nationale de Gouvernance de la Pêche et de l'Élevage ; Gestion des Politiques Sectorielles ; Gestion des Stratégies Nationales ; Gestion des Programmes Nationaux ; Gestion des Réformes Sectorielles.

Pêche

Gestion des Zones de Pêche ; Gestion des Licences de Pêche ; Gestion des Captures ; Gestion des Débarquements ; Gestion des Flottes de Pêche ; Gestion des Ressources Halieutiques.

Aquaculture

Gestion des Exploitations Aquacoles ; Gestion des Écloseries ; Gestion des Stations Piscicoles ; Gestion des Productions Aquacoles ; Gestion des Aliments Piscicoles ; Gestion des Investissements Aquacoles.

Élevage

Gestion des Exploitations d'Élevage ; Gestion des Cheptels ; Gestion des Productions Animales ; Gestion de la Reproduction ; Gestion de l'Alimentation Animale ; Gestion des Performances Zootechniques.

Santé animale

Gestion de la Surveillance Sanitaire ; Gestion des Vaccinations ; Gestion des Laboratoires Vétérinaires ; Gestion des Alertes Épidémiologiques ; Gestion des Médicaments Vétérinaires ; Gestion des Certificats Sanitaires.

Filières animales et halieutiques

Gestion des Filières Halieutiques ; Gestion des Filières Animales ; Gestion des Marchés ; Gestion des Abattoirs ; Gestion des Centres de Collecte ; Gestion des Unités de Transformation.

Intelligence décisionnelle

BI Pêche et Élevage ; Data Warehouse Halieutique ; Data Warehouse Zootechnique ; Data Lake Halieutique et Animal ; Knowledge Graph Halieutique ; Knowledge Graph Zootechnique ; IA de Prévision des Ressources Halieutiques ; IA de Surveillance Épidémiologique Animale ; IA d'Optimisation des Productions Animales ; IA de Prévision des Productions Aquacoles ; IA d'Analyse des Filières Animales ; Jumeau Numérique National de la Pêche et de l'Élevage.`
  },
  {
    id: "CH670",
    num: 670,
    titre: "Architecture Technologique",
    contenu: `L'architecture technologique comprend :

Cloud Gouvernemental ; Cloud National de la Pêche et de l'Élevage ; Datacenter National ; plateforme nationale de la pêche ; plateforme nationale de l'aquaculture ; plateforme nationale de l'élevage ; plateforme nationale de la santé animale ; plateforme nationale vétérinaire ; plateforme nationale des filières halieutiques ; plateforme nationale des productions animales ; portail national de la pêche et de l'élevage ; plateforme nationale des statistiques halieutiques ; plateforme nationale des statistiques zootechniques ; API Gateway Nationale ; ESB Gouvernemental ; IAM ; PKI ; infrastructure nationale de signature électronique ; Data Lake Halieutique et Animal ; Knowledge Graph Halieutique et Zootechnique ; plateforme nationale SIG des ressources halieutiques ; plateforme nationale de surveillance épidémiologique animale ; plateforme nationale d'observation des ressources halieutiques ; Centre National de Supervision de la Pêche et de l'Élevage.`
  },
  {
    id: "CH671",
    num: 671,
    titre: "Architecture de Sécurité",
    contenu: `Gouvernance

La gouvernance de la sécurité du système d'information du Ministère de la Pêche et de l'Élevage repose sur les principes suivants : gouvernance nationale des données halieutiques et zootechniques ; classification des données relatives aux ressources halieutiques et aux productions animales ; gouvernance des référentiels nationaux de la pêche et de l'élevage ; protection des données des producteurs, pêcheurs et éleveurs ; conformité aux normes nationales de cybersécurité ; gouvernance des identités numériques des acteurs des filières animales et halieutiques ; gouvernance des plateformes nationales sectorielles ; traçabilité complète des opérations halieutiques et zootechniques.

Protection

Les mécanismes de protection comprennent : authentification multifacteur ; fédération des identités numériques ; contrôle des accès basé sur les rôles ; chiffrement des bases de données ; chiffrement des communications ; signature électronique gouvernementale ; journalisation exhaustive ; gestion des certificats numériques ; protection des plateformes vétérinaires ; protection des plateformes halieutiques ; protection des données géospatiales des ressources naturelles ; anonymisation des données statistiques sectorielles.

Cybersécurité

Le dispositif national comprend : supervision permanente des plateformes ; SOC gouvernemental ; détection des intrusions ; sécurisation des API ; surveillance des infrastructures numériques ; contrôle continu des vulnérabilités ; audit périodique des systèmes ; gestion des incidents de cybersécurité ; surveillance des échanges interinstitutionnels ; protection des plateformes critiques de la pêche, de l'aquaculture, de l'élevage, de la santé animale, des productions animales et des filières halieutiques.

Résilience

Le ministère met en œuvre : Plan de Continuité d'Activité (PCA) ; Plan de Reprise d'Activité (PRA) ; sauvegardes nationales ; réplication multisite ; haute disponibilité ; redondance des infrastructures critiques ; restauration automatisée ; continuité des services numériques de la pêche, de l'aquaculture, de l'élevage, de la santé animale, des productions animales, des ressources pastorales et des filières halieutiques.`
  }
];

async function main() {
  for (const c of chapitres) {
    await db.run(
      "INSERT OR IGNORE INTO manuel_architecture (chapitre_id, numero_chapitre, institution, titre_chapitre, contenu_narratif, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [c.id, c.num, "Ministere de la Peche et de l'Elevage", c.titre, c.contenu, new Date().toISOString()]
    );
    console.log(`Chapitre ${c.num} (${c.titre}) insere ou deja present.`);
  }

  const r = await db.all(
    "SELECT chapitre_id, numero_chapitre, titre_chapitre FROM manuel_architecture WHERE numero_chapitre BETWEEN 663 AND 671 ORDER BY numero_chapitre"
  );
  console.log("Verification finale:", r);
}

main().catch(e => console.log("ERREUR FATALE:", e.message));
