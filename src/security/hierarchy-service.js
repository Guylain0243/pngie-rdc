// src/security/hierarchy-service.js
// Calcule les institutions visibles depuis une institution donnee.
// TUTELLE : se propage recursivement (un enfant de mon enfant m est visible).
// RATTACHEMENT_CONSTITUTIONNEL : ne se propage PAS. Seule l institution
// directement liee en source voit l institution rattachee - pas d heritage
// de subordination, conformement a l independance fonctionnelle de ces organes.
const db = require("../db");

async function getInstitutionsDescendantes(institutionId) {
  if (!institutionId) return [];

  const tutelle = await db.all(`
    WITH RECURSIVE descendants AS (
      SELECT institution_id FROM institution WHERE institution_id = ?
      UNION
      SELECT ir.institution_cible_id
      FROM institution_relation ir
      JOIN descendants d ON d.institution_id = ir.institution_source_id
      WHERE ir.type_relation = 'TUTELLE' AND ir.actif = TRUE
    )
    SELECT institution_id FROM descendants
  `, [institutionId]);

  const rattachements = await db.all(`
    SELECT institution_cible_id AS institution_id
    FROM institution_relation
    WHERE institution_source_id = ? AND type_relation = 'RATTACHEMENT_CONSTITUTIONNEL' AND actif = TRUE
  `, [institutionId]);

  const ensemble = new Set([...tutelle.map(r => r.institution_id), ...rattachements.map(r => r.institution_id)]);
  return [...ensemble];
}

module.exports = { getInstitutionsDescendantes };
