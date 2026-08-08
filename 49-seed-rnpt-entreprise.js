const db = require("./src/db");

async function main() {
  const [,, CODE, ORG, NOM_ENTREPRISE_RAW, NOM_DIRTECH_RAW] = process.argv;
  if (!CODE || !ORG || !NOM_ENTREPRISE_RAW || !NOM_DIRTECH_RAW) {
    console.error("Usage: node 49-seed-rnpt-entreprise.js <CODE> <ORG_ID> \"<Nom Entreprise>\" \"<Nom Direction Technique>\"");
    process.exit(1);
  }
  const NOM_ENTREPRISE = NOM_ENTREPRISE_RAW;
  const NOM_DIRTECH = NOM_DIRTECH_RAW;

  const unitRow = await db.get("SELECT unit_id FROM unit WHERE organization_id = ? LIMIT 1", [ORG]);
  if (!unitRow) {
    console.error("ERREUR: aucune unite trouvee pour organization_id " + ORG);
    process.exit(1);
  }
  const UNIT = unitRow.unit_id;

  const positions = [
    { id: "POS-" + CODE + "-DG", unit: UNIT, titre: "Directeur General (" + NOM_ENTREPRISE + ")", niveau: 0, autorite: "decisionnelle" },
    { id: "POS-" + CODE + "-DGA", unit: UNIT, titre: "Directeur General Adjoint", niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-IS", unit: UNIT, titre: "Inspecteur des Services", niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-DT", unit: UNIT, titre: "Directeur (" + NOM_DIRTECH + ")", niveau: 1, autorite: "executive" },
  ];

  for (const p of positions) {
    await db.run(
      "INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)",
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {};
  data["POS-" + CODE + "-DG"] = {
    resp: ["Diriger " + NOM_ENTREPRISE, "Assurer la production et la commercialisation des biens ou services de l'entreprise", "Representer l'entreprise aupres du Ministre du Portefeuille et des partenaires"],
    droits: [["gestion_entreprise","ecriture","national"],["budget_entreprise","validation","national"]],
    menus: ["Tableau de bord","Production","Directions","Rapports"],
    docs: [["Note de service","creer"],["Rapport annuel","valider"]],
    inter: [["POS-MIN_21-MINISTRE","rapporte_a","Rend compte au Ministre du Portefeuille"],["POS-" + CODE + "-DT","supervise","Supervise le Directeur (" + NOM_DIRTECH + ")"]],
    kpi: [["Taux de realisation des objectifs de production","75","%"]],
    wf: [["gestion_production","Planification","initiateur"],["gestion_production","Execution","initiateur"],["gestion_production","Reddition","valideur"]]
  };
  data["POS-" + CODE + "-DGA"] = {
    resp: ["Assister le Directeur General dans la gestion de l'entreprise", "Coordonner les directions techniques et provinciales", "Assurer l'interim en cas d'absence du Directeur General"],
    droits: [["coordination_entreprise","ecriture","national"],["directions_techniques","lecture","national"]],
    menus: ["Tableau de bord","Directions","Coordination"],
    docs: [["Instruction de coordination","creer"],["Instruction de coordination","signer"]],
    inter: [["POS-" + CODE + "-DG","rapporte_a","Rend compte au Directeur General"]],
    kpi: [["Taux de suivi des instructions","90","%"]],
    wf: [["coordination_directions","Redaction","initiateur"],["coordination_directions","Validation","valideur"]]
  };
  data["POS-" + CODE + "-IS"] = {
    resp: ["Controler la gestion administrative et financiere des services de l'entreprise", "Auditer les directions et sites de production", "Detecter et signaler les irregularites"],
    droits: [["audits_entreprise","ecriture","national"],["controle_services","validation","national"]],
    menus: ["Tableau de bord","Audits","Controles","Rapports"],
    docs: [["Rapport d'audit","creer"],["Rapport d'audit","valider"]],
    inter: [["POS-" + CODE + "-DG","rapporte_a","Rend compte au Directeur General"]],
    kpi: [["Nombre d'audits realises par an","15","nombre"]],
    wf: [["audit_entreprise","Planification","initiateur"],["audit_entreprise","Controle","initiateur"],["audit_entreprise","Rapport","valideur"]]
  };
  data["POS-" + CODE + "-DT"] = {
    resp: ["Diriger " + NOM_DIRTECH, "Mettre en oeuvre les operations techniques et industrielles de l'entreprise", "Superviser les sites de production rattaches"],
    droits: [["operations_techniques","ecriture","national"],["controle_technique","validation","national"]],
    menus: ["Tableau de bord","Operations","Sites de production"],
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

  console.log("OK: " + NOM_ENTREPRISE + " (unite existante reutilisee) + " + positions.length + " postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
