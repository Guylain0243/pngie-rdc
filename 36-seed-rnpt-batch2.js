const db = require("./src/db");

async function main() {
  const positions = [
    { id: "POS-PR-DIRMC", unit: "UNIT-PR-MC", titre: "Directeur de la Maison Civile", niveau: 1, autorite: "exécutive" },
    { id: "POS-PR-RESPCT", unit: "UNIT-PR-CT", titre: "Responsable de Cellule Technique", niveau: 2, autorite: "exécutive" },
    { id: "POS-PR-DIRDIR", unit: "UNIT-PR-DIR", titre: "Directeur de Direction", niveau: 2, autorite: "exécutive" },
    { id: "POS-PR-CHEFSRV", unit: "UNIT-PR-SRV", titre: "Chef de Service", niveau: 3, autorite: "opérationnelle" }
  ];
  for (const p of positions) {
    await db.run(
      `INSERT OR IGNORE INTO position (position_id, unit_id, titre, niveau, role_defaut_id, autorite) VALUES (?, ?, ?, ?, NULL, ?)`,
      [p.id, p.unit, p.titre, p.niveau, p.autorite]
    );
  }

  const data = {
    "POS-PR-DIRMC": {
      resp: ["Organiser la vie civile et les audiences du Président","Gérer le protocole civil et les relations publiques","Coordonner les cérémonies civiles officielles","Superviser l'accueil des délégations","Gérer les invitations et audiences présidentielles"],
      droits: [["protocole_civil","ecriture","institution"],["audiences_presidentielles","ecriture","institution"],["relations_publiques","ecriture","institution"]],
      menus: ["Tableau de bord","Audiences","Protocole civil","Délégations"],
      docs: [["Programme d'audience","creer"],["Programme d'audience","valider"],["Invitation officielle","creer"],["Invitation officielle","signer"]],
      inter: [["POS-PR-DIRCAB","collabore_avec","Coordination protocolaire"],["POS-PR-PRESIDENT","rapporte_a","Rend compte au Président"]],
      kpi: [["Nombre d'audiences organisées par mois","30","nombre"],["Taux de satisfaction protocolaire","95","%"]],
      wf: [["organisation_audience","Demande","initiateur"],["organisation_audience","Vérification protocolaire","valideur"],["organisation_audience","Confirmation","signataire"]]
    },
    "POS-PR-RESPCT": {
      resp: ["Piloter les études techniques sectorielles","Produire des analyses pour le Cabinet","Suivre la mise en œuvre des projets présidentiels","Coordonner avec les ministères techniques"],
      droits: [["etudes_techniques","ecriture","institution"],["projets_presidentiels","ecriture","institution"],["rapports_sectoriels","lecture","national"]],
      menus: ["Tableau de bord","Études techniques","Projets présidentiels","Rapports"],
      docs: [["Étude technique","creer"],["Rapport de suivi de projet","creer"],["Rapport de suivi de projet","valider"]],
      inter: [["POS-PR-DIRCAB","rapporte_a","Rend compte au Directeur de Cabinet"],["POS-PR-CONSEILLER","collabore_avec","Collabore avec les Conseillers Spéciaux"]],
      kpi: [["Nombre d'études produites par trimestre","5","nombre"],["Taux d'avancement des projets suivis","80","%"]],
      wf: [["suivi_projet_presidentiel","Collecte de données","initiateur"],["suivi_projet_presidentiel","Analyse","initiateur"],["suivi_projet_presidentiel","Validation","valideur"]]
    },
    "POS-PR-DIRDIR": {
      resp: ["Diriger les activités opérationnelles de la Direction","Superviser les Services rattachés","Assurer le reporting au Cabinet","Gérer les ressources humaines et budgétaires de la Direction"],
      droits: [["gestion_direction","ecriture","institution"],["budget_direction","ecriture","institution"],["rh_direction","ecriture","institution"]],
      menus: ["Tableau de bord","Services rattachés","Budget","Ressources humaines"],
      docs: [["Rapport d'activité","creer"],["Rapport d'activité","valider"],["Note de service","creer"],["Note de service","signer"]],
      inter: [["POS-PR-DIRCAB","rapporte_a","Rend compte au Directeur de Cabinet"],["POS-PR-CHEFSRV","supervise","Supervise le Chef de Service"]],
      kpi: [["Taux d'exécution budgétaire","90","%"],["Taux de réalisation des objectifs","85","%"]],
      wf: [["validation_rapport_direction","Rédaction","initiateur"],["validation_rapport_direction","Validation Cabinet","valideur"]]
    },
    "POS-PR-CHEFSRV": {
      resp: ["Exécuter les tâches opérationnelles du Service","Encadrer les agents du Service","Assurer le suivi quotidien des dossiers","Rendre compte à la Direction"],
      droits: [["dossiers_service","ecriture","unite"],["agents_service","lecture","unite"]],
      menus: ["Tableau de bord","Dossiers","Agents"],
      docs: [["Dossier courant","creer"],["Dossier courant","consulter"],["Compte rendu hebdomadaire","creer"]],
      inter: [["POS-PR-DIRDIR","rapporte_a","Rend compte au Directeur de Direction"]],
      kpi: [["Taux de traitement des dossiers","90","%"],["Délai moyen de traitement","5","jours"]],
      wf: [["traitement_dossier_service","Réception","initiateur"],["traitement_dossier_service","Traitement","initiateur"],["traitement_dossier_service","Clôture","valideur"]]
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

  console.log("OK: 4 postes crees avec 7 dimensions completes (Directeur Maison Civile, Responsable Cellule Technique, Directeur de Direction, Chef de Service)");
}

main().catch(err => { console.error(err); process.exit(1); });
