const db = require("./src/db");

async function main() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS position_responsabilite (
      responsabilite_id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      libelle TEXT NOT NULL,
      description TEXT,
      ordre INTEGER,
      FOREIGN KEY (position_id) REFERENCES position(position_id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS position_droit_acces (
      droit_id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      portee TEXT,
      FOREIGN KEY (position_id) REFERENCES position(position_id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS position_menu (
      menu_id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      menu_code TEXT NOT NULL,
      libelle TEXT NOT NULL,
      ordre INTEGER,
      FOREIGN KEY (position_id) REFERENCES position(position_id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS position_document (
      document_id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      action TEXT NOT NULL,
      FOREIGN KEY (position_id) REFERENCES position(position_id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS position_interaction (
      interaction_id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      position_cible_id TEXT NOT NULL,
      type_interaction TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (position_id) REFERENCES position(position_id),
      FOREIGN KEY (position_cible_id) REFERENCES position(position_id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS position_kpi (
      kpi_id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      indicateur TEXT NOT NULL,
      cible TEXT,
      unite TEXT,
      FOREIGN KEY (position_id) REFERENCES position(position_id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS position_workflow (
      workflow_item_id TEXT PRIMARY KEY,
      position_id TEXT NOT NULL,
      workflow_code TEXT NOT NULL,
      etape TEXT NOT NULL,
      role_attendu TEXT,
      FOREIGN KEY (position_id) REFERENCES position(position_id)
    )
  `);

  console.log("OK: schema RNPT cree (position_responsabilite, position_droit_acces, position_menu, position_document, position_interaction, position_kpi, position_workflow)");
}

main().catch(err => { console.error(err); process.exit(1); });
