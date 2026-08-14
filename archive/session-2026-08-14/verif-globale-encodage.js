const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';
const text = fs.readFileSync(target, 'utf8');

const brokenChars = (text.match(/\uFFFD/g) || []).length;
const mojibake = (text.match(/Ã©|Ã‰|Ã¨|Ã¢|Ã®|Ã´|Ã§|â€™|â€“|â€œ|Â«|Â»|Â·|Â /g) || []).length;
const brokenEmoji = (text.match(/ð[\s\S]{1,6}?["\x27]/g) || []).length;
const hasCloisonnement = text.includes("CUR.restricted = (CUR.code !== 'PR')");
const hasOldBug = text.includes("CUR.restricted=false;");

console.log('=== VERIFICATION GLOBALE ===');
console.log('Taille fichier:', text.length, 'caracteres');
console.log('Caracteres perdus (FFFD):', brokenChars);
console.log('Mojibake residuel:', mojibake);
console.log('Emoji casses residuels:', brokenEmoji);
console.log('Correctif cloisonnement present:', hasCloisonnement);
console.log('Ancien bug (restricted=false) present:', hasOldBug);
console.log('');
console.log(brokenChars === 0 && mojibake === 0 && brokenEmoji === 0 && hasCloisonnement && !hasOldBug ? '>>> FICHIER 100% PROPRE <<<' : '>>> PROBLEMES DETECTES, voir details ci-dessus <<<');
