const db = require("./src/db");
(async () => {
  try {
    await db.run(`ALTER TABLE agent ADD CONSTRAINT agent_personne_id_fkey FOREIGN KEY (personne_id) REFERENCES personne(personne_id)`);
    console.log("Contrainte agent_personne_id_fkey ajoutee.");
  } catch (e) {
    console.log("Info:", e.message);
  }
  process.exit(0);
})();
