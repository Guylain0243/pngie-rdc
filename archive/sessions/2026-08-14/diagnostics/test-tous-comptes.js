const emails = ["an@rdc.gouv.cd","ace@rdc.gouv.cd","pm@rdc.gouv.cd","pr@rdc.gouv.cd","sn@rdc.gouv.cd"];
const gateUser = process.env.GATE_USER;
const gatePass = process.env.GATE_PASS;
const basicAuth = "Basic " + Buffer.from(gateUser + ":" + gatePass).toString("base64");

async function main() {
  for (const email of emails) {
    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": basicAuth
        },
        body: JSON.stringify({ email, password: "Pngie#2027" })
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(email, "-> ECHEC LOGIN:", data.error || res.status);
        continue;
      }
      const roles = (data.roles || []).map(r => r.code).join(",");
      console.log(email, "-> OK | roles:", roles);
    } catch (e) {
      console.log(email, "-> ERREUR:", e.message);
    }
  }
}
main();
