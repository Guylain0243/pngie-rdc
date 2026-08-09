// src/domains/governance/cockpit.service.js
const decisionRepo = require("./decision.repository");
const decisionService = require("./decision.service");
const cockpitRepo = require("./cockpit.repository");
const { ERROR_CODES } = require("../../lib/errors");

async function verifierAccesCockpit(ctx) {
  // Le Cockpit lit les memes donnees que decision.*, donc s'appuie sur la
  // meme permission READ plutot que d'en inventer une nouvelle.
  const autorise = await decisionRepo.possedePermission(ctx.personneId, "decision_gouvernementale", "READ");
  if (!autorise) {
    throw new decisionService.ErreurMetier(ERROR_CODES.FORBIDDEN, "Permission refusee : acces au Cockpit.");
  }
}

async function obtenirIndicateurs(ctx) {
  await verifierAccesCockpit(ctx);
  const filtres = decisionService.resoudreFiltresListe(ctx);

  const [parStatut, enRetard, repartition, actesPublies] = await Promise.all([
    cockpitRepo.compterDecisionsParStatut(filtres),
    cockpitRepo.compterDecisionsEnRetard(filtres),
    cockpitRepo.repartitionParInstitution(filtres),
    cockpitRepo.compterActesPublies({}),
  ]);

  const total = parStatut.reduce((acc, r) => acc + Number(r.total), 0);

  return {
    total_decisions: total,
    par_statut: parStatut,
    decisions_en_retard: enRetard,
    repartition_par_institution: repartition,
    actes_publies_journal: actesPublies,
  };
}

async function obtenirSyntheseNationale(ctx) {
  // Reservee a PR/PM/Analyste Cockpit (verification RBAC deja faite via
  // verifierAccesCockpit -- READ sur decision_gouvernementale ; le perimetre
  // resoudreFiltresListe fait le reste : AN/SN ne verront que les PUBLIEE,
  // MI/GV seront restreints a leur propre institution -- ce n'est pas une
  // "synthese nationale" pour eux a proprement parler, mais l'API reste
  // coherente avec leur perimetre plutot que de dupliquer une verification
  // de role en plus de la portee).
  return obtenirIndicateurs(ctx);
}

module.exports = {
  obtenirIndicateurs,
  obtenirSyntheseNationale,
};
