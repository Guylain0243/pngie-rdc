const { Client } = require("pg");

const NEW_PASSWORD = "PgSuperUser-2026-Definitif!Xk9m";

async function main() {
  // Connexion SANS mot de passe (trust actif pour ce test uniquement)
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    database: "postgres",
  });
  await client.connect();
  console.log("Connecté sans mot de passe (trust actif).");

  await client.query(`ALTER USER postgres WITH PASSWORD '${NEW_PASSWORD}'`);
  console.log("Mot de passe de 'postgres' mis à jour.");

  await client.end();

  console.log(`\nNOUVEAU MOT DE PASSE POSTGRES : ${NEW_PASSWORD}`);
  console.log("Notez-le, il sera stocké dans .env.admin.local à l'étape suivante.");
}
main().catch(e => { console.error("ERREUR :", e.message); process.exit(1); });
