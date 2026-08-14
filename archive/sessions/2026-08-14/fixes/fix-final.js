const fs = require('fs');
const backup = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html.avant-reparation-encodage.bak';
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';

fs.copyFileSync(backup, target);
let text = fs.readFileSync(target, 'utf8');

const map = {
  'Ã©':'é','Ã¨':'è','Ã«':'ë','Ãª':'ê','Ã ':'à','Ã¢':'â','Ã®':'î','Ã¯':'ï',
  'Ã´':'ô','Ã¶':'ö','Ã¹':'ù','Ã»':'û','Ã§':'ç',
  'Ã‰':'É','Ãˆ':'È','ÃŠ':'Ê','Ã‹':'Ë','Ã€':'À','Ã‚':'Â','ÃŽ':'Î','Ã”':'Ô','Ã‡':'Ç',
  'â€™':'\u2019','â€“':'\u2013','â€”':'\u2014','â€œ':'\u201C','â€\x9d':'\u201D','â€¦':'\u2026',
  'Â«':'«','Â»':'»','â€“':'-','Å“':'œ','Ã¦':'æ'
};

for (const [bad, good] of Object.entries(map)) {
  if (text.includes(bad)) text = text.split(bad).join(good);
}

if (!text.includes("CUR.restricted = (CUR.code !== 'PR')")) {
  text = text.replace("CUR.restricted=false;", "CUR.restricted = (CUR.code !== 'PR');");
}

fs.writeFileSync(target, text, 'utf8');

const brokenLeft = (text.match(/\uFFFD/g) || []).length;
const mojiLeft = (text.match(/Ã©|Ã‰|Ã¨|â€™|â€“/g) || []).length;
const fixApplied = text.includes("CUR.restricted = (CUR.code !== 'PR')");

console.log('=== RESULTAT FINAL ===');
console.log('Caracteres perdus restants:', brokenLeft);
console.log('Mojibake restant:', mojiLeft);
console.log('Correctif cloisonnement present:', fixApplied);
console.log(brokenLeft === 0 && mojiLeft === 0 && fixApplied ? 'TOUT EST BON' : 'PROBLEME A VERIFIER');
