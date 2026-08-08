const db = require("./src/db");

async function main() {
  await db.run(
    `INSERT OR IGNORE INTO referentiel_national (code, nom, description) VALUES (?, ?, ?)`,
    ["RNSEM", "Référentiel National de la Sémantique et des Ontologies Métier",
     "Couche sémantique officielle du PNGIE-RDC : concepts, taxonomies, ontologies, graphes de connaissances et règles d'inférence."]
  );

  const sections = [
    { n: 1, code: "RNSEM-000001", titre: "MÉTADONNÉES D'UN CONCEPT SÉMANTIQUE",
      items: ["Code RNSEM","Identifiant universel","Nom du concept","Libellé officiel","Définition","Domaine métier","Sous-domaine","Ontologie d'appartenance","Taxonomie associée","Objet métier associé (RNBOM)","Modèle canonique associé (RNCIM)","Data Owner","Autorité responsable","Niveau de confidentialité","Version","Statut","Date de création","Date de validation","Date de publication","URI officielle","Documentation","Historique","Références réglementaires","Langues disponibles","Journal d'audit"] },
    { n: 2, code: "RNSEM-000002", titre: "CATÉGORIES DE CONCEPTS",
      items: ["Personne","Organisation","Territoire","Bien","Ressource","Processus","Service","Événement","Document","Donnée","Règle","Actif","Infrastructure","Politique publique","Concept transversal"] },
    { n: 3, code: "RNSEM-000003", titre: "TYPES D'ONTOLOGIES",
      items: ["Ontologie fondamentale","Ontologie métier","Ontologie gouvernementale","Ontologie documentaire","Ontologie géographique","Ontologie juridique","Ontologie financière","Ontologie sanitaire","Ontologie éducative","Ontologie statistique","Ontologie de sécurité","Ontologie technique","Ontologie IA","Ontologie interopérable","Ontologie nationale souveraine"] },
    { n: 4, code: "RNSEM-000004", titre: "RELATIONS SÉMANTIQUES",
      items: ["Est un","Fait partie de","Contient","Possède","Dépend de","Produit","Consomme","Utilise","Référence","Est associé à","Est équivalent à","Est compatible avec","Hérite de","Contrôle","Influence"] },
    { n: 5, code: "RNSEM-000005", titre: "TAXONOMIES",
      items: ["Taxonomie administrative","Taxonomie territoriale","Taxonomie documentaire","Taxonomie métier","Taxonomie fonctionnelle","Taxonomie applicative","Taxonomie des données","Taxonomie réglementaire","Taxonomie financière","Taxonomie statistique","Taxonomie sectorielle","Taxonomie technique","Taxonomie des services","Taxonomie nationale","Taxonomie intersectorielle"] },
    { n: 6, code: "RNSEM-000006", titre: "VOCABULAIRES CONTRÔLÉS",
      items: ["Glossaire national","Dictionnaire métier","Liste de codes","Liste de valeurs","Synonymes","Acronymes","Abréviations","Descripteurs","Mots-clés","Expressions normalisées","Terminologie juridique","Terminologie administrative","Terminologie technique","Terminologie sectorielle","Vocabulaire gouvernemental officiel"] },
    { n: 7, code: "RNSEM-000007", titre: "GRAPHES DE CONNAISSANCES",
      items: ["Graphe des citoyens","Graphe des entreprises","Graphe des administrations","Graphe des territoires","Graphe des infrastructures","Graphe des services publics","Graphe des données","Graphe documentaire","Graphe réglementaire","Graphe financier","Graphe décisionnel","Graphe IA","Graphe d'interopérabilité","Graphe transversal","Graphe national de connaissances"] },
    { n: 8, code: "RNSEM-000008", titre: "RÈGLES D'INFÉRENCE",
      items: ["Déduction","Induction","Abduction","Héritage","Classification","Validation logique","Vérification de cohérence","Détection de contradiction","Alignement sémantique","Raisonnement temporel","Raisonnement spatial","Raisonnement réglementaire","Raisonnement métier","Raisonnement probabiliste","Raisonnement hybride"] },
    { n: 9, code: "RNSEM-000009", titre: "STANDARDS SÉMANTIQUES",
      items: ["RDF","RDFS","OWL","SKOS","SHACL","SPARQL","JSON-LD","Turtle","N-Triples","RDF/XML","DCAT","Dublin Core","FOAF","PROV-O","Standard national PNGIE-RDC"] },
    { n: 10, code: "RNSEM-000010", titre: "INDICATEURS",
      items: ["Nombre de concepts","Nombre d'ontologies","Nombre de taxonomies","Nombre de graphes","Nombre de relations","Nombre de règles","Taux de cohérence","Taux d'alignement","Taux de réutilisation","Nombre de requêtes SPARQL","Qualité sémantique","Couverture métier","Performance des inférences","Niveau de maturité","Indice national de gouvernance sémantique"] },
    { n: 11, code: "RNSEM-000011", titre: "GOUVERNANCE SÉMANTIQUE",
      items: ["Politique nationale sémantique","Comité des ontologies","Comité des taxonomies","Comité des vocabulaires","Comité qualité","Comité IA","Gestion documentaire","Gestion des versions","Gestion des changements","Gestion des risques","Audit","Reporting","Certification","Amélioration continue","Gouvernance nationale sémantique"] },
    { n: 12, code: "RNSEM-000012", titre: "CATALOGUE NATIONAL DES CONNAISSANCES",
      items: ["Catalogue des concepts","Catalogue des ontologies","Catalogue des taxonomies","Catalogue des vocabulaires","Catalogue des graphes","Catalogue des règles","Catalogue des URI","Catalogue des alignements","Catalogue des mappings","Catalogue des standards","Catalogue des requêtes","Catalogue des inférences","Catalogue des métadonnées","Catalogue des publications","Catalogue national des connaissances"] },
    { n: 13, code: "RNSEM-000013", titre: "INTÉGRATION AVEC LES AUTRES RÉFÉRENTIELS",
      items: ["RNBOM → Objets métier","RNCIM → Modèle canonique d'information","RNMDM → Données maîtres","RND → Données","RNDC → Dictionnaire de données","RNDAM → Actifs de données","RNAPI → Interfaces et API","RNEVT → Événements d'intégration","RNIAI → Gouvernance de l'IA","RNAGI → Agents intelligents","RNBCM → Capacités métier","RNFI → Flux d'information","RNCC → Contrôles","RNRS → Risques","RNIP → Indicateurs","RNPOL → Politiques","RNDOC → Documents","RNEX → Exigences"] },
    { n: 14, code: "RNSEM-000014", titre: "ARCHITECTURE LOGIQUE DE LA COUCHE SÉMANTIQUE",
      items: ["Couche des concepts","Couche des vocabulaires","Couche des taxonomies","Couche des ontologies","Couche des graphes de connaissances","Couche des règles d'inférence","Couche des alignements","Couche des mappings","Couche des requêtes SPARQL","Couche des API sémantiques","Couche de validation","Couche de gouvernance","Couche de supervision","Couche d'interopérabilité","Architecture logique nationale"] },
    { n: 15, code: "RNSEM-000015", titre: "ARCHITECTURE NATIONALE DE LA SÉMANTIQUE ET DES ONTOLOGIES",
      items: [] }
  ];

  let sectionCount = 0, itemCount = 0;

  for (const s of sections) {
    const sectionId = `RNSEM-${String(s.n).padStart(3, "0")}`;
    await db.run(
      `INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre) VALUES (?, ?, ?, ?, ?)`,
      [sectionId, "RNSEM", s.n, s.code, s.titre]
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

  console.log(`OK: RNSEM insere - ${sectionCount} sections, ${itemCount} items`);
}

main().catch(err => { console.error(err); process.exit(1); });
