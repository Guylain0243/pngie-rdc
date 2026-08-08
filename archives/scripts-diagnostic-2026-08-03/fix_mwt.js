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
  const errors = [];
  const rows = sqlite.prepare('SELECT * FROM meta_workflow_transition').all();

  await pg.query('BEGIN');
  let ok = 0;
  for (const t of rows) {
    const success = await insertRow(
      pg,
      `INSERT INTO meta_workflow_transition
         (transition_id, entite, from_statut, to_statut, role_code_requis, condition_json, statut, created_at)
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,$6, now())
       ON CONFLICT (entite, from_statut, to_statut, role_code_requis) DO NOTHING`,
      [t.entity, t.from_statut, t.to_statut, t.role_code_requis || null, null, t.statut || 'ACTIF'],
      'meta_workflow_transition(' + t.transition_id + ')',
      errors
    );
    if (success) ok++;
  }
  await pg.query('COMMIT');
  console.log('meta_workflow_transition : ' + ok + '/' + rows.length + ' lignes migrees (' + errors.length + ' erreurs)');
  errors.forEach((e) => console.log('  ! ' + e));

  await pg.end();
  sqlite.close();
})();