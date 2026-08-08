const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, login, api } = require('./helpers');

before(startTestServer);
after(stopTestServer);

test('connexion avec identifiants valides retourne un token', async () => {
  const { status, body } = await login('pr@rdc.gouv.cd', 'Pngie#2027');
  assert.equal(status, 200);
  assert.ok(body.token, 'un token doit être retourné');
  assert.equal(body.person.email, 'pr@rdc.gouv.cd');
});

test('connexion avec mauvais mot de passe est refusée', async () => {
  const { status, body } = await login('pr@rdc.gouv.cd', 'mauvais_mdp');
  assert.equal(status, 401);
  assert.ok(!body.token);
});

test('connexion avec email inexistant est refusée (pas de fuite d\'info)', async () => {
  const { status, body } = await login('inexistant@rdc.gouv.cd', 'peu importe');
  assert.equal(status, 401);
  // Le message ne doit pas révéler si c'est l'email ou le mdp qui est faux
  assert.equal(body.error, 'Identifiants invalides.');
});

test('connexion sans email ni mot de passe -> 400, pas de crash serveur', async () => {
  const { status } = await api('POST', '/api/auth/login', { body: {} });
  assert.equal(status, 400);
});

test('connexion avec corps JSON complètement absent -> gérée proprement', async () => {
  const res = await fetch(`${require('./helpers').BASE_URL}/api/auth/login`, { method: 'POST' });
  assert.ok([400, 401, 415].includes(res.status), `statut inattendu: ${res.status}`);
});

test('tentative d\'injection SQL dans le champ email ne casse rien et échoue proprement', async () => {
  const { status } = await login("' OR '1'='1", "x");
  assert.equal(status, 401, "l'injection ne doit ni planter le serveur ni contourner l'auth");
});

test('mot de passe extrêmement long (10000 caractères) est géré sans crash', async () => {
  const longPassword = 'a'.repeat(10000);
  const { status } = await login('pr@rdc.gouv.cd', longPassword);
  assert.equal(status, 401);
});

test('email avec caractères unicode/emoji ne casse pas le serveur', async () => {
  const { status } = await login('日本語🎉@test.cd', 'x');
  assert.equal(status, 401);
});

test('endpoint protégé sans token -> 401', async () => {
  const { status } = await api('GET', '/api/ministeres');
  assert.equal(status, 401);
});

test('endpoint protégé avec token malformé -> 401, pas de crash', async () => {
  const { status } = await api('GET', '/api/ministeres', { token: 'ceci.nest.pas.un.jwt.valide' });
  assert.equal(status, 401);
});

test('endpoint protégé avec header Authorization sans "Bearer " -> 401', async () => {
  const res = await fetch(`${require('./helpers').BASE_URL}/api/ministeres`, {
    headers: { Authorization: 'sk-fake-token-sans-bearer' },
  });
  assert.equal(res.status, 401);
});

test('rate limiting : 11 tentatives de connexion rapprochées déclenchent un 429', async () => {
  // Utilise un email dédié pour ne pas polluer les autres tests avec le blocage IP partagé
  let last;
  for (let i = 0; i < 11; i++) {
    last = await login('pr@rdc.gouv.cd', 'mauvais_mdp_' + i);
  }
  assert.equal(last.status, 429, 'la 11e tentative doit être bloquée par le rate limiting');
});
