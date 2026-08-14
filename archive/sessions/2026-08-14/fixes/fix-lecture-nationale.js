const fs = require('fs');
const target = 'C:\\pngie-rdc\\pngie-backend\\src\\security\\scope-resolver.js';

fs.copyFileSync(target, target + '.avant-fix-lecture-nationale.bak');
let text = fs.readFileSync(target, 'utf8');

const oldQuery = `const row = await db.get(\`
    SELECT r.lecture_nationale
    FROM personne_role pr
    JOIN role r ON r.role_id = pr.role_id
    WHERE pr.personne_id = ? AND LOWER(pr.statut) = 'actif' AND r.lecture_nationale = true
    LIMIT 1
  \`, [personneId]);
  return !!row;`;

const newQuery = `const row = await db.get(\`
    SELECT 1
    FROM person_role pr
    JOIN role r ON r.role_id = pr.role_id
    WHERE pr.person_id = ? AND LOWER(pr.statut) = 'actif' AND r.code = 'PR'
    LIMIT 1
  \`, [personneId]);
  return !!row;`;

if (text.includes(oldQuery)) {
  text = text.replace(oldQuery, newQuery);
  fs.writeFileSync(target, text, 'utf8');
  console.log('Correctif applique avec succes.');
} else {
  console.log('ATTENTION: le texte exact n a pas ete trouve, rien modifie. Verification manuelle necessaire.');
}
