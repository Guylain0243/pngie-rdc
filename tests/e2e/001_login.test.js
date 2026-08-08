const test = require("node:test");
const assert = require("node:assert/strict");
const { login, apiRequest, TEST_ACCOUNTS, LOGIN_PATH } = require("./helpers");

test("001 - Login", async (t) => {
  for (const roleKey of Object.keys(TEST_ACCOUNTS)) {
    await t.test(`connexion reussie pour le compte ${roleKey}`, async () => {
      const token = await login(roleKey);
      assert.equal(typeof token, "string");
      assert.ok(token.length > 10);
    });
  }

  await t.test("400 si email ou mot de passe manquant", async () => {
    const { status } = await apiRequest(null, "POST", LOGIN_PATH, { email: TEST_ACCOUNTS.MI });
    assert.equal(status, 400);
  });

  await t.test("401 avec un mauvais mot de passe", async () => {
    const { status } = await apiRequest(null, "POST", LOGIN_PATH, {
      email: TEST_ACCOUNTS.MI,
      password: "mot_de_passe_deliberement_faux",
    });
    assert.ok(status === 401 || status === 429, `Attendu 401 ou 429, obtenu ${status}`);
  });
});