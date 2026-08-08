const fs = require('fs');
const db = require('./src/db');

const src = fs.readFileSync('./24-seed-permissions-batch3.js', 'utf8');
const match = src.match(/ENTITES\s*=\s*\[([\s\S]*?)\]/);
const attendues = [...match[1].matchAll(/'([a-z_]+)'/g)].map(m => m[1]);

db.all("SELECT nom_table FROM meta_entity")
  .then(rows => {
    const presentes = new Set(rows.map(r => r.nom_table));
    const manquantes = attendues.filter(e => !presentes.has(e));
    console.log('Total attendu (batch3):', attendues.length);
    console.log('Total en base:', presentes.size);
    console.log('MANQUANTES dans meta_entity:', JSON.stringify(manquantes, null, 2));
    process.exit(0);
  })
  .catch(e => { console.error('Erreur:', e.message); process.exit(1); });