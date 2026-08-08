const db = require("./src/db");

async function main() {
  const [,, CODE, NOM_ETAB_RAW, TITRE_CHEF_RAW, NOM_SERVICE_RAW] = process.argv;
  if (!CODE || !NOM_ETAB_RAW || !TITRE_CHEF_RAW || !NOM_SERVICE_RAW) {
    console.error("Usage: node 50-create-etablissement.js <CODE> \"<Nom Etablissement>\" \"<Titre du Chef>\" \"<Nom Service Cle>\"");
    process.exit(1);
  }
  const NOM_ETAB = NOM_ETAB_RAW;
  const TITRE_CHEF = TITRE_CHEF_RAW;
  const NOM_SERVICE = NOM_SERVICE_RAW;

  const ORG_ID = "ORG-" + CODE;
  const UNIT_ID = "UNIT-" + CODE;

  await db.run(
    "INSERT OR IGNORE INTO organization (organization_id, code, nom, type_id, parent_id, niveau, statut, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [ORG_ID, CODE, NOM_ETAB, 7, null, 1, "actif", "Etablissement public sous tutelle du Gouvernement de la RDC"]
  );

  await db.run(
    "INSERT OR IGNORE INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [UNIT_ID, ORG_ID, null, "DIR-" + CODE, "Direction / Cabinet", "Direction", 1]
  );

  const positions = [
    { id: "POS-" + CODE + "-CHEF", titre: TITRE_CHEF + " de " + NOM_ETAB, niveau: 0, autorite: "decisionnelle" },
    { id: "POS-" + CODE + "-ADJOINT", titre: "Adjoint au " + TITRE_CHEF, niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-SG", titre: "Secretaire General de " + NOM_ETAB, niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-CS", titre: "Chef de " + NOM_SERVICE, niveau: 1, autorite: "executive" },
  ];

  for (const p of positions) {
    await db.run(
      "INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)",
      [p.id, UNIT_ID, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {};
  data["POS-" + CODE + "-CHEF"] = {
    resp: ["Diriger " + NOM_ETAB, "Assurer la mise en oeuvre de la mission de service public de l'etablissement", "Representer l'etablissement aupres des autorites de tutelle"],
    droits: [["gestion_etablissement","ecriture","national"],["budget_etablissement","validation","national"]],
    menus: ["Tableau de bord","Services","Rapports"],
    docs: [["Decision de l'etablissement","creer"],["Decision de l'etablissement","signer"]],
    inter: [["POS-" + CODE + "-SG","supervise","Supervise le Secretaire General"]],
    kpi: [["Taux de realisation de la mission de service public","75","%"]],
    wf: [["adoption_decision_etablissement","Proposition","initiateur"],["adoption_decision_etablissement","Signature","signataire"]]
  };
  data["POS-" + CODE + "-ADJOINT"] = {
    resp: ["Assister le " + TITRE_CHEF + " dans la gestion de l'etablissement", "Coordonner les services de l'etablissement", "Assurer l'interim en cas d'absence du " + TITRE_CHEF],
    droits: [["coordination_etablissement","ecriture","national"],["services_etablissement","lecture","national"]],
    menus: ["Tableau de bord","Services","Coordination"],
    docs: [["Instruction interne","creer"],["Instruction interne","signer"]],
    inter: [["POS-" + CODE + "-CHEF","rapporte_a","Rend compte au " + TITRE_CHEF]],
    kpi: [["Taux de suivi des instructions","85","%"]],
    wf: [["coordination_services","Redaction","initiateur"],["coordination_services","Validation","valideur"]]
  };
  data["POS-" + CODE + "-SG"] = {
    resp: ["Coordonner l'administration de " + NOM_ETAB, "Superviser les services administratifs et financiers", "Assurer le suivi des instructions du " + TITRE_CHEF],
    droits: [["administration_etablissement","ecriture","national"],["services_administratifs","lecture","national"]],
    menus: ["Tableau de bord","Administration","Finances"],
    docs: [["Rapport administratif","creer"],["Rapport administratif","valider"]],
    inter: [["POS-" + CODE + "-CHEF","rapporte_a","Rend compte au " + TITRE_CHEF]],
    kpi: [["Taux d'execution du budget","80","%"]],
    wf: [["gestion_administrative","Planification","initiateur"],["gestion_administrative","Execution","initiateur"],["gestion_administrative","Reddition","valideur"]]
  };
  data["POS-" + CODE + "-CS"] = {
    resp: ["Diriger " + NOM_SERVICE, "Mettre en oeuvre les activites techniques ou scientifiques de l'etablissement", "Assurer la qualite des prestations rendues"],
    droits: [["operations_techniques","ecriture","national"],["controle_qualite","validation","national"]],
    menus: ["Tableau de bord","Operations","Qualite"],
    docs: [["Rapport d'activite","creer"],["Rapport d'activite","valider"]],
    inter: [["POS-" + CODE + "-CHEF","rapporte_a","Rend compte au " + TITRE_CHEF]],
    kpi: [["Taux de satisfaction des usagers","80","%"]],
    wf: [["prestation_service","Planification","initiateur"],["prestation_service","Execution","initiateur"],["prestation_service","Rapport","valideur"]]
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

  console.log("OK: " + NOM_ETAB + " creee (organization + 1 unite) + " + positions.length + " postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });

