const db = require("./src/db");

async function main() {
  const colonnes = ["valide_par_budget", "valide_par_finances", "valide_par_primature", "valide_par_presidence", "valide_par_igf"];
  for (const col of colonnes) {
    try {
      await db.run(`ALTER TABLE ordre_paiement ADD COLUMN ${col} TEXT DEFAULT 'NON'`);
      console.log("OK: colonne " + col + " ajoutee");
    } catch (err) {
      console.log("SKIP: " + col + " (" + err.message + ")");
    }
  }
}

main().catch(err => { console.error(err); process.exit(1); });
