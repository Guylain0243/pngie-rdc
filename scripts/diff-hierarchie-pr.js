// scripts/diff-hierarchie-pr.js
// Identifie precisement les institutions qui different entre les deux
// mecanismes de hierarchie pour PR (Presidence), racine avec 112 vs 119
// descendants selon le mecanisme utilise.
// Usage : node scripts/diff-hierarchie-pr.js
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function chargerEnv(nomFichier) {
  const p = path.join(__dirname, '..', nomFichier);
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const envDev = chargerEnv('.env.development');
const admin = chargerEnv('.env.admin.local');
let database = 'pngie_rdc_rls_test';
const m = (envDev.DATABASE_URL || '').match(/\/([^/?]+)(\?|$)/);
if (m) database = m[1];

const client = new Client({
  host: 'localhost', port: 5432,
  user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
  database,
});

const PR_ID = 'f924e2ae-96c6-4b9e-81cc-d9602969ec3f';

async function main() {
  await client.connect();

  const viaParent = await client.query(`SELECT institution_id FROM fn_institutions_descendantes($1)`, [PR_ID]);
  const setParent = new Set(viaParent.rows.map(r => r.institution_id));

  const viaRelationTutelle = await client.query(`
    WITH RECURSIVE descendants AS (
      SELECT institution_id FROM institution WHERE institution_id = $1
      UNION
      SELECT ir.institution_cible_id
      FROM institution_relation ir
      JOIN descendants d ON d.institution_id = ir.institution_source_id
      WHERE ir.type_relation = 'TUTELLE' AND ir.actif = TRUE
    )
    SELECT institution_id FROM descendants
  `, [PR_ID]);
  const viaRattachement = await client.query(`
    SELECT institution_cible_id AS institution_id
    FROM institution_relation
    WHERE institution_source_id = $1 AND type_relation = 'RATTACHEMENT_CONSTITUTIONNEL' AND actif = TRUE
  `, [PR_ID]);
  const setRelation = new Set([...viaRelationTutelle.rows.map(r => r.institution_id), PR_ID, ...viaRattachement.rows.map(r => r.institution_id)]);

  const presentsDansRelationSeulement = [...setRelation].filter(id => !setParent.has(id));
  const presentsDansParentSeulement = [...setParent].filter(id => !setRelation.has(id));

  console.log('=== Presentes via institution_relation (TUTELLE/RATTACHEMENT) mais ABSENTES via institution_parent_id ===');
  if (presentsDansRelationSeulement.length) {
    const r = await client.query(`SELECT institution_id, nom, institution_parent_id FROM institution WHERE institution_id = ANY($1)`, [presentsDansRelationSeulement]);
    console.table(r.rows);
  } else {
    console.log('(aucune)');
  }

  console.log('\n=== Presentes via institution_parent_id mais ABSENTES via institution_relation ===');
  if (presentsDansParentSeulement.length) {
    const r = await client.query(`SELECT institution_id, nom, institution_parent_id FROM institution WHERE institution_id = ANY($1)`, [presentsDansParentSeulement]);
    console.table(r.rows);
  } else {
    console.log('(aucune)');
  }

  await client.end();
}

main().catch((err) => { console.error('ERREUR :', err.message); process.exit(1); });
