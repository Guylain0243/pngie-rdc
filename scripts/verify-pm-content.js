// scripts/verify-pm-content.js
// Verifie si /api/agents-rh renvoie reellement des donnees pour PM (scope
// national, scope_institution_id NULL) apres la migration institution_scope,
// et pas juste un 200 avec une liste vide.
// Usage : node scripts/verify-pm-content.js
const BASE_URL = process.env.PNGIE_API_URL || 'http://localhost:4000';
const GATE_USER = process.env.GATE_USER;
const GATE_PASS = process.env.GATE_PASS;
const GATE_AUTH = (GATE_USER && GATE_PASS) ? 'Basic ' + Buffer.from(`${GATE_USER}:${GATE_PASS}`).toString('base64') : null;

async function main() {
  if (!process.env.PNGIE_TEST_PASSWORD) {
    console.error('ERREUR : PNGIE_TEST_PASSWORD non definie dans cette fenetre.');
    process.exit(1);
  }

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(GATE_AUTH ? { Authorization: GATE_AUTH } : {}) },
    body: JSON.stringify({ email: 'test-pm@pngie.local', password: process.env.PNGIE_TEST_PASSWORD }),
  });
  if (!loginRes.ok) {
    console.error('Login PM echoue :', loginRes.status, await loginRes.text());
    process.exit(1);
  }
  const { token } = await loginRes.json();

  // IMPORTANT : uniquement le Bearer token ici, pas GATE_AUTH (cf.
  // tests/e2e/helpers.js -> apiRequest n'utilise jamais GATE_AUTH,
  // seulement login() en a besoin).
  const res = await fetch(`${BASE_URL}/api/agents-rh`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => null);

  console.log('Statut :', res.status);
  const arr = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : null;
  console.log('Nombre d\'agents renvoyes pour PM :', arr ? arr.length : '(forme inattendue)');
  if (!arr) {
    console.log('Corps brut :', JSON.stringify(body).slice(0, 500));
  }

  if (arr && arr.length === 0) {
    console.log('\n!!! REGRESSION CONFIRMEE : PM recoit un 200 mais une liste VIDE.');
    console.log('    La visibilite nationale de PM est cassee par la migration institution_scope.');
  } else if (arr && arr.length > 0) {
    console.log('\nOK : PM recoit bien', arr.length, 'agent(s). Pas de regression detectee ici.');
  }
}

main().catch((err) => { console.error('ERREUR :', err.message); process.exit(1); });
