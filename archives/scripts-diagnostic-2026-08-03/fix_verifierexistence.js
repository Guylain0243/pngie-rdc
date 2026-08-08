const fs = require("fs");
const path = "C:\\pngie-rdc\\pngie-backend\\routes-generated\\relations.routes.js";
let content = fs.readFileSync(path, "utf8");

const oldFn = "async function verifierExistence(nomTable, pkColumn, id) {\n    const row = await db.get(`SELECT ${pkColumn} FROM ${nomTable} WHERE ${pkColumn} = ?`, [id]);\n    return !!row;\n}";

const newFn = "async function verifierExistence(nomTable, pkColumn, id) {\n    const row = await db.get(`SELECT fn_entite_existe(?, ?) AS existe`, [nomTable, id]);\n    return !!(row && row.existe);\n}";

if (!content.includes(oldFn)) {
    console.log("ERREUR: bloc exact non trouve.");
    process.exit(1);
}

content = content.replace(oldFn, newFn);
fs.writeFileSync(path, content, "utf8");
console.log("Remplacement effectue avec succes.");