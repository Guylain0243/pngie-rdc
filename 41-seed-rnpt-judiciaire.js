const db = require("./src/db");

async function main() {
  const DIR_CC = "770a0b56-fdf4-4c4e-9b05-2da4b3f96e91";
  const DIR_CASS = "fd574a8a-d12e-4ab8-a980-a51d1298b19a";
  const DIR_CE = "fb5d8cb7-53c0-45fb-8f96-6c038449df4b";
  const DIR_COMPTES = "5cd6633f-a08b-4929-b935-ef7a27d5db49";

  const positions = [
    { id: "POS-CC-PRESIDENT", unit: DIR_CC, titre: "Président de la Cour Constitutionnelle", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-CASS-PREMPRES", unit: DIR_CASS, titre: "Premier Président de la Cour de Cassation", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-CE-PREMPRES", unit: DIR_CE, titre: "Premier Président du Conseil d'État", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-COMPTES-PREMPRES", unit: DIR_COMPTES, titre: "Premier Président de la Cour des Comptes", niveau: 0, autorite: "décisionnelle" }
  ];
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {
    "POS-CC-PRESIDENT": {
      resp: ["Présider les audiences de la Cour","Statuer sur la constitutionnalité des lois","Contrôler la régularité des élections présidentielles","Trancher les contentieux électoraux"],
      droits: [["audiences_cc","ecriture","national"],["arrets_constitutionnalite","validation","national"],["contentieux_electoral","validation","national"]],
      menus: ["Tableau de bord","Audiences","Arrêts","Contentieux électoral"],
      docs: [["Arrêt de la Cour","creer"],["Arrêt de la Cour","signer"],["Avis de constitutionnalité","valider"]],
      inter: [["POS-PR-PRESIDENT","collabore_avec","Coordination avec la Présidence de la République"]],
      kpi: [["Nombre d'arrêts rendus par mois","10","nombre"],["Délai moyen de traitement d'un dossier","30","jours"]],
      wf: [["adoption_arret_cc","Instruction","initiateur"],["adoption_arret_cc","Délibéré","observateur"],["adoption_arret_cc","Adoption","valideur"],["adoption_arret_cc","Signature","signataire"]]
    },
    "POS-CASS-PREMPRES": {
      resp: ["Présider la Cour de Cassation","Statuer sur les pourvois en cassation","Assurer l'unité de la jurisprudence nationale","Superviser les chambres de la Cour"],
      droits: [["pourvois_cassation","validation","national"],["jurisprudence","ecriture","national"]],
      menus: ["Tableau de bord","Pourvois","Jurisprudence","Chambres"],
      docs: [["Arrêt de cassation","creer"],["Arrêt de cassation","signer"]],
      inter: [["POS-CC-PRESIDENT","collabore_avec","Coordination avec la Cour Constitutionnelle"]],
      kpi: [["Nombre de pourvois traités par mois","15","nombre"]],
      wf: [["traitement_pourvoi","Enregistrement","initiateur"],["traitement_pourvoi","Instruction","initiateur"],["traitement_pourvoi","Délibéré","observateur"],["traitement_pourvoi","Arrêt","valideur"]]
    },
    "POS-CE-PREMPRES": {
      resp: ["Présider le Conseil d'État","Statuer sur les recours en annulation des actes administratifs","Conseiller le Gouvernement sur les projets de texte","Superviser les sections du Conseil"],
      droits: [["recours_administratifs","validation","national"],["avis_gouvernement","ecriture","national"]],
      menus: ["Tableau de bord","Recours","Avis","Sections"],
      docs: [["Arrêt du Conseil d'État","creer"],["Arrêt du Conseil d'État","signer"],["Avis consultatif","creer"],["Avis consultatif","valider"]],
      inter: [["POS-PM-PREMIERMIN","collabore_avec","Coordination avec la Primature"]],
      kpi: [["Nombre de recours traités par mois","12","nombre"],["Délai moyen de traitement","60","jours"]],
      wf: [["traitement_recours_ce","Enregistrement","initiateur"],["traitement_recours_ce","Instruction","initiateur"],["traitement_recours_ce","Délibéré","observateur"],["traitement_recours_ce","Arrêt","valideur"]]
    },
    "POS-COMPTES-PREMPRES": {
      resp: ["Présider la Cour des Comptes","Superviser le contrôle des finances publiques","Certifier les comptes de l'État","Superviser les chambres de contrôle"],
      droits: [["controle_finances_publiques","validation","national"],["certification_comptes","validation","national"]],
      menus: ["Tableau de bord","Contrôles","Certification","Chambres"],
      docs: [["Rapport de contrôle","creer"],["Rapport de contrôle","valider"],["Certification des comptes","signer"]],
      inter: [["POS-PM-PREMIERMIN","collabore_avec","Coordination avec la Primature"],["POS-AN-QUESTEUR","collabore_avec","Coordination avec le Questeur de l'Assemblée Nationale"]],
      kpi: [["Nombre de contrôles réalisés par an","20","nombre"],["Taux de recouvrement des irrégularités","70","%"]],
      wf: [["certification_comptes","Contrôle","initiateur"],["certification_comptes","Analyse","initiateur"],["certification_comptes","Certification","valideur"],["certification_comptes","Publication","signataire"]]
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

  console.log("OK: 4 postes Pouvoir Judiciaire crees avec 7 dimensions completes (Cour Constitutionnelle, Cour de Cassation, Conseil d'Etat, Cour des Comptes)");
}

main().catch(err => { console.error(err); process.exit(1); });
