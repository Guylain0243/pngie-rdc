// src/domains/governance/cockpit.repository.js
// Requetes d'agregation uniquement. Le Cockpit ne possede aucune donnee : il
// lit decision_gouvernementale/decision_action (et plus tard d'autres domaines)
// et calcule des indicateurs. Reutilise le meme filtrage par perimetre que
// decision.repository.listerDecisions (institutionsVisibles/statutsAutorises).
const db = require("../../db");

function clauseInstitutions(institutionsVisibles, params) {
  if (institutionsVisibles === null) return "";
  if (institutionsVisibles.length === 0) return "AND FALSE"; // aucun perimetre -> aucune ligne
  params.push(...institutionsVisibles);
  return `AND emetteur_institution_id IN (${institutionsVisibles.map(() => "?").join(",")})`;
}

async function compterDecisionsParStatut({ institutionsVisibles, statutsAutorises }) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  return db.all(
    `SELECT statut, COUNT(*) AS total FROM decision_gouvernementale
     WHERE TRUE ${clauseInst} ${clauseStatuts}
     GROUP BY statut`,
    params
  );
}

async function compterDecisionsEnRetard({ institutionsVisibles, statutsAutorises }) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  const row = await db.get(
    `SELECT COUNT(*) AS total FROM decision_gouvernementale d
     WHERE d.statut NOT IN ('ARCHIVEE', 'ANNULEE')
       AND EXISTS (
         SELECT 1 FROM decision_action da
         WHERE da.decision_id = d.decision_id
           AND da.date_echeance IS NOT NULL
           AND da.date_echeance < CURRENT_DATE
           AND da.statut <> 'TERMINEE'
       )
       ${clauseInst.replace("emetteur_institution_id", "d.emetteur_institution_id")}
       ${clauseStatuts.replace("statut", "d.statut")}`,
    params
  );
  return row ? row.total : 0;
}

async function repartitionParInstitution({ institutionsVisibles, statutsAutorises }) {
  const params = [];
  const clauseInst = clauseInstitutions(institutionsVisibles, params);
  let clauseStatuts = "";
  if (statutsAutorises) {
    clauseStatuts = `AND statut IN (${statutsAutorises.map(() => "?").join(",")})`;
    params.push(...statutsAutorises);
  }
  return db.all(
    `SELECT i.nom AS institution_nom, COUNT(*) AS total
     FROM decision_gouvernementale d
     JOIN institution i ON i.institution_id = d.emetteur_institution_id
     WHERE TRUE ${clauseInst} ${clauseStatuts}
     GROUP BY i.nom
     ORDER BY total DESC`,
    params
  );
}

async function compterActesPublies({ depuis }) {
  // Le Journal National a sa propre RLS (pol_acte_officiel_scope) -- ici on ne
  // fait que compter, la visibilite est deja assuree par PostgreSQL au niveau
  // de la session de l'utilisateur connecte (contrairement a decision_gouvernementale).
  const params = [];
  let clauseDate = "";
  if (depuis) { clauseDate = "AND date_publication >= ?"; params.push(depuis); }
  const row = await db.get(
    `SELECT COUNT(*) AS total FROM acte_officiel WHERE statut = 'publie' ${clauseDate}`,
    params
  );
  return row ? row.total : 0;
}

module.exports = {
  compterDecisionsParStatut,
  compterDecisionsEnRetard,
  repartitionParInstitution,
  compterActesPublies,
};
