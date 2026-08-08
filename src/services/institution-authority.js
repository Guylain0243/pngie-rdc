// ════════════════════════════════════════════════════════════════
// PNGIE-RDC — Service d'autorité institutionnelle
// Patron "PNGIE Secure API v1" — bloc C
//
// Résout la chaîne : personne_id -> affectation active -> poste ->
// unité organisationnelle -> institution (autorité DIRECTE),
// puis vérifie les délégations normalisées dans delegation_perimetre
// (autorité DÉLÉGUÉE). Le champ delegation_pouvoir.perimetre (texte
// libre) n'est jamais parsé : seule delegation_perimetre fait foi.
//
// Principe non négociable : un institution_id envoyé par le client
// n'est jamais une preuve d'autorité. Ce module est la seule source
// de vérité pour savoir si une personne peut agir au nom d'une
// institution donnée.
//
// Usage :
//   const { estAutoriseSurInstitution, getInstitutionsAutorisees } = require('../services/institution-authority');
//   const ok = await estAutoriseSurInstitution(req.user.sub, institutionId, 'rni_instruction', 'CREATE');
// ════════════════════════════════════════════════════════════════
const db = require('../db');

// ─── Autorité directe : affectation active de la personne ───
// "Active" = statut ACTIF + titulaire + pas de date de fin (voir
// l'index unique partiel uq_affectation_poste_active en base).
async function getInstitutionDirecte(personId) {
  if (!personId) return null;
  const row = await db.get(
    `SELECT u.institution_id
     FROM affectation a
     JOIN poste p ON p.poste_id = a.poste_id
     JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
     WHERE a.personne_id = ?
       AND a.statut = 'ACTIF'
       AND a.type_affectation = 'TITULAIRE'
       AND a.date_fin IS NULL`,
    [personId]
  );
  return row ? row.institution_id : null;
}

// ─── Autorité déléguée : delegation_pouvoir + delegation_perimetre ───
// Une délégation est active si :
//   - la personne est bien la délégataire (pas la délégante)
//   - la délégation elle-même est ACTIF et dans sa fenêtre de dates
//   - delegation_perimetre couvre explicitement (institution, entity, action)
async function getInstitutionsDeleguees(personId, entity, action) {
  if (!personId) return [];
  const now = new Date().toISOString();
  const rows = await db.all(
    `SELECT dp.institution_id
     FROM delegation_pouvoir d
     JOIN delegation_perimetre dp ON dp.delegation_id = d.delegation_id
     WHERE d.delegataire_id = ?
       AND d.statut = 'ACTIF'
       AND d.date_debut <= ?
       AND (d.date_fin IS NULL OR d.date_fin >= ?)
       AND dp.entity = ?
       AND dp.action = ?
       AND dp.actif = true`,
    [personId, now, now, entity, action]
  );
  return rows.map(r => r.institution_id);
}

// ─── API publique 1 : liste de toutes les institutions autorisées ───
// (directe + déléguées), sans doublon.
async function getInstitutionsAutorisees(personId, entity, action) {
  const directe = await getInstitutionDirecte(personId);
  const deleguees = await getInstitutionsDeleguees(personId, entity, action);
  const toutes = new Set(deleguees);
  if (directe) toutes.add(directe);
  return Array.from(toutes);
}

// ─── API publique 2 : la personne peut-elle agir sur CETTE institution précise ? ───
async function estAutoriseSurInstitution(personId, institutionId, entity, action) {
  if (!personId || !institutionId) return false;
  const autorisees = await getInstitutionsAutorisees(personId, entity, action);
  return autorisees.includes(institutionId);
}

module.exports = { estAutoriseSurInstitution, getInstitutionsAutorisees };
