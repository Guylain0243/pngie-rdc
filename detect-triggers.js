const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Colle ici la liste des 84 tables utilisées directement dans le code
  // (routes-generated/ + src/). Un seul point de vérité pour ce script.
  const tablesUtilisees = [
    // "personne", "document", "institution", "role", "personne_role", ...
  ];

  const whereClause = tablesUtilisees.length > 0
    ? `AND c.relname = ANY($1::text[])`
    : ``;

  const mainQuery = `
    SELECT
      c.relname AS table_name,
      t.tgname AS trigger_name,
      p.proname AS function_name,
      p.prosecdef AS security_definer,
      pg_get_triggerdef(t.oid) AS trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE NOT t.tgisinternal
      AND c.relnamespace = 'public'::regnamespace
      ${whereClause}
    ORDER BY c.relname, t.tgname;
  `;

  try {
    const res = tablesUtilisees.length > 0
      ? await client.query(mainQuery, [tablesUtilisees])
      : await client.query(mainQuery);

    console.log(`\n=== ${res.rows.length} triggers trouvés (requête principale) ===\n`);
    const nonSecdef = res.rows.filter(r => r.security_definer !== true);

    console.table(res.rows.map(r => ({
      table: r.table_name,
      trigger: r.trigger_name,
      fonction: r.function_name,
      security_definer: r.security_definer
    })));

    console.log(`\n=== TABLES A RISQUE (fonction sans SECURITY DEFINER = true) ===\n`);
    console.table(nonSecdef.map(r => ({
      table: r.table_name,
      trigger: r.trigger_name,
      fonction: r.function_name
    })));

    // Pour chaque fonction non-SECURITY DEFINER, on veut aussi savoir
    // quelles tables elle touche EN ECRITURE (INSERT/UPDATE/DELETE)
    // au-delà de la table déclenchante — ex: fn_audit_generique écrit
    // dans journal_audit alors qu'elle est déclenchée sur personne.
    console.log(`\nRappel : ceci liste les triggers, pas les tables cibles des`);
    console.log(`INSERT internes aux fonctions (ex: journal_audit). Vérifier`);
    console.log(`manuellement le corps de chaque fonction non-SECURITY DEFINER`);
    console.log(`ci-dessus avec \\sf nom_fonction dans psql si besoin.\n`);

  } catch (err) {
    console.error("Requête principale échouée, fallback simple :", err.message);

    const fallbackQuery = `
      SELECT
        c.relname AS table_name,
        t.tgname AS trigger_name,
        t.tgfoid::regproc AS function_name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      WHERE NOT t.tgisinternal
        AND c.relnamespace = 'public'::regnamespace
        ${whereClause}
      ORDER BY c.relname, t.tgname;
    `;

    const res2 = tablesUtilisees.length > 0
      ? await client.query(fallbackQuery, [tablesUtilisees])
      : await client.query(fallbackQuery);

    console.log(`\n=== ${res2.rows.length} triggers trouvés (fallback) ===\n`);
    console.table(res2.rows);
    console.log(`\nVérifier prosecdef manuellement pour chaque function_name ci-dessus :`);
    console.log(`SELECT proname, prosecdef FROM pg_proc WHERE proname = 'nom_fonction';`);
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
