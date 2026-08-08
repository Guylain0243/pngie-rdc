// Teste directement au niveau base de données (pas d'endpoint API dédié pour
// l'instant) que les 18 nouvelles tables existent, sont peuplées et que
// leurs relations (clés étrangères) sont cohérentes.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

const TEST_DB = path.join(__dirname, 'extension-test.db');
process.env.DB_PATH = TEST_DB;
delete process.env.DATABASE_URL;

let db;

before(async () => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  const Database = require('better-sqlite3');
  const sqlite = new Database(TEST_DB);
  sqlite.exec(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sqlite.sql'), 'utf8'));
  sqlite.close();

  db = require('../src/db');
  // Minimum de données de référence dont dépend seed-extension.js
  const crypto = require('crypto');
  const uuid = () => crypto.randomUUID();
  await db.run(`INSERT INTO organization_type VALUES (1,'PRESIDENCE','Présidence',NULL)`);
  const orgId = uuid();
  await db.run(`INSERT INTO organization (organization_id,code,nom,type_id,niveau) VALUES (?,?,?,?,?)`,
    [orgId, 'PR', 'Présidence', 1, 0]);
  const personId = uuid();
  await db.run(`INSERT INTO person (person_id,nom,email,password_hash) VALUES (?,?,?,?)`,
    [personId, 'Test', 'test@rdc.gouv.cd', 'x']);

  const seedExtension = require('../db/seed-extension');
  await seedExtension();
});

after(async () => {
  await db.close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

test('les 18 tables de l\'extension existent et sont peuplées', async () => {
  const tables = [
    'tribunal', 'magistrat', 'dossier_judiciaire', 'jugement',
    'etablissement_sante', 'patient', 'consultation', 'campagne_vaccination',
    'entreprise', 'permis_minier', 'exploitation_agricole', 'projet_energie',
    'infrastructure_projet', 'parcelle_cadastrale',
    'mfa_backup_code', 'mfa_event', 'pki_certificate', 'pki_signature',
  ];
  for (const t of tables) {
    const row = await db.get(`SELECT count(*) as n FROM ${t}`);
    assert.ok(row.n >= 1, `la table ${t} doit contenir au moins une ligne, trouvé ${row.n}`);
  }
});

test('le jugement est bien lié à un dossier et à un magistrat existants (intégrité FK)', async () => {
  const jugement = await db.get(`SELECT * FROM jugement LIMIT 1`);
  assert.ok(jugement);
  const dossier = await db.get(`SELECT * FROM dossier_judiciaire WHERE dossier_id = ?`, [jugement.dossier_id]);
  const magistrat = await db.get(`SELECT * FROM magistrat WHERE magistrat_id = ?`, [jugement.magistrat_id]);
  assert.ok(dossier, 'le dossier référencé par le jugement doit exister');
  assert.ok(magistrat, 'le magistrat référencé par le jugement doit exister');
});

test('la contrainte de la table jugement rejette un type de nature judiciaire invalide', async () => {
  const crypto = require('crypto');
  const trib = await db.get(`SELECT tribunal_id FROM tribunal LIMIT 1`);
  await assert.rejects(
    db.run(
      `INSERT INTO dossier_judiciaire (dossier_id, numero_dossier, tribunal_id, nature) VALUES (?,?,?,?)`,
      [crypto.randomUUID(), 'INVALID-TEST', trib.tribunal_id, 'NATURE_INEXISTANTE']
    ),
    'une nature de dossier hors de la liste CHECK autorisée doit être rejetée'
  );
});

test('pki_signature référence bien un certificat actif et un document réel', async () => {
  const sig = await db.get(`SELECT * FROM pki_signature LIMIT 1`);
  assert.ok(sig);
  const cert = await db.get(`SELECT * FROM pki_certificate WHERE certificate_id = ?`, [sig.certificate_id]);
  assert.ok(cert, 'le certificat référencé doit exister');
  assert.equal(cert.statut, 'ACTIF');
  assert.ok(sig.document_id, 'la signature doit référencer un document');
});

test('le code de secours MFA est haché, jamais stocké en clair', async () => {
  const code = await db.get(`SELECT * FROM mfa_backup_code LIMIT 1`);
  assert.ok(code);
  assert.notEqual(code.code_hash, 'BACKUP-CODE-DEMO-0001', 'le code ne doit jamais apparaître en clair en base');
  assert.match(code.code_hash, /^\$2[aby]\$/, 'le hash doit être un hash bcrypt valide');
});
