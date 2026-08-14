const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\src\\security\\scope-resolver.js';

fs.copyFileSync(target, target + '.avant-fix-lecture-nationale-v2.bak');
let text = fs.readFileSync(target, 'utf8');

const before = text;

text = text.replace(
  /SELECT r\.lecture_nationale\s*\n\s*FROM personne_role pr\s*\n\s*JOIN role r ON r\.role_id = pr\.role_id\s*\n\s*WHERE pr\.personne_id = \? AND LOWER\(pr\.statut\) = 'actif' AND r\.lecture_nationale = true/,
  `SELECT 1
    FROM person_role pr
    JOIN role r ON r.role_id = pr.role_id
    WHERE pr.person_id = ? AND LOWER(pr.statut) = 'actif' AND r.code = 'PR'`
);

if (text !== before) {
  fs.writeFileSync(target, text, 'utf8');
  console.log('Correctif applique avec succes (methode regex).');
} else {
  console.log('ATTENTION: regex n a pas matche non plus. Affichage brut de la zone concernee:');
  const idx = before.indexOf('lecture_nationale');
  console.log(JSON.stringify(before.slice(idx - 100, idx + 300)));
}
