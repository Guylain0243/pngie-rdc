const crypto = require("crypto");
const db = require("./src/db");

async function main() {
  console.log("===== 1. Creation table relation_type =====");
  await db.run(`
    CREATE TABLE IF NOT EXISTS relation_type (
      code VARCHAR PRIMARY KEY,
      libelle VARCHAR NOT NULL,
      description TEXT,
      statut VARCHAR DEFAULT 'ACTIF',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `);

  console.log("===== 2. Seed des 2 types de relation (Phase 1) =====");
  const types = [
    ["TUTELLE", "Tutelle administrative", "L institution source exerce une autorite hierarchique sur l institution cible"],
    ["COORDINATION", "Coordination", "L institution source coordonne l action de l institution cible sans lien hierarchique direct"]
  ];
  for (const [code, libelle, description] of types) {
    await db.run(
      `INSERT INTO relation_type (code, libelle, description) VALUES (?, ?, ?)
       ON CONFLICT (code) DO NOTHING`,
      [code, libelle, description]
    );
  }

  console.log("===== 3. Creation table institution_relation =====");
  await db.run(`
    CREATE TABLE IF NOT EXISTS institution_relation (
      institution_relation_id UUID PRIMARY KEY,
      institution_source_id UUID NOT NULL REFERENCES institution(institution_id),
      institution_cible_id UUID NOT NULL REFERENCES institution(institution_id),
      type_relation VARCHAR NOT NULL REFERENCES relation_type(code),
      priorite INTEGER DEFAULT 0,
      date_debut DATE DEFAULT CURRENT_DATE,
      date_fin DATE,
      actif BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (institution_source_id, institution_cible_id, type_relation)
    )
  `);

  console.log("===== 4. Migration des institution_parent_id existants (Phase 2) =====");
  const aMigrer = await db.all(`
    SELECT institution_id, institution_parent_id, nom
    FROM institution
    WHERE institution_parent_id IS NOT NULL
  `);
  console.log("A migrer : " + aMigrer.length + " relations");

  let crees = 0, ignores = 0;
  for (const row of aMigrer) {
    const result = await db.run(
      `INSERT INTO institution_relation
         (institution_relation_id, institution_source_id, institution_cible_id, type_relation, priorite)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (institution_source_id, institution_cible_id, type_relation) DO NOTHING`,
      [crypto.randomUUID(), row.institution_parent_id, row.institution_id, "TUTELLE", 0]
    );
    crees++;
  }
  console.log("Relations TUTELLE inserees : " + crees);

  console.log("`n===== 5. Verification finale =====");
  const totalRelations = await db.get(`SELECT COUNT(*) as total FROM institution_relation`);
  const parType = await db.all(`SELECT type_relation, COUNT(*) as total FROM institution_relation GROUP BY type_relation`);
  console.log("Total institution_relation : " + totalRelations.total);
  console.log(parType.map(r => r.type_relation + " : " + r.total).join("\n"));

  const sansRelation = await db.get(`
    SELECT COUNT(*) as total FROM institution i
    WHERE NOT EXISTS (SELECT 1 FROM institution_relation ir WHERE ir.institution_cible_id = i.institution_id)
      AND NOT EXISTS (SELECT 1 FROM institution_relation ir WHERE ir.institution_source_id = i.institution_id)
  `);
  console.log("Institutions sans AUCUNE relation (source ou cible) : " + sansRelation.total + " - a rattacher progressivement (Phase 4)");

  process.exit(0);
}

main().catch(err => { console.error("ERREUR:", err.message); process.exit(1); });
