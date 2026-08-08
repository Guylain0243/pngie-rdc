const db = require("./src/db");

async function main() {
  const [,, CODE, ORG, NOM_PROVINCE_RAW] = process.argv;
  if (!CODE || !ORG || !NOM_PROVINCE_RAW) {
    console.error("Usage: node 47-seed-rnpt-province.js <CODE> <ORG_ID> \"<Nom Province>\"");
    process.exit(1);
  }
  const NOM_PROVINCE = NOM_PROVINCE_RAW;

  const unitRow = await db.get("SELECT unit_id FROM unit WHERE organization_id = ? LIMIT 1", [ORG]);
  if (!unitRow) {
    console.error("ERREUR: aucune unite trouvee pour organization_id " + ORG);
    process.exit(1);
  }
  const UNIT = unitRow.unit_id;

  const positions = [
    { id: "POS-" + CODE + "-GOUV", unit: UNIT, titre: "Gouverneur de " + NOM_PROVINCE, niveau: 0, autorite: "decisionnelle" },
    { id: "POS-" + CODE + "-VGOUV", unit: UNIT, titre: "Vice-Gouverneur de " + NOM_PROVINCE, niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-PAP", unit: UNIT, titre: "President de l'Assemblee Provinciale de " + NOM_PROVINCE, niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-SGP", unit: UNIT, titre: "Secretaire General Provincial de " + NOM_PROVINCE, niveau: 1, autorite: "executive" },
  ];

  for (const p of positions) {
    await db.run(
      "INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)",
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {};
  data["POS-" + CODE + "-GOUV"] = {
    resp: ["Diriger l'execution provinciale de " + NOM_PROVINCE, "Assurer la coordination des services publics provinciaux", "Representer la province aupres du Gouvernement central"],
    droits: [["gestion_provinciale","ecriture","provincial"],["budget_provincial","validation","provincial"]],
    menus: ["Tableau de bord","Executif provincial","Services provinciaux","Rapports"],
    docs: [["Arrete provincial","creer"],["Arrete provincial","signer"]],
    inter: [["POS-MIN_0-MINISTRE","rapporte_a","Rend compte au Ministre de l'Interieur"],["POS-" + CODE + "-SGP","supervise","Supervise le Secretaire General Provincial"]],
    kpi: [["Taux d'execution du budget provincial","75","%"]],
    wf: [["adoption_arrete_provincial","Proposition","initiateur"],["adoption_arrete_provincial","Signature","signataire"]]
  };
  data["POS-" + CODE + "-VGOUV"] = {
    resp: ["Assister le Gouverneur dans la gestion de la province", "Coordonner les services techniques provinciaux", "Assurer l'interim en cas d'absence du Gouverneur"],
    droits: [["coordination_provinciale","ecriture","provincial"],["services_techniques","lecture","provincial"]],
    menus: ["Tableau de bord","Services techniques","Coordination"],
    docs: [["Instruction provinciale","creer"],["Instruction provinciale","signer"]],
    inter: [["POS-" + CODE + "-GOUV","rapporte_a","Rend compte au Gouverneur"]],
    kpi: [["Taux de suivi des instructions","85","%"]],
    wf: [["coordination_services","Redaction","initiateur"],["coordination_services","Validation","valideur"]]
  };
  data["POS-" + CODE + "-PAP"] = {
    resp: ["Diriger l'Assemblee Provinciale de " + NOM_PROVINCE, "Voter les edits provinciaux", "Controler l'action du Gouvernement provincial"],
    droits: [["deliberation_provinciale","ecriture","provincial"],["controle_executif","validation","provincial"]],
    menus: ["Tableau de bord","Edits provinciaux","Sessions","Controle"],
    docs: [["Edit provincial","creer"],["Edit provincial","adopter"]],
    inter: [["POS-" + CODE + "-GOUV","controle","Controle l'action du Gouverneur"]],
    kpi: [["Nombre d'edits adoptes par an","10","nombre"]],
    wf: [["adoption_edit","Proposition","initiateur"],["adoption_edit","Debat","observateur"],["adoption_edit","Adoption","valideur"]]
  };
  data["POS-" + CODE + "-SGP"] = {
    resp: ["Coordonner l'administration provinciale", "Superviser les divisions provinciales", "Assurer le suivi des instructions du Gouverneur"],
    droits: [["administration_provinciale","ecriture","provincial"],["divisions_provinciales","lecture","provincial"]],
    menus: ["Tableau de bord","Divisions provinciales","Instructions"],
    docs: [["Instruction administrative","creer"],["Instruction administrative","signer"]],
    inter: [["POS-" + CODE + "-GOUV","rapporte_a","Rend compte au Gouverneur"]],
    kpi: [["Taux de suivi des instructions","90","%"]],
    wf: [["diffusion_instruction","Redaction","initiateur"],["diffusion_instruction","Validation","valideur"]]
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

  console.log("OK: " + NOM_PROVINCE + " (unite existante reutilisee) + " + positions.length + " postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });

