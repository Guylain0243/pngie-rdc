// src/domains/governance/decision.controller.js
const { sendSuccess, sendError, ERROR_CODES } = require("../../lib/errors");
const service = require("./decision.service");
const validators = require("./decision.validators");

function contexteDepuisRequete(req) {
  return {
    personneId: req.user.sub,
    roleCode: (req.user.roles && req.user.roles[0]) || null,
    institutionId: req.scope ? req.scope.institutionId : null,
    institutionsVisibles: req.scope ? req.scope.institutionsVisibles : [],
    lectureNationale: req.scope ? !!req.scope.lectureNationale : false,
  };
}

function gererErreur(res, e) {
  if (e instanceof service.ErreurMetier) {
    return sendError(res, e.code, e.message, e.details);
  }
  console.error("[decision.controller] erreur non geree :", e);
  return sendError(res, ERROR_CODES.INTERNAL_ERROR, "Une erreur interne est survenue.");
}

async function creer(req, res) {
  const erreurs = validators.validerCreationDecision(req.body);
  if (erreurs.length) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Donnees invalides.", erreurs);
  try {
    const decision = await service.creerDecision(req.body, contexteDepuisRequete(req));
    return sendSuccess(res, decision, 201);
  } catch (e) { return gererErreur(res, e); }
}

async function lister(req, res) {
  try {
    const decisions = await service.listerDecisions({
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    }, contexteDepuisRequete(req));
    return sendSuccess(res, decisions);
  } catch (e) { return gererErreur(res, e); }
}

async function obtenir(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  try {
    const decision = await service.obtenirDecision(req.params.id, contexteDepuisRequete(req));
    return sendSuccess(res, decision);
  } catch (e) { return gererErreur(res, e); }
}

async function modifier(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  const erreurs = validators.validerModificationDecision(req.body);
  if (erreurs.length) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Donnees invalides.", erreurs);
  try {
    const decision = await service.modifierDecision(req.params.id, req.body, contexteDepuisRequete(req));
    return sendSuccess(res, decision);
  } catch (e) { return gererErreur(res, e); }
}

function transitionVers(statutCible) {
  return async function (req, res) {
    if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
    try {
      const decision = await service.transitionner(req.params.id, statutCible, contexteDepuisRequete(req));
      return sendSuccess(res, decision);
    } catch (e) { return gererErreur(res, e); }
  };
}

async function tableauBord(req, res) {
  if (!validators.estUuid(req.params.id)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "id invalide.");
  try {
    const resultat = await service.obtenirTableauBord(req.params.id, contexteDepuisRequete(req));
    return sendSuccess(res, resultat);
  } catch (e) { return gererErreur(res, e); }
}

async function modifierAction(req, res) {
  if (!validators.estUuid(req.params.actionId)) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "actionId invalide.");
  const erreurs = validators.validerMiseAJourAction(req.body);
  if (erreurs.length) return sendError(res, ERROR_CODES.VALIDATION_ERROR, "Donnees invalides.", erreurs);
  try {
    const action = await service.modifierAction(req.params.actionId, req.body, contexteDepuisRequete(req));
    return sendSuccess(res, action);
  } catch (e) { return gererErreur(res, e); }
}

module.exports = {
  contexteDepuisRequete,
  creer, lister, obtenir, modifier, transitionVers, tableauBord, modifierAction,
};
