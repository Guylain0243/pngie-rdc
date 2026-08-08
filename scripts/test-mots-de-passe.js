const { Client } = require("pg");

async function testConnexion(label, user, password, database) {
  const c = new Client({ host: "localhost", port: 5432, user, password, database });
  try {
    await c.connect();
    console.log(`${label} : OK`);
    await c.end();
  } catch (e) {
    console.log(`${label} : ECHEC (${e.code || ""} ${e.message})`);
  }
}

async function main() {
  await testConnexion("postgres / mot de passe DATABASE_URL / pngie_rdc", "postgres", "Merci@002432026", "pngie_rdc");
  await testConnexion("pngie_app / meme mot de passe / pngie_rdc", "pngie_app", "Merci@002432026", "pngie_rdc");
  await testConnexion("pngie_app / meme mot de passe / pngie_rdc_rls_test", "pngie_app", "Merci@002432026", "pngie_rdc_rls_test");
}
main();
