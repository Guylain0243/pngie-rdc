// src/domains/journal/journal.controller.js
const { sendSuccess, sendError, ERROR_CODES } = require("../../lib/errors");
const service = require("./journal.service");
const validators = require("./journal.validators");

function contexteDepuisRequete(req) {
  return { personneId: req.user.sub };
}

function gererErreur(res, e) {
  if (e instanceof service.ErreurMetier) {
    return sendError(res, e.code, e.message, e.details);
  }
  console.error("[journal.controller] erreur non geree :", e);
  return sendError(res, ERROR_CODES.INTERNAL_ERROR, "Une erreur interne est survenue.");
}

async function creer(req, res) {
  const erreurs = validators.validerCreationActe(req.body);
  if (erreurs.length) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Donnees invalides.", erreurs);
  try {
    const acte = await service.creerActe(req.body, contexteDepuisRequete(req));
    return sendSuccess(res, acte, 201);
  } catch (e) { return gererErreur(res, e); }
}

async function lister(req, res) {
  try {
    const acte = await service.listerActes({
      statut: req.query.statut, diffusion: req.query.diffusion,
      typeActeId: req.query.typeActeId ? Number(req.query.typeActeId) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    });
    return sendSuccess(res, acte);
  } catch (e) { return gererErreur(res, e); }
}

async function obtenir(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  try {
    const acte = await service.obtenirActe(req.params.id);
    return sendSuccess(res, acte);
  } catch (e) { return gererErreur(res, e); }
}

async function modifier(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  const erreurs = validators.validerModificationActe(req.body);
  if (erreurs.length) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Donnees invalides.", erreurs);
  try {
    const acte = await service.modifierActe(req.params.id, req.body, contexteDepuisRequete(req));
    return sendSuccess(res, acte);
  } catch (e) { return gererErreur(res, e); }
}

function transitionVers(statutCible) {
  return async function (req, res) {
    if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
    try {
      const acte = await service.transitionner(req.params.id, statutCible, contexteDepuisRequete(req));
      return sendSuccess(res, acte);
    } catch (e) { return gererErreur(res, e); }
  };
}

async function signer(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  const erreurs = validators.validerSignature(req.body);
  if (erreurs.length) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Donnees invalides.", erreurs);
  try {
    const acte = await service.signerActe(req.params.id, req.body, contexteDepuisRequete(req));
    return sendSuccess(res, acte);
  } catch (e) { return gererErreur(res, e); }
}

async function diffusion(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  const erreurs = validators.validerDiffusion(req.body);
  if (erreurs.length) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Donnees invalides.", erreurs);
  try {
    const acte = await service.changerDiffusion(req.params.id, req.body.diffusion, contexteDepuisRequete(req));
    return sendSuccess(res, acte);
  } catch (e) { return gererErreur(res, e); }
}

async function historique(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  try {
    const h = await service.obtenirHistorique(req.params.id);
    return sendSuccess(res, h);
  } catch (e) { return gererErreur(res, e); }
}

async function types(req, res) {
  try {
    const t = await service.listerTypesActe();
    return sendSuccess(res, t);
  } catch (e) { return gererErreur(res, e); }
}

async function rechercher(req, res) {
  try {
    const resultats = await service.rechercherActes(req.query.q);
    return sendSuccess(res, resultats);
  } catch (e) { return gererErreur(res, e); }
}

module.exports = {
  creer, lister, obtenir, modifier, transitionVers, signer, diffusion, historique, types, rechercher,
};