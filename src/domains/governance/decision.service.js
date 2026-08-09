// src/domains/governance/decision.service.js
const db = require("../../db");
const repo = require("./decision.repository");
const audit = require("../../lib/audit");
const { ERROR_CODES } = require("../../lib/errors");

class ErreurMetier extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function verifierPermission(personneId, entite, action) {
  const autorise = await repo.possedePermission(personneId, entite, action);
  if (!autorise) {
    throw new ErreurMetier(ERROR_CODES.FORBIDDEN, `Permission refusee : ${entite}.${action}`);
  }
}

// --- Decisions gouvernementales -------------------------------------------

async function creerDecision({ emetteurInstitutionId, titre, description, dateEmission, dateEcheance, institutionsConcernees }, ctx) {
  await verifierPermission(ctx.personneId, "decision_gouvernementale", "CREATE");

  const decision = await db.transaction(async (tx) => {
    const d = await repo.creerDecision(tx, {
      emetteurInstitutionId, titre, description, dateEmission, creePar: ctx.personneId,
    });
    for (const institutionId of institutionsConcernees) {
      await repo.creerAction(tx, { decisionId: d.decision_id, institutionId, dateEcheance });
    }
    return d;
  });

  await audit(ctx.personneId, "CREATION", "decision_gouvernementale", decision.decision_id, { titre });
  return decision;
}

// Determine, pour un role donne, comment filtrer la liste des decisions.
// AN/SN : vision nationale mais uniquement les decisions PUBLIEE (Q1, separation
// des pouvoirs) -- jamais filtre par institution.
// Analyste Cockpit / lecture nationale : aucun filtre (vision complete).
// PR/PM/MI/GV : filtre par institutionsVisibles (Graphe 2, deja resolu par
// scope-engine.js), tous statuts visibles dans leur perimetre.
function resoudreFiltresListe(ctx) {
  if (ctx.roleCode === "AN" || ctx.roleCode === "SN") {
    return { institutionsVisibles: null, statutsAutorises: ["PUBLIEE"] };
  }
  if (ctx.lectureNationale) {
    return { institutionsVisibles: null, statutsAutorises: null };
  }
  return { institutionsVisibles: ctx.institutionsVisibles, statutsAutorises: null };
}

async function listerDecisions(filtres, ctx) {
  await verifierPermission(ctx.personneId, "decision_gouvernementale", "READ");
  const { institutionsVisibles, statutsAutorises } = resoudreFiltresListe(ctx);
  return repo.listerDecisions({
    institutionsVisibles,
    statutsAutorises,
    limit: filtres.limit,
    offset: filtres.offset,
  });
}

// Verifie qu'une decision precise est bien dans le perimetre de lecture du
// role connecte (meme logique que resoudreFiltresListe, appliquee a un objet
// deja charge plutot qu'a une clause SQL).
function estVisiblePour(decision, ctx) {
  if (ctx.roleCode === "AN" || ctx.roleCode === "SN") {
    return decision.statut === "PUBLIEE";
  }
  if (ctx.lectureNationale) return true;
  return (ctx.institutionsVisibles || []).includes(decision.emetteur_institution_id);
}

async function obtenirDecision(id, ctx) {
  await verifierPermission(ctx.personneId, "decision_gouvernementale", "READ");
  const decision = await repo.obtenirDecisionParId(id);
  if (!decision) throw new ErreurMetier(ERROR_CODES.NOT_FOUND, "Decision introuvable.");
  if (!estVisiblePour(decision, ctx)) {
    throw new ErreurMetier(ERROR_CODES.FORBIDDEN_INSTITUTION, "Cette decision est hors de votre perimetre de visibilite.");
  }
  const actions = await repo.obtenirActionsDeDecision(id);
  return { ...decision, actions };
}

async function modifierDecision(id, champs, ctx) {
  await verifierPermission(ctx.personneId, "decision_gouvernementale", "UPDATE");
  const decision = await repo.obtenirDecisionParId(id);
  if (!decision) throw new ErreurMetier(ERROR_CODES.NOT_FOUND, "Decision introuvable.");
  if (!estVisiblePour(decision, ctx)) {
    throw new ErreurMetier(ERROR_CODES.FORBIDDEN_INSTITUTION, "Cette decision est hors de votre perimetre de visibilite.");
  }
  if (decision.statut !== "EN_COURS") {
    throw new ErreurMetier(ERROR_CODES.CONFLICT, "Seule une decision EN_COURS peut etre modifiee.");
  }
  const maj = await repo.modifierDecision(id, champs);
  await audit(ctx.personneId, "MODIFICATION", "decision_gouvernementale", id, champs);
  return maj;
}

// governance.annuler : l'auteur peut annuler sa propre decision ; PR/PM
// peuvent aussi annuler une decision dans leur perimetre hierarchique
// (institutionsVisibles). Decision metier validee le 09/08/2026 -- la table
// permission autorise l'ACTION pour PR/PM/MI/GV, cette verification
// d'appartenance/perimetre est deliberement en plus, en code, car aucune RLS
// ne la fait a la place (cf. COCKPIT_V1_PHASE2_ARCHITECTURE.md).
function peutAnnuler(decision, ctx) {
  if (decision.emetteur_institution_id === ctx.institutionId) return true;
  if ((ctx.roleCode === "PR" || ctx.roleCode === "PM") && (ctx.institutionsVisibles || []).includes(decision.emetteur_institution_id)) {
    return true;
  }
  return false;
}

async function transitionner(id, statutCible, ctx) {
  const decision = await repo.obtenirDecisionParId(id);
  if (!decision) throw new ErreurMetier(ERROR_CODES.NOT_FOUND, "Decision introuvable.");

  const transition = await repo.obtenirTransition(decision.statut, statutCible);
  if (!transition) {
    throw new ErreurMetier(ERROR_CODES.CONFLICT, `Transition non autorisee : ${decision.statut} -> ${statutCible}.`);
  }

  const actionRequise = transition.permission_requise.replace("governance.", "");
  await verifierPermission(ctx.personneId, "decision_gouvernementale", actionRequise);

  if (actionRequise === "annuler" && !peutAnnuler(decision, ctx)) {
    throw new ErreurMetier(
      ERROR_CODES.FORBIDDEN_INSTITUTION,
      "Vous ne pouvez annuler qu'une decision de votre propre institution, ou de votre perimetre hierarchique (PR/PM)."
    );
  }

  const decisionMaj = await db.transaction(async (tx) => {
    return repo.changerStatut(tx, id, statutCible, {
      publiePar: statutCible === "PUBLIEE" ? ctx.personneId : undefined,
      archivePar: statutCible === "ARCHIVEE" ? ctx.personneId : undefined,
    });
  });

  await audit(ctx.personneId, "TRANSITION", "decision_gouvernementale", id, { de: decision.statut, vers: statutCible });
  return decisionMaj;
}

async function obtenirTableauBord(id, ctx) {
  const decision = await obtenirDecision(id, ctx); // reutilise la verification de perimetre
  const stats = await repo.obtenirStatistiquesDecision(id);
  return { decision, stats };
}

// --- Actions (avancement par institution) ----------------------------------

async function modifierAction(actionId, champs, ctx) {
  await verifierPermission(ctx.personneId, "decision_action", "UPDATE");
  const action = await repo.obtenirActionParId(actionId);
  if (!action) throw new ErreurMetier(ERROR_CODES.NOT_FOUND, "Action introuvable.");
  // Une institution ne declare l'avancement que de sa propre action -- PR/PM
  // n'ont que READ sur decision_action (cf. matrice RBAC), donc n'atteignent
  // jamais ce code avec succes ; MI/GV sont restreints a leur propre institution.
  if (action.institution_id !== ctx.institutionId) {
    throw new ErreurMetier(ERROR_CODES.FORBIDDEN_INSTITUTION, "Vous ne pouvez modifier que l'avancement de votre propre institution.");
  }
  const maj = await repo.modifierAction(actionId, champs);
  await audit(ctx.personneId, "MODIFICATION", "decision_action", actionId, champs);
  return maj;
}

module.exports = {
  ErreurMetier,
  creerDecision,
  listerDecisions,
  obtenirDecision,
  modifierDecision,
  transitionner,
  obtenirTableauBord,
  modifierAction,
  // Exportes pour reutilisation par cockpit.service.js (meme regle de portee,
  // cf. COCKPIT_V1_PHASE2_ARCHITECTURE.md - le Cockpit ne reimplemente pas
  // sa propre logique de perimetre, il reutilise celle du domaine).
  resoudreFiltresListe,
};
