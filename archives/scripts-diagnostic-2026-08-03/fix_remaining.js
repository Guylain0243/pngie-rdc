const Database = require('better-sqlite3');
const { Client } = require('pg');

const sqlite = new Database('db\\pngie.db', { readonly: true });
const pg = new Client({
  host: 'localhost', port: 5432, user: 'postgres',
  password: process.env.PGPASSWORD || 'Merci@0243', database: 'pngie_rdc',
});

async function insertRow(client, sql, params, label, errors) {
  await client.query('SAVEPOINT sp');
  try {
    await client.query(sql, params);
    await client.query('RELEASE SAVEPOINT sp');
    return true;
  } catch (e) {
    await client.query('ROLLBACK TO SAVEPOINT sp');
    errors.push(label + ' :: ' + e.message);
    return false;
  }
}

(async () => {
  await pg.connect();

  // Institution racine (niveau_hierarchique le plus bas)
  const rootRes = await pg.query(
    'SELECT institution_id, code, nom FROM institution ORDER BY niveau_hierarchique ASC, code ASC LIMIT 1'
  );
  const rootInstitution = rootRes.rows[0];
  console.log('Institution racine choisie : ' + rootInstitution.code + ' - ' + rootInstitution.nom);

  // Type de document par defaut
  const defTypeRes = await pg.query(
    'SELECT type_document_id, code, nom FROM type_document ORDER BY code ASC LIMIT 1'
  );
  const defType = defTypeRes.rows[0];
  console.log('Type de document par defaut choisi : ' + defType.code + ' - ' + defType.nom);

  // --- 1) personne_role orphelins (scope_org_id NULL en SQLite) ---
  const errors1 = [];
  const prs = sqlite.prepare('SELECT * FROM person_role WHERE scope_org_id IS NULL').all();

  // recuperer les maps personne/role deja migrees (par email / code, cles stables)
  const persons = sqlite.prepare('SELECT * FROM person').all();
  const personEmailToSqliteId = new Map(persons.map(p => [p.person_id, p.email]));

  const roles = sqlite.prepare('SELECT * FROM role').all();
  const roleIdToCode = new Map(roles.map(r => [r.role_id, r.code]));

  await pg.query('BEGIN');
  let ok1 = 0;
  for (const pr of prs) {
    const email = personEmailToSqliteId.get(pr.person_id);
    const roleCode = roleIdToCode.get(pr.role_id);
    if (!email || !roleCode) {
      errors1.push('personne_role :: introuvable email=' + email + ' roleCode=' + roleCode);
      continue;
    }
    const personneRes = await pg.query('SELECT personne_id FROM personne WHERE email = $1', [email]);
    const roleRes = await pg.query('SELECT role_id FROM role WHERE code = $1', [roleCode]);
    if (!personneRes.rows[0] || !roleRes.rows[0]) {
      errors1.push('personne_role :: non trouve en PG email=' + email + ' roleCode=' + roleCode);
      continue;
    }
    const success = await insertRow(
      pg,
      `INSERT INTO personne_role (personne_role_id, personne_id, role_id, scope_institution_id, date_attribution, statut)
       VALUES (gen_random_uuid(),$1,$2,$3, now(), $4)
       ON CONFLICT (personne_id, role_id, scope_institution_id) DO NOTHING`,
      [personneRes.rows[0].personne_id, roleRes.rows[0].role_id, rootInstitution.institution_id, 'ACTIF'],
      'personne_role(' + pr.person_role_id + ')',
      errors1
    );
    if (success) ok1++;
  }
  await pg.query('COMMIT');
  console.log('personne_role (orphelins) : ' + ok1 + '/' + prs.length + ' lignes migrees (' + errors1.length + ' erreurs)');
  errors1.forEach((e) => console.log('  ! ' + e));

  // --- 2) document orphelin (document_type_id NULL en SQLite) ---
  const errors2 = [];
  const docs = sqlite.prepare('SELECT * FROM document WHERE document_type_id IS NULL').all();

  await pg.query('BEGIN');
  let ok2 = 0;
  for (const d of docs) {
    const orgRes = await pg.query(
      'SELECT institution_id FROM institution WHERE code = (SELECT code FROM json_each(\'[]\'))'
    );
    // organization_id -> code -> institution.code (lookup direct)
    const org = sqlite.prepare('SELECT code FROM organization WHERE organization_id = ?').get(d.organization_id);
    let institutionId = rootInstitution.institution_id;
    if (org) {
      const match = await pg.query('SELECT institution_id FROM institution WHERE code = $1', [org.code]);
      if (match.rows[0]) institutionId = match.rows[0].institution_id;
    }
    const success = await insertRow(
      pg,
      `INSERT INTO document
         (document_id, type_document_id, institution_id, titre, reference, statut, confidentialite, created_at, updated_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6, now(), now())`,
      [defType.type_document_id, institutionId, d.titre, d.reference || null, 'BROUILLON', 'PUBLIC'],
      'document(' + d.titre + ')',
      errors2
    );
    if (success) ok2++;
  }
  await pg.query('COMMIT');
  console.log('document (orphelins) : ' + ok2 + '/' + docs.length + ' lignes migrees (' + errors2.length + ' erreurs)');
  errors2.forEach((e) => console.log('  ! ' + e));

  await pg.end();
  sqlite.close();
})();