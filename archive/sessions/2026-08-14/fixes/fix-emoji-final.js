const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';

fs.copyFileSync(target, target + '.avant-fix-emoji.bak');
let text = fs.readFileSync(target, 'utf8');

// Table inverse Windows-1252 pour les octets 0x80-0x9F (differents de Latin1 a cet endroit)
const cp1252Reverse = {
  0x20AC:0x80, 0x201A:0x82, 0x0192:0x83, 0x201E:0x84, 0x2026:0x85, 0x2020:0x86, 0x2021:0x87,
  0x02C6:0x88, 0x2030:0x89, 0x0160:0x8A, 0x2039:0x8B, 0x0152:0x8C, 0x017D:0x8E, 0x2018:0x91,
  0x2019:0x92, 0x201C:0x93, 0x201D:0x94, 0x2022:0x95, 0x2013:0x96, 0x2014:0x97, 0x02DC:0x98,
  0x2122:0x99, 0x0161:0x9A, 0x203A:0x9B, 0x0153:0x9C, 0x017E:0x9E, 0x0178:0x9F
};

function charToByte(cp) {
  if (cp <= 0x7F) return cp;
  if (cp1252Reverse[cp] !== undefined) return cp1252Reverse[cp];
  if (cp >= 0xA0 && cp <= 0xFF) return cp;
  return null;
}

// Repère les suites de caracteres "suspects" (mojibake potentiel) et tente de les reconvertir
const suspectRegex = /[\u0080-\u02FF]{2,12}/g;
let fixedCount = 0;
let unresolved = [];

text = text.replace(suspectRegex, (match) => {
  const bytes = [];
  for (const ch of match) {
    const b = charToByte(ch.codePointAt(0));
    if (b === null) return match; // pas convertible, on laisse tel quel
    bytes.push(b);
  }
  try {
    const decoded = Buffer.from(bytes).toString('utf8');
    if (decoded.includes('\uFFFD')) return match; // echec de decodage, on laisse tel quel
    if (decoded === match) return match; // rien a changer
    fixedCount++;
    return decoded;
  } catch (e) {
    return match;
  }
});

fs.writeFileSync(target, text, 'utf8');

const brokenLeft = (text.match(/\uFFFD/g) || []).length;
const stillHasArtifacts = (text.match(/ð[ŸÂ]|Â·|Â /g) || []).length;

console.log('=== RESULTAT ===');
console.log('Sequences reparees:', fixedCount);
console.log('Caracteres perdus:', brokenLeft);
console.log('Artefacts residuels detectes:', stillHasArtifacts);
console.log('Correctif cloisonnement toujours present:', text.includes("CUR.restricted = (CUR.code !== 'PR')"));
