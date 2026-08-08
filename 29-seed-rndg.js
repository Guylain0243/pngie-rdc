const db = require("./src/db");

async function main() {
  await db.run(
    `INSERT OR IGNORE INTO referentiel_national (code, nom, description) VALUES (?, ?, ?)`,
    ["RNDG", "Référentiel National des Graphes de Données",
     "Couche nationale de représentation des données relationnelles et des connaissances du PNGIE-RDC : graphes gouvernementaux, nœuds, relations, propriétés et mécanismes d'exploitation."]
  );

  const sections = [
    { n: 1, code: "RNDG-000001", titre: "MÉTADONNÉES D'UN GRAPHE DE DONNÉES",
      items: ["Code RNDG","Identifiant unique","Nom du graphe","Description","Domaine métier","Sous-domaine","Type de graphe","Propriétaire métier","Responsable technique","Autorité responsable","Ontologie associée (RNSEM)","Modèle canonique associé (RNCIM)","Niveau de confidentialité","Niveau de criticité","Version","Statut","Date de création","Date de validation","Date de publication","URI du graphe","Documentation","Historique des versions","Références réglementaires","Licence d'utilisation","Journal d'audit"] },
    { n: 2, code: "RNDG-000002", titre: "CATÉGORIES DE GRAPHES",
      items: ["Graphe de connaissances","Graphe métier","Graphe organisationnel","Graphe territorial","Graphe documentaire","Graphe réglementaire","Graphe financier","Graphe d'identité","Graphe d'infrastructures","Graphe des actifs","Graphe des processus","Graphe événementiel","Graphe décisionnel","Graphe analytique","Graphe national fédéré"] },
    { n: 3, code: "RNDG-000003", titre: "TYPES DE NŒUDS",
      items: ["Personne","Organisation","Administration","Territoire","Actif","Document","Donnée","Service","Processus","Événement","Contrat","Infrastructure","Ressource","Décision","Concept sémantique"] },
    { n: 4, code: "RNDG-000004", titre: "TYPES DE RELATIONS",
      items: ["Est membre de","Appartient à","Dépend de","Produit","Consomme","Gère","Contrôle","Finance","Localise","Relie","Hérite de","Est conforme à","Remplace","Référence","Influence"] },
    { n: 5, code: "RNDG-000005", titre: "PROPRIÉTÉS DES NŒUDS",
      items: ["Identifiant","Nom","Libellé","Description","Catégorie","Type","Statut","Date de création","Date de modification","Version","Source","Niveau de confidentialité","Niveau de criticité","Localisation","Métadonnées"] },
    { n: 6, code: "RNDG-000006", titre: "PROPRIÉTÉS DES RELATIONS",
      items: ["Identifiant","Type","Direction","Cardinalité","Force de relation","Pondération","Date de début","Date de fin","Validité","Statut","Source","Niveau de confiance","Historique","Version","Métadonnées"] },
    { n: 7, code: "RNDG-000007", titre: "MODÈLES DE REPRÉSENTATION",
      items: ["Property Graph","RDF Graph","Hypergraph","Knowledge Graph","Semantic Graph","Labeled Graph","Directed Graph","Undirected Graph","Weighted Graph","Temporal Graph","Spatial Graph","Federated Graph","Multi-layer Graph","Hybrid Graph","National Sovereign Graph"] },
    { n: 8, code: "RNDG-000008", titre: "MÉCANISMES DE REQUÊTAGE",
      items: ["SPARQL","Cypher","Gremlin","GraphQL","GQL","Requête RDF","Traversée de graphe","Recherche de chemin","Recherche de voisinage","Détection de communautés","Centralité","Similarité","Inférence","Analyse d'impact","Requêtes fédérées"] },
    { n: 9, code: "RNDG-000009", titre: "CYCLE DE VIE D'UN GRAPHE",
      items: ["Identification","Conception","Modélisation","Validation","Publication","Indexation","Synchronisation","Exploitation","Optimisation","Extension","Fusion","Archivage","Dépréciation","Suppression","Capitalisation"] },
    { n: 10, code: "RNDG-000010", titre: "INDICATEURS",
      items: ["Nombre de graphes","Nombre de nœuds","Nombre de relations","Densité","Connectivité","Temps de réponse","Nombre de requêtes","Disponibilité","Cohérence","Taux d'intégrité","Taux de synchronisation","Taux de fédération","Performance","Niveau de maturité","Indice national des graphes"] },
    { n: 11, code: "RNDG-000011", titre: "GOUVERNANCE DES GRAPHES",
      items: ["Politique nationale","Comité des graphes","Comité d'interopérabilité","Comité des données","Comité des ontologies","Comité IA","Gestion documentaire","Gestion des versions","Gestion des changements","Gestion des risques","Audit","Contrôle qualité","Reporting","Amélioration continue","Gouvernance nationale des graphes"] },
    { n: 12, code: "RNDG-000012", titre: "CATALOGUE NATIONAL DES GRAPHES",
      items: ["Catalogue des graphes métier","Catalogue des graphes territoriaux","Catalogue des graphes documentaires","Catalogue des graphes réglementaires","Catalogue des graphes financiers","Catalogue des graphes organisationnels","Catalogue des graphes d'identité","Catalogue des graphes analytiques","Catalogue des graphes décisionnels","Catalogue des graphes de connaissances","Catalogue des modèles","Catalogue des requêtes","Catalogue des API Graph","Catalogue des fédérations","Catalogue national des graphes"] },
    { n: 13, code: "RNDG-000013", titre: "INTÉGRATION AVEC LES AUTRES RÉFÉRENTIELS",
      items: ["RNSEM → Ontologies et sémantique","RNCIM → Modèle canonique d'information","RNMDM → Données maîtres","RNBOM → Objets métier","RND → Données","RNDC → Dictionnaire de données","RNDAM → Actifs de données","RNAPI → Interfaces et API","RNEVT → Événements d'intégration","RNFI → Flux d'information","RNIAI → Gouvernance IA","RNAGI → Agents intelligents","RNBCM → Capacités métier","RNIP → Indicateurs","RNRS → Gestion des risques","RNG → Gouvernance","RNPOL → Politiques nationales","RNDOC → Documents"] },
    { n: 14, code: "RNDG-000014", titre: "ARCHITECTURE LOGIQUE DES GRAPHES",
      items: ["Couche des sources de données","Couche de transformation","Couche canonique","Couche sémantique","Couche des graphes","Couche d'inférence","Couche de fédération","Couche d'interrogation","Couche analytique","Couche IA","Couche API Graph","Couche de sécurité","Couche de gouvernance","Couche de supervision","Architecture logique nationale"] },
    { n: 15, code: "RNDG-000015", titre: "ARCHITECTURE NATIONALE DES GRAPHES DE DONNÉES",
      items: [] }
  ];

  let sectionCount = 0, itemCount = 0;

  for (const s of sections) {
    const sectionId = `RNDG-${String(s.n).padStart(3, "0")}`;
    await db.run(
      `INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre) VALUES (?, ?, ?, ?, ?)`,
      [sectionId, "RNDG", s.n, s.code, s.titre]
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

  console.log(`OK: RNDG insere - ${sectionCount} sections, ${itemCount} items`);
}

main().catch(err => { console.error(err); process.exit(1); });
