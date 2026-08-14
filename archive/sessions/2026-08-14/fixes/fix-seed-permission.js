const fs = require('fs');
const path = 'db/seed.js';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `const permIds = {};
for (const p of PAGES) {
  const id = uuid(); permIds[p] = id;
  await db.run('INSERT INTO permission VALUES (?,?,?)', [id, 'page:'+p+':read', 'Lecture page '+p]);
}

const ROLE_PAGES = {
  PR: PAGES,
  PM: ['dashboard','alertes','provinces','institutions','ministeres','budget','depenses','marches','sante','education','mines','journal'],
  SN: ['dashboard','budget','institutions','ministeres','journal'],
  AN: ['dashboard','budget','institutions','ministeres','journal'],
  MI: ['dashboard','budget','tresorerie','depenses','fiscalite','douanes','marches','journal','institutions','ministeres'],
  GV: ['dashboard','population','agents','budget','depenses','sante','education','mines','journal','institutions','provinces','ministeres'],
};
for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {
  for (const p of pages) {
    await db.run('INSERT INTO role_permission VALUES (?,?)', [roleIds[roleCode], permIds[p]]);
  }
}`;

const newBlock = `const ROLE_PAGES = {
  PR: PAGES,
  PM: ['dashboard','alertes','provinces','institutions','ministeres','budget','depenses','marches','sante','education','mines','journal'],
  SN: ['dashboard','budget','institutions','ministeres','journal'],
  AN: ['dashboard','budget','institutions','ministeres','journal'],
  MI: ['dashboard','budget','tresorerie','depenses','fiscalite','douanes','marches','journal','institutions','ministeres'],
  GV: ['dashboard','population','agents','budget','depenses','sante','education','mines','journal','institutions','provinces','ministeres'],
};

// permission.role_id est NOT NULL (schema reel) : une permission appartient a un
// seul role. On cree donc une ligne de permission par (role, page), et 'code'
// est une colonne GENERATED (entite || ':' || action), on ne l'insere jamais.
const permIds = {};
for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {
  for (const p of pages) {
    const id = uuid();
    permIds[roleCode + ':' + p] = id;
    await db.run(
      'INSERT INTO permission (permission_id, role_id, entite, action) VALUES (?,?,?,?)',
      [id, roleIds[roleCode], 'page:' + p, 'read']
    );
  }
}

for (const [roleCode, pages] of Object.entries(ROLE_PAGES)) {
  for (const p of pages) {
    await db.run(
      'INSERT INTO role_permission (role_id, permission_id) VALUES (?,?)',
      [roleIds[roleCode], permIds[roleCode + ':' + p]]
    );
  }
}`;

if (!content.includes(oldBlock)) {
  console.error('ERREUR : le bloc attendu est introuvable dans db/seed.js. Aucune modification appliquee.');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(path, content, 'utf8');
console.log('OK : db/seed.js corrige avec succes.');
