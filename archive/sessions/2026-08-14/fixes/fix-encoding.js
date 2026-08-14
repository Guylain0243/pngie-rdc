const fs = require('fs');
const path = 'C:\\pngie-rdc\\pngie-backend\\public\\index.html';

const text = fs.readFileSync(path, 'utf8');

// Le mojibake classique : chaque caractère corrompu correspond à un octet Latin1
// qui, une fois réencodé en UTF-8, redonne le texte original.
const buf = Buffer.from(text, 'latin1');
const fixed = buf.toString('utf8');

// Sécurité : on vérifie qu'on a bien réduit le nombre de "Ã" avant d'écrire
const before = (text.match(/Ã/g) || []).length;
const after = (fixed.match(/Ã/g) || []).length;
console.log('Occurrences "Ã" avant:', before, '- après:', after);

if (after < before) {
  fs.copyFileSync(path, path + '.avant-reparation-encodage.bak');
  fs.writeFileSync(path, fixed, 'utf8');
  console.log('Fichier reparé et sauvegardé (backup: index.html.avant-reparation-encodage.bak)');
} else {
  console.log('ATTENTION: la reparation n a pas reduit la corruption, rien ecrit.');
}
