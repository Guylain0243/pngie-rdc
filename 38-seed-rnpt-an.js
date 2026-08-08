const db = require("./src/db");

async function main() {
  const CABAN = "8986f30b-8664-4752-8391-a0742ab468d0";

  const positions = [
    { id: "POS-AN-PRESIDENT", unit: CABAN, titre: "Président de l'Assemblée Nationale", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-AN-RAPPORTEUR", unit: CABAN, titre: "Rapporteur du Bureau", niveau: 1, autorite: "exécutive" },
    { id: "POS-AN-QUESTEUR", unit: CABAN, titre: "Questeur", niveau: 1, autorite: "exécutive" },
    { id: "POS-AN-PRESCOM", unit: CABAN, titre: "Président de Commission", niveau: 1, autorite: "exécutive" },
    { id: "POS-AN-DEPUTE", unit: CABAN, titre: "Député", niveau: 2, autorite: "consultative" }
  ];
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {
    "POS-AN-PRESIDENT": {
      resp: ["Présider les séances plénières","Représenter l'Assemblée Nationale","Superviser l'administration parlementaire","Coordonner avec le Bureau et la Conférence des Présidents","Garantir le respect du règlement intérieur"],
      droits: [["seances_plenieres","ecriture","national"],["ordre_du_jour","ecriture","national"],["administration_parlementaire","validation","national"]],
      menus: ["Tableau de bord","Séances plénières","Ordre du jour","Bureau","Commissions"],
      docs: [["Ordre du jour","creer"],["Ordre du jour","valider"],["Procès-verbal de séance","valider"],["Procès-verbal de séance","signer"]],
      inter: [["POS-AN-RAPPORTEUR","supervise","Supervise le Rapporteur du Bureau"],["POS-AN-QUESTEUR","supervise","Supervise le Questeur"]],
      kpi: [["Nombre de séances tenues par mois","8","nombre"],["Taux d'exécution de l'ordre du jour","90","%"]],
      wf: [["adoption_ordre_du_jour","Proposition","initiateur"],["adoption_ordre_du_jour","Examen Conférence des Présidents","observateur"],["adoption_ordre_du_jour","Adoption","valideur"]]
    },
    "POS-AN-RAPPORTEUR": {
      resp: ["Rédiger les rapports du Bureau","Assurer le suivi des décisions du Bureau","Coordonner la communication du Bureau"],
      droits: [["rapports_bureau","ecriture","national"],["decisions_bureau","lecture","national"]],
      menus: ["Tableau de bord","Rapports","Décisions du Bureau"],
      docs: [["Rapport du Bureau","creer"],["Rapport du Bureau","valider"]],
      inter: [["POS-AN-PRESIDENT","rapporte_a","Rend compte au Président de l'Assemblée Nationale"]],
      kpi: [["Nombre de rapports produits par mois","4","nombre"]],
      wf: [["redaction_rapport_bureau","Rédaction","initiateur"],["redaction_rapport_bureau","Validation","valideur"]]
    },
    "POS-AN-QUESTEUR": {
      resp: ["Gérer le budget et les finances de l'Assemblée Nationale","Superviser l'administration financière","Contrôler les dépenses parlementaires"],
      droits: [["budget_an","ecriture","national"],["depenses_parlementaires","validation","national"]],
      menus: ["Tableau de bord","Budget","Dépenses"],
      docs: [["Rapport financier","creer"],["Rapport financier","valider"],["Ordre de dépense","valider"]],
      inter: [["POS-AN-PRESIDENT","rapporte_a","Rend compte au Président de l'Assemblée Nationale"]],
      kpi: [["Taux d'exécution budgétaire","85","%"],["Taux de conformité des dépenses","100","%"]],
      wf: [["validation_depense_an","Demande","initiateur"],["validation_depense_an","Contrôle","observateur"],["validation_depense_an","Validation","valideur"]]
    },
    "POS-AN-PRESCOM": {
      resp: ["Diriger les travaux de la commission","Organiser les auditions","Superviser l'examen des textes de loi","Présenter les rapports en séance plénière"],
      droits: [["travaux_commission","ecriture","national"],["auditions","ecriture","national"],["textes_loi","validation","national"]],
      menus: ["Tableau de bord","Travaux de commission","Auditions","Textes de loi"],
      docs: [["Rapport de commission","creer"],["Rapport de commission","valider"],["Amendement","consulter"]],
      inter: [["POS-AN-PRESIDENT","collabore_avec","Coordination avec la Présidence de l'AN"]],
      kpi: [["Nombre de textes examinés par mois","3","nombre"],["Taux de présence aux auditions","90","%"]],
      wf: [["examen_texte_commission","Réception","initiateur"],["examen_texte_commission","Auditions","initiateur"],["examen_texte_commission","Rapport","valideur"]]
    },
    "POS-AN-DEPUTE": {
      resp: ["Participer aux séances plénières","Voter les lois","Proposer des amendements","Représenter sa circonscription","Participer aux travaux de commission"],
      droits: [["votes","ecriture","national"],["amendements","ecriture","national"],["seances_plenieres","lecture","national"]],
      menus: ["Tableau de bord","Votes","Amendements","Séances"],
      docs: [["Proposition de loi","creer"],["Amendement","creer"]],
      inter: [["POS-AN-PRESCOM","collabore_avec","Collabore avec le Président de Commission"]],
      kpi: [["Taux de participation aux séances","80","%"],["Nombre d'amendements proposés par session","5","nombre"]],
      wf: [["depot_amendement","Rédaction","initiateur"],["depot_amendement","Dépôt","initiateur"],["depot_amendement","Examen","observateur"]]
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

  console.log("OK: 5 postes Assemblee Nationale crees avec 7 dimensions completes (President AN, Rapporteur, Questeur, President Commission, Depute)");
}

main().catch(err => { console.error(err); process.exit(1); });
