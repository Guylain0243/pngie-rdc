const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, login, api } = require('./helpers');

let token;
before(async () => {
  await startTestServer();
  const { body } = await login('pr@rdc.gouv.cd', 'Pngie#2027');
  token = body.token;
});
after(stopTestServer);

test('le cycle de gouvernance est complet et cohérent de bout en bout', async () => {
  const { status, body } = await api('GET', '/api/gouvernance/cycle', { token });
  assert.equal(status, 200);
  assert.ok(body.instructions.length >= 1, 'au moins une instruction');
  assert.ok(body.rapports.length >= 1, 'au moins un rapport');
  assert.ok(body.controles.length >= 1, 'au moins un contrôle');
  assert.ok(body.recommandations.length >= 1, 'au moins une recommandation');
  assert.ok(body.decisions.length >= 1, 'au moins une décision');
  assert.ok(body.suivis.length >= 1, 'au moins un suivi');

  const instr = body.instructions[0];
  const rapport = body.rapports.find(r => r.instruction_id === instr.instruction_id);
  assert.ok(rapport, 'le rapport doit être lié à l\'instruction dont il découle');
});

test('le registre d\'intégration contient bien 44 systèmes classés par catégorie', async () => {
  const { status, body } = await api('GET', '/api/integrations', { token });
  assert.equal(status, 200);
  assert.equal(body.systemes.length, 44);
  const kolecto = body.systemes.find(s => s.nom === 'Kolecto');
  assert.ok(kolecto, 'Kolecto doit être présent');
  assert.equal(kolecto.categorie, 'ERP_Finances');
});

test('résumé de base : aucune table en erreur (null)', async () => {
  const { status, body } = await api('GET', '/api/db-summary', { token });
  assert.equal(status, 200);
  const nullTables = Object.entries(body.counts).filter(([, v]) => v === null).map(([k]) => k);
  assert.deepEqual(nullTables, [], 'aucune table ne doit être absente/en erreur');
});

test('les 42 ministères et 26 provinces réels sont bien en base', async () => {
  const { body: ministeres } = await api('GET', '/api/ministeres', { token });
  const { body: provinces } = await api('GET', '/api/provinces', { token });
  assert.equal(ministeres.length, 42);
  assert.equal(provinces.length, 26);
  assert.ok(provinces.some(p => p.nom === 'Kinshasa'));
  assert.ok(ministeres.some(m => m.nom.includes('Finances')));
});
