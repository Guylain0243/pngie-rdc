const db = require("./src/db");

async function main() {
  const institutions = [
    { code: "CC", unit: "770a0b56-fdf4-4c4e-9b05-2da4b3f96e91", nomInst: "Cour Constitutionnelle", president: "POS-CC-PRESIDENT" },
    { code: "CASS", unit: "fd574a8a-d12e-4ab8-a980-a51d1298b19a", nomInst: "Cour de Cassation", president: "POS-CASS-PREMPRES" },
    { code: "CE", unit: "fb5d8cb7-53c0-45fb-8f96-6c038449df4b", nomInst: "Conseil d'État", president: "POS-CE-PREMPRES" },
    { code: "COMPTES", unit: "5cd6633f-a08b-4929-b935-ef7a27d5db49", nomInst: "Cour des Comptes", president: "POS-COMPTES-PREMPRES" }
  ];

  const positions = [];
  for (const inst of institutions) {
    positions.push(
      { id: `POS-${inst.code}-JUGE`, unit: inst.unit, titre: `Juge / Conseiller - ${inst.nomInst}`, niveau: 1, autorite: "exécutive" },
      { id: `POS-${inst.code}-GREFFIER`, unit: inst.unit, titre: `Greffier en Chef - ${inst.nomInst}`, niveau: 2, autorite: "exécutive" },
      { id: `POS-${inst.code}-PROCUREUR`, unit: inst.unit, titre: `Procureur Général - ${inst.nomInst}`, niveau: 1, autorite: "exécutive" }
    );
  }
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  let sectionCount = 0;
  for (const inst of institutions) {
    const data = {
      [`POS-${inst.code}-JUGE`]: {
        resp: ["Instruire les dossiers soumis à la juridiction","Participer aux délibérés","Rédiger des projets d'arrêt","Siéger aux audiences"],
        droits: [["dossiers_juridiction","ecriture","national"],["projets_arret","ecriture","national"]],
        menus: ["Tableau de bord","Dossiers","Projets d'arrêt","Audiences"],
        docs: [["Projet d'arrêt","creer"],["Rapport d'instruction","creer"],["Rapport d'instruction","valider"]],
        inter: [[inst.president,"rapporte_a",`Rend compte au Président - ${inst.nomInst}`]],
        kpi: [["Nombre de dossiers instruits par mois","8","nombre"],["Délai moyen d'instruction","45","jours"]],
        wf: [["instruction_dossier","Attribution","initiateur"],["instruction_dossier","Instruction","initiateur"],["instruction_dossier","Rapport","valideur"]]
      },
      [`POS-${inst.code}-GREFFIER`]: {
        resp: ["Assurer le secrétariat des audiences","Tenir les registres de la juridiction","Authentifier les actes et décisions","Gérer les archives judiciaires"],
        droits: [["registres_juridiction","ecriture","national"],["archives_judiciaires","ecriture","national"]],
        menus: ["Tableau de bord","Registres","Archives","Actes"],
        docs: [["Registre d'audience","creer"],["Acte authentifié","valider"]],
        inter: [[inst.president,"rapporte_a",`Rend compte au Président - ${inst.nomInst}`]],
        kpi: [["Taux de tenue à jour des registres","100","%"],["Délai de délivrance des actes","5","jours"]],
        wf: [["authentification_acte","Réception","initiateur"],["authentification_acte","Vérification","initiateur"],["authentification_acte","Authentification","valideur"]]
      },
      [`POS-${inst.code}-PROCUREUR`]: {
        resp: ["Représenter le ministère public devant la juridiction","Requérir l'application de la loi","Superviser les parquets rattachés","Exercer les poursuites nécessaires"],
        droits: [["poursuites","ecriture","national"],["requisitions","ecriture","national"]],
        menus: ["Tableau de bord","Poursuites","Réquisitions","Parquets"],
        docs: [["Réquisitoire","creer"],["Réquisitoire","signer"],["Rapport de poursuite","creer"]],
        inter: [[inst.president,"collabore_avec",`Coordination avec le Président - ${inst.nomInst}`]],
        kpi: [["Nombre de réquisitoires produits par mois","10","nombre"],["Taux de suivi des poursuites","90","%"]],
        wf: [["requisition","Instruction","initiateur"],["requisition","Rédaction","initiateur"],["requisition","Validation","valideur"],["requisition","Dépôt","signataire"]]
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
      sectionCount++;
    }
  }

  console.log(`OK: ${sectionCount} postes Pouvoir Judiciaire (Juge, Greffier, Procureur x4 institutions) crees avec 7 dimensions completes`);
}

main().catch(err => { console.error(err); process.exit(1); });
