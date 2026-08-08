const { Client } = require('pg');
const client = new Client({ connectionString: process.env.PNGIE_DB_URL });
client.connect().then(async () => {
  console.log('=== 1. Colonnes de la table personne (pour annuaire) ===');
  const personneCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'personne' ORDER BY ordinal_position");
  console.log(JSON.stringify(personneCols.rows, null, 2));

  console.log('=== 2. Colonnes de la table poste (souvent liee a personne) ===');
  const posteExiste = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'poste'");
  if (posteExiste.rows.length > 0) {
    const posteCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'poste' ORDER BY ordinal_position");
    console.log(JSON.stringify(posteCols.rows, null, 2));
  } else {
    console.log('Table poste introuvable.');
  }

  console.log('=== 3. Referentiel national + sections vides ===');
  const refs = await client.query("SELECT referentiel_national_id, code, nom FROM referentiel_national ORDER BY code");
  console.log(JSON.stringify(refs.rows, null, 2));

  const sectionsCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'referentiel_national_section' ORDER BY ordinal_position");
  console.log('=== Colonnes referentiel_national_section ===');
  console.log(JSON.stringify(sectionsCols.rows, null, 2));

  const sectionsVides = await client.query("SELECT COUNT(*) as n FROM referentiel_national_section WHERE contenu_texte IS NULL OR contenu_texte = ''");
  console.log('Sections vides:', sectionsVides.rows[0].n);

  console.log('=== 4. Ministeres restants a traiter (Tome disponible) ===');
  const minsAVerifier = ['MIN_12','MIN_11','MIN_13','MIN_24','MIN_8','MIN_21'];
  const rows = await client.query(
    `SELECT i.code, i.nom, COUNT(u.unite_id) as nb_unites
     FROM institution i LEFT JOIN unite_organisationnelle u ON u.institution_id = i.institution_id
     WHERE i.code = ANY($1) GROUP BY i.code, i.nom ORDER BY i.code`,
    [minsAVerifier]
  );
  console.log(JSON.stringify(rows.rows, null, 2));

  await client.end();
}).catch(err => console.error('ERREUR:', err.message));
