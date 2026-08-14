const { Client } = require('pg');
const c = new Client({ connectionString: process.env.DATABASE_URL });
const gateUser = process.env.GATE_USER;
const gatePass = process.env.GATE_PASS;
const basicAuth = "Basic " + Buffer.from(gateUser + ":" + gatePass).toString("base64");

async function main() {
  await c.connect();
  const r = await c.query(`SELECT DISTINCT p.email FROM person p ORDER BY p.email`);
  await c.end();

  let ok = 0, fail = 0;
  const echecs = [];

  for (const row of r.rows) {
    const email = row.email;
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": basicAuth },
        body: JSON.stringify({ email, password: "Pngie#2027" })
      });
      const data = await res.json();
      if (!res.ok) { fail++; echecs.push(email + ' -> ' + (data.error || res.status)); continue; }
      ok++;
    } catch (e) {
      fail++; echecs.push(email + ' -> ERREUR: ' + e.message);
    }
  }

  console.log('=== RESULTAT SUR', r.rows.length, 'COMPTES ===');
  console.log('OK:', ok, '| ECHECS:', fail);
  if (echecs.length > 0) {
    console.log('');
    console.log('--- Comptes en echec ---');
    echecs.forEach(e => console.log(e));
  }
}
main().catch(e => { console.error('ERREUR:', e.message); process.exit(1); });
