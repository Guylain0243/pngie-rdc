const db = require("./src/db");

async function main() {
  const posId = "POS-PR-DIRMM";

  const responsabilites = [
    "Assurer la sécurité rapprochée du Président de la République",
    "Coordonner les unités militaires affectées à la protection présidentielle",
    "Superviser les déplacements officiels du Président",
    "Organiser le protocole militaire lors des cérémonies officielles",
    "Assurer la liaison avec les forces armées et les services de sécurité",
    "Gérer les situations de crise sécuritaire impliquant la Présidence"
  ];
  for (let i = 0; i < responsabilites.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_responsabilite (responsabilite_id, position_id, libelle, ordre) VALUES (?, ?, ?, ?)`,
      [`${posId}-RESP-${i+1}`, posId, responsabilites[i], i+1]
    );
  }

  const droits = [
    ["securite_presidentielle", "ecriture", "institution"],
    ["deplacements_officiels", "ecriture", "institution"],
    ["protocole_militaire", "ecriture", "institution"],
    ["rapports_securite", "lecture", "national"]
  ];
  for (let i = 0; i < droits.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_droit_acces (droit_id, position_id, module, action, portee) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-DROIT-${i+1}`, posId, droits[i][0], droits[i][1], droits[i][2]]
    );
  }

  const menus = ["Tableau de bord", "Sécurité présidentielle", "Déplacements officiels", "Protocole militaire", "Rapports de sécurité"];
  for (let i = 0; i < menus.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_menu (menu_id, position_id, menu_code, libelle, ordre) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-MENU-${i+1}`, posId, `menu_${i+1}`, menus[i], i+1]
    );
  }

  const documents = [
    ["Plan de sécurité", "creer"],
    ["Plan de sécurité", "valider"],
    ["Ordre de mission militaire", "creer"],
    ["Ordre de mission militaire", "signer"],
    ["Rapport d'incident sécuritaire", "creer"]
  ];
  for (let i = 0; i < documents.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_document (document_id, position_id, document_type, action) VALUES (?, ?, ?, ?)`,
      [`${posId}-DOC-${i+1}`, posId, documents[i][0], documents[i][1]]
    );
  }

  const interactions = [
    ["POS-PR-DIRCAB", "collabore_avec", "Coordination sécurité et protocole"],
    ["POS-PR-PRESIDENT", "rapporte_a", "Rend compte directement au Président sur les questions de sécurité"]
  ];
  for (let i = 0; i < interactions.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_interaction (interaction_id, position_id, position_cible_id, type_interaction, description) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-INTER-${i+1}`, posId, interactions[i][0], interactions[i][1], interactions[i][2]]
    );
  }

  const kpis = [
    ["Taux de disponibilité opérationnelle", "100", "%"],
    ["Nombre d'incidents sécuritaires traités", "0", "nombre"],
    ["Délai moyen de préparation d'un déplacement", "24", "heures"]
  ];
  for (let i = 0; i < kpis.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_kpi (kpi_id, position_id, indicateur, cible, unite) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-KPI-${i+1}`, posId, kpis[i][0], kpis[i][1], kpis[i][2]]
    );
  }

  const workflow = [
    ["validation_plan_securite", "Évaluation des risques", "initiateur"],
    ["validation_plan_securite", "Élaboration du plan", "initiateur"],
    ["validation_plan_securite", "Validation", "valideur"],
    ["validation_plan_securite", "Exécution", "observateur"]
  ];
  for (let i = 0; i < workflow.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_workflow (workflow_item_id, position_id, workflow_code, etape, role_attendu) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-WF-${i+1}`, posId, workflow[i][0], workflow[i][1], workflow[i][2]]
    );
  }

  console.log("OK: poste Directeur de la Maison Militaire cree avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
