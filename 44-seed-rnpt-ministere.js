const db = require("./src/db");

async function main() {
  const [,, CODE, ORG, NOM_MIN_RAW, NOM_DG_RAW] = process.argv;
  if (!CODE || !ORG || !NOM_MIN_RAW) {
    console.error("Usage: node 44-seed-rnpt-ministere.js <CODE_MIN> <ORG_ID> \"<Nom du Ministere>\" [\"<Nom Direction Generale>\"]");
    process.exit(1);
  }
  const NOM_MIN = NOM_MIN_RAW;
  const NOM_DG = NOM_DG_RAW || ("Direction Generale (" + NOM_MIN + ")");

  const units = [
    { id: "UNIT-" + CODE + "-CAB", parent: null, code: "CAB-" + CODE, nom: "Cabinet du Ministre", type: "Cabinet", ordre: 1 },
    { id: "UNIT-" + CODE + "-SG",  parent: null, code: "SG-" + CODE,  nom: "Secretariat General", type: "Secretariat General", ordre: 2 },
    { id: "UNIT-" + CODE + "-IG",  parent: null, code: "IG-" + CODE,  nom: "Inspection Generale", type: "Inspection", ordre: 3 },
    { id: "UNIT-" + CODE + "-DG",  parent: null, code: "DG-" + CODE,  nom: NOM_DG, type: "Direction Generale", ordre: 4 },
  ];

  for (const u of units) {
    await db.run(
      "INSERT OR IGNORE INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [u.id, ORG, u.parent, u.code, u.nom, u.type, u.ordre]
    );
  }

  const positions = [
    { id: "POS-" + CODE + "-MINISTRE", unit: "UNIT-" + CODE + "-CAB", titre: "Ministre " + NOM_MIN, niveau: 0, autorite: "decisionnelle" },
    { id: "POS-" + CODE + "-SG",       unit: "UNIT-" + CODE + "-SG",  titre: "Secretaire General", niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-IG",       unit: "UNIT-" + CODE + "-IG",  titre: "Inspecteur General", niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-DG",       unit: "UNIT-" + CODE + "-DG",  titre: "Directeur General (" + NOM_DG + ")", niveau: 1, autorite: "executive" },
  ];

  for (const p of positions) {
    await db.run(
      "INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)",
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {};
  data["POS-" + CODE + "-MINISTRE"] = {
    resp: ["Diriger la politique nationale du secteur (" + NOM_MIN + ")", "Superviser les directions et services du ministere", "Representer le ministere au Conseil des ministres"],
    droits: [["politique_sectorielle","ecriture","national"],["budget_ministere","validation","national"]],
    menus: ["Tableau de bord","Politique sectorielle","Directions generales","Rapports"],
    docs: [["Arrete ministeriel","creer"],["Arrete ministeriel","signer"]],
    inter: [["POS-PM-PREMIERMIN","rapporte_a","Rend compte a la Premiere Ministre"],["POS-" + CODE + "-DG","supervise","Supervise le Directeur General (" + NOM_DG + ")"]],
    kpi: [["Taux d'execution du plan sectoriel","75","%"]],
    wf: [["adoption_arrete_ministeriel","Proposition","initiateur"],["adoption_arrete_ministeriel","Signature","signataire"]]
  };
  data["POS-" + CODE + "-SG"] = {
    resp: ["Coordonner l'administration du ministere", "Superviser les directions generales", "Assurer le suivi des instructions ministerielles"],
    droits: [["coordination_ministere","ecriture","national"],["directions_generales","lecture","national"]],
    menus: ["Tableau de bord","Directions generales","Instructions"],
    docs: [["Instruction administrative","creer"],["Instruction administrative","signer"]],
    inter: [["POS-" + CODE + "-MINISTRE","rapporte_a","Rend compte au Ministre " + NOM_MIN]],
    kpi: [["Taux de suivi des instructions","90","%"]],
    wf: [["diffusion_instruction","Redaction","initiateur"],["diffusion_instruction","Validation","valideur"]]
  };
  data["POS-" + CODE + "-IG"] = {
    resp: ["Controler la gestion administrative et financiere des services", "Auditer les entites sous tutelle", "Detecter et signaler les irregularites"],
    droits: [["audits_sectoriels","ecriture","national"],["controle_services","validation","national"]],
    menus: ["Tableau de bord","Audits","Controles","Rapports"],
    docs: [["Rapport d'audit","creer"],["Rapport d'audit","valider"]],
    inter: [["POS-" + CODE + "-MINISTRE","rapporte_a","Rend compte au Ministre " + NOM_MIN]],
    kpi: [["Nombre d'audits realises par an","10","nombre"]],
    wf: [["audit_sectoriel","Planification","initiateur"],["audit_sectoriel","Controle","initiateur"],["audit_sectoriel","Rapport","valideur"]]
  };
  data["POS-" + CODE + "-DG"] = {
    resp: ["Diriger " + NOM_DG, "Superviser les services et directions provinciales rattaches", "Mettre en oeuvre la politique sectorielle du ministere"],
    droits: [["gestion_sectorielle","ecriture","national"],["controle_sectoriel","validation","national"]],
    menus: ["Tableau de bord","Gestion sectorielle","Services provinciaux"],
    docs: [["Rapport d'activite","creer"],["Rapport d'activite","valider"]],
    inter: [["POS-" + CODE + "-MINISTRE","rapporte_a","Rend compte au Ministre " + NOM_MIN]],
    kpi: [["Taux de realisation des objectifs sectoriels","75","%"]],
    wf: [["gestion_sectorielle","Planification","initiateur"],["gestion_sectorielle","Execution","initiateur"],["gestion_sectorielle","Rapport","valideur"]]
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

  console.log("OK: " + NOM_MIN + " structure (" + units.length + " unites) + " + positions.length + " postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
