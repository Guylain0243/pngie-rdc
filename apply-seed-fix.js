const fs = require('fs');
const path = 'db/seed.js';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const startIdx = lines.findIndex(l => l.includes('const permIds = {};'));
const endIdx = lines.findIndex(l => l.includes('const DEMO_PASSWORD'));

if (startIdx !== 165 || endIdx !== 185) {
  console.error('ERREUR : le fichier a change depuis la derniere inspection. startIdx=' + startIdx + ' endIdx=' + endIdx + ' (attendu 165/185). Aucune modification appliquee.');
  process.exit(1);
}

const newLines = [
  "const ROLE_PAGES = {",
  "  PR: PAGES,",
  "  PM: ['dashboard','alertes','provinces','institutions','ministeres','budget','depenses','marches','sante','education','mines','journal'],",
  "  SN: ['dashboard','budget','institutions','ministeres','journal'],",
  "  AN: ['dashboard','budget','institutions','ministeres','journal'],",
  "  MI: ['dashboard','budget','tresorerie','depenses','fiscalite','douanes','marches','journal','institutions','ministeres'],",
  "  GV: ['dashboard','population','agents','budget','depenses','sante','education','mines','journal','institutions','provinces','ministeres'],",
  "};",
  "",
  "const permIds = {};",
  "for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {",
  "  for (const p of pages) {",
  "    const id = uuid();",
  "    permIds[roleCode + ':' + p] = id;",
  "    await db.run(",
  "      'INSERT INTO permission (permission_id, role_id, entite, action) VALUES (?,?,?,?)',",
  "      [id, roleIds[roleCode], 'page:' + p, 'read']",
  "    );",
  "  }",
  "}",
  "",
  "for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {",
  "  for (const p of pages) {",
  "    await db.run(",
  "      'INSERT INTO role_permission (role_id, permission_id) VALUES (?,?)',",
  "      [roleIds[roleCode], permIds[roleCode + ':' + p]]",
  "    );",
  "  }",
  "}"
];

lines.splice(startIdx, endIdx - startIdx, ...newLines);
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('OK : db/seed.js modifie. Nouvelle taille : ' + lines.length + ' lignes.');
