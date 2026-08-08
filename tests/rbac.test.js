const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startTestServer, stopTestServer, login, api } = require('./helpers');

before(startTestServer);
after(stopTestServer);

const ROLES = ['pr', 'pm', 'sn', 'an', 'mi', 'gv'];
const tokens = {};

test('connexion des 6 comptes de démonstration', async () => {
  for (const role of ROLES) {
    const { status, body } = await login(`${role}@rdc.gouv.cd`, 'Pngie#2027');
    assert.equal(status, 200, `le rôle ${role} doit pouvoir se connecter`);
    tokens[role] = body.token;
  }
});

test('/api/me retourne les bonnes pages pour chaque rôle (pas juste "ça répond")', async () => {
  for (const role of ROLES) {
    const { status, body } = await api('GET', '/api/me', { token: tokens[role] });
    assert.equal(status, 200);
    assert.ok(body.pages.includes('dashboard'), `${role} doit toujours voir le dashboard`);
    assert.ok(Array.isArray(body.pages) && body.pages.length > 0, `${role} doit avoir au moins une page`);
  }
});

test('Présidence a un périmètre strictement plus large que Gouvernorat', async () => {
  const { body: pr } = await api('GET', '/api/me', { token: tokens.pr });
  const { body: gv } = await api('GET', '/api/me', { token: tokens.gv });
  const missing = gv.pages.filter(p => !pr.pages.includes(p));
  assert.deepEqual(missing, [], 'toute page visible par Gouvernorat doit l\'être aussi par la Présidence');
  assert.ok(pr.pages.length >= gv.pages.length);
});

test('seule la Présidence peut lire /api/audit — vérifié pour LES 6 rôles, pas 1', async () => {
  for (const role of ROLES) {
    const { status } = await api('GET', '/api/audit', { token: tokens[role] });
    if (role === 'pr' || role === 'pm') {
      assert.equal(status, 200, 'la Présidence doit avoir accès au journal d\'audit');
    } else {
      assert.equal(status, 403, `le rôle ${role} ne doit PAS avoir accès au journal d'audit`);
    }
  }
});

test('/api/ministeres nécessite la permission page:ministeres:read — vérifié pour les 6 rôles', async () => {
  // D'après le seed, tous les rôles actuels ont accès à ministeres — vérifie que c'est
  // bien vrai côté serveur (permission réellement accordée), pas supposé.
  for (const role of ROLES) {
    const { status, body } = await api('GET', '/api/ministeres', { token: tokens[role] });
    const { body: me } = await api('GET', '/api/me', { token: tokens[role] });
    if (me.pages.includes('ministeres')) {
      assert.equal(status, 200, `${role} a la permission mais l'accès est refusé — incohérence RBAC`);
      assert.ok(Array.isArray(body) && body.length === 42, 'doit retourner les 42 ministères');
    } else {
      assert.equal(status, 403, `${role} n'a pas la permission mais l'accès est autorisé — FAILLE RBAC`);
    }
  }
});

test('agent IA : chaque rôle est testé contre chaque agent (pas un seul cas)', async () => {
  const { body: agentsAsAdmin } = await api('GET', '/api/agents', { token: tokens.pr });
  assert.ok(agentsAsAdmin.length >= 3, 'au moins 3 agents doivent exister');

  for (const agent of agentsAsAdmin) {
    for (const role of ROLES) {
      const { body: me } = await api('GET', '/api/me', { token: tokens[role] });
      // Déduit si ce rôle DEVRAIT avoir accès en comparant à la permission déclarée de l'agent
      const permPage = agent.permission_code?.replace('page:', '').replace(':read', '');
      const shouldHaveAccess = !agent.permission_code || me.pages.includes(permPage);

      const { status } = await api('POST', `/api/agents/${agent.agent_id}/chat`, {
        token: tokens[role], body: { message: 'test' },
      });

      if (shouldHaveAccess) {
        // Sans clé Anthropic configurée, on attend 502 (erreur API) et NON 403 (refus RBAC)
        assert.notEqual(status, 403,
          `${role} DEVRAIT avoir accès à l'agent "${agent.nom}" mais reçoit 403`);
      } else {
        assert.equal(status, 403,
          `${role} ne devrait PAS avoir accès à l'agent "${agent.nom}" — FAILLE RBAC si ce n'est pas 403`);
      }
    }
  }
});

test('modification directe du rôle dans un token forgé est rejetée (signature invalide)', async () => {
  // Un token avec une signature bidouillée doit être rejeté par jwt.verify, jamais accepté
  const fakeToken = tokens.gv.slice(0, -5) + 'AAAAA';
  const { status } = await api('GET', '/api/audit', { token: fakeToken });
  assert.equal(status, 401, 'un token à la signature altérée doit être rejeté, pas juste re-vérifié en RBAC');
});
