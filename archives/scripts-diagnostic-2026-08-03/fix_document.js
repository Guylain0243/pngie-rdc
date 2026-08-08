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

  const rootRes = await pg.query(
    'SELECT institution_id, code FROM institution ORDER BY niveau_hierarchique ASC, code ASC LIMIT 1'
  );
  const rootInstitution = rootRes.rows[0];

  const defTypeRes = await pg.query(
    'SELECT type_document_id, code FROM type_document ORDER BY code ASC LIMIT 1'
  );
  const defType = defTypeRes.rows[0];

  const errors = [];
  const docs = sqlite.prepare('SELECT * FROM document WHERE document_type_id IS NULL').all();

  await pg.query('BEGIN');
  let ok = 0;
  for (const d of docs) {
    let institutionId = rootInstitution.institution_id;
    if (d.organization_id) {
      const org = sqlite.prepare('SELECT code FROM organization WHERE organization_id = ?').get(d.organization_id);
      if (org) {
        const match = await pg.query('SELECT institution_id FROM institution WHERE code = $1', [org.code]);
        if (match.rows[0]) institutionId = match.rows[0].institution_id;
      }
    }
    const success = await insertRow(
      pg,
      `INSERT INTO document
         (document_id, type_document_id, institution_id, titre, reference, statut, confidentialite, created_at, updated_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6, now(), now())`,
      [defType.type_document_id, institutionId, d.titre, d.reference || null, 'BROUILLON', 'PUBLIC'],
      'document(' + d.titre + ')',
      errors
    );
    if (success) ok++;
  }
  await pg.query('COMMIT');
  console.log('document (orphelins) : ' + ok + '/' + docs.length + ' lignes migrees (' + errors.length + ' erreurs)');
  errors.forEach((e) => console.log('  ! ' + e));

  await pg.end();
  sqlite.close();
})();