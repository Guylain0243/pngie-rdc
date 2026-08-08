const db = require("./src/db");

async function main() {
  await db.run(
    `INSERT OR IGNORE INTO referentiel_national (code, nom, description) VALUES (?, ?, ?)`,
    ["RNDEC", "Référentiel National des Événements Complexes",
     "Architecture nationale de traitement des événements complexes (Complex Event Processing) du PNGIE-RDC : modèles d'événements, corrélation, causalité, fenêtres temporelles et spatiales, moteurs CEP, détection d'anomalies et de fraude, alertes temps réel, réactions automatiques."]
  );

  const sections = [
    { n: 1, code: "RNDEC-000001", titre: "MÉTADONNÉES D'UN ÉVÉNEMENT COMPLEXE",
      items: ["Code RNDEC","Identifiant unique","Nom de l'événement","Description","Domaine métier","Sous-domaine","Type d'événement","Propriétaire métier","Responsable technique","Autorité responsable","Événement source associé (RNEVT)","Modèle canonique associé (RNCIM)","Niveau de confidentialité","Niveau de criticité","Version","Statut","Date de création","Date de validation","Date de publication","URI de l'événement","Documentation","Historique des versions","Références réglementaires","Fenêtre de validité","Journal d'audit"] },
    { n: 2, code: "RNDEC-000002", titre: "CATÉGORIES D'ÉVÉNEMENTS",
      items: ["Événement simple","Événement composite","Événement métier","Événement technique","Événement financier","Événement judiciaire","Événement sécuritaire","Événement territorial","Événement sanitaire","Événement documentaire","Événement réglementaire","Événement d'infrastructure","Événement d'identité","Événement transversal","Événement national critique"] },
    { n: 3, code: "RNDEC-000003", titre: "TYPES DE PATTERNS DE CORRÉLATION",
      items: ["Séquence","Conjonction","Disjonction","Absence","Répétition","Seuil","Tendance","Agrégation","Fenêtrage","Négation","Causalité directe","Causalité indirecte","Corrélation temporelle","Corrélation spatiale","Corrélation multi-source"] },
    { n: 4, code: "RNDEC-000004", titre: "TYPES DE FENÊTRES",
      items: ["Fenêtre temporelle fixe","Fenêtre glissante","Fenêtre par session","Fenêtre par nombre d'événements","Fenêtre spatiale","Fenêtre spatio-temporelle","Fenêtre cumulative","Fenêtre décroissante","Fenêtre hiérarchique","Fenêtre métier","Fenêtre réglementaire","Fenêtre d'alerte","Fenêtre de tolérance","Fenêtre d'observation","Fenêtre nationale de référence"] },
    { n: 5, code: "RNDEC-000005", titre: "PROPRIÉTÉS D'UN ÉVÉNEMENT",
      items: ["Identifiant","Horodatage","Source","Type","Priorité","Statut","Payload","Contexte","Localisation","Acteur déclencheur","Niveau de confiance","Niveau de criticité","Corrélations associées","Version du schéma","Métadonnées"] },
    { n: 6, code: "RNDEC-000006", titre: "MOTEURS ET MÉCANISMES CEP",
      items: ["Moteur de règles","Moteur de patterns","Moteur de fenêtrage","Moteur de scoring","Moteur de détection d'anomalies","Moteur de détection de fraude","Moteur de corrélation","Moteur temporel","Moteur spatial","Moteur d'apprentissage","Moteur hybride règles/IA","Moteur de simulation","Moteur de rejeu (replay)","Moteur de priorisation","Moteur national CEP"] },
    { n: 7, code: "RNDEC-000007", titre: "RÈGLES DE DÉTECTION",
      items: ["Règle de seuil","Règle de fréquence","Règle de séquence","Règle d'absence","Règle de déviation","Règle de comparaison","Règle croisée multi-source","Règle géographique","Règle temporelle","Règle réglementaire","Règle de fraude financière","Règle de fraude documentaire","Règle de sécurité","Règle de conformité","Règle nationale prioritaire"] },
    { n: 8, code: "RNDEC-000008", titre: "MÉCANISMES D'ALERTE",
      items: ["Alerte temps réel","Alerte différée","Alerte par seuil","Alerte par tendance","Alerte critique","Alerte informative","Notification interne","Notification externe","Escalade automatique","Escalade hiérarchique","Tableau de bord d'alerte","Journal d'alertes","Canal SMS","Canal e-mail","Canal plateforme nationale"] },
    { n: 9, code: "RNDEC-000009", titre: "CYCLE DE VIE D'UN ÉVÉNEMENT COMPLEXE",
      items: ["Capture","Normalisation","Enrichissement","Corrélation","Évaluation","Détection","Notification","Réaction","Investigation","Résolution","Clôture","Archivage","Rejeu","Capitalisation","Amélioration continue"] },
    { n: 10, code: "RNDEC-000010", titre: "INDICATEURS",
      items: ["Nombre d'événements traités","Nombre d'événements complexes détectés","Nombre d'alertes générées","Taux de faux positifs","Taux de faux négatifs","Temps moyen de détection","Temps moyen de réaction","Taux de corrélation réussie","Taux de couverture des règles","Latence du moteur CEP","Disponibilité","Taux de fraude détectée","Taux d'anomalies confirmées","Niveau de maturité","Indice national de vigilance événementielle"] },
    { n: 11, code: "RNDEC-000011", titre: "GOUVERNANCE DES ÉVÉNEMENTS COMPLEXES",
      items: ["Politique nationale CEP","Comité de détection","Comité de gestion des alertes","Comité anti-fraude","Comité de sécurité","Gestion documentaire","Gestion des versions des règles","Gestion des changements","Gestion des risques","Audit","Contrôle qualité","Reporting","Certification des moteurs","Amélioration continue","Gouvernance nationale CEP"] },
    { n: 12, code: "RNDEC-000012", titre: "CATALOGUE NATIONAL DES ÉVÉNEMENTS COMPLEXES",
      items: ["Catalogue des patterns","Catalogue des règles","Catalogue des fenêtres","Catalogue des moteurs","Catalogue des alertes","Catalogue des scénarios de fraude","Catalogue des scénarios d'anomalies","Catalogue des scénarios sécuritaires","Catalogue des scénarios financiers","Catalogue des scénarios judiciaires","Catalogue des indicateurs","Catalogue des tableaux de bord","Catalogue des API CEP","Catalogue des journaux","Catalogue national des événements complexes"] },
    { n: 13, code: "RNDEC-000013", titre: "INTÉGRATION AVEC LES AUTRES RÉFÉRENTIELS",
      items: ["RNEVT → Événements d'intégration","RNAPI → Interfaces et API","RNFI → Flux d'information","RNIAI → Gouvernance de l'IA","RNAGI → Agents intelligents","RNSEM → Ontologies et sémantique","RNDG → Graphes de données","RNCIM → Modèle canonique d'information","RNMDM → Données maîtres","RNBOM → Objets métier","RNRS → Gestion des risques","RNCC → Contrôles","RNIP → Indicateurs","RNPOL → Politiques nationales","RNDOC → Documents","RNG → Gouvernance","RNBCM → Capacités métier","RNEX → Exigences"] },
    { n: 14, code: "RNDEC-000014", titre: "ARCHITECTURE LOGIQUE DU CEP",
      items: ["Couche de capture d'événements","Couche de normalisation","Couche d'enrichissement","Couche de fenêtrage","Couche de corrélation","Couche de règles","Couche de détection d'anomalies","Couche de scoring","Couche d'alerte","Couche de réaction automatique","Couche d'investigation","Couche analytique","Couche de sécurité","Couche de gouvernance","Architecture logique nationale"] },
    { n: 15, code: "RNDEC-000015", titre: "ARCHITECTURE NATIONALE DU TRAITEMENT DES ÉVÉNEMENTS COMPLEXES",
      items: [] }
  ];

  let sectionCount = 0, itemCount = 0;

  for (const s of sections) {
    const sectionId = `RNDEC-${String(s.n).padStart(3, "0")}`;
    await db.run(
      `INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre) VALUES (?, ?, ?, ?, ?)`,
      [sectionId, "RNDEC", s.n, s.code, s.titre]
    );
    sectionCount++;

    for (let i = 0; i < s.items.length; i++) {
      const itemId = `${sectionId}-${String(i + 1).padStart(2, "0")}`;
      await db.run(
        `INSERT OR IGNORE INTO referentiel_national_item (item_id, section_id, numero, libelle) VALUES (?, ?, ?, ?)`,
        [itemId, sectionId, i + 1, s.items[i]]
      );
      itemCount++;
    }
  }

  console.log(`OK: RNDEC insere - ${sectionCount} sections, ${itemCount} items`);
}

main().catch(err => { console.error(err); process.exit(1); });
