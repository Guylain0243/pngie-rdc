const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
async function main() {
  await c.connect();

  const person = await c.query(`SELECT person_id FROM person WHERE email = 'gv@rdc.gouv.cd'`);
  if (person.rows.length === 0) {
    console.error("ECHEC: gv@rdc.gouv.cd introuvable dans person.");
    process.exit(1);
  }
  const personneId = person.rows[0].person_id;

  const res = await c.query(
    `INSERT INTO affectation (affectation_id, personne_id, poste_id, type_affectation, date_debut, statut)
     VALUES (gen_random_uuid(), $1, $2, $3, CURRENT_DATE, $4)
     RETURNING affectation_id`,
    [personneId, "2fc5f5e8-3ddd-4090-83f2-578b2481860a", "NOMINATION", "ACTIF"]
  );
  console.log("Affectation creee avec succes:", res.rows[0]);

  console.log("\n=== Verification finale: resolution via resoudreInstitutionPersonne (requete equivalente) ===");
  const verif = await c.query(`
    SELECT u.institution_id, i.nom AS institution_nom
    FROM affectation a
    JOIN poste p ON p.poste_id = a.poste_id
    JOIN unite_organisationnelle u ON u.unite_id = p.unite_id
    LEFT JOIN institution i ON i.institution_id = u.institution_id
    WHERE a.personne_id = $1 AND a.statut = 'ACTIF' AND a.date_fin IS NULL
    ORDER BY a.date_debut DESC LIMIT 1
  `, [personneId]);
  console.table(verif.rows);

  await c.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
