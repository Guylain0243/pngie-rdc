const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function walkJsFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsFiles(full, results);
    else if (entry.name.endsWith(".js")) results.push(full);
  }
  return results;
}

(async () => {
  const client = await pool.connect();
  try {
    console.log("========================================");
    console.log("PARTIE 1 - Test du flux de login sous pngie_app (via les VUES reelles)");
    console.log("========================================");

    await client.query("SET ROLE pngie_app");
    const emailTest = "test-mi@pngie.local";

    try {
      const r1 = await client.query("SELECT * FROM person WHERE email = $1 AND statut = $2", [emailTest, "ACTIF"]);
      console.log(`Etape 1 (lecture vue person) : ${r1.rows.length} ligne(s)`);
    } catch (e) { console.log(`Etape 1 : ERREUR - ${e.message}`); }

    try {
      const r2 = await client.query(`
        SELECT r.code, r.nom, r.categorie FROM person_role pr
        JOIN role r ON r.role_id = pr.role_id
        JOIN person p ON p.person_id = pr.person_id
        WHERE p.email = $1
      `, [emailTest]);
      console.log(`Etape 2 (lecture vue person_role) : ${r2.rows.length} ligne(s)`);
    } catch (e) { console.log(`Etape 2 : ERREUR - ${e.message}`); }

    await client.query("RESET ROLE");

    console.log("");
    console.log("========================================");
    console.log("PARTIE 1bis - GRANTs sur les VUES de compatibilite (postgres)");
    console.log("========================================");
    const vues = await client.query(`
      SELECT table_name, table_type FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'VIEW'
      ORDER BY table_name
    `);
    const grantedVues = await client.query(`
      SELECT DISTINCT table_name FROM information_schema.role_table_grants
      WHERE grantee = 'pngie_app'
    `);
    const grantedSetVues = new Set(grantedVues.rows.map(r => r.table_name));
    const missingVues = vues.rows.map(r => r.table_name).filter(t => !grantedSetVues.has(t));
    console.log(`Vues totales : ${vues.rows.length} | Sans GRANT pour pngie_app : ${missingVues.length}`);
    console.table(missingVues);

    console.log("");
    console.log("========================================");
    console.log("PARTIE 2 - Tables de base sans GRANT (sous role postgres, correct cette fois)");
    console.log("========================================");
    const allTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const grantedTables = await client.query(`
      SELECT DISTINCT table_name FROM information_schema.role_table_grants
      WHERE grantee = 'pngie_app'
    `);
    const grantedSet = new Set(grantedTables.rows.map(r => r.table_name));
    const missing = allTables.rows.map(r => r.table_name).filter(t => !grantedSet.has(t));

    const jsFiles = walkJsFiles(path.join(process.cwd(), "src"));
    let allCode = "";
    for (const f of jsFiles) allCode += fs.readFileSync(f, "utf8") + "\n";

    const usedMissing = missing.filter(t => new RegExp(`\\b${t}\\b`).test(allCode));
    const unusedMissing = missing.filter(t => !usedMissing.includes(t));

    console.log(`Tables totales : ${allTables.rows.length} | Sans GRANT : ${missing.length}`);
    console.log(`  - Referencees dans src/ (PRIORITAIRES) : ${usedMissing.length}`);
    console.table(usedMissing);
    console.log(`  - Non referencees dans src/ : ${unusedMissing.length}`);
    console.table(unusedMissing);

  } finally {
    client.release();
    await pool.end();
  }
})();
