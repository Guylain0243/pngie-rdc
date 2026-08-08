const db = require("./src/db");

async function main() {
  const [,, CODE, ORG, NOM_REGIE_RAW, NOM_DIRTECH_RAW] = process.argv;
  if (!CODE || !ORG || !NOM_REGIE_RAW) {
    console.error("Usage: node 45-seed-rnpt-regie.js <CODE> <ORG_ID> \"<Nom de la Regie>\" \"<Nom Direction Technique>\"");
    process.exit(1);
  }
  const NOM_REGIE = NOM_REGIE_RAW;
  const NOM_DIRTECH = NOM_DIRTECH_RAW || ("Direction Technique (" + NOM_REGIE + ")");

  const units = [
    { id: "UNIT-" + CODE + "-DG",  parent: null, code: "DG-" + CODE,  nom: "Direction Generale", type: "Direction Generale", ordre: 1 },
    { id: "UNIT-" + CODE + "-DGA", parent: null, code: "DGA-" + CODE, nom: "Direction Generale Adjointe", type: "Direction Generale Adjointe", ordre: 2 },
    { id: "UNIT-" + CODE + "-IS",  parent: null, code: "IS-" + CODE,  nom: "Inspection des Services", type: "Inspection", ordre: 3 },
    { id: "UNIT-" + CODE + "-DT",  parent: null, code: "DT-" + CODE,  nom: NOM_DIRTECH, type: "Direction Technique", ordre: 4 },
  ];

  for (const u of units) {
    await db.run(
      "INSERT OR IGNORE INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [u.id, ORG, u.parent, u.code, u.nom, u.type, u.ordre]
    );
  }

  const positions = [
    { id: "POS-" + CODE + "-DG",  unit: "UNIT-" + CODE + "-DG",  titre: "Directeur General (" + NOM_REGIE + ")", niveau: 0, autorite: "decisionnelle" },
    { id: "POS-" + CODE + "-DGA", unit: "UNIT-" + CODE + "-DGA", titre: "Directeur General Adjoint", niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-IS",  unit: "UNIT-" + CODE + "-IS",  titre: "Inspecteur des Services", niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-DT",  unit: "UNIT-" + CODE + "-DT",  titre: "Directeur (" + NOM_DIRTECH + ")", niveau: 1, autorite: "executive" },
  ];

  for (const p of positions) {
    await db.run(
      "INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)",
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {};
  data["POS-" + CODE + "-DG"] = {
    resp: ["Diriger " + NOM_REGIE, "Superviser la mobilisation des recettes relevant de la regie", "Representer la regie aupres du Ministre des Finances et des partenaires"],
    droits: [["gestion_regie","ecriture","national"],["mobilisation_recettes","validation","national"]],
    menus: ["Tableau de bord","Recettes","Directions","Rapports"],
    docs: [["Note de service","creer"],["Rapport annuel","valider"]],
    inter: [["POS-MIN5-MINISTRE","rapporte_a","Rend compte au Ministre des Finances"],["POS-" + CODE + "-DT","supervise","Supervise le Directeur (" + NOM_DIRTECH + ")"]],
    kpi: [["Taux de mobilisation des recettes","85","%"]],
    wf: [["mobilisation_recettes","Planification","initiateur"],["mobilisation_recettes","Execution","initiateur"],["mobilisation_recettes","Reddition","valideur"]]
  };
  data["POS-" + CODE + "-DGA"] = {
    resp: ["Assister le Directeur General dans la gestion de la regie", "Coordonner les directions techniques et provinciales", "Assurer l'interim en cas d'absence du Directeur General"],
    droits: [["coordination_regie","ecriture","national"],["directions_techniques","lecture","national"]],
    menus: ["Tableau de bord","Directions","Coordination"],
    docs: [["Instruction de coordination","creer"],["Instruction de coordination","signer"]],
    inter: [["POS-" + CODE + "-DG","rapporte_a","Rend compte au Directeur General"]],
    kpi: [["Taux de suivi des instructions","90","%"]],
    wf: [["coordination_directions","Redaction","initiateur"],["coordination_directions","Validation","valideur"]]
  };
  data["POS-" + CODE + "-IS"] = {
    resp: ["Controler la gestion administrative et financiere des services de la regie", "Auditer les directions provinciales et techniques", "Detecter et signaler les irregularites et fraudes"],
    droits: [["audits_regie","ecriture","national"],["controle_services","validation","national"]],
    menus: ["Tableau de bord","Audits","Controles","Rapports"],
    docs: [["Rapport d'audit","creer"],["Rapport d'audit","valider"]],
    inter: [["POS-" + CODE + "-DG","rapporte_a","Rend compte au Directeur General"]],
    kpi: [["Nombre d'audits realises par an","20","nombre"]],
    wf: [["audit_regie","Planification","initiateur"],["audit_regie","Controle","initiateur"],["audit_regie","Rapport","valideur"]]
  };
  data["POS-" + CODE + "-DT"] = {
    resp: ["Diriger " + NOM_DIRTECH, "Mettre en oeuvre les operations techniques de la regie", "Superviser les services provinciaux rattaches"],
    droits: [["operations_techniques","ecriture","national"],["controle_technique","validation","national"]],
    menus: ["Tableau de bord","Operations","Services provinciaux"],
    docs: [["Rapport d'activite","creer"],["Rapport d'activite","valider"]],
    inter: [["POS-" + CODE + "-DG","rapporte_a","Rend compte au Directeur General"]],
    kpi: [["Taux de realisation des objectifs techniques","80","%"]],
    wf: [["operations_techniques","Planification","initiateur"],["operations_techniques","Execution","initiateur"],["operations_techniques","Rapport","valideur"]]
  };

  for (const posId of Object.keys(data)) {
    const d = data[posId];
    for (let i = 0; i < d.resp.length; i++) {
      await db.run("INSERT OR IGNORE INTO position_responsabilite (responsabilite_id, position_id, libelle, ordre) VALUES (?, ?, ?, ?)",
        [posId + "-RESP-" + (i+1), posId, d.resp[i], i+1]);
    }
    for (let i = 0; i < d.droits.length; i++) {
      await db.run("INSERT OR IGNORE INTO position_droit_acces (droit_id, position_id, module, action, portee) VALUES (?, ?, ?, ?, ?)",
        [posId + "-DROIT-" + (i+1), posId, d.droits[i][0], d.droits[i][1], d.droits[i][2]]);
    }
    for (let i = 0; i < d.menus.length; i++) {
      await db.run("INSERT OR IGNORE INTO position_menu (menu_id, position_id, menu_code, libelle, ordre) VALUES (?, ?, ?, ?, ?)",
        [posId + "-MENU-" + (i+1), posId, "menu_" + (i+1), d.menus[i], i+1]);
    }
    for (let i = 0; i < d.docs.length; i++) {
      await db.run("INSERT OR IGNORE INTO position_document (document_id, position_id, document_type, action) VALUES (?, ?, ?, ?)",
        [posId + "-DOC-" + (i+1), posId, d.docs[i][0], d.docs[i][1]]);
    }
    for (let i = 0; i < d.inter.length; i++) {
      await db.run("INSERT OR IGNORE INTO position_interaction (interaction_id, position_id, position_cible_id, type_interaction, description) VALUES (?, ?, ?, ?, ?)",
        [posId + "-INTER-" + (i+1), posId, d.inter[i][0], d.inter[i][1], d.inter[i][2]]);
    }
    for (let i = 0; i < d.kpi.length; i++) {
      await db.run("INSERT OR IGNORE INTO position_kpi (kpi_id, position_id, indicateur, cible, unite) VALUES (?, ?, ?, ?, ?)",
        [posId + "-KPI-" + (i+1), posId, d.kpi[i][0], d.kpi[i][1], d.kpi[i][2]]);
    }
    for (let i = 0; i < d.wf.length; i++) {
      await db.run("INSERT OR IGNORE INTO position_workflow (workflow_item_id, position_id, workflow_code, etape, role_attendu) VALUES (?, ?, ?, ?, ?)",
        [posId + "-WF-" + (i+1), posId, d.wf[i][0], d.wf[i][1], d.wf[i][2]]);
    }
  }

  console.log("OK: " + NOM_REGIE + " structure (" + units.length + " unites) + " + positions.length + " postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
