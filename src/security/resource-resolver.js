// src/security/resource-resolver.js
// Resout l institution de rattachement d une ressource, quel que soit son type.
const db = require("../db");

async function institutionDeAffectation(affectationId) {
  const row = await db.get(`
    SELECT u.institution_id
    FROM affectation a
    JOIN poste p ON p.poste_id = a.poste_id
    JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
    WHERE a.affectation_id = ?
  `, [affectationId]);
  return row ? row.institution_id : null;
}

async function institutionDePoste(posteId) {
  const row = await db.get(`
    SELECT u.institution_id
    FROM poste p
    JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
    WHERE p.poste_id = ?
  `, [posteId]);
  return row ? row.institution_id : null;
}

async function institutionDAgent(agentId) {
  const row = await db.get(`SELECT institution_id FROM agent WHERE agent_id = ?`, [agentId]);
  return row ? row.institution_id : null;
}

// Cas particulier : la valeur EST deja un institution_id (ex: body.institution_id d un formulaire)
async function institutionIdentite(institutionId) {
  return institutionId;
}

const RESOLVERS = {
  affectation: institutionDeAffectation,
  poste: institutionDePoste,
  agent: institutionDAgent,
  institution: institutionIdentite
};

module.exports = { RESOLVERS };
