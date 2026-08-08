// src/security/scope-resolver.js
// Resout le perimetre institutionnel d une personne :
// personne -> affectation active -> poste -> unite -> institution
const db = require("../db");
const { getInstitutionsDescendantes } = require("./hierarchy-service");

async function resoudreInstitutionPersonne(personneId) {
  const row = await db.get(`
    SELECT u.institution_id
    FROM affectation a
    JOIN poste p ON p.poste_id = a.poste_id
    JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
    WHERE a.personne_id = ? AND a.statut = ? AND a.date_fin IS NULL
    ORDER BY a.date_debut DESC
    LIMIT 1
  `, [personneId, "ACTIF"]);
  return row ? row.institution_id : null;
}

async function resoudrePorteeInstitution(personneId) {
  const institutionId = await resoudreInstitutionPersonne(personneId);
  if (!institutionId) return { institutionId: null, institutionsVisibles: [] };
  const institutionsVisibles = await getInstitutionsDescendantes(institutionId);
  return { institutionId, institutionsVisibles };
}

module.exports = { resoudreInstitutionPersonne, resoudrePorteeInstitution };
