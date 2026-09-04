const fs = require("fs");

function parseColumns(file) {
  const map = new Map();
  for (const line of fs.readFileSync(file, "utf8").split("\n").map(s=>s.trim()).filter(Boolean)) {
    const [table, col, type, nullable, def, pos] = line.split("|");
    if (!map.has(table)) map.set(table, []);
    map.get(table).push({ col, type, nullable, def: def || "", pos: parseInt(pos, 10) });
  }
  for (const list of map.values()) list.sort((a,b) => a.pos - b.pos);
  return map;
}
function parsePK(file) {
  const map = new Map();
  for (const line of fs.readFileSync(file, "utf8").split("\n").map(s=>s.trim()).filter(Boolean)) {
    const [table, col] = line.split("|");
    map.set(table, col);
  }
  return map;
}
function parseFK(file) {
  const map = new Map();
  for (const line of fs.readFileSync(file, "utf8").split("\n").map(s=>s.trim()).filter(Boolean)) {
    const [table, def] = line.split("|");
    const m = def.match(/FOREIGN KEY \(([^)]+)\) REFERENCES (\w+)\(([^)]+)\)/);
    if (m) {
      if (!map.has(table)) map.set(table, new Map());
      map.get(table).set(m[1], { refTable: m[2], refCol: m[3] });
    }
  }
  return map;
}
function convertType(pgType) {
  const t = pgType.toLowerCase();
  if (t === "uuid") return "TEXT";
  if (t.startsWith("character varying")) return "TEXT";
  if (t === "text") return "TEXT";
  if (t === "integer") return "INTEGER";
  if (t === "smallint") return "INTEGER";
  if (t === "bigint") return "INTEGER";
  if (t === "boolean") return "BOOLEAN";
  if (t.startsWith("timestamp")) return "TEXT";
  if (t === "tsvector") return "TEXT";
  if (t === "date") return "TEXT";
  if (t === "numeric") return "REAL";
  if (t === "jsonb") return "TEXT";
  if (t === "inet") return "TEXT";
  throw new Error(`Type non gere: ${pgType}`);
}
function convertDefault(def, pgType) {
  if (!def) return null;
  if (def.includes("uuid_generate_v4()") || def.includes("gen_random_uuid()")) return null;
  if (def.includes("nextval(")) return null;
  if (def.includes("now()") || def.includes("CURRENT_TIMESTAMP")) return "(datetime('now'))";
  if (def.includes("CURRENT_DATE")) return "(date('now'))";
  if (def === "true") return "1";
  if (def === "false") return "0";
  const strMatch = def.match(/^'([^']*)'::/);
  if (strMatch) return `'${strMatch[1]}'`;
  if (/^-?\d+$/.test(def)) return def;
  throw new Error(`Default non gere: ${def}`);
}
function indexSuffix(tableName, colName) {
  let suffix = colName.replace(/_id$/, "");
  if (suffix.startsWith(tableName + "_")) {
    suffix = suffix.slice(tableName.length + 1);
  }
  return suffix;
}
function generateTable(tableName, cols, pks, fks) {
  const columns = cols.get(tableName);
  const pkCol = pks.get(tableName);
  const tableFKs = fks.get(tableName) || new Map();

  let lines = [`CREATE TABLE ${tableName} (`];
  const colLines = columns.map(c => {
    let parts = [c.col, convertType(c.type)];
    if (c.col === pkCol) {
      parts.push("PRIMARY KEY");
    } else {
      if (c.nullable === "NO") parts.push("NOT NULL");
      const fk = tableFKs.get(c.col);
      if (fk) parts.push(`REFERENCES ${fk.refTable}(${fk.refCol})`);
    }
    const def = convertDefault(c.def, c.type);
    if (def !== null && c.col !== pkCol) parts.push(`DEFAULT ${def}`);
    return "  " + parts.join(" ");
  });
  lines.push(colLines.join(",\n"));
  lines.push(");");

  for (const c of columns) {
    if (tableFKs.has(c.col)) {
      lines.push(`CREATE INDEX idx_${tableName}_${indexSuffix(tableName, c.col)} ON ${tableName}(${c.col});`);
    }
  }
  return lines.join("\n") + "\n";
}

const cols = parseColumns("docs/phase5-colonnes-33-tables.txt");
const pks = parsePK("docs/phase5-pk-33-tables.txt");
const fks = parseFK("docs/phase5-fk-33-tables.txt");

const EXCLUDED = ["acte_workflow_transition", "decision_workflow_transition"];

const allTables = [...cols.keys()].filter(t => !EXCLUDED.includes(t));

let successes = [];
let failures = [];

for (const table of allTables) {
  try {
    const sql = generateTable(table, cols, pks, fks);
    fs.writeFileSync(`docs/sprint-2c/generated/${table}.sql`, sql);
    successes.push(table);
  } catch (e) {
    failures.push({ table, error: e.message });
  }
}

console.log(`\n=== RESULTAT ===`);
console.log(`Succes: ${successes.length}/${allTables.length}`);
successes.forEach(t => console.log(`  OK  ${t}`));
if (failures.length) {
  console.log(`\nEchecs: ${failures.length}`);
  failures.forEach(f => console.log(`  FAIL ${f.table} -> ${f.error}`));
}
