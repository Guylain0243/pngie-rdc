const db = require("./src/db");

async function main() {
  const [,, CODE, ORG, NOM_ETD_RAW, TITRE_CHEF_RAW] = process.argv;
  if (!CODE || !ORG || !NOM_ETD_RAW || !TITRE_CHEF_RAW) {
    console.error("Usage: node 48-seed-rnpt-etd.js <CODE> <ORG_ID> \"<Nom ETD>\" \"<Titre du Chef>\"");
    process.exit(1);
  }
  const NOM_ETD = NOM_ETD_RAW;
  const TITRE_CHEF = TITRE_CHEF_RAW;

  const unitRow = await db.get("SELECT unit_id FROM unit WHERE organization_id = ? LIMIT 1", [ORG]);
  if (!unitRow) {
    console.error("ERREUR: aucune unite trouvee pour organization_id " + ORG);
    process.exit(1);
  }
  const UNIT = unitRow.unit_id;

  const positions = [
    { id: "POS-" + CODE + "-CHEF", unit: UNIT, titre: TITRE_CHEF + " de " + NOM_ETD, niveau: 0, autorite: "decisionnelle" },
    { id: "POS-" + CODE + "-ADJOINT", unit: UNIT, titre: "Adjoint au " + TITRE_CHEF, niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-SE", unit: UNIT, titre: "Secretaire Executif de " + NOM_ETD, niveau: 1, autorite: "executive" },
    { id: "POS-" + CODE + "-CONS", unit: UNIT, titre: "President du Conseil de " + NOM_ETD, niveau: 1, autorite: "executive" },
  ];

  for (const p of positions) {
    await db.run(
      "INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)",
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {};
  data["POS-" + CODE + "-CHEF"] = {
    resp: ["Diriger l'administration de " + NOM_ETD, "Assurer l'execution des decisions du Conseil", "Representer l'ETD aupres des autorites provinciales"],
    droits: [["gestion_etd","ecriture","local"],["budget_etd","validation","local"]],
    menus: ["Tableau de bord","Administration locale","Services de base","Rapports"],
    docs: [["Decision de l'ETD","creer"],["Decision de l'ETD","signer"]],
    inter: [["POS-" + CODE + "-SE","supervise","Supervise le Secretaire Executif"]],
    kpi: [["Taux d'execution du budget local","70","%"]],
    wf: [["adoption_decision_etd","Proposition","initiateur"],["adoption_decision_etd","Signature","signataire"]]
  };
  data["POS-" + CODE + "-ADJOINT"] = {
    resp: ["Assister le " + TITRE_CHEF + " dans la gestion de l'ETD", "Coordonner les services locaux", "Assurer l'interim en cas d'absence du " + TITRE_CHEF],
    droits: [["coordination_locale","ecriture","local"],["services_locaux","lecture","local"]],
    menus: ["Tableau de bord","Services locaux","Coordination"],
    docs: [["Instruction locale","creer"],["Instruction locale","signer"]],
    inter: [["POS-" + CODE + "-CHEF","rapporte_a","Rend compte au " + TITRE_CHEF]],
    kpi: [["Taux de suivi des instructions","85","%"]],
    wf: [["coordination_services_locaux","Redaction","initiateur"],["coordination_services_locaux","Validation","valideur"]]
  };
  data["POS-" + CODE + "-SE"] = {
    resp: ["Coordonner l'administration technique de l'ETD", "Superviser les divisions et bureaux locaux", "Assurer l'etat civil et les services de proximite"],
    droits: [["administration_locale","ecriture","local"],["etat_civil","validation","local"]],
    menus: ["Tableau de bord","Etat civil","Divisions locales"],
    docs: [["Acte d'etat civil","creer"],["Acte d'etat civil","valider"]],
    inter: [["POS-" + CODE + "-CHEF","rapporte_a","Rend compte au " + TITRE_CHEF]],
    kpi: [["Delai moyen de traitement des actes","5","jours"]],
    wf: [["traitement_acte_etat_civil","Enregistrement","initiateur"],["traitement_acte_etat_civil","Validation","valideur"]]
  };
  data["POS-" + CODE + "-CONS"] = {
    resp: ["Diriger le Conseil de " + NOM_ETD, "Deliberer sur les affaires locales", "Controler l'action de l'executif local"],
    droits: [["deliberation_locale","ecriture","local"],["controle_local","validation","local"]],
    menus: ["Tableau de bord","Deliberations","Sessions","Controle"],
    docs: [["Deliberation du Conseil","creer"],["Deliberation du Conseil","adopter"]],
    inter: [["POS-" + CODE + "-CHEF","controle","Controle l'action du " + TITRE_CHEF]],
    kpi: [["Nombre de deliberations adoptees par an","6","nombre"]],
    wf: [["adoption_deliberation","Proposition","initiateur"],["adoption_deliberation","Debat","observateur"],["adoption_deliberation","Adoption","valideur"]]
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

  console.log("OK: " + NOM_ETD + " (unite existante reutilisee) + " + positions.length + " postes crees avec 7 dimensions completes");
}

main().catch(err => { console.error(err); process.exit(1); });
