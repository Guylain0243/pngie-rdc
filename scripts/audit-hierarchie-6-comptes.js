// scripts/audit-hierarchie-6-comptes.js
// Audit complet de l'arborescence institutionnelle pour les 6 comptes de
// test, en croisant les DEUX mecanismes de hierarchie presents dans le code :
//   (A) institution.institution_parent_id -- utilise par fn_institutions_descendantes()
//       dans la policy RLS "institution_scope" (protege la table institution elle-meme)
//   (B) table institution_relation (type_relation TUTELLE / RATTACHEMENT_CONSTITUTIONNEL)
//       -- utilise par hierarchy-service.js -> resoudrePorteeInstitution()
//       -> req.scope.institutionsVisibles (filtre les listes d'agents/affectations
//       cote applicatif dans les routes generees)
// But : verifier que les deux mecanismes donnent le MEME resultat pour les
// 6 comptes de reference, avant de corriger quoi que ce soit.
// Usage : node scripts/audit-hierarchie-6-comptes.js
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

const COMPTES = {
  PR: 'test-pr@pngie.local',
  PM: 'test-pm@pngie.local',
  MI: 'test-mi@pngie.local',
  AN: 'test-an@pngie.local',
  SN: 'test-sn@pngie.local',
  GV: 'test-gv@pngie.local',
};

// PM n'a pas encore de scope_institution_id (NULL) -- on utilise son
// affectation physique (Primature, deja identifiee) pour pouvoir quand meme
// l'inclure dans la comparaison ci-dessous, marque explicitement.
const PRIMATURE_ID = 'ae011056-e941-4cb0-9504-9d1478324fc5';

async function niveau(institutionId) {
  // Remonte les parents jusqu'a la racine, compte la profondeur.
  let current = institutionId;
  let depth = 0;
  const chemin = [];
  while (current && depth < 20) {
    const r = await client.query('SELECT nom, institution_parent_id FROM institution WHERE institution_id = $1', [current]);
    if (!r.rows[0]) break;
    chemin.unshift(r.rows[0].nom);
    current = r.rows[0].institution_parent_id;
    if (current) depth++;
  }
  return { profondeur: depth, chemin: chemin.join(' > ') };
}

async function descendantsViaParentId(institutionId) {
  const r = await client.query(`SELECT institution_id FROM fn_institutions_descendantes($1)`, [institutionId]);
  return r.rows.map(row => row.institution_id);
}

async function descendantsViaRelation(institutionId) {
  const r = await client.query(`
    WITH RECURSIVE descendants AS (
      SELECT institution_id FROM institution WHERE institution_id = $1
      UNION
      SELECT ir.institution_cible_id
      FROM institution_relation ir
      JOIN descendants d ON d.institution_id = ir.institution_source_id
      WHERE ir.type_relation = 'TUTELLE' AND ir.actif = TRUE
    )
    SELECT institution_id FROM descendants
  `, [institutionId]);
  const rattachements = await client.query(`
    SELECT institution_cible_id AS institution_id
    FROM institution_relation
    WHERE institution_source_id = $1 AND type_relation = 'RATTACHEMENT_CONSTITUTIONNEL' AND actif = TRUE
  `, [institutionId]);
  return [...new Set([...r.rows.map(x => x.institution_id), institutionId, ...rattachements.rows.map(x => x.institution_id)])];
}

async function main() {
  await client.connect();

  const resultats = [];
  for (const [role, email] of Object.entries(COMPTES)) {
    const pr = await client.query(`
      SELECT pr.scope_institution_id, i.nom
      FROM personne p
      JOIN personne_role pr ON pr.personne_id = p.personne_id
      LEFT JOIN institution i ON i.institution_id = pr.scope_institution_id
      WHERE p.email = $1
    `, [email]);
    let institutionId = pr.rows[0]?.scope_institution_id;
    let nom = pr.rows[0]?.nom;
    let note = '';
    if (!institutionId && role === 'PM') {
      institutionId = PRIMATURE_ID;
      nom = '(NULL en base -- Primature utilisee ici a titre de simulation, cf. affectation physique)';
      note = 'SIMULATION';
    }

    if (!institutionId) {
      resultats.push({ role, email, institution: '(scope_institution_id NULL, pas de simulation)', profondeur: '-', descendants_via_parent_id: '-', descendants_via_relation: '-', coherent: '-' });
      continue;
    }

    const { profondeur, chemin } = await niveau(institutionId);
    const viaParent = await descendantsViaParentId(institutionId);
    const viaRelation = await descendantsViaRelation(institutionId);
    const memesEnsembles = viaParent.length === viaRelation.length &&
      viaParent.every(id => viaRelation.includes(id));

    resultats.push({
      role,
      institution: nom + (note ? ` [${note}]` : ''),
      chemin_racine: chemin,
      profondeur,
      descendants_via_institution_parent_id: viaParent.length,
      descendants_via_institution_relation: viaRelation.length,
      coherent: memesEnsembles ? 'OUI' : 'NON -- DIVERGENCE',
    });
  }

  console.table(resultats);

  await client.end();
}

main().catch((err) => { console.error('ERREUR :', err.message); process.exit(1); });
