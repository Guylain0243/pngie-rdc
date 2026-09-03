// src/domains/journal/journal.repository.js
const db = require("../../db");

async function listerTypesActe() {
  return db.all(
    `SELECT id, code, libelle, ordre_affichage FROM type_acte_ref WHERE actif = true ORDER BY ordre_affichage`
  );
}

async function obtenirTypeActeParId(id) {
  return db.get(`SELECT id, code, libelle FROM type_acte_ref WHERE id = ?`, [id]);
}

async function obtenirTransition(typeActeId, statutOrigine, statutCible) {
  return db.get(
    `SELECT * FROM acte_workflow_transition
     WHERE type_acte_id = ? AND statut_origine = ? AND statut_cible = ?`,
    [typeActeId, statutOrigine, statutCible]
  );
}

async function creerActe(tx, { typeActeId, institutionEmettriceId, titre, resume, contenuTexte, creePar }) {
  return tx.get(
    `INSERT INTO acte_officiel
       (type_acte_id, institution_emettrice_id, titre, resume, contenu_texte, statut, diffusion, cree_par)
     VALUES (?, ?, ?, ?, ?, 'brouillon', 'restreint', ?)
     RETURNING *`,
    [typeActeId, institutionEmettriceId, titre, resume || null, contenuTexte || null, creePar]
  );
}

async function obtenirActeParId(id) {
  return db.get(`SELECT * FROM acte_officiel WHERE id = ?`, [id]);
}

async function listerActes({ statut, diffusion, typeActeId, limit = 50, offset = 0 }) {
  const conditions = [];
  const params = [];
  if (statut) { conditions.push("statut = ?"); params.push(statut); }
  if (diffusion) { conditions.push("diffusion = ?"); params.push(diffusion); }
  if (typeActeId) { conditions.push("type_acte_id = ?"); params.push(typeActeId); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(limit, offset);
  return db.all(
    `SELECT * FROM acte_officiel ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    params
  );
}

async function modifierActeBrouillon(id, { titre, resume, contenuTexte }) {
  return db.get(
    `UPDATE acte_officiel
     SET titre = COALESCE(?, titre),
         resume = COALESCE(?, resume),
         contenu_texte = COALESCE(?, contenu_texte)
     WHERE id = ? AND statut = 'brouillon'
     RETURNING *`,
    [titre || null, resume || null, contenuTexte || null, id]
  );
}

async function changerStatut(tx, id, nouveauStatut) {
  return tx.get(
    `UPDATE acte_officiel SET statut = ? WHERE id = ? RETURNING *`,
    [nouveauStatut, id]
  );
}

async function changerDiffusion(id, diffusion) {
  return db.get(
    `UPDATE acte_officiel SET diffusion = ? WHERE id = ? RETURNING *`,
    [diffusion, id]
  );
}

async function ajouterSignature(tx, { acteId, signataireId, roleSignataire, hashDocument, certificatRef }) {
  console.log('DEBUG ajouterSignature APPELEE avec:', { acteId, signataireId, roleSignataire, hashDocument, certificatRef });
  return tx.get(
    `INSERT INTO acte_signature (acte_id, signataire_id, role_signataire, hash_document, certificat_ref)
     VALUES (?, ?, ?, ?, ?)
     RETURNING *`,
    [acteId, signataireId, roleSignataire || null, hashDocument, certificatRef || null]
  );
}

async function ajouterHistorique(tx, { acteId, typeEvenement, valeurAvant, valeurApres, modifiePar }) {
  const executor = tx || db;
  return executor.run(
    `INSERT INTO acte_historique (acte_id, type_evenement, valeur_avant, valeur_apres, modifie_par)
     VALUES (?, ?, ?, ?, ?)`,
    [acteId, typeEvenement, JSON.stringify(valeurAvant || null), JSON.stringify(valeurApres || null), modifiePar || null]
  );
}

async function obtenirHistorique(acteId) {
  return db.all(
    `SELECT * FROM acte_historique WHERE acte_id = ? ORDER BY created_at DESC`,
    [acteId]
  );
}

async function possedePermission(personneId, action) {
  const ligne = await db.get(
    `SELECT 1
     FROM personne_role pr
     JOIN permission p ON p.role_id = pr.role_id
     WHERE pr.personne_id = ?
       AND LOWER(pr.statut) = 'actif'
       AND p.entite = 'journal'
       AND p.action = ?
       AND LOWER(p.statut) = 'actif'
     LIMIT 1`,
    [personneId, action]
  );
  return !!ligne;
}

async function rechercherActes(texte, { limit = 20 } = {}) {
  return db.all(
    `SELECT id, numero_officiel, titre, resume, statut, diffusion, date_publication,
            ts_rank(recherche_tsv, plainto_tsquery('french', ?)) AS pertinence
     FROM acte_officiel
     WHERE recherche_tsv @@ plainto_tsquery('french', ?)
     ORDER BY pertinence DESC
     LIMIT ?`,
    [texte, texte, limit]
  );
}

module.exports = {
  listerTypesActe, obtenirTypeActeParId, obtenirTransition, creerActe, obtenirActeParId,
  listerActes, modifierActeBrouillon, changerStatut, changerDiffusion, ajouterSignature,
  ajouterHistorique, obtenirHistorique, possedePermission, rechercherActes,
};
