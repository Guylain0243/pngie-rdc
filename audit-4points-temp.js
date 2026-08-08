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
    console.log("PARTIE 1 - Test du flux de login sous pngie_app");
    console.log("========================================");

    await client.query("SET ROLE pngie_app");

    const emailTest = "test-mi@pngie.local";

    // Etape 1 : lecture utilisateur
    try {
      const r1 = await client.query(
        "SELECT * FROM person WHERE email = $1 AND statut = $2",
        [emailTest, "ACTIF"]
      );
      console.log(`Etape 1 (lecture person) : ${r1.rows.length} ligne(s)`);
      if (r1.rows.length === 0) console.log("  -> ECHEC : login impossible, utilisateur introuvable sous ce role.");
    } catch (e) {
      console.log(`Etape 1 (lecture person) : ERREUR - ${e.message}`);
    }

    // Etape 2 : lecture des roles
    try {
      const r2 = await client.query(`
        SELECT r.code, r.nom, r.categorie FROM person_role pr
        JOIN role r ON r.role_id = pr.role_id
        JOIN person p ON p.person_id = pr.person_id
        WHERE p.email = $1
      `, [emailTest]);
      console.log(`Etape 2 (lecture roles via person_role) : ${r2.rows.length} ligne(s)`);
      if (r2.rows.length === 0) console.log("  -> ECHEC : aucun role recupere, JWT contiendrait roles=[] ou login bloque en amont.");
    } catch (e) {
      console.log(`Etape 2 (lecture roles) : ERREUR - ${e.message}`);
    }

    // Etape 3 : ecriture de session (test a blanc, ROLLBACK immediat)
    try {
      await client.query("BEGIN");
      const testSessionId = "00000000-0000-0000-0000-000000000001";
      await client.query(`
        INSERT INTO session_utilisateur (session_id, personne_id, token_hash, adresse_ip, user_agent, date_debut, date_expiration, statut)
        SELECT $1, person_id, 'test_hash', '127.0.0.1', 'test-agent', NOW(), NOW() + INTERVAL '8 hours', 'ACTIF'
        FROM person WHERE email = $2
      `, [testSessionId, emailTest]);
      console.log("Etape 3 (ecriture session_utilisateur) : OK (testee puis annulee)");
      await client.query("ROLLBACK");
    } catch (e) {
      console.log(`Etape 3 (ecriture session_utilisateur) : ERREUR - ${e.message}`);
      try { await client.query("ROLLBACK"); } catch (_) {}
    }

    console.log("");
    console.log("========================================");
    console.log("PARTIE 2 - Croisement tables sans GRANT vs usage reel dans le code");
    console.log("========================================");

    const allTables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    const granted = await client.query(`
      SELECT DISTINCT table_name FROM information_schema.role_table_grants
      WHERE grantee = 'pngie_app'
    `);
    const grantedSet = new Set(granted.rows.map(r => r.table_name));
    const missing = allTables.rows.map(r => r.table_name).filter(t => !grantedSet.has(t));

    const jsFiles = walkJsFiles(path.join(process.cwd(), "src"));
    let allCode = "";
    for (const f of jsFiles) {
      allCode += fs.readFileSync(f, "utf8") + "\n";
    }

    const usedMissing = [];
    const unusedMissing = [];
    for (const table of missing) {
      const regex = new RegExp(`\\b${table}\\b`);
      if (regex.test(allCode)) usedMissing.push(table);
      else unusedMissing.push(table);
    }

    console.log(`Tables sans GRANT : ${missing.length}`);
    console.log(`  - Referencees dans src/ (a corriger avant bascule) : ${usedMissing.length}`);
    console.log(`  - Non trouvees dans src/ (probablement non utilisees) : ${unusedMissing.length}`);
    console.log("");
    console.log("--- Tables sans GRANT ET utilisees dans le code (PRIORITAIRES) ---");
    console.table(usedMissing);
    console.log("--- Tables sans GRANT et non referencees dans src/ (a verifier avant d'ignorer) ---");
    console.table(unusedMissing);

    console.log("");
    console.log("========================================");
    console.log("PARTIE 3 - Etat des comptes pour R3");
    console.log("========================================");
    await client.query("RESET ROLE");
    const comptes = await client.query(`
      SELECT pe.email, pr.scope_institution_id
      FROM personne pe
      JOIN personne_role pr ON pr.personne_id = pe.personne_id
      WHERE pe.email LIKE 'test-%@pngie.local'
      ORDER BY pe.email
    `);
    console.table(comptes.rows);

  } finally {
    client.release();
    await pool.end();
  }
})();
