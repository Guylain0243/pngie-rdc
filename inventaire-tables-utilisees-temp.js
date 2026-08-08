const fs = require("fs");
const path = require("path");

function listerFichiersJS(dir) {
  let fichiers = [];
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) {
      if (item !== "node_modules") fichiers = fichiers.concat(listerFichiersJS(p));
    } else if (item.endsWith(".js")) {
      fichiers.push(p);
    }
  }
  return fichiers;
}

const db = require("./src/db");

(async () => {
  const tablesReelles = await db.all("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  const fichiers = [...listerFichiersJS("./routes-generated"), ...listerFichiersJS("./src")];
  const contenu = fichiers.map(f => fs.readFileSync(f, "utf8")).join("\n");

  const utilisees = [];
  const nonUtilisees = [];
  for (const t of tablesReelles) {
    const regex = new RegExp("\\b" + t.tablename + "\\b");
    if (regex.test(contenu)) utilisees.push(t.tablename);
    else nonUtilisees.push(t.tablename);
  }

  console.log("===== TABLES REELLEMENT REFERENCEES DANS LE CODE (" + utilisees.length + ") =====");
  console.log(utilisees.join(", "));

  console.log("`n===== TABLES NON REFERENCEES - candidates a EXCLURE des GRANT (" + nonUtilisees.length + ") =====");
  console.log(nonUtilisees.join(", "));

  process.exit(0);
})();
