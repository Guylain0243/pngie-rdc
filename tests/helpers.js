// Utilitaires de test : lance un VRAI serveur (sous-processus, port dédié,
// base SQLite isolée) plutôt que de mocker quoi que ce soit. Les tests
// parlent HTTP au serveur exactement comme un client réel le ferait.
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const TEST_DB = path.join(ROOT, 'db', 'test.db');
const TEST_PORT = 4111;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Environnement de base pour les sous-processus de test : on part de process.env
// mais on retire DATABASE_URL, qui peut etre definie de facon persistante au
// niveau de la session/utilisateur Windows et ferait sinon basculer src/db.js
// et db/seed.js sur PostgreSQL au lieu de la base SQLite isolee attendue ici.
const testEnv = { ...process.env };
delete testEnv.DATABASE_URL;

let serverProcess = null;

async function startTestServer() {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);

  // Seed la base de test — échoue bruyamment (throw) si le seed plante,
  // pour ne jamais faire tourner des tests contre une base à moitié vide.
  execFileSync('node', ['db/seed.js'], {
    cwd: ROOT,
    env: { ...testEnv, DB_PATH: TEST_DB },
    stdio: 'pipe',
  });

  serverProcess = spawn('node', ['src/server.js'], {
    cwd: ROOT,
    env: { ...testEnv, DB_PATH: TEST_DB, PORT: String(TEST_PORT), JWT_SECRET: 'test-secret-not-for-production-32chars' },
    stdio: 'pipe',
  });

  let stderrBuf = '';
  serverProcess.stderr.on('data', (d) => { stderrBuf += d.toString(); });

  // Attend que /api/health réponde (jusqu'à 5s), plutôt qu'un sleep arbitraire fragile
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) return;
    } catch { /* pas encore prêt */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Le serveur de test ne répond pas après 5s. Stderr:\n' + stderrBuf);
}

function stopTestServer() {
  if (serverProcess) { serverProcess.kill(); serverProcess = null; }
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function api(method, urlPath, { token, body } = {}) {
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let parsed;
  try { parsed = await res.json(); } catch { parsed = null; }
  return { status: res.status, body: parsed };
}

module.exports = { startTestServer, stopTestServer, login, api, BASE_URL, TEST_DB };
