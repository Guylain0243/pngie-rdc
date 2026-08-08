const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { execSync } = require("child_process");

function loadEnvAdmin() {
  const envPath = path.join(__dirname, "..", ".env.admin.local");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const OUT = [];
function titre(t) { OUT.push(`\n\n## ${t}\n`); }
function ligne(t) { OUT.push(t); }
function safe(label, fn) {
  try { fn(); }
  catch (e) { OUT.push(`> ERREUR lors de "${label}" : ${e.message}`); }
}

async function main() {
  const admin = loadEnvAdmin();
  const client = new Client({
    host: "localhost", port: 5432,
    user: admin.PGSUPERUSER, password: admin.PGSUPERUSER_PASSWORD,
    database: "pngie_rdc_rls_test",
  });
  await client.connect();

  OUT.push(`# AUDIT COMPLET — PNGIE-RDC`);
  OUT.push(`Généré le ${new Date().toISOString()}`);

  // ------------------------------------------------------------
  titre("1. Arborescence du projet (2 niveaux, hors node_modules)");
  await (async () => {
    function lister(dir, prefixe, profondeur) {
      if (profondeur > 2) return;
      let entries;
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        if (e.name === "node_modules" || e.name === ".git") continue;
        OUT.push(`${prefixe}${e.isDirectory() ? "[DIR] " : ""}${e.name}`);
        if (e.isDirectory()) lister(path.join(dir, e.name), prefixe + "  ", profondeur + 1);
      }
    }
    lister(path.join(__dirname, ".."), "", 0);
  })();

  // ------------------------------------------------------------
  titre("2. Toutes les tables + colonnes + PK");
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  for (const { table_name } of tables.rows) {
    ligne(`\n### ${table_name}`);
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1 ORDER BY ordinal_position
    `, [table_name]);
    cols.rows.forEach(c => ligne(`- ${c.column_name} (${c.data_type}${c.is_nullable === 'NO' ? ', NOT NULL' : ''})`));
    const pk = await client.query(`
      SELECT a.attname FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = $1::regclass AND i.indisprimary
    `, [table_name]);
    if (pk.rows.length) ligne(`  PK : ${pk.rows.map(r => r.attname).join(", ")}`);
  }

  // ------------------------------------------------------------
  titre("3. Toutes les clés étrangères");
  const fks = await client.query(`
    SELECT
      tc.table_name, kcu.column_name,
      ccu.table_name AS table_referencee, ccu.column_name AS colonne_referencee
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name
  `);
  fks.rows.forEach(r => ligne(`- ${r.table_name}.${r.column_name} -> ${r.table_referencee}.${r.colonne_referencee}`));

  // ------------------------------------------------------------
  titre("4. Toutes les fonctions PL/pgSQL");
  const fns = await client.query(`
    SELECT n.nspname AS schema, p.proname AS fonction,
           pg_get_function_identity_arguments(p.oid) AS arguments,
           l.lanname AS langage
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
    ORDER BY n.nspname, p.proname
  `);
  fns.rows.forEach(r => ligne(`- ${r.schema}.${r.fonction}(${r.arguments}) [${r.langage}]`));

  // ------------------------------------------------------------
  titre("5. Tous les triggers");
  const trg = await client.query(`
    SELECT event_object_table AS table_nom, trigger_name, action_timing, event_manipulation, action_statement
    FROM information_schema.triggers
    ORDER BY event_object_table, trigger_name
  `);
  trg.rows.forEach(r => ligne(`- [${r.table_nom}] ${r.trigger_name} — ${r.action_timing} ${r.event_manipulation} -> ${r.action_statement}`));

  // ------------------------------------------------------------
  titre("6. Toutes les politiques RLS");
  const pol = await client.query(`
    SELECT tablename, policyname, cmd, qual, with_check
    FROM pg_policies ORDER BY tablename, policyname
  `);
  pol.rows.forEach(r => {
    ligne(`\n[${r.tablename}] ${r.policyname} (${r.cmd})`);
    if (r.qual) ligne(`  USING: ${r.qual}`);
    if (r.with_check) ligne(`  WITH CHECK: ${r.with_check}`);
  });

  // ------------------------------------------------------------
  titre("7. Tables avec RLS activé mais sans politique (risque)");
  const rlsSansPolitique = await client.query(`
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND c.relrowsecurity = true AND n.nspname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = c.relname)
  `);
  if (rlsSansPolitique.rows.length === 0) ligne("Aucune — toutes les tables RLS ont au moins une politique.");
  rlsSansPolitique.rows.forEach(r => ligne(`- ${r.relname}`));

  // ------------------------------------------------------------
  titre("8. Extensions PostgreSQL installées");
  const ext = await client.query(`SELECT extname, extversion FROM pg_extension ORDER BY extname`);
  ext.rows.forEach(r => ligne(`- ${r.extname} (${r.extversion})`));

  // ------------------------------------------------------------
  titre("9. Comptage de lignes par table (santé des données)");
  for (const { table_name } of tables.rows) {
    try {
      const c = await client.query(`SELECT COUNT(*) FROM "${table_name}"`);
      ligne(`- ${table_name} : ${c.rows[0].count} lignes`);
    } catch (e) {
      ligne(`- ${table_name} : ERREUR (${e.message})`);
    }
  }

  await client.end();

  // ------------------------------------------------------------
  titre("10. package.json — dépendances");
  safe("package.json", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    ligne("Dependencies:");
    Object.entries(pkg.dependencies || {}).forEach(([k, v]) => ligne(`  - ${k}: ${v}`));
    ligne("DevDependencies:");
    Object.entries(pkg.devDependencies || {}).forEach(([k, v]) => ligne(`  - ${k}: ${v}`));
    ligne("Scripts:");
    Object.entries(pkg.scripts || {}).forEach(([k, v]) => ligne(`  - ${k}: ${v}`));
  });

  // ------------------------------------------------------------
  titre("11. Fichiers de migrations présents (db/, migrations_rls/)");
  safe("migrations", () => {
    for (const dossier of ["db", "migrations_rls"]) {
      const p = path.join(__dirname, "..", dossier);
      if (!fs.existsSync(p)) { ligne(`(dossier ${dossier} absent)`); continue; }
      ligne(`\n${dossier}/ :`);
      function walk(d, prefixe) {
        fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
          if (e.isDirectory()) walk(path.join(d, e.name), prefixe + e.name + "/");
          else ligne(`  ${prefixe}${e.name}`);
        });
      }
      walk(p, "");
    }
  });

  // ------------------------------------------------------------
  titre("12. Domaines backend existants (src/domains)");
  safe("src/domains", () => {
    const p = path.join(__dirname, "..", "src", "domains");
    if (!fs.existsSync(p)) { ligne("(absent)"); return; }
    fs.readdirSync(p, { withFileTypes: true }).forEach(e => {
      if (e.isDirectory()) {
        ligne(`\n- ${e.name}/`);
        const sous = fs.readdirSync(path.join(p, e.name));
        sous.forEach(f => ligne(`    ${f}`));
      }
    });
  });

  // ------------------------------------------------------------
  titre("13. Routes générées (routes-generated)");
  safe("routes-generated", () => {
    const p = path.join(__dirname, "..", "routes-generated");
    if (!fs.existsSync(p)) { ligne("(absent)"); return; }
    fs.readdirSync(p).forEach(f => ligne(`- ${f}`));
  });

  // ------------------------------------------------------------
  titre("14. Documentation existante (docs/)");
  safe("docs", () => {
    const p = path.join(__dirname, "..", "docs");
    if (!fs.existsSync(p)) { ligne("(absent)"); return; }
    function walk(d, prefixe) {
      fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
        if (e.isDirectory()) walk(path.join(d, e.name), prefixe + e.name + "/");
        else ligne(`  ${prefixe}${e.name}`);
      });
    }
    walk(p, "");
  });

  // ------------------------------------------------------------
  titre("15. Tests existants (tests/)");
  safe("tests", () => {
    const p = path.join(__dirname, "..", "tests");
    if (!fs.existsSync(p)) { ligne("(absent)"); return; }
    function walk(d, prefixe) {
      fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
        if (e.isDirectory()) walk(path.join(d, e.name), prefixe + e.name + "/");
        else ligne(`  ${prefixe}${e.name}`);
      });
    }
    walk(p, "");
  });

  // ------------------------------------------------------------
  titre("16. Dernier état Git (si dépôt initialisé)");
  safe("git", () => {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: path.join(__dirname, "..") }).toString().trim();
    ligne(`Branche courante : ${branch}`);
    const log = execSync('git log -15 --oneline', { cwd: path.join(__dirname, "..") }).toString();
    ligne("15 derniers commits :");
    ligne(log);
    const status = execSync("git status --porcelain", { cwd: path.join(__dirname, "..") }).toString();
    ligne("Fichiers modifiés non commités :");
    ligne(status || "(aucun)");
  });

  // ------------------------------------------------------------
  const contenu = OUT.join("\n");
  const cheminSortie = path.join(__dirname, "..", "AUDIT_PNGIE_RDC.md");
  fs.writeFileSync(cheminSortie, contenu, "utf8");
  console.log(`\nAudit terminé. Rapport écrit dans : ${cheminSortie}`);
  console.log(`Taille du rapport : ${(contenu.length / 1024).toFixed(1)} Ko`);
}

main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });
