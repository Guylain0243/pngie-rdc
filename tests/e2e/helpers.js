const fs = require("node:fs");
const path = require("node:path");

const BASE_URL = process.env.PNGIE_API_URL || "http://localhost:4000";
const LOGIN_PATH = process.env.PNGIE_LOGIN_PATH || "/api/auth/login";

if (!process.env.PNGIE_TEST_PASSWORD) {
  throw new Error(
    "PNGIE_TEST_PASSWORD non definie. " +
    "Executer : $env:PNGIE_TEST_PASSWORD = '...' avant de lancer les tests."
  );
}

const TEST_ACCOUNTS = {
  AN: "test-an@pngie.local",
  GV: "test-gv@pngie.local",
  MI: "test-mi@pngie.local",
  PM: "test-pm@pngie.local",
  PR: "test-pr@pngie.local",
  SN: "test-sn@pngie.local",
};

const TEST_PASSWORD = process.env.PNGIE_TEST_PASSWORD;
const CACHE_FILE = path.join(__dirname, ".token-cache.json");
const GATE_USER = process.env.GATE_USER;
const GATE_PASS = process.env.GATE_PASS;
const GATE_AUTH = (GATE_USER && GATE_PASS) ? "Basic " + Buffer.from(GATE_USER + ":" + GATE_PASS).toString("base64") : null;

function readCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")); }
  catch { return {}; }
}
function writeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), "utf8");
}
function decodeExp(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return payload.exp || null;
  } catch { return null; }
}

async function login(roleKey) {
  const email = TEST_ACCOUNTS[roleKey];
  if (!email) throw new Error(`Compte de test inconnu : ${roleKey}`);

  const cache = readCache();
  const cached = cache[roleKey];
  if (cached) {
    const exp = decodeExp(cached);
    const stillValid = !exp || exp * 1000 > Date.now() + 60000;
    if (stillValid) return cached;
  }

  const res = await fetch(`${BASE_URL}${LOGIN_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(GATE_AUTH ? { Authorization: GATE_AUTH } : {}) },
    body: JSON.stringify({ email, password: TEST_PASSWORD }),
  });

  if (res.status === 429) {
    throw new Error(`Limite de tentatives (429) pour ${email}. Attendre 15 minutes.`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Login echoue pour ${email} (${res.status}) : ${body}`);
  }

  const data = await res.json();
  const token = data.token;
  if (!token) {
    throw new Error(`Pas de champ 'token' dans la reponse. Cles : ${Object.keys(data).join(", ")}`);
  }
  cache[roleKey] = token;
  writeCache(cache);
  return token;
}

function clearTokenCache() {
  try { fs.unlinkSync(CACHE_FILE); } catch {}
}

async function apiRequest(token, method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, body: json };
}

module.exports = { BASE_URL, TEST_ACCOUNTS, TEST_PASSWORD, LOGIN_PATH, login, apiRequest, clearTokenCache };
