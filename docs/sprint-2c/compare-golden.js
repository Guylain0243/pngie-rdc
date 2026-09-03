const fs = require("fs");
function stripComments(content) {
  return content.split("\n")
    .filter(l => !l.trim().startsWith("--") && l.trim() !== "")
    .join("\n").trim();
}
const ref = stripComments(fs.readFileSync("docs/sprint-2c/acte-officiel-reference.sql", "utf8"));
const gen = stripComments(fs.readFileSync("docs/sprint-2c/generated/acte_officiel.sql", "utf8"));
if (ref === gen) {
  console.log("SUCCESS - generation identique a la Golden Reference");
} else {
  console.log("FAIL - differences detectees:");
  const refLines = ref.split("\n"), genLines = gen.split("\n");
  const max = Math.max(refLines.length, genLines.length);
  for (let i = 0; i < max; i++) {
    if (refLines[i] !== genLines[i]) {
      console.log(`  Ligne ${i+1}:`);
      console.log(`    REF: ${refLines[i] ?? "(absente)"}`);
      console.log(`    GEN: ${genLines[i] ?? "(absente)"}`);
    }
  }
}
