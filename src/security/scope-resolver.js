// src/security/scope-resolver.js
// Resout le perimetre institutionnel d une personne :
// personne -> affectation active -> poste -> unite -> institution
const db = require("../db");
const requestContext = require("../request-context");
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
  if (row) return row.institution_id;

  // Repli : pas d'affectation organisationnelle active, on utilise le scope
  // porte directement par personne_role (cf. migrations 008/009).
  const fallback = await db.get(`
    SELECT scope_institution_id
    FROM personne_role
    WHERE personne_id = ? AND LOWER(statut) = 'actif' AND scope_institution_id IS NOT NULL
    ORDER BY date_attribution DESC
    LIMIT 1
  `, [personneId]);
  return fallback ? fallback.scope_institution_id : null;
}

// Cockpit Gouvernemental V1 - mecanisme "lecture nationale" (cf.
// COCKPIT_V1_PHASE2_ARCHITECTURE.md). Un role peut avoir role.lecture_nationale
// = true sans avoir d'institution propre (ex. Analyste Cockpit). Lecture
// bypassRls strictement encadree : uniquement pour peupler institutionsVisibles
// en lecture, jamais utilisee pour une ecriture, jamais exposee telle quelle
// a l'appelant. Aucune policy RLS n'est modifiee par ce mecanisme.
async function possedeLectureNationale(personneId) {
  const row = await db.get(`
    SELECT 1
    FROM personne_role pr
    JOIN role r ON r.role_id = pr.role_id
    WHERE pr.personne_id = ? AND LOWER(pr.statut) = 'actif' AND r.lecture_nationale = true
    LIMIT 1
  `, [personneId]);
  return !!row;
}

async function obtenirToutesInstitutionsIds() {
  return requestContext.run({ bypassRls: true }, async () => {
    const rows = await db.all(`SELECT institution_id FROM institution`);
    return rows.map((r) => r.institution_id);
  });
}

async function resoudrePorteeInstitution(personneId) {
  if (await possedeLectureNationale(personneId)) {
    const institutionsVisibles = await obtenirToutesInstitutionsIds();
    return { institutionId: null, institutionsVisibles, lectureNationale: true };
  }

  const institutionId = await resoudreInstitutionPersonne(personneId);
  if (!institutionId) return { institutionId: null, institutionsVisibles: [], lectureNationale: false };
  const institutionsVisibles = await getInstitutionsDescendantes(institutionId);
  return { institutionId, institutionsVisibles, lectureNationale: false };
}

module.exports = { resoudreInstitutionPersonne, resoudrePorteeInstitution, possedeLectureNationale };
