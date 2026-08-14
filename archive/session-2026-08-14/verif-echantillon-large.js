const emails = [
  "pr@rdc.gouv.cd",           // Présidence (doit garder vue nationale)
  "pm@rdc.gouv.cd",           // Primature
  "an@rdc.gouv.cd",           // Assemblée Nationale
  "sn@rdc.gouv.cd",           // Sénat
  "min-14@rdc.gouv.cd",       // Ministère des Mines (MI, spécifique)
  "min-26@rdc.gouv.cd",       // Ministère Santé publique (MI, spécifique)
  "prov-25@rdc.gouv.cd",      // Haut-Katanga (GV, spécifique)
  "gv@rdc.gouv.cd",           // Gouvernorat générique (GV)
  "cour-cass@rdc.gouv.cd",    // Cour de Cassation (MI, spécifique)
  "ville-de-lubumbashi@rdc.gouv.cd" // Ville (GV, spécifique)
];
const gateUser = process.env.GATE_USER;
const gatePass = process.env.GATE_PASS;
const basicAuth = "Basic " + Buffer.from(gateUser + ":" + gatePass).toString("base64");

async function main() {
  console.log('=== ECHANTILLON REPRESENTATIF ===');
  for (const email of emails) {
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": basicAuth },
        body: JSON.stringify({ email, password: "Pngie#2027" })
      });
      const data = await res.json();
      if (!res.ok) { console.log(email.padEnd(35), "-> ECHEC:", data.error); continue; }
      const role = (data.roles || [])[0];
      const code = role ? role.code : 'AUCUN';
      const restricted = code !== 'PR';
      console.log(email.padEnd(35), "-> role:", code.padEnd(4), "| nom:", (data.person.nom||'').padEnd(15), "| restricted attendu:", restricted);
    } catch (e) {
      console.log(email.padEnd(35), "-> ERREUR:", e.message);
    }
  }
}
main();
