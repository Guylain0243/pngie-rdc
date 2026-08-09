// src/domains/governance/cockpit.controller.js
const { sendSuccess, sendError, ERROR_CODES } = require("../../lib/errors");
const service = require("./cockpit.service");
const { contexteDepuisRequete } = require("./decision.controller");
const decisionService = require("./decision.service");

function gererErreur(res, e) {
  if (e instanceof decisionService.ErreurMetier) {
    return sendError(res, e.code, e.message, e.details);
  }
  console.error("[cockpit.controller] erreur non geree :", e);
  return sendError(res, ERROR_CODES.INTERNAL_ERROR, "Une erreur interne est survenue.");
}

async function indicateurs(req, res) {
  try {
    const resultat = await service.obtenirIndicateurs(contexteDepuisRequete(req));
    return sendSuccess(res, resultat);
  } catch (e) { return gererErreur(res, e); }
}

async function syntheseNationale(req, res) {
  try {
    const resultat = await service.obtenirSyntheseNationale(contexteDepuisRequete(req));
    return sendSuccess(res, resultat);
  } catch (e) { return gererErreur(res, e); }
}

module.exports = { indicateurs, syntheseNationale };
