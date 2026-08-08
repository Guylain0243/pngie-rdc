// src/domains/journal/journal.validators.js
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIFFUSIONS_VALIDES = ["public", "restreint", "confidentiel"];

function estUuid(v) { return typeof v === "string" && UUID_RE.test(v); }

function validerCreationActe(body) {
  const erreurs = [];
  if (!body.typeActeId || typeof body.typeActeId !== "number") erreurs.push("typeActeId requis (nombre).");
  if (!estUuid(body.institutionEmettriceId)) erreurs.push("institutionEmettriceId requis (UUID valide).");
  if (!body.titre || typeof body.titre !== "string" || body.titre.trim().length < 3) {
    erreurs.push("titre requis (3 caracteres minimum).");
  }
  return erreurs;
}

function validerModificationActe(body) {
  const erreurs = [];
  if (body.titre !== undefined && (typeof body.titre !== "string" || body.titre.trim().length < 3)) {
    erreurs.push("titre invalide (3 caracteres minimum).");
  }
  return erreurs;
}

function validerDiffusion(body) {
  const erreurs = [];
  if (!DIFFUSIONS_VALIDES.includes(body.diffusion)) {
    erreurs.push(`diffusion doit etre l'une de : ${DIFFUSIONS_VALIDES.join(", ")}.`);
  }
  return erreurs;
}

function validerSignature(body) {
  const erreurs = [];
  if (!body.hashDocument || typeof body.hashDocument !== "string") {
    erreurs.push("hashDocument requis.");
  }
  return erreurs;
}

module.exports = { estUuid, validerCreationActe, validerModificationActe, validerDiffusion, validerSignature };