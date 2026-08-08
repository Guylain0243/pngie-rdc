const db = require("./src/db");

async function main() {
  await db.run(`
    CREATE TABLE IF NOT EXISTS referentiel_national (
      code TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      description TEXT,
      date_creation TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS referentiel_national_section (
      section_id TEXT PRIMARY KEY,
      referentiel_code TEXT NOT NULL,
      numero INTEGER,
      code_officiel TEXT,
      titre TEXT NOT NULL,
      contenu_texte TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referentiel_code) REFERENCES referentiel_national(code)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS referentiel_national_item (
      item_id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL,
      numero INTEGER,
      libelle TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES referentiel_national_section(section_id)
    )
  `);

  console.log("OK: schema referentiels_nationaux cree (referentiel_national, referentiel_national_section, referentiel_national_item)");
}

main().catch(err => { console.error(err); process.exit(1); });
