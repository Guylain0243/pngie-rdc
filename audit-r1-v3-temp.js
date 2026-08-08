const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const EXCLUDE_DIRS = new Set(["node_modules", "archives", "migrations_rls", ".git", "docs"]);

function walkJsFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsFiles(full, results);
    else if (entry.name.endsWith(".js")) results.push(full);
  }
  return results;
}

(async () => {
  const client = await pool.connect();
  try {
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

    const jsFiles = walkJsFiles(process.cwd());
    console.log(`Fichiers .js scannes : ${jsFiles.length}`);
    let allCode = "";
    for (const f of jsFiles) allCode += fs.readFileSync(f, "utf8") + "\n";

    const usedMissing = missing.filter(t => new RegExp(`\\b${t}\\b`).test(allCode));
    const unusedMissing = missing.filter(t => !usedMissing.includes(t));

    console.log(`Tables totales : ${allTables.rows.length} | Sans GRANT : ${missing.length}`);
    console.log(`  - Referencees dans le backend (PRIORITAIRES) : ${usedMissing.length}`);
    console.table(usedMissing);
    console.log(`  - Non referencees (probablement mortes ou generees dynamiquement) : ${unusedMissing.length}`);
    console.table(unusedMissing);
  } finally {
    client.release();
    await pool.end();
  }
})();
