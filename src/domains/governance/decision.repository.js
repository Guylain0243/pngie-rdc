// src/domains/governance/decision.repository.js
// Requetes SQL uniquement, aucune logique metier. Meme patron que
// journal.repository.js, avec une difference importante : decision_gouvernementale
// et decision_action n'ont PAS de RLS (contrairement a acte_officiel) -- tout
// filtrage par institution est explicite ici, pas delegue a PostgreSQL.
const db = require("../../db");

async function possedePermission(personneId, entite, action) {
  const ligne = await db.get(
    `SELECT 1
     FROM personne_role pr
     JOIN permission p ON p.role_id = pr.role_id
     WHERE pr.personne_id = ?
       AND LOWER(pr.statut) = 'actif'
       AND p.entite = ?
       AND p.action = ?
       AND LOWER(p.statut) = 'actif'
     LIMIT 1`,
    [personneId, entite, action]
  );
  return !!ligne;
}

async function obtenirTransition(statutOrigine, statutCible) {
  return db.get(
    `SELECT * FROM decision_workflow_transition WHERE statut_origine = ? AND statut_cible = ?`,
    [statutOrigine, statutCible]
  );
}

async function creerDecision(tx, { emetteurInstitutionId, titre, description, dateEmission, dateEcheance, creePar }) {
  return tx.get(
    `INSERT INTO decision_gouvernementale
       (emetteur_institution_id, titre, description, date_emission, statut, cree_par)
     VALUES (?, ?, ?, ?, 'EN_COURS', ?)
     RETURNING *`,
    [emetteurInstitutionId, titre, description || null, dateEmission, creePar]
  );
}

async function creerAction(tx, { decisionId, institutionId, dateEcheance }) {
  return tx.get(
    `INSERT INTO decision_action (action_id, decision_id, institution_id, statut, taux_execution, date_echeance)
     VALUES (gen_random_uuid(), ?, ?, 'NON_DEMARREE', 0, ?)
     RETURNING *`,
    [decisionId, institutionId, dateEcheance || null]
  );
}

async function obtenirDecisionParId(id) {
  return db.get(`SELECT * FROM decision_gouvernementale WHERE decision_id = ?`, [id]);
}

async function obtenirActionsDeDecision(decisionId) {
  return db.all(
    `SELECT da.*, i.nom AS institution_nom FROM decision_action da
     JOIN institution i ON i.institution_id = da.institution_id
     WHERE da.decision_id = ? ORDER BY i.nom`,
    [decisionId]
  );
}

// Liste avec filtrage explicite par perimetre. `institutionsVisibles` : liste
// d'UUID (portee du role, deja resolue par le service). `institutionsVisibles
// === null` signifie portee nationale illimitee (role.lecture_nationale ou PR).
// `statutsAutorises` : restreint les statuts visibles (ex. AN/SN -> ['PUBLIEE'] uniquement).
async function listerDecisions({ institutionsVisibles, statutsAutorises, limit = 50, offset = 0 }) {
  const conditions = [];
  const params = [];

  if (institutionsVisibles !== null) {
    if (institutionsVisibles.length === 0) return [];
    conditions.push(`emetteur_institution_id IN (${institutionsVisibles.map(() => "?").join(",")})`);
    params.push(...institutionsVisibles);
  }
  if (statutsAutorises) {
    conditions.push(`statut IN (${statutsAutorises.map(() => "?").join(",")})`);
    params.push(...statutsAutorises);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(limit, offset);
  return db.all(
    `SELECT * FROM decision_gouvernementale ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );
}

async function modifierDecision(id, { titre, description, dateEcheance }) {
  const champs = [];
  const params = [];
  if (titre !== undefined) { champs.push("titre = ?"); params.push(titre); }
  if (description !== undefined) { champs.push("description = ?"); params.push(description); }
  if (dateEcheance !== undefined) { champs.push("date_echeance = ?"); params.push(dateEcheance); }
  if (champs.length === 0) return obtenirDecisionParId(id);
  params.push(id);
  return db.get(
    `UPDATE decision_gouvernementale SET ${champs.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE decision_id = ? RETURNING *`,
    params
  );
}

async function changerStatut(tx, id, nouveauStatut, { publiePar, archivePar } = {}) {
  if (nouveauStatut === "PUBLIEE") {
    return tx.get(
      `UPDATE decision_gouvernementale
       SET statut = ?, date_publication = CURRENT_TIMESTAMP, publie_par = ?, updated_at = CURRENT_TIMESTAMP
       WHERE decision_id = ? RETURNING *`,
      [nouveauStatut, publiePar, id]
    );
  }
  if (nouveauStatut === "ARCHIVEE") {
    return tx.get(
      `UPDATE decision_gouvernementale
       SET statut = ?, date_archivage = CURRENT_TIMESTAMP, archive_par = ?, updated_at = CURRENT_TIMESTAMP
       WHERE decision_id = ? RETURNING *`,
      [nouveauStatut, archivePar, id]
    );
  }
  return tx.get(
    `UPDATE decision_gouvernementale SET statut = ?, updated_at = CURRENT_TIMESTAMP
     WHERE decision_id = ? RETURNING *`,
    [nouveauStatut, id]
  );
}

async function modifierAction(id, { statut, tauxExecution, commentaire }) {
  return db.get(
    `UPDATE decision_action SET statut = ?, taux_execution = ?, commentaire = ?, updated_at = CURRENT_TIMESTAMP
     WHERE action_id = ? RETURNING *`,
    [statut, tauxExecution, commentaire || null, id]
  );
}

async function obtenirActionParId(id) {
  return db.get(`SELECT * FROM decision_action WHERE action_id = ?`, [id]);
}

async function obtenirStatistiquesDecision(decisionId) {
  return db.get(
    `SELECT COUNT(*) AS total, AVG(taux_execution)::int AS taux_moyen,
            SUM(CASE WHEN statut = 'TERMINEE' THEN 1 ELSE 0 END) AS terminees,
            SUM(CASE WHEN statut = 'BLOQUEE' THEN 1 ELSE 0 END) AS bloquees
     FROM decision_action WHERE decision_id = ?`,
    [decisionId]
  );
}

module.exports = {
  possedePermission,
  obtenirTransition,
  creerDecision,
  creerAction,
  obtenirDecisionParId,
  obtenirActionsDeDecision,
  listerDecisions,
  modifierDecision,
  changerStatut,
  modifierAction,
  obtenirActionParId,
  obtenirStatistiquesDecision,
};
