const { Client } = require('pg');
const client = new Client({ connectionString: process.env.PNGIE_DB_URL });
client.connect().then(async () => {
  const cols = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'unite_organisationnelle' ORDER BY ordinal_position");
  console.log('=== Toutes les colonnes ===');
  console.log(JSON.stringify(cols.rows, null, 2));

  const typesUtilises = await client.query("SELECT DISTINCT type_unite FROM unite_organisationnelle WHERE type_unite IS NOT NULL ORDER BY type_unite");
  console.log('=== Valeurs existantes de type_unite ===');
  console.log(JSON.stringify(typesUtilises.rows, null, 2));

  const exempleMin31 = await client.query("SELECT code, nom, type_unite FROM unite_organisationnelle u JOIN institution i ON i.institution_id = u.institution_id WHERE i.code = 'MIN_31'");
  console.log('=== Exemple MIN_31 avec type_unite ===');
  console.log(JSON.stringify(exempleMin31.rows, null, 2));

  await client.end();
}).catch(err => console.error('ERREUR:', err.message));
