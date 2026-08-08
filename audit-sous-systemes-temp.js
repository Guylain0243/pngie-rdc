const db = require("./src/db");
(async () => {
  console.log("===== 1. Contenu complet du schema gouvernance =====");
  const tables = await db.all(`SELECT tablename FROM pg_tables WHERE schemaname = 'gouvernance' ORDER BY tablename`);
  console.log("Tables (" + tables.length + "): " + tables.map(t => t.tablename).join(", "));
  const vues = await db.all(`SELECT table_name FROM information_schema.views WHERE table_schema = 'gouvernance'`);
  console.log("Vues (" + vues.length + "): " + vues.map(v => v.table_name).join(", "));
  const fns = await db.all(`SELECT proname FROM pg_proc WHERE pronamespace = 'gouvernance'::regnamespace`);
  console.log("Fonctions (" + fns.length + "): " + fns.map(f => f.proname).join(", "));

  console.log("`n===== 2. Schema de entity_relation et entity_scope =====");
  for (const t of ["entity_relation", "entity_scope"]) {
    const cols = await db.all(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ? ORDER BY ordinal_position`, [t]);
    console.log("--- " + t + " ---");
    console.log(cols.map(c => c.column_name + " (" + c.data_type + ")").join(", "));
    const count = await db.get(`SELECT COUNT(*) as total FROM ${t}`);
    console.log("Lignes: " + count.total);
  }

  console.log("`n===== 3. Definition de la vue rnso_hierarchie =====");
  const def = await db.get(`SELECT view_definition FROM information_schema.views WHERE table_name = 'rnso_hierarchie'`);
  console.log(def ? def.view_definition : "Introuvable");

  console.log("`n===== 4. Ces tables sont-elles utilisees dans le code (routes/src) ? =====");
  process.exit(0);
})();
