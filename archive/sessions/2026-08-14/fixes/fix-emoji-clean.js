const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';

fs.copyFileSync(target, target + '.avant-fix-clean.bak');
let text = fs.readFileSync(target, 'utf8');

const regex = /ð[\s\S]{1,6}?(?=["\x27])/g;
const before = (text.match(regex) || []).length;
text = text.replace(regex, '●');

fs.writeFileSync(target, text, 'utf8');

const brokenLeft = (text.match(/\uFFFD/g) || []).length;
const stillHasArtifacts = (text.match(/ð[\s\S]{1,6}?["\x27]/g) || []).length;

console.log('=== RESULTAT ===');
console.log('Emoji casses remplaces par un point plein:', before);
console.log('Caracteres perdus:', brokenLeft);
console.log('Artefacts residuels:', stillHasArtifacts);
console.log('Correctif cloisonnement toujours present:', text.includes("CUR.restricted = (CUR.code !== 'PR')"));
