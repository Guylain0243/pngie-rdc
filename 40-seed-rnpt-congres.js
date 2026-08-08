const db = require("./src/db");

async function main() {
  await db.run(
    `INSERT OR IGNORE INTO organization (organization_id, code, nom, type_id, parent_id, niveau, statut, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["ORG-CONGRES", "CONGRES", "Congrès", 1, null, 0, "ACTIF", "Réunion conjointe de l'Assemblée Nationale et du Sénat pour les révisions constitutionnelles et déclarations solennelles"]
  );

  await db.run(
    `INSERT OR IGNORE INTO unit (unit_id, organization_id, parent_unit_id, code, nom, type, ordre) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ["UNIT-CONGRES-BUREAU", "ORG-CONGRES", null, "BUREAU", "Bureau du Congrès", "Bureau", 1]
  );

  const positions = [
    { id: "POS-CONGRES-PRESIDENT", unit: "UNIT-CONGRES-BUREAU", titre: "Président du Congrès", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-CONGRES-RAPPORTEUR", unit: "UNIT-CONGRES-BUREAU", titre: "Rapporteur du Congrès", niveau: 1, autorite: "exécutive" },
    { id: "POS-CONGRES-SECRETAIRE", unit: "UNIT-CONGRES-BUREAU", titre: "Secrétaire du Congrès", niveau: 1, autorite: "exécutive" }
  ];
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {
    "POS-CONGRES-PRESIDENT": {
      resp: ["Présider les séances du Congrès","Coordonner l'organisation des révisions constitutionnelles","Assurer le bon déroulement des votes solennels","Représenter le Congrès"],
      droits: [["seances_congres","ecriture","national"],["votes_constitutionnels","validation","national"]],
      menus: ["Tableau de bord","Séances du Congrès","Votes constitutionnels"],
      docs: [["Ordre du jour du Congrès","creer"],["Ordre du jour du Congrès","valider"],["Procès-verbal du Congrès","valider"],["Procès-verbal du Congrès","signer"]],
      inter: [["POS-AN-PRESIDENT","collabore_avec","Coordination avec la Présidence de l'Assemblée Nationale"],["POS-SN-PRESIDENT","collabore_avec","Coordination avec la Présidence du Sénat"]],
      kpi: [["Nombre de sessions du Congrès tenues par an","2","nombre"],["Taux de quorum atteint","100","%"]],
      wf: [["convocation_congres","Proposition","initiateur"],["convocation_congres","Vérification quorum","observateur"],["convocation_congres","Convocation","valideur"]]
    },
    "POS-CONGRES-RAPPORTEUR": {
      resp: ["Rédiger les rapports des sessions du Congrès","Consigner les résultats des votes","Assurer la publication des textes adoptés"],
      droits: [["rapports_congres","ecriture","national"],["resultats_votes","lecture","national"]],
      menus: ["Tableau de bord","Rapports","Résultats des votes"],
      docs: [["Rapport de session","creer"],["Rapport de session","valider"]],
      inter: [["POS-CONGRES-PRESIDENT","rapporte_a","Rend compte au Président du Congrès"]],
      kpi: [["Nombre de rapports produits par session","1","nombre"]],
      wf: [["redaction_rapport_congres","Rédaction","initiateur"],["redaction_rapport_congres","Validation","valideur"]]
    },
    "POS-CONGRES-SECRETAIRE": {
      resp: ["Assurer le secrétariat administratif du Congrès","Gérer la logistique des sessions","Tenir le registre des présences et des votes"],
      droits: [["logistique_congres","ecriture","national"],["registre_presences","ecriture","national"]],
      menus: ["Tableau de bord","Logistique","Registre des présences"],
      docs: [["Registre de présence","creer"],["Feuille de vote","consulter"]],
      inter: [["POS-CONGRES-PRESIDENT","rapporte_a","Rend compte au Président du Congrès"]],
      kpi: [["Taux de tenue à jour du registre","100","%"]],
      wf: [["gestion_registre_congres","Ouverture","initiateur"],["gestion_registre_congres","Clôture","valideur"]]
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

  console.log("OK: organization Congres creee, 3 postes crees avec 7 dimensions completes (President, Rapporteur, Secretaire)");
}

main().catch(err => { console.error(err); process.exit(1); });
