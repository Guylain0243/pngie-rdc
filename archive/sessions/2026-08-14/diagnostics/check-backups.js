const fs = require('fs');
const files = [
  'C:\\pngie-rdc\\pngie-backend\\public\\index.html.avant-reparation-encodage.bak',
  'C:\\pngie-rdc\\pngie-backend\\public\\index_ancien_backup_20260728_224717.html',
  'C:\\pngie-rdc\\pngie-backend\\public\\_archive_20260728_233559\\index_avant_reconnexion.html',
  'C:\\pngie-rdc\\pngie-backend\\public\\_archive_20260728_233559\\index_corrige_temp.html'
];
for (const f of files) {
  if (!fs.existsSync(f)) { console.log(f, '-> INEXISTANT'); continue; }
  const text = fs.readFileSync(f, 'utf8');
  const broken = (text.match(/�/g) || []).length;
  const mojibake = (text.match(/Ã©|Ã‰|Ã¨/g) || []).length;
  console.log(f);
  console.log('  -> caracteres perdus (irrecuperable):', broken, '| mojibake (recuperable):', mojibake);
}
