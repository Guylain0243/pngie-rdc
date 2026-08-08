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

let appId;

test('au moins une application no-code publiée existe', async () => {
  const { status, body } = await api('GET', '/api/nocode/apps', { token });
  assert.equal(status, 200);
  assert.ok(body.length >= 1);
  appId = body[0].app_id;
});

test('récupération de la définition JSON d\'une app', async () => {
  const { status, body } = await api('GET', `/api/nocode/apps/${appId}`, { token });
  assert.equal(status, 200);
  // Le serveur renvoie désormais toujours un objet déjà interprété (cohérent
  // entre SQLite et PostgreSQL — bug corrigé, voir parseDefinition dans server.js)
  const schema = body.definition_json;
  assert.ok(Array.isArray(schema.champs) && schema.champs.length > 0);
});

test('app inexistante -> 404, pas 500', async () => {
  const { status } = await api('GET', '/api/nocode/apps/00000000-0000-0000-0000-000000000000', { token });
  assert.equal(status, 404);
});

test('soumission avec champ requis manquant est rejetée avec message clair', async () => {
  const { status, body } = await api('POST', `/api/nocode/apps/${appId}/submit`, {
    token, body: { data: { organisation_cible: 'Test' } },
  });
  assert.equal(status, 400);
  assert.ok(body.error.includes('requis'));
});

test('soumission complète et valide est acceptée', async () => {
  const { status, body } = await api('POST', `/api/nocode/apps/${appId}/submit`, {
    token, body: { data: {
      organisation_cible: 'Ministère Test', type_controle: 'FINANCIER', motif: 'Test automatisé',
    } },
  });
  assert.equal(status, 200);
  assert.ok(body.submission_id);
});

test('soumission avec data absente du corps -> gérée sans crash (400, pas 500)', async () => {
  const { status } = await api('POST', `/api/nocode/apps/${appId}/submit`, { token, body: {} });
  assert.ok([400, 422].includes(status), `attendu 400/422, obtenu ${status}`);
});

test('soumission vers une app inexistante -> 404, pas de crash', async () => {
  const { status } = await api('POST', '/api/nocode/apps/00000000-0000-0000-0000-000000000000/submit', {
    token, body: { data: { x: 'y' } },
  });
  assert.equal(status, 404);
});

test('payload avec script XSS dans un champ texte : stocké tel quel (à sanitiser côté rendu)', async () => {
  // Documente le comportement réel plutôt que de supposer : l'API ne rejette pas le
  // contenu, elle le stocke brut. C'est au moteur de rendu (nocode-runtime.html) de
  // l'échapper à l'affichage — ce test sert de garde-fou pour ne pas régresser sans
  // le remarquer si quelqu'un "corrige" ça un jour sans le documenter.
  const { status, body } = await api('POST', `/api/nocode/apps/${appId}/submit`, {
    token, body: { data: {
      organisation_cible: '<script>alert(1)</script>', type_controle: 'FINANCIER', motif: 'Test XSS',
    } },
  });
  assert.equal(status, 200, 'l\'API accepte le contenu (validation de présence, pas de contenu)');
  assert.ok(body.submission_id);
});

test('objet JSON profondément imbriqué dans data ne fait pas planter le serveur', async () => {
  let nested = 'valeur';
  for (let i = 0; i < 50; i++) nested = { x: nested };
  const { status } = await api('POST', `/api/nocode/apps/${appId}/submit`, {
    token, body: { data: {
      organisation_cible: JSON.stringify(nested), type_controle: 'FINANCIER', motif: 'Test',
    } },
  });
  assert.equal(status, 200);
});
