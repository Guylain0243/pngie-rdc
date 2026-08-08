const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const fonctions = [
    "fn_rnsj_texte_historiser",
    "fn_indexer_document",
    "fn_detecter_anomalie_connexion"
  ];

  for (const nom of fonctions) {
    const res = await client.query(
      "SELECT prosrc FROM pg_proc WHERE proname = $1",
      [nom]
    );
    console.log(`\n=== ${nom} ===\n`);
    console.log(res.rows.length ? res.rows[0].prosrc : "NON TROUVEE");
  }

  await client.end();
}

main().catch(err => { console.error(err); process.exit(1); });
