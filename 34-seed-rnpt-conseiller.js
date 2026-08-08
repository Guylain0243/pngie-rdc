const db = require("./src/db");

async function main() {
  const posId = "POS-PR-CONSEILLER";

  const responsabilites = [
    "Conseiller le Président sur les dossiers stratégiques de son domaine de compétence",
    "Analyser les dossiers transmis par le Cabinet",
    "Préparer des notes d'orientation et de recommandation",
    "Assurer une veille sectorielle dans son domaine",
    "Participer aux réunions stratégiques sur convocation",
    "Coordonner avec les cellules techniques concernées"
  ];
  for (let i = 0; i < responsabilites.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_responsabilite (responsabilite_id, position_id, libelle, ordre) VALUES (?, ?, ?, ?)`,
      [`${posId}-RESP-${i+1}`, posId, responsabilites[i], i+1]
    );
  }

  const droits = [
    ["dossiers_strategiques", "lecture", "institution"],
    ["notes_orientation", "ecriture", "institution"],
    ["veille_sectorielle", "ecriture", "institution"],
    ["agenda_presidentiel", "lecture", "institution"]
  ];
  for (let i = 0; i < droits.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_droit_acces (droit_id, position_id, module, action, portee) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-DROIT-${i+1}`, posId, droits[i][0], droits[i][1], droits[i][2]]
    );
  }

  const menus = ["Tableau de bord", "Dossiers stratégiques", "Notes d'orientation", "Veille sectorielle", "Réunions"];
  for (let i = 0; i < menus.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_menu (menu_id, position_id, menu_code, libelle, ordre) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-MENU-${i+1}`, posId, `menu_${i+1}`, menus[i], i+1]
    );
  }

  const documents = [
    ["Note d'orientation", "creer"],
    ["Rapport de veille", "creer"],
    ["Dossier stratégique", "consulter"]
  ];
  for (let i = 0; i < documents.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_document (document_id, position_id, document_type, action) VALUES (?, ?, ?, ?)`,
      [`${posId}-DOC-${i+1}`, posId, documents[i][0], documents[i][1]]
    );
  }

  const interactions = [
    ["POS-PR-DIRCAB", "rapporte_a", "Rend compte au Directeur de Cabinet"],
    ["POS-PR-PRESIDENT", "collabore_avec", "Conseille directement le Président sur convocation"]
  ];
  for (let i = 0; i < interactions.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_interaction (interaction_id, position_id, position_cible_id, type_interaction, description) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-INTER-${i+1}`, posId, interactions[i][0], interactions[i][1], interactions[i][2]]
    );
  }

  const kpis = [
    ["Nombre de notes d'orientation produites par mois", "8", "nombre"],
    ["Délai moyen de traitement d'un dossier", "72", "heures"]
  ];
  for (let i = 0; i < kpis.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_kpi (kpi_id, position_id, indicateur, cible, unite) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-KPI-${i+1}`, posId, kpis[i][0], kpis[i][1], kpis[i][2]]
    );
  }

  const workflow = [
    ["preparation_note_orientation", "Analyse", "initiateur"],
    ["preparation_note_orientation", "Rédaction", "initiateur"],
    ["preparation_note_orientation", "Validation Cabinet", "valideur"]
  ];
  for (let i = 0; i < workflow.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_workflow (workflow_item_id, position_id, workflow_code, etape, role_attendu) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-WF-${i+1}`, posId, workflow[i][0], workflow[i][1], workflow[i][2]]
    );
  }

  console.log("OK: poste Conseiller Special cree avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
