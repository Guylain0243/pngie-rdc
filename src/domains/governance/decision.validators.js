// src/domains/governance/decision.validators.js
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function estUuid(v) { return typeof v === "string" && UUID_RE.test(v); }

function validerCreationDecision(body) {
  const erreurs = [];
  if (!estUuid(body.emetteurInstitutionId)) erreurs.push("emetteurInstitutionId requis (UUID valide).");
  if (!body.titre || typeof body.titre !== "string" || body.titre.trim().length < 3) {
    erreurs.push("titre requis (3 caracteres minimum).");
  }
  if (!body.dateEmission) erreurs.push("dateEmission requise.");
  if (!Array.isArray(body.institutionsConcernees) || body.institutionsConcernees.length === 0) {
    erreurs.push("institutionsConcernees requis (au moins une institution, tableau d'UUID).");
  } else if (body.institutionsConcernees.some((id) => !estUuid(id))) {
    erreurs.push("institutionsConcernees contient un UUID invalide.");
  }
  return erreurs;
}

function validerModificationDecision(body) {
  const erreurs = [];
  if (body.titre !== undefined && (typeof body.titre !== "string" || body.titre.trim().length < 3)) {
    erreurs.push("titre invalide (3 caracteres minimum).");
  }
  return erreurs;
}

const STATUTS_ACTION_VALIDES = ["NON_DEMARREE", "EN_COURS", "TERMINEE", "BLOQUEE"];

function validerMiseAJourAction(body) {
  const erreurs = [];
  if (!STATUTS_ACTION_VALIDES.includes(body.statut)) {
    erreurs.push(`statut doit etre l'un de : ${STATUTS_ACTION_VALIDES.join(", ")}.`);
  }
  if (body.tauxExecution === undefined || typeof body.tauxExecution !== "number" || body.tauxExecution < 0 || body.tauxExecution > 100) {
    erreurs.push("tauxExecution requis (nombre entre 0 et 100).");
  }
  return erreurs;
}

module.exports = {
  estUuid,
  validerCreationDecision,
  validerModificationDecision,
  validerMiseAJourAction,
};
