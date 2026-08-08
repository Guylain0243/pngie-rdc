const db = require("./src/db");

async function main() {
  const ORG = "ab61bb27-5d1a-4e1e-a81d-fa9116d13108";
  const DIRBUDGET = "a9ca4a15-d618-450d-9f76-10344badfd3f";
  const DIVRECOUV = "9275df9d-a20b-40c2-9595-7c5bc3816d6b";

  const units = [
    { id: "UNIT-MIN5-CAB", parent: null, code: "CAB-MIN5", nom: "Cabinet du Ministre", type: "Cabinet", ordre: 1 },
    { id: "UNIT-MIN5-SG", parent: null, code: "SG-MIN5", nom: "Secrétariat Général", type: "Secrétariat Général", ordre: 2 },
    { id: "UNIT-MIN5-IG", parent: null, code: "IG-MIN5", nom: "Inspection Générale des Finances", type: "Inspection", ordre: 3 },
    { id: "UNIT-MIN5-DGI", parent: null, code: "DGI-MIN5", nom: "Direction Générale des Impôts", type: "Direction Générale", ordre: 4 }
  ];
  for (const u of units) {
    await db.run(
      `INSERT OR IGNORE INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.id, ORG, u.parent, u.code, u.nom, u.type, u.ordre]
    );
  }

  const positions = [
    { id: "POS-MIN5-MINISTRE", unit: "UNIT-MIN5-CAB", titre: "Ministre des Finances", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-MIN5-SG", unit: "UNIT-MIN5-SG", titre: "Secrétaire Général", niveau: 1, autorite: "exécutive" },
    { id: "POS-MIN5-IG", unit: "UNIT-MIN5-IG", titre: "Inspecteur Général des Finances", niveau: 1, autorite: "exécutive" },
    { id: "POS-MIN5-DGDGI", unit: "UNIT-MIN5-DGI", titre: "Directeur Général de la DGI", niveau: 1, autorite: "exécutive" },
    { id: "POS-MIN5-DIRBUDGET", unit: DIRBUDGET, titre: "Directeur du Budget", niveau: 1, autorite: "exécutive" },
    { id: "POS-MIN5-CHEFDIVRECOUV", unit: DIVRECOUV, titre: "Chef de Division Recouvrement", niveau: 2, autorite: "opérationnelle" }
  ];
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {
    "POS-MIN5-MINISTRE": {
      resp: ["Diriger la politique financière nationale","Superviser le budget de l'État","Représenter le ministère au Conseil des ministres","Superviser les régies financières"],
      droits: [["politique_financiere","ecriture","national"],["budget_national","validation","national"]],
      menus: ["Tableau de bord","Politique financière","Budget national","Régies financières"],
      docs: [["Arrêté ministériel","creer"],["Arrêté ministériel","signer"],["Rapport budgétaire","valider"]],
      inter: [["POS-PM-PREMIERMIN","rapporte_a","Rend compte à la Première Ministre"],["POS-MIN5-DGDGI","supervise","Supervise le Directeur Général de la DGI"]],
      kpi: [["Taux d'exécution budgétaire national","80","%"],["Taux de mobilisation des recettes","85","%"]],
      wf: [["adoption_arrete_ministeriel","Proposition","initiateur"],["adoption_arrete_ministeriel","Examen","observateur"],["adoption_arrete_ministeriel","Adoption","valideur"],["adoption_arrete_ministeriel","Signature","signataire"]]
    },
    "POS-MIN5-SG": {
      resp: ["Coordonner l'administration du ministère","Superviser les directions générales","Assurer le suivi des instructions ministérielles"],
      droits: [["coordination_ministere","ecriture","national"],["directions_generales","lecture","national"]],
      menus: ["Tableau de bord","Directions générales","Instructions"],
      docs: [["Instruction administrative","creer"],["Instruction administrative","signer"]],
      inter: [["POS-MIN5-MINISTRE","rapporte_a","Rend compte au Ministre des Finances"]],
      kpi: [["Taux de suivi des instructions","90","%"]],
      wf: [["diffusion_instruction","Rédaction","initiateur"],["diffusion_instruction","Validation","valideur"]]
    },
    "POS-MIN5-IG": {
      resp: ["Contrôler la gestion financière des services","Auditer les régies financières","Détecter et signaler les irrégularités"],
      droits: [["audits_financiers","ecriture","national"],["controle_regies","validation","national"]],
      menus: ["Tableau de bord","Audits","Contrôles","Rapports"],
      docs: [["Rapport d'audit","creer"],["Rapport d'audit","valider"]],
      inter: [["POS-MIN5-MINISTRE","rapporte_a","Rend compte au Ministre des Finances"]],
      kpi: [["Nombre d'audits réalisés par an","15","nombre"]],
      wf: [["audit_financier","Planification","initiateur"],["audit_financier","Contrôle","initiateur"],["audit_financier","Rapport","valideur"]]
    },
    "POS-MIN5-DGDGI": {
      resp: ["Diriger l'administration fiscale nationale","Superviser la collecte des impôts","Lutter contre la fraude fiscale","Superviser les Directions provinciales des impôts"],
      droits: [["collecte_impots","ecriture","national"],["controle_fiscal","validation","national"]],
      menus: ["Tableau de bord","Collecte des impôts","Contrôle fiscal","Directions provinciales"],
      docs: [["Avis d'imposition","valider"],["Rapport de collecte","creer"]],
      inter: [["POS-MIN5-MINISTRE","rapporte_a","Rend compte au Ministre des Finances"]],
      kpi: [["Taux de recouvrement fiscal","75","%"],["Nombre de contrôles fiscaux réalisés par an","500","nombre"]],
      wf: [["controle_fiscal","Sélection","initiateur"],["controle_fiscal","Contrôle","initiateur"],["controle_fiscal","Redressement","valideur"]]
    },
    "POS-MIN5-DIRBUDGET": {
      resp: ["Élaborer le budget de l'État","Superviser l'exécution budgétaire","Contrôler les engagements de dépenses"],
      droits: [["elaboration_budget","ecriture","national"],["execution_budgetaire","validation","national"]],
      menus: ["Tableau de bord","Élaboration budget","Exécution","Engagements"],
      docs: [["Projet de loi de finances","creer"],["Rapport d'exécution","valider"]],
      inter: [["POS-MIN5-MINISTRE","rapporte_a","Rend compte au Ministre des Finances"]],
      kpi: [["Taux d'exécution budgétaire","80","%"]],
      wf: [["elaboration_budget","Collecte des besoins","initiateur"],["elaboration_budget","Arbitrage","observateur"],["elaboration_budget","Validation","valideur"]]
    },
    "POS-MIN5-CHEFDIVRECOUV": {
      resp: ["Superviser le recouvrement des créances publiques","Suivre les contentieux de recouvrement"],
      droits: [["recouvrement","ecriture","unite"]],
      menus: ["Tableau de bord","Recouvrement","Contentieux"],
      docs: [["Rapport de recouvrement","creer"]],
      inter: [["POS-MIN5-DIRBUDGET","rapporte_a","Rend compte au Directeur du Budget"]],
      kpi: [["Taux de recouvrement","70","%"]],
      wf: [["recouvrement_creance","Relance","initiateur"],["recouvrement_creance","Mise en demeure","initiateur"],["recouvrement_creance","Recouvrement","valideur"]]
    }
  };

  for (const posId of Object.keys(data)) {
    const d = data[posId];
    for (let i = 0; i < d.resp.length; i++) {
      await db.run(`INSERT OR IGNORE INTO position_responsabilite (responsabilite_id, position_id, libelle, ordre) VALUES (?, ?, ?, ?)`,
        [`${posId}-RESP-${i+1}`, posId, d.resp[i], i+1]);
    }
    for (let i = 0; i < d.droits.length; i++) {
      await db.run(`INSERT OR IGNORE INTO position_droit_acces (droit_id, position_id, module, action, portee) VALUES (?, ?, ?, ?, ?)`,
        [`${posId}-DROIT-${i+1}`, posId, d.droits[i][0], d.droits[i][1], d.droits[i][2]]);
    }
    for (let i = 0; i < d.menus.length; i++) {
      await db.run(`INSERT OR IGNORE INTO position_menu (menu_id, position_id, menu_code, libelle, ordre) VALUES (?, ?, ?, ?, ?)`,
        [`${posId}-MENU-${i+1}`, posId, `menu_${i+1}`, d.menus[i], i+1]);
    }
    for (let i = 0; i < d.docs.length; i++) {
      await db.run(`INSERT OR IGNORE INTO position_document (document_id, position_id, document_type, action) VALUES (?, ?, ?, ?)`,
        [`${posId}-DOC-${i+1}`, posId, d.docs[i][0], d.docs[i][1]]);
    }
    for (let i = 0; i < d.inter.length; i++) {
      await db.run(`INSERT OR IGNORE INTO position_interaction (interaction_id, position_id, position_cible_id, type_interaction, description) VALUES (?, ?, ?, ?, ?)`,
        [`${posId}-INTER-${i+1}`, posId, d.inter[i][0], d.inter[i][1], d.inter[i][2]]);
    }
    for (let i = 0; i < d.kpi.length; i++) {
      await db.run(`INSERT OR IGNORE INTO position_kpi (kpi_id, position_id, indicateur, cible, unite) VALUES (?, ?, ?, ?, ?)`,
        [`${posId}-KPI-${i+1}`, posId, d.kpi[i][0], d.kpi[i][1], d.kpi[i][2]]);
    }
    for (let i = 0; i < d.wf.length; i++) {
      await db.run(`INSERT OR IGNORE INTO position_workflow (workflow_item_id, position_id, workflow_code, etape, role_attendu) VALUES (?, ?, ?, ?, ?)`,
        [`${posId}-WF-${i+1}`, posId, d.wf[i][0], d.wf[i][1], d.wf[i][2]]);
    }
  }

  console.log("OK: Ministere des Finances structure (4 unites) + 6 postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
