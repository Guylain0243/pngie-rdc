const db = require("./src/db");

async function main() {
  const org = await db.get(`SELECT organization_id FROM organization WHERE code = 'PRESIDENCE'`);
  if (!org) throw new Error("Organization PRESIDENCE introuvable");
  const orgId = org.organization_id;

  const cabPR = await db.get(`SELECT unit_id FROM unit WHERE organization_id = ? AND code = 'CAB-PR'`, [orgId]);
  if (!cabPR) throw new Error("Unit CAB-PR introuvable");
  const cabPRId = cabPR.unit_id;

  // Nouvelles unités de la Présidence
  const units = [
    { id: "UNIT-PR-MC", parent: null, code: "MC", nom: "Maison Civile", type: "Maison", ordre: 2 },
    { id: "UNIT-PR-MM", parent: null, code: "MM", nom: "Maison Militaire", type: "Maison", ordre: 3 },
    { id: "UNIT-PR-CS", parent: cabPRId, code: "CS", nom: "Conseillers Spéciaux", type: "Conseil", ordre: 4 },
    { id: "UNIT-PR-CT", parent: cabPRId, code: "CT", nom: "Cellules Techniques", type: "Cellule", ordre: 5 },
    { id: "UNIT-PR-DIR", parent: cabPRId, code: "DIR", nom: "Directions", type: "Direction", ordre: 6 },
    { id: "UNIT-PR-SRV", parent: cabPRId, code: "SRV", nom: "Services", type: "Service", ordre: 7 }
  ];
  for (const u of units) {
    await db.run(
      `INSERT OR IGNORE INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.id, orgId, u.parent, u.code, u.nom, u.type, u.ordre]
    );
  }

  // Postes cibles nécessaires pour les interactions (créés minimalement s'ils n'existent pas)
  const positions = [
    { id: "POS-PR-PRESIDENT", unit: cabPRId, titre: "Président de la République", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-PR-CONSEILLER", unit: "UNIT-PR-CS", titre: "Conseiller Spécial", niveau: 2, autorite: "consultative" },
    { id: "POS-PR-DIRMM", unit: "UNIT-PR-MM", titre: "Directeur de la Maison Militaire", niveau: 1, autorite: "exécutive" },
    { id: "POS-PM-SGG", unit: "e6c31abc-d164-4c80-83df-4b1cf67dfe9a", titre: "Secrétaire Général du Gouvernement", niveau: 1, autorite: "exécutive" },
    { id: "POS-PR-DIRCAB", unit: cabPRId, titre: "Directeur de Cabinet", niveau: 1, autorite: "décisionnelle" }
  ];
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const posId = "POS-PR-DIRCAB";

  // 1. Responsabilités
  const responsabilites = [
    "Coordonner l'ensemble des activités du Cabinet présidentiel",
    "Superviser les conseillers et cellules techniques rattachés au Cabinet",
    "Assurer la liaison entre la Présidence et les autres institutions",
    "Valider les dossiers avant transmission au Président",
    "Organiser l'agenda stratégique du Président",
    "Superviser la sécurité documentaire et la confidentialité des dossiers présidentiels",
    "Piloter la mise en œuvre des directives présidentielles"
  ];
  for (let i = 0; i < responsabilites.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_responsabilite (responsabilite_id, position_id, libelle, ordre) VALUES (?, ?, ?, ?)`,
      [`${posId}-RESP-${i+1}`, posId, responsabilites[i], i+1]
    );
  }

  // 2. Droits d'accès
  const droits = [
    ["agenda_presidentiel", "ecriture", "institution"],
    ["dossiers_presidentiels", "validation", "institution"],
    ["courrier_officiel", "ecriture", "institution"],
    ["conseillers", "supervision", "institution"],
    ["budget_cabinet", "lecture", "institution"],
    ["rapports_institutionnels", "lecture", "national"]
  ];
  for (let i = 0; i < droits.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_droit_acces (droit_id, position_id, module, action, portee) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-DROIT-${i+1}`, posId, droits[i][0], droits[i][1], droits[i][2]]
    );
  }

  // 3. Menus
  const menus = [
    "Tableau de bord", "Agenda présidentiel", "Dossiers en attente de validation",
    "Courrier officiel", "Conseillers et cellules", "Rapports institutionnels", "Journal d'audit du Cabinet"
  ];
  for (let i = 0; i < menus.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_menu (menu_id, position_id, menu_code, libelle, ordre) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-MENU-${i+1}`, posId, `menu_${i+1}`, menus[i], i+1]
    );
  }

  // 4. Documents
  const documents = [
    ["Note présidentielle", "creer"],
    ["Note présidentielle", "valider"],
    ["Décret présidentiel", "consulter"],
    ["Correspondance officielle", "creer"],
    ["Correspondance officielle", "signer"],
    ["Rapport d'activité du Cabinet", "creer"],
    ["Compte rendu de réunion", "valider"]
  ];
  for (let i = 0; i < documents.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_document (document_id, position_id, document_type, action) VALUES (?, ?, ?, ?)`,
      [`${posId}-DOC-${i+1}`, posId, documents[i][0], documents[i][1]]
    );
  }

  // 5. Interactions
  const interactions = [
    ["POS-PR-PRESIDENT", "rapporte_a", "Rend compte directement au Président"],
    ["POS-PR-CONSEILLER", "supervise", "Supervise les conseillers spéciaux"],
    ["POS-PM-SGG", "collabore_avec", "Coordination avec la Primature"],
    ["POS-PR-DIRMM", "collabore_avec", "Coordination sécurité et protocole"]
  ];
  for (let i = 0; i < interactions.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_interaction (interaction_id, position_id, position_cible_id, type_interaction, description) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-INTER-${i+1}`, posId, interactions[i][0], interactions[i][1], interactions[i][2]]
    );
  }

  // 6. KPI
  const kpis = [
    ["Taux de traitement des dossiers dans les délais", "95", "%"],
    ["Nombre de notes présidentielles produites par mois", "20", "nombre"],
    ["Délai moyen de validation d'un dossier", "48", "heures"]
  ];
  for (let i = 0; i < kpis.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_kpi (kpi_id, position_id, indicateur, cible, unite) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-KPI-${i+1}`, posId, kpis[i][0], kpis[i][1], kpis[i][2]]
    );
  }

  // 7. Workflow
  const workflow = [
    ["validation_note_presidentielle", "Rédaction", "initiateur"],
    ["validation_note_presidentielle", "Relecture juridique", "observateur"],
    ["validation_note_presidentielle", "Validation Cabinet", "valideur"],
    ["validation_note_presidentielle", "Signature présidentielle", "signataire"]
  ];
  for (let i = 0; i < workflow.length; i++) {
    await db.run(
      `INSERT OR IGNORE INTO position_workflow (workflow_item_id, position_id, workflow_code, etape, role_attendu) VALUES (?, ?, ?, ?, ?)`,
      [`${posId}-WF-${i+1}`, posId, workflow[i][0], workflow[i][1], workflow[i][2]]
    );
  }

  console.log("OK: poste Directeur de Cabinet cree avec 7 dimensions completes (unites, positions cibles, responsabilites, droits, menus, documents, interactions, kpi, workflow)");
}

main().catch(err => { console.error(err); process.exit(1); });
