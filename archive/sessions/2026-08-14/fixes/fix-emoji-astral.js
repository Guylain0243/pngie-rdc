const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';

fs.copyFileSync(target, target + '.avant-fix-astral.bak');
let text = fs.readFileSync(target, 'utf8');

// Ces séquences précises ont été identifiées comme emoji cassés (mojibake sur 4 octets UTF-8)
const regex = /ð[\s\S]{1,6}?(?=["\x27])/g;

let fixedCount = 0;
text = text.replace(regex, (match) => {
  try {
    const bytes = Buffer.from(match, 'latin1');
    const decoded = bytes.toString('utf8');
    if (decoded.includes('\uFFFD')) return match; // echec, on laisse tel quel
    fixedCount++;
    return decoded;
  } catch (e) {
    return match;
  }
});

fs.writeFileSync(target, text, 'utf8');

const brokenLeft = (text.match(/\uFFFD/g) || []).length;
const stillHasArtifacts = (text.match(/ð[\s\S]{1,6}?["\x27]/g) || []).length;

console.log('=== RESULTAT ===');
console.log('Sequences reparees:', fixedCount);
console.log('Caracteres perdus:', brokenLeft);
console.log('Artefacts residuels:', stillHasArtifacts);
console.log('Correctif cloisonnement toujours present:', text.includes("CUR.restricted = (CUR.code !== 'PR')"));
