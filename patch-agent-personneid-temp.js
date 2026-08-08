const fs = require("fs");
const path = "routes-generated/agent.routes.js";
let content = fs.readFileSync(path, "utf8");

const oldSchema = `  institution_id: { type: "uuid", required: true },`;
const newSchema = `  institution_id: { type: "uuid", required: true },
  personne_id: { type: "uuid" },`;
if (!content.includes(oldSchema)) { console.log("ECHEC ancre schema"); process.exit(1); }
content = content.replace(oldSchema, newSchema);

const oldInsert = `        \`INSERT INTO agent (agent_id, nom, prenom, date_naissance, matricule, numero_identite_nationale, sexe, email, telephone, institution_id, grade_id, corps_id, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
        [id, b.nom, b.prenom, b.date_naissance, b.matricule, b.numero_identite_nationale || null, b.sexe, b.email || null, b.telephone || null, b.institution_id, b.grade_id || null, b.corps_id || null, b.statut || "ACTIF"]`;
const newInsert = `        \`INSERT INTO agent (agent_id, nom, prenom, date_naissance, matricule, numero_identite_nationale, sexe, email, telephone, institution_id, grade_id, corps_id, personne_id, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
        [id, b.nom, b.prenom, b.date_naissance, b.matricule, b.numero_identite_nationale || null, b.sexe, b.email || null, b.telephone || null, b.institution_id, b.grade_id || null, b.corps_id || null, b.personne_id || null, b.statut || "ACTIF"]`;
if (!content.includes(oldInsert)) { console.log("ECHEC ancre insert"); process.exit(1); }
content = content.replace(oldInsert, newInsert);

fs.writeFileSync(path, content, "utf8");
console.log("SUCCES : agent.routes.js accepte desormais personne_id.");
