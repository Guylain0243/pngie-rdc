// src/domains/journal/journal.service.js
const db = require("../../db");
const repo = require("./journal.repository");
const audit = require("../../lib/audit");
const { ERROR_CODES } = require("../../lib/errors");

class ErreurMetier extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function verifierPermission(personneId, action) {
  const autorise = await repo.possedePermission(personneId, action);
  if (!autorise) {
    throw new ErreurMetier(ERROR_CODES.FORBIDDEN, `Permission refusee : journal.${action}`);
  }
}

async function creerActe({ typeActeId, institutionEmettriceId, titre, resume, contenuTexte }, ctx) {
  await verifierPermission(ctx.personneId, "creer");

  const typeActe = await repo.obtenirTypeActeParId(typeActeId);
  if (!typeActe) throw new ErreurMetier(ERROR_CODES.VALIDATION_ERROR, "Type d'acte inconnu.");

  const acte = await db.transaction(async (tx) => {
    const a = await repo.creerActe(tx, {
      typeActeId, institutionEmettriceId, titre, resume, contenuTexte, creePar: ctx.personneId,
    });
    await repo.ajouterHistorique(tx, {
      acteId: a.id, typeEvenement: "CREATION", valeurApres: { statut: a.statut }, modifiePar: ctx.personneId,
    });
    return a;
  });

  await audit(ctx.personneId, "CREATION", "acte_officiel", acte.id, { titre });
  return acte;
}

async function obtenirActe(id) {
  const acte = await repo.obtenirActeParId(id);
  if (!acte) throw new ErreurMetier(ERROR_CODES.NOT_FOUND, "Acte introuvable.");
  return acte;
}

async function listerActes(filtres) {
  return repo.listerActes(filtres);
}

async function modifierActe(id, champs, ctx) {
  await verifierPermission(ctx.personneId, "modifier");
  const acte = await obtenirActe(id);
  if (acte.statut !== "brouillon") {
    throw new ErreurMetier(ERROR_CODES.CONFLICT, "Seul un acte en brouillon peut etre modifie.");
  }
  const maj = await repo.modifierActeBrouillon(id, champs);
  await audit(ctx.personneId, "MODIFICATION", "acte_officiel", id, champs);
  return maj;
}

async function transitionner(id, statutCible, ctx) {
  const acte = await obtenirActe(id);

  const transition = await repo.obtenirTransition(acte.type_acte_id, acte.statut, statutCible);
  if (!transition) {
    throw new ErreurMetier(
      ERROR_CODES.CONFLICT,
      `Transition non autorisee : ${acte.statut} -> ${statutCible} pour ce type d'acte.`
    );
  }

  const actionRequise = transition.permission_requise.replace("journal.", "");
  await verifierPermission(ctx.personneId, actionRequise);

  let acteMaj;
  try {
    acteMaj = await db.transaction(async (tx) => {
      const a = await repo.changerStatut(tx, id, statutCible);
      await repo.ajouterHistorique(tx, {
        acteId: id, typeEvenement: "CHANGEMENT_STATUT",
        valeurAvant: { statut: acte.statut }, valeurApres: { statut: statutCible },
        modifiePar: ctx.personneId,
      });
      return a;
    });
  } catch (e) {
    if (e.message && e.message.includes("Publication refusee")) {
      throw new ErreurMetier(ERROR_CODES.CONFLICT, e.message);
    }
    throw e;
  }

  await audit(ctx.personneId, "CHANGEMENT_STATUT", "acte_officiel", id, { de: acte.statut, vers: statutCible });
  return acteMaj;
}

async function signerActe(id, { hashDocument, certificatRef, roleSignataire }, ctx) {
  await verifierPermission(ctx.personneId, "signer");
  await obtenirActe(id);

  await db.transaction(async (tx) => {
    await repo.ajouterSignature(tx, {
      acteId: id, signataireId: ctx.personneId, roleSignataire, hashDocument, certificatRef,
    });
  });
  await audit(ctx.personneId, "SIGNATURE", "acte_signature", id, { roleSignataire });

  return transitionner(id, "signe", ctx);
}

async function changerDiffusion(id, diffusion, ctx) {
  await verifierPermission(ctx.personneId, "gerer_diffusion");
  const acte = await obtenirActe(id);
  const maj = await repo.changerDiffusion(id, diffusion);
  await repo.ajouterHistorique(null, {
    acteId: id, typeEvenement: "CHANGEMENT_DIFFUSION",
    valeurAvant: { diffusion: acte.diffusion }, valeurApres: { diffusion },
    modifiePar: ctx.personneId,
  });
  await audit(ctx.personneId, "CHANGEMENT_DIFFUSION", "acte_officiel", id, { de: acte.diffusion, vers: diffusion });
  return maj;
}

async function obtenirHistorique(id) {
  await obtenirActe(id);
  return repo.obtenirHistorique(id);
}

async function listerTypesActe() {
  return repo.listerTypesActe();
}

async function rechercherActes(q) {
  if (!q || q.trim().length < 2) {
    throw new ErreurMetier(ERROR_CODES.VALIDATION_ERROR, "Recherche trop courte (2 caracteres minimum).");
  }
  return repo.rechercherActes(q.trim());
}

module.exports = {
  ErreurMetier, creerActe, obtenirActe, listerActes, modifierActe, transitionner,
  signerActe, changerDiffusion, obtenirHistorique, listerTypesActe, rechercherActes,
};