const db = require("./src/db");
(async () => {
  console.log("--- 1. TABLES ---");
  const tables = await db.all("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log("Total: " + tables.length);
  console.log(tables.map(r => r.tablename).join(", "));

  console.log("`n--- 2. SEQUENCES ---");
  const seq = await db.all("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'");
  console.log(seq.length === 0 ? "Aucune sequence" : seq.map(r => r.sequence_name).join(", "));

  console.log("`n--- 3. FONCTIONS ---");
  const fn = await db.all("SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname");
  console.log("Total: " + fn.length);
  console.log(fn.map(r => r.proname).join(", "));

  console.log("`n--- 4. VUES ---");
  const vues = await db.all("SELECT table_name FROM information_schema.views WHERE table_schema = 'public'");
  console.log("Total: " + vues.length);
  console.log(vues.map(r => r.table_name).join(", "));

  console.log("`n--- 5. TRIGGERS ---");
  const trig = await db.all("SELECT DISTINCT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public'");
  console.log("Total: " + trig.length);
  console.log(trig.map(r => r.trigger_name + " sur " + r.event_object_table).join(", "));

  console.log("`n--- 6. SCHEMAS ET EXTENSIONS ---");
  const sch = await db.all("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog','information_schema','pg_toast')");
  console.log("Schemas: " + sch.map(s => s.schema_name).join(", "));
  const ext = await db.all("SELECT extname FROM pg_extension");
  console.log("Extensions: " + ext.map(e => e.extname).join(", "));

  process.exit(0);
})();
