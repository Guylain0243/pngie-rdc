const db = require("./src/db");

async function main() {
  await db.run(
    `INSERT OR IGNORE INTO referentiel_national (code, nom, description) VALUES (?, ?, ?)`,
    ["RNAPI", "Référentiel National des Interfaces et API",
     "Normalisation de l'ensemble des interfaces de programmation (API) du PNGIE-RDC : interopérabilité, sécurité et gouvernance des échanges entre administrations, plateformes numériques et systèmes tiers."]
  );

  const sections = [
    { n: 1, code: "RNAPI-000001", titre: "MÉTADONNÉES D'UNE API",
      items: ["Code RNAPI","Identifiant unique","Nom de l'API","Description","Domaine métier","Sous-domaine","Version","Propriétaire métier","Responsable technique","Autorité responsable","Objet métier associé (RNBOM)","Modèle canonique associé (RNCIM)","Niveau de confidentialité","Niveau de criticité","Statut","Date de création","Date de validation","Date de publication","URL de base","Documentation (OpenAPI/Swagger)","Historique des versions","Références réglementaires","SLA associé","Journal d'audit"] },
    { n: 2, code: "RNAPI-000002", titre: "CATÉGORIES D'API",
      items: ["API interne","API externe","API partenaire","API publique (Open Data)","API sécurisée","API transactionnelle","API de consultation","API d'intégration","API événementielle","API géospatiale","API documentaire","API d'identité","API financière","API judiciaire","API nationale souveraine"] },
    { n: 3, code: "RNAPI-000003", titre: "TYPES D'ARCHITECTURES",
      items: ["REST","GraphQL","SOAP","gRPC","Webhook","WebSocket","Event-driven API","Batch API","Streaming API","RPC","API Gateway","API Mesh","API composite","API fédérée","Architecture nationale d'API"] },
    { n: 4, code: "RNAPI-000004", titre: "MÉTHODES ET OPÉRATIONS",
      items: ["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS","Subscribe","Publish","Query","Mutation","Batch","Upload","Download","Callback"] },
    { n: 5, code: "RNAPI-000005", titre: "PROPRIÉTÉS TECHNIQUES",
      items: ["Endpoint","Verbe HTTP","Paramètres","En-têtes","Corps de requête","Format de réponse","Code de statut","Pagination","Filtrage","Tri","Versionnage","Limite de débit (rate limiting)","Cache","Compression","Encodage"] },
    { n: 6, code: "RNAPI-000006", titre: "SÉCURITÉ DES API",
      items: ["Authentification","Autorisation","OAuth2","JWT","API Key","mTLS","Chiffrement en transit","Chiffrement au repos","Validation des entrées","Protection contre les injections","Limitation de débit","Détection d'abus","Journalisation de sécurité","Politique CORS","Conformité RGPD/nationale"] },
    { n: 7, code: "RNAPI-000007", titre: "CYCLE DE VIE D'UNE API",
      items: ["Conception","Spécification","Développement","Test","Publication","Documentation","Découverte","Exploitation","Surveillance","Versionnage","Dépréciation","Retrait","Migration","Archivage","Capitalisation"] },
    { n: 8, code: "RNAPI-000008", titre: "GESTION DES CONSOMMATEURS",
      items: ["Enregistrement des consommateurs","Attribution de clés","Gestion des quotas","Gestion des abonnements","Portail développeur","Sandbox de test","Support technique","Contrats de niveau de service","Facturation","Analytique d'usage","Alertes de dépassement","Gestion des accès","Révocation d'accès","Historique de consommation","Catalogue des consommateurs"] },
    { n: 9, code: "RNAPI-000009", titre: "MÉCANISMES DE GOUVERNANCE TECHNIQUE",
      items: ["API Gateway","Reverse proxy","Load balancing","Circuit breaker","Throttling","Service mesh","Observabilité","Traçabilité distribuée","Health check","Failover","Résilience","Gestion des versions","Contrats d'interface","Tests de contrat","Registre national des API"] },
    { n: 10, code: "RNAPI-000010", titre: "INDICATEURS",
      items: ["Nombre d'API publiées","Nombre d'appels","Taux de disponibilité","Temps de réponse moyen","Taux d'erreur","Taux d'adoption","Nombre de consommateurs actifs","Taux de conformité aux standards","Taux de sécurité","Volume de données échangées","Latence","Taux de réutilisation","Couverture documentaire","Niveau de maturité","Indice national d'interopérabilité"] },
    { n: 11, code: "RNAPI-000011", titre: "GOUVERNANCE DES API",
      items: ["Politique nationale API","Comité API","Comité de sécurité","Comité d'architecture","Gestion documentaire","Gestion des versions","Gestion des changements","Gestion des risques","Audit","Contrôle qualité","Reporting","Certification des API","Amélioration continue","Standards obligatoires","Gouvernance nationale des API"] },
    { n: 12, code: "RNAPI-000012", titre: "CATALOGUE NATIONAL DES API",
      items: ["Catalogue des API internes","Catalogue des API externes","Catalogue des API publiques","Catalogue des API sécurisées","Catalogue des schémas","Catalogue des contrats","Catalogue des consommateurs","Catalogue des SLA","Catalogue des versions","Catalogue des dépréciations","Catalogue des standards","Catalogue des certifications","Catalogue des incidents","Catalogue des métriques","Catalogue national des API"] },
    { n: 13, code: "RNAPI-000013", titre: "INTÉGRATION AVEC LES AUTRES RÉFÉRENTIELS",
      items: ["RNEVT → Événements d'intégration","RNDEC → Événements complexes","RNFI → Flux d'information","RNSEM → Ontologies et sémantique","RNDG → Graphes de données","RNCIM → Modèle canonique d'information","RNMDM → Données maîtres","RNBOM → Objets métier","RNIAI → Gouvernance de l'IA","RNAGI → Agents intelligents","RNBCM → Capacités métier","RNCC → Contrôles","RNRS → Gestion des risques","RNIP → Indicateurs","RNPOL → Politiques nationales","RNDOC → Documents","RNG → Gouvernance","RNEX → Exigences"] },
    { n: 14, code: "RNAPI-000014", titre: "ARCHITECTURE LOGIQUE DES API",
      items: ["Couche des consommateurs","Couche du portail développeur","Couche de gateway","Couche de sécurité","Couche de routage","Couche de transformation","Couche métier","Couche d'accès aux données","Couche d'événements","Couche d'observabilité","Couche de gouvernance","Couche de test","Couche de documentation","Couche de supervision","Architecture logique nationale"] },
    { n: 15, code: "RNAPI-000015", titre: "ARCHITECTURE NATIONALE DES INTERFACES ET API",
      items: [] }
  ];

  let sectionCount = 0, itemCount = 0;

  for (const s of sections) {
    const sectionId = `RNAPI-${String(s.n).padStart(3, "0")}`;
    await db.run(
      `INSERT OR IGNORE INTO referentiel_national_section (section_id, referentiel_code, numero, code_officiel, titre) VALUES (?, ?, ?, ?, ?)`,
      [sectionId, "RNAPI", s.n, s.code, s.titre]
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

  console.log(`OK: RNAPI insere - ${sectionCount} sections, ${itemCount} items`);
}

main().catch(err => { console.error(err); process.exit(1); });
