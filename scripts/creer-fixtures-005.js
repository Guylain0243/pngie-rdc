// scripts/creer-fixtures-005.js
// Cree les fixtures fixes attendues par tests/e2e/005_affectations.test.js
// (unites, postes, personne neutre, affectations). Idempotent : ne recree
// rien si les lignes existent deja (ON CONFLICT DO NOTHING sur les PK fixes).
// Usage : node scripts/creer-fixtures-005.js
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnvTest() {
  const envPath = path.join(__dirname, "..", ".env.test");
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}

// IDs fixes attendus par tests/e2e/005_affectations.test.js
const POSTE_LIBRE_MIN9_ID = "fd7fdec6-553b-4322-af16-305a83f3ca5f";
const PERSONNE_NEUTRE_ID = "edbf2003-d3ac-4102-aa18-ef0488a70018";
const AFFECTATION_MIN9_ID = "28a9e73f-2c02-406c-be82-5c2c574e87e8";
const AFFECTATION_MIN2_ID = "f59cee7f-2065-4e91-8603-d2dd65355a14";
const POSTE_MIN9_DEJA_POURVU_ID = "51f7f699-0a2a-42e0-9a5e-a295d64c2447";
const POSTE_MIN2_HORS_PERIMETRE_ID = "04b42a20-327a-4a88-b99b-a409e413402e";
const POSTE_MIN2_TITULAIRE_ID = "6c2f8e1a-9b3d-4e5f-8a7c-1d2e3f4a5b6c";
const UNITE_MIN0_ID = "aaaaaaaa-0000-4000-8000-000000000001";
const UNITE_MIN2_ID = "aaaaaaaa-0000-4000-8000-000000000002";

async function main() {
  loadEnvTest();
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    password: process.env.PGPASSWORD,
  });
  await client.connect();
  await client.query(`SELECT set_config('app.bypass_rls', 'true', false)`);

  console.log("=== FIXTURES TEST 005 (bypass_rls actif) ===\n");

  const min0 = await client.query(`SELECT institution_id FROM institution WHERE code = 'MIN_0'`);
  const min2 = await client.query(`SELECT institution_id FROM institution WHERE code = 'MIN_2'`);
  if (min0.rowCount === 0 || min2.rowCount === 0) {
    console.error("ERREUR : institution MIN_0 ou MIN_2 introuvable.");
    process.exit(1);
  }
  const min0Id = min0.rows[0].institution_id;
  const min2Id = min2.rows[0].institution_id;

  // --- Unites organisationnelles ---
  await client.query(
    `INSERT INTO unite_organisationnelle (unite_id, institution_id, code, nom, type_unite, niveau_hierarchique)
     VALUES ($1,$2,'DIR','Direction / Cabinet','Cabinet',1)
     ON CONFLICT (unite_id) DO NOTHING`,
    [UNITE_MIN0_ID, min0Id]
  );
  await client.query(
    `INSERT INTO unite_organisationnelle (unite_id, institution_id, code, nom, type_unite, niveau_hierarchique)
     VALUES ($1,$2,'DIR','Direction / Cabinet','Cabinet',1)
     ON CONFLICT (unite_id) DO NOTHING`,
    [UNITE_MIN2_ID, min2Id]
  );
  console.log("OK unites organisationnelles MIN_0 / MIN_2");

  // --- Postes ---
  await client.query(
    `INSERT INTO poste (poste_id, unite_id, code, intitule, niveau_hierarchique, statut)
     VALUES ($1,$2,'POSTE-LIBRE','Poste libre test E2E',1,'ACTIF')
     ON CONFLICT (poste_id) DO NOTHING`,
    [POSTE_LIBRE_MIN9_ID, UNITE_MIN0_ID]
  );
  await client.query(
    `INSERT INTO poste (poste_id, unite_id, code, intitule, niveau_hierarchique, statut)
     VALUES ($1,$2,'POSTE-POURVU','Poste deja pourvu test E2E',1,'ACTIF')
     ON CONFLICT (poste_id) DO NOTHING`,
    [POSTE_MIN9_DEJA_POURVU_ID, UNITE_MIN0_ID]
  );
  await client.query(
    `INSERT INTO poste (poste_id, unite_id, code, intitule, niveau_hierarchique, statut)
     VALUES ($1,$2,'POSTE-MIN2-A','Poste hors perimetre test E2E',1,'ACTIF')
     ON CONFLICT (poste_id) DO NOTHING`,
    [POSTE_MIN2_HORS_PERIMETRE_ID, UNITE_MIN2_ID]
  );
  await client.query(
    `INSERT INTO poste (poste_id, unite_id, code, intitule, niveau_hierarchique, statut)
     VALUES ($1,$2,'POSTE-MIN2-B','Poste titulaire MIN_2 test E2E',1,'ACTIF')
     ON CONFLICT (poste_id) DO NOTHING`,
    [POSTE_MIN2_TITULAIRE_ID, UNITE_MIN2_ID]
  );
  console.log("OK postes (libre, pourvu, MIN_2 x2)");

  // --- Personne neutre ---
  await client.query(
    `INSERT INTO personne (personne_id, matricule, nom, prenom, email, password_hash, statut)
     VALUES ($1,'NEUTRE-E2E','Neutre','Test','personne-neutre-e2e@pngie.local','x','ACTIF')
     ON CONFLICT (personne_id) DO NOTHING`,
    [PERSONNE_NEUTRE_ID]
  );
  console.log("OK personne neutre");

  // --- Affectations ---
  await client.query(
    `INSERT INTO affectation (affectation_id, personne_id, poste_id, type_affectation, date_debut, statut)
     VALUES ($1,$2,$3,'TITULAIRE','2025-01-01','ACTIF')
     ON CONFLICT (affectation_id) DO NOTHING`,
    [AFFECTATION_MIN9_ID, PERSONNE_NEUTRE_ID, POSTE_MIN9_DEJA_POURVU_ID]
  );
  await client.query(
    `INSERT INTO affectation (affectation_id, personne_id, poste_id, type_affectation, date_debut, statut)
     VALUES ($1,$2,$3,'TITULAIRE','2025-01-01','ACTIF')
     ON CONFLICT (affectation_id) DO NOTHING`,
    [AFFECTATION_MIN2_ID, PERSONNE_NEUTRE_ID, POSTE_MIN2_TITULAIRE_ID]
  );
  console.log("OK affectations MIN_9 (pourvu) / MIN_2");

  console.log("\n=== VERIFICATION ===");
  const check = await client.query(
    `SELECT affectation_id, poste_id, statut FROM affectation WHERE affectation_id IN ($1,$2)`,
    [AFFECTATION_MIN9_ID, AFFECTATION_MIN2_ID]
  );
  console.log(check.rows);

  await client.end();
  console.log("\nTermine.");
}

main().catch(e => { console.error("ERREUR FATALE :", e.message); process.exit(1); });