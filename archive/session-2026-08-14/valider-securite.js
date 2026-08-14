const gateUser = process.env.GATE_USER;
const gatePass = process.env.GATE_PASS;
const basicAuth = "Basic " + Buffer.from(gateUser + ":" + gatePass).toString("base64");
const BASE = "http://localhost:4000";

const comptes = [
  "an@rdc.gouv.cd", "sn@rdc.gouv.cd", "ace@rdc.gouv.cd", "gv@rdc.gouv.cd",
  "pr@rdc.gouv.cd", "pm@rdc.gouv.cd", "mi@rdc.gouv.cd"
];

async function login(email) {
  const res = await fetch(BASE + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": basicAuth },
    body: JSON.stringify({ email, password: "Pngie#2027" })
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, token: data.token };
}

async function call(path, token) {
  const res = await fetch(BASE + path, {
    headers: { "Authorization": "Bearer " + token }
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

async function main() {
  const lignes = [];
  lignes.push("=== RAPPORT DE VALIDATION - " + new Date().toISOString() + " ===\n");

  // 1. Login + /api/me pour chaque compte
  const tokens = {};
  for (const email of comptes) {
    const login1 = await login(email);
    if (!login1.ok) {
      lignes.push(`[LOGIN] ${email} -> ECHEC (status ${login1.status})`);
      continue;
    }
    tokens[email] = login1.token;
    const me = await call("/api/me", login1.token);
    lignes.push(`[LOGIN] ${email} -> OK | /api/me status=${me.status} | roles=${JSON.stringify(me.body && me.body.roles)}`);
  }

  lignes.push("");

  // 2. Recuperer la liste des institutions (via PR, compte national)
  const listeRes = await call("/api/institutions/liste", tokens["pr@rdc.gouv.cd"]);
  let toutesInstitutions = [];
  if (listeRes.status === 200 && listeRes.body) {
    for (const type of Object.keys(listeRes.body)) {
      toutesInstitutions.push(...listeRes.body[type]);
    }
  }
  lignes.push(`[INSTITUTIONS] Total trouve: ${toutesInstitutions.length}`);
  lignes.push("");

  // 3. Pour chaque compte restreint, tester le dashboard sur 2 institutions AU HASARD (test de fuite)
  const idsTest = toutesInstitutions.slice(0, 3).map(i => i.institution_id);
  lignes.push("=== TEST FUITE DASHBOARD (route /institutions/:id/dashboard) ===");
  for (const email of comptes) {
    if (!tokens[email]) continue;
    for (const id of idsTest) {
      const r = await call(`/api/institutions/${id}/dashboard`, tokens[email]);
      const nom = r.body && r.body.institution ? r.body.institution.nom : "N/A";
      lignes.push(`${email} -> institution_id=${id} -> status=${r.status} -> nom_retourne="${nom}"`);
    }
  }
  lignes.push("");

  // 4. Pour chaque compte, tester ligne_budgetaires et dossier_agent_rhs (widgets NON DISPONIBLE)
  lignes.push("=== TEST WIDGETS BUDGET / AGENTS RH (scope propre) ===");
  for (const email of comptes) {
    if (!tokens[email]) continue;
    const budget = await call("/api/ligne_budgetaires", tokens[email]);
    const agents = await call("/api/dossier_agent_rhs", tokens[email]);
    const budgetInfo = budget.status === 200 ? `${budget.body.length} ligne(s)` : `ERREUR ${budget.status}`;
    const agentsInfo = agents.status === 200 ? `${agents.body.length} dossier(s)` : `ERREUR ${agents.status}`;
    lignes.push(`${email} -> budget: status=${budget.status} (${budgetInfo}) | agents_rh: status=${agents.status} (${agentsInfo})`);
  }

  const rapport = lignes.join("\n");
  require("fs").writeFileSync("rapport-validation.txt", rapport, "utf8");
  console.log(rapport);
}

main().catch(e => console.error("ERREUR FATALE:", e.message));
