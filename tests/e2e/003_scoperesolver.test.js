const { test } = require("node:test");
const assert = require("node:assert");
const { login, apiRequest, resolveAgentByMatricule } = require("./helpers");

let AGENT_ID;

test("003 - ScopeResolver agent", async (t) => {
  AGENT_ID = await resolveAgentByMatricule("TESTSCOPE-006");

  await t.test("MI voit l'agent de son perimetre (200)", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", `/api/agents-rh/${AGENT_ID}`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("PR (perimetre national) voit aussi l'agent (200)", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", `/api/agents-rh/${AGENT_ID}`);
    assert.strictEqual(res.status, 200);
  });

  await t.test("AN refuse (403) hors perimetre sur agent precis", async () => {
    const token = await login("AN");
    const res = await apiRequest(token, "GET", `/api/agents-rh/${AGENT_ID}`);
    assert.strictEqual(res.status, 403);
  });

  await t.test("MI voit l'agent dans la liste filtree", async () => {
    const token = await login("MI");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 200);
    const ids = (res.body.data || []).map((a) => a.agent_id);
    assert.ok(ids.includes(AGENT_ID), "L'agent de test devrait apparaitre dans la liste filtree pour MI");
  });

  await t.test("PR voit aussi l'agent dans sa liste (perimetre national)", async () => {
    const token = await login("PR");
    const res = await apiRequest(token, "GET", "/api/agents-rh");
    assert.strictEqual(res.status, 200);
    const ids = (res.body.data || []).map((a) => a.agent_id);
    assert.ok(ids.includes(AGENT_ID), "PR devrait voir l'agent de MI (perimetre national)");
  });
});

