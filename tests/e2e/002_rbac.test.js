const { test } = require("node:test");
const assert = require("node:assert");
const { login, apiRequest } = require("./helpers");

test("002 - RBAC agent/affectation", async (t) => {
  await t.test("MI a acces lecture sur /api/agents-rh", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 200);
  });

  await t.test("MI a acces lecture sur /api/affectations", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 200);
  });

  await t.test("PM a acces lecture sur /api/agents-rh", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 200);
  });

  await t.test("PR a acces lecture sur /api/affectations", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 200);
  });

  await t.test("AN refuse (403) sur /api/agents-rh", async () => {
    const token = await login("AN");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 403);
  });

  await t.test("GV refuse (403) sur /api/affectations", async () => {
    const token = await login("GV");
    const res = await apiRequest(token, "GET", "/api/affectations");
    assert.strictEqual(res.status, 403);
  });

  await t.test("SN refuse (403) sur /api/agents-rh", async () => {
    const token = await login("SN");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 403);
  });

  await t.test("PM refuse (403) en ecriture sur /api/agents-rh", async () => {
    const token = await login("PM");
    const res = await apiRequest(token, "POST", "/api/agents-rh", {});
    assert.strictEqual(res.status, 403);
  });
});
