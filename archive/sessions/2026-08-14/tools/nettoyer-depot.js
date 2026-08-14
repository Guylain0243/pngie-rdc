// nettoyer-depot.js
// À exécuter depuis C:\pngie-rdc\pngie-backend avec : node nettoyer-depot.js
// Archive, supprime et met à jour .gitignore selon la classification validée.

const fs = require('fs');
const path = require('path');

const ARCHIVE_ROOT = 'archive/sessions/2026-08-14';
const DIAG_DIR = path.join(ARCHIVE_ROOT, 'diagnostics');
const FIX_DIR = path.join(ARCHIVE_ROOT, 'fixes');

const diagnostics = [
  'check-all.js', 'check-backups.js', 'check-pm.js', 'check-role-cols.js', 'check-role.js',
  'debug-role.js', 'debug-role2.js', 'debug-role3.js', 'debug-schema.js',
  'diag-person.js', 'diag-person2.js', 'diag-schema.js', 'diag-schema2.js', 'diag-schema3.js', 'diag-triggers.js',
  'find-broken-chars.js', 'find-emoji-exact.js', 'find-residual.js',
  'inspect-seed-block.js', 'list-accounts2.js', 'liste-comptes.js',
  'test-boucle.js', 'test-insert-isole.js', 'test-tous-comptes.js'
];

const fixes = [
  'fix-emoji-astral.js', 'fix-emoji-clean.js', 'fix-emoji-final.js', 'fix-encoding.js', 'fix-final.js',
  'fix-lecture-nationale-v2.js', 'fix-lecture-nationale.js', 'fix-postgres.js', 'fix-seed-permission.js',
  'restaurer-et-reparer.js'
];

const aSupprimer = [
  'db/seed.js.backup-avant-fix',
  'liste-comptes.txt',
  'public/index.html.avant-fix-astral.bak',
  'public/index.html.avant-fix-clean.bak',
  'public/index.html.avant-fix-emoji.bak',
  'public/index.html.avant-reparation-encodage.bak',
  'rapport-validation.txt',
  'routes-generated/institutions_dashboard.routes.js.bak',
  'src/security/scope-resolver.js.avant-fix-lecture-nationale-v2.bak',
  'src/security/scope-resolver.js.avant-fix-lecture-nationale.bak',
  'src/server.js.backup-avant-gate-fix',
  'status.txt'
];

const gitignoreLocal = [
  'reset-all-passwords.js',
  'grant-person.js',
  'grant-update.js'
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`[OK] Dossier prêt : ${dir}`);
}

function moveFile(file, destDir) {
  const dest = path.join(destDir, path.basename(file));
  try {
    fs.renameSync(file, dest);
    console.log(`[ARCHIVE] ${file} -> ${dest}`);
  } catch (err) {
    console.log(`[IGNORE] ${file} : ${err.code === 'ENOENT' ? 'introuvable (déjà déplacé ?)' : err.message}`);
  }
}

function deleteFile(file) {
  try {
    fs.unlinkSync(file);
    console.log(`[SUPPRIME] ${file}`);
  } catch (err) {
    console.log(`[IGNORE] ${file} : ${err.code === 'ENOENT' ? 'introuvable (déjà supprimé ?)' : err.message}`);
  }
}

function updateGitignore(entries) {
  const gitignorePath = '.gitignore';
  let content = '';
  try {
    content = fs.readFileSync(gitignorePath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const existingLines = new Set(content.split(/\r?\n/).map(l => l.trim()));
  const toAdd = entries.filter(e => !existingLines.has(e));

  if (toAdd.length === 0) {
    console.log('[GITIGNORE] Toutes les règles sont déjà présentes.');
    return;
  }

  const header = '\n# Outils d\'administration locaux (non versionnés)\n';
  const block = header + toAdd.join('\n') + '\n';
  fs.writeFileSync(gitignorePath, content + block, 'utf8');
  console.log(`[GITIGNORE] Ajouté : ${toAdd.join(', ')}`);
}

console.log('=== 1. Création des dossiers d\'archive ===');
ensureDir(DIAG_DIR);
ensureDir(FIX_DIR);

console.log('\n=== 2. Archivage des scripts de diagnostic ===');
diagnostics.forEach(f => moveFile(f, DIAG_DIR));

console.log('\n=== 3. Archivage des scripts correctifs ===');
fixes.forEach(f => moveFile(f, FIX_DIR));

console.log('\n=== 4. Suppression des fichiers redondants ===');
aSupprimer.forEach(deleteFile);

console.log('\n=== 5. Mise à jour de .gitignore ===');
updateGitignore(gitignoreLocal);

console.log('\n=== Terminé. Lance "git status" pour vérifier. ===');
