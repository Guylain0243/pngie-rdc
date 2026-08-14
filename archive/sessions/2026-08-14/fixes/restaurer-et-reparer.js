const fs = require('fs');
const backup = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html.avant-reparation-encodage.bak';
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';

// 1. Copier le backup propre vers index.html
fs.copyFileSync(backup, target);
console.log('Backup restauré comme index.html');

// 2. Réparer le mojibake (comme la fois précédente, qui avait fonctionné)
const text = fs.readFileSync(target, 'utf8');
const buf = Buffer.from(text, 'latin1');
const fixed = buf.toString('utf8');

const brokenAfter = (fixed.match(/�/g) || []).length;
const mojiBefore = (text.match(/Ã©|Ã‰|Ã¨/g) || []).length;
const mojiAfter = (fixed.match(/Ã©|Ã‰|Ã¨/g) || []).length;
console.log('Mojibake avant:', mojiBefore, '-> après:', mojiAfter, '| caractères perdus après:', brokenAfter);

if (mojiAfter < mojiBefore && brokenAfter === 0) {
  fs.writeFileSync(target, fixed, 'utf8');
  console.log('index.html réparé et sauvegardé proprement.');
} else {
  console.log('ATTENTION: reparation suspecte, verifier manuellement avant ecriture.');
}
