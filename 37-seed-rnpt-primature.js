const db = require("./src/db");

async function main() {
  const CAB = "e6c31abc-d164-4c80-83df-4b1cf67dfe9a";
  const SG = "a3a94424-c5e5-47f5-bff2-b38bdef8b99d";

  const positions = [
    { id: "POS-PM-PREMIERMIN", unit: CAB, titre: "Première Ministre", niveau: 0, autorite: "décisionnelle" },
    { id: "POS-PM-DIRCAB", unit: CAB, titre: "Directeur de Cabinet", niveau: 1, autorite: "décisionnelle" },
    { id: "POS-PM-CONSEILLER", unit: CAB, titre: "Conseiller PM", niveau: 2, autorite: "consultative" }
  ];
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {
    "POS-PM-PREMIERMIN": {
      resp: ["Diriger l'action du Gouvernement","Coordonner les politiques publiques interministérielles","Superviser la mise en œuvre du programme gouvernemental","Rendre compte au Président de la République"],
      droits: [["politiques_publiques","ecriture","national"],["programme_gouvernemental","ecriture","national"],["conseil_ministres","ecriture","national"]],
      menus: ["Tableau de bord","Politiques publiques","Conseil des ministres","Rapports gouvernementaux"],
      docs: [["Décret gouvernemental","creer"],["Décret gouvernemental","signer"],["Communiqué du Conseil des ministres","valider"]],
      inter: [["POS-PR-PRESIDENT","rapporte_a","Rend compte au Président de la République"],["POS-PM-SGG","supervise","Supervise le Secrétaire Général du Gouvernement"]],
      kpi: [["Taux de mise en œuvre du programme gouvernemental","75","%"],["Nombre de conseils des ministres tenus par mois","4","nombre"]],
      wf: [["adoption_decret","Proposition","initiateur"],["adoption_decret","Examen interministériel","observateur"],["adoption_decret","Adoption Conseil","valideur"],["adoption_decret","Signature","signataire"]]
    },
    "POS-PM-DIRCAB": {
      resp: ["Coordonner le Cabinet de la Première Ministre","Superviser les conseillers","Valider les dossiers avant transmission à la PM","Assurer la liaison avec les ministères"],
      droits: [["dossiers_pm","validation","national"],["agenda_pm","ecriture","national"],["courrier_pm","ecriture","national"]],
      menus: ["Tableau de bord","Agenda PM","Dossiers","Courrier"],
      docs: [["Note à la PM","creer"],["Note à la PM","valider"],["Correspondance","creer"],["Correspondance","signer"]],
      inter: [["POS-PM-PREMIERMIN","rapporte_a","Rend compte à la Première Ministre"],["POS-PM-SGG","collabore_avec","Coordination avec le Secrétariat Général"]],
      kpi: [["Taux de traitement des dossiers dans les délais","95","%"],["Délai moyen de validation","48","heures"]],
      wf: [["validation_note_pm","Rédaction","initiateur"],["validation_note_pm","Validation Cabinet","valideur"],["validation_note_pm","Transmission","signataire"]]
    },
    "POS-PM-CONSEILLER": {
      resp: ["Conseiller la PM sur son domaine sectoriel","Analyser les dossiers interministériels","Préparer des notes d'orientation"],
      droits: [["dossiers_sectoriels_pm","lecture","national"],["notes_orientation_pm","ecriture","national"]],
      menus: ["Tableau de bord","Dossiers sectoriels","Notes d'orientation"],
      docs: [["Note d'orientation","creer"],["Dossier sectoriel","consulter"]],
      inter: [["POS-PM-DIRCAB","rapporte_a","Rend compte au Directeur de Cabinet"]],
      kpi: [["Nombre de notes produites par mois","6","nombre"]],
      wf: [["preparation_note_pm","Analyse","initiateur"],["preparation_note_pm","Rédaction","initiateur"],["preparation_note_pm","Validation","valideur"]]
    },
    "POS-PM-SGG": {
      resp: ["Coordonner l'action administrative interministérielle","Assurer le secrétariat du Conseil des ministres","Superviser la mise en forme juridique des textes","Assurer la liaison entre ministères et Primature"],
      droits: [["secretariat_conseil","ecriture","national"],["textes_juridiques","validation","national"],["coordination_interministerielle","ecriture","national"]],
      menus: ["Tableau de bord","Conseil des ministres","Textes juridiques","Coordination ministérielle"],
      docs: [["Procès-verbal du Conseil","creer"],["Procès-verbal du Conseil","valider"],["Projet de décret","consulter"],["Projet de décret","valider"]],
      inter: [["POS-PM-PREMIERMIN","rapporte_a","Rend compte à la Première Ministre"],["POS-PM-DIRCAB","collabore_avec","Coordination avec le Cabinet"]],
      kpi: [["Taux de textes traités dans les délais","90","%"],["Nombre de PV produits par mois","4","nombre"]],
      wf: [["validation_texte_juridique","Rédaction","initiateur"],["validation_texte_juridique","Vérification juridique","observateur"],["validation_texte_juridique","Validation","valideur"]]
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

  console.log("OK: 4 postes Primature crees avec 7 dimensions completes (Premiere Ministre, Directeur de Cabinet, Conseiller PM, Secretaire General du Gouvernement)");
}

main().catch(err => { console.error(err); process.exit(1); });
