const fs = require('fs');
const path = 'db/seed.js';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const startIdx = lines.findIndex(l => l.includes('const permIds = {};'));
const endIdx = lines.findIndex(l => l.includes("const DEMO_PASSWORD"));

if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
  console.error('ERREUR : reperes introuvables. startIdx=' + startIdx + ' endIdx=' + endIdx);
  process.exit(1);
}

console.log('Bloc a remplacer : lignes ' + (startIdx+1) + ' a ' + endIdx + ' (' + (endIdx-startIdx) + ' lignes)');
console.log('--- Contenu actuel de ce bloc ---');
console.log(lines.slice(startIdx, endIdx).join('\n'));
