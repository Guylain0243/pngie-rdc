const db = require("./src/db");

async function main() {
  const ORG_ID = "ORG-CENI";
  const UNIT_BUREAU = "UNIT-CENI-BUREAU";

  await db.run(
    "INSERT OR IGNORE INTO organization (organization_id, code, nom, type_id, parent_id, niveau, statut, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [ORG_ID, "CENI", "Commission Electorale Nationale Independante", 8, null, 1, "actif", "Institution d'appui a la democratie chargee de l'organisation des elections"]
  );

  await db.run(
    "INSERT OR IGNORE INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [UNIT_BUREAU, ORG_ID, null, "BUREAU-CENI", "Bureau de la CENI", "Bureau", 1]
  );

  const positions = [
    { id: "POS-CENI-PRESIDENT", titre: "President de la CENI", niveau: 0, autorite: "decisionnelle" },
    { id: "POS-CENI-VP", titre: "Vice-President de la CENI", niveau: 1, autorite: "executive" },
    { id: "POS-CENI-RAPPORTEUR", titre: "Rapporteur de la CENI", niveau: 1, autorite: "executive" },
    { id: "POS-CENI-QUESTEUR", titre: "Questeur de la CENI", niveau: 1, autorite: "executive" },
  ];

  for (const p of positions) {
    await db.run(
      "INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)",
      [p.id, UNIT_BUREAU, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {
    "POS-CENI-PRESIDENT": {
      resp: ["Diriger la Commission Electorale Nationale Independante", "Organiser et superviser les processus electoraux", "Representer la CENI aupres des institutions et partenaires"],
      droits: [["gestion_electorale","ecriture","national"],["budget_electoral","validation","national"]],
      menus: ["Tableau de bord","Processus electoraux","Bureau","Rapports"],
      docs: [["Decision du Bureau","creer"],["Decision du Bureau","signer"]],
      inter: [["POS-AN-PRESIDENT","rapporte_a","Rend compte a l'Assemblee Nationale"]],
      kpi: [["Taux de couverture du fichier electoral","90","%"]],
      wf: [["organisation_scrutin","Planification","initiateur"],["organisation_scrutin","Deploiement","initiateur"],["organisation_scrutin","Proclamation","valideur"]]
    },
    "POS-CENI-VP": {
      resp: ["Assister le President dans la gestion de la CENI", "Coordonner les operations electorales sur le terrain", "Assurer l'interim en cas d'absence du President"],
      droits: [["coordination_electorale","ecriture","national"],["operations_terrain","lecture","national"]],
      menus: ["Tableau de bord","Operations terrain","Coordination"],
      docs: [["Instruction operationnelle","creer"],["Instruction operationnelle","signer"]],
      inter: [["POS-CENI-PRESIDENT","rapporte_a","Rend compte au President de la CENI"]],
      kpi: [["Taux de deploiement des bureaux de vote","95","%"]],
      wf: [["deploiement_bureaux_vote","Planification","initiateur"],["deploiement_bureaux_vote","Validation","valideur"]]
    },
    "POS-CENI-RAPPORTEUR": {
      resp: ["Assurer la redaction et la conservation des actes de la CENI", "Compiler et publier les resultats electoraux", "Assurer la communication institutionnelle de la CENI"],
      droits: [["publication_resultats","ecriture","national"],["archives_electorales","lecture","national"]],
      menus: ["Tableau de bord","Resultats","Archives","Communication"],
      docs: [["Proces-verbal de resultats","creer"],["Proces-verbal de resultats","valider"]],
      inter: [["POS-CENI-PRESIDENT","rapporte_a","Rend compte au President de la CENI"]],
      kpi: [["Delai moyen de publication des resultats","48","heures"]],
      wf: [["publication_resultats","Compilation","initiateur"],["publication_resultats","Verification","initiateur"],["publication_resultats","Publication","valideur"]]
    },
    "POS-CENI-QUESTEUR": {
      resp: ["Gerer le patrimoine et les ressources financieres de la CENI", "Superviser la logistique electorale", "Controler l'execution du budget electoral"],
      droits: [["gestion_patrimoine","ecriture","national"],["logistique_electorale","validation","national"]],
      menus: ["Tableau de bord","Budget","Logistique","Patrimoine"],
      docs: [["Rapport financier","creer"],["Rapport financier","valider"]],
      inter: [["POS-CENI-PRESIDENT","rapporte_a","Rend compte au President de la CENI"]],
      kpi: [["Taux d'execution du budget electoral","85","%"]],
      wf: [["gestion_logistique_electorale","Planification","initiateur"],["gestion_logistique_electorale","Execution","initiateur"],["gestion_logistique_electorale","Reddition","valideur"]]
    }
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

  console.log("OK: CENI creee (organization + 1 unite) + 4 postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
