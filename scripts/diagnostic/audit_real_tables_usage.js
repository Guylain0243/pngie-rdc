/**
 * Sprint 3 - Phase A (audit inversé) : pour chaque objet RÉEL de la base
 * (les 163 de current_objects.txt), vérifie s'il est référencé par du code
 * structurel (migration/modèle/route/service), par un test, par de la
 * documentation seulement, ou par RIEN DU TOUT.
 *
 * Objectif : contrairement au premier audit (qui partait de nos hypothèses
 * de noms de tables et pouvait rater les vraies conventions de nommage),
 * celui-ci part de la vérité terrain (la base réelle) et ne peut donc pas
 * se tromper de nom.
 *
 * ⚠️ LECTURE SEULE. Aucune modification de fichier, aucune requête base
 * autre que la lecture déjà faite par generate_current_objects.js.
 *
 * Usage :
 *   node scripts/diagnostic/audit_real_tables_usage.js
 *
 * Prérequis : scripts/diagnostic/current_objects.txt doit déjà exister
 * (généré par generate_current_objects.js).
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const objectsPath = path.join(ROOT, 'scripts/diagnostic/current_objects.txt');
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out']);
const TEXT_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.sql', '.md', '.json', '.yml', '.yaml']);

function classifyPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (/(^|\/)migrations?\//i.test(rel)) return 'migration';
  if (/(^|\/)models?\//i.test(rel)) return 'modele';
  if (/(^|\/)(routes|routes-generated|api|controllers)\//i.test(rel)) return 'route_api';
  if (/(^|\/)services?\//i.test(rel)) return 'service';
  if (/(^|\/)(tests?|__tests__)\//i.test(rel) || /\.(test|spec)\.[jt]sx?$/i.test(rel)) return 'test';
  if (/(^|\/)(docs?|specs?)\//i.test(rel) || /\.md$/i.test(rel)) return 'documentation';
  if (/(^|\/)db\//i.test(rel)) return 'db_scripts'; // seed.js, schema.sql, etc.
  return 'autre';
}

function walk(dir, files = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return files; }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function main() {
  console.log('=== Sprint 3 - Audit inversé : usage réel des 163 objets de la base ===\n');
  console.log('⚠️  Lecture seule. Aucune modification.\n');

  if (!fs.existsSync(objectsPath)) {
    console.log(`❌ ${objectsPath} introuvable. Lancez d'abord generate_current_objects.js.`);
    return;
  }

  const realTables = fs.readFileSync(objectsPath, 'utf8')
    .split('\n').map(s => s.trim()).filter(Boolean);

  console.log(`${realTables.length} objets réels à vérifier.`);

  const allFiles = walk(ROOT);
  console.log(`${allFiles.length} fichiers texte scannés.\n`);

  // Pré-lecture de tous les fichiers en mémoire pour éviter de relire 163x
  const fileContents = allFiles.map(f => {
    try { return { file: f, content: fs.readFileSync(f, 'utf8') }; }
    catch (e) { return null; }
  }).filter(Boolean);

  const results = {};

  for (const table of realTables) {
    const pattern = new RegExp(`\\b${table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const matches = [];
    for (const { file, content } of fileContents) {
      if (pattern.test(content)) {
        matches.push({ file: path.relative(ROOT, file).replace(/\\/g, '/'), category: classifyPath(file) });
      }
    }
    const categories = new Set(matches.map(m => m.category));
    let verdict;
    if (categories.has('migration') || categories.has('modele') || categories.has('route_api') || categories.has('service')) {
      verdict = 'CABLE'; // utilisé par du code structurel actif
    } else if (categories.has('db_scripts')) {
      verdict = 'SEED_SEULEMENT'; // référencé dans schema.sql/seed.js mais pas dans routes/services
    } else if (categories.has('test') || categories.has('documentation')) {
      verdict = 'DOC_TEST_SEULEMENT';
    } else {
      verdict = 'AUCUNE_REFERENCE';
    }
    results[table] = { verdict, match_count: matches.length, matches: matches.slice(0, 5) };
  }

  // Regroupement par verdict pour lisibilité
  const byVerdict = { CABLE: [], SEED_SEULEMENT: [], DOC_TEST_SEULEMENT: [], AUCUNE_REFERENCE: [] };
  for (const [table, data] of Object.entries(results)) byVerdict[data.verdict].push(table);

  console.log(`--- ✓ CABLÉ (utilisé par migration/modèle/route/service) : ${byVerdict.CABLE.length} ---`);
  console.log(byVerdict.CABLE.join(', ') || '(aucune)');

  console.log(`\n--- ~ SEED SEULEMENT (référencé dans db/ mais aucune route/service) : ${byVerdict.SEED_SEULEMENT.length} ---`);
  console.log(byVerdict.SEED_SEULEMENT.join(', ') || '(aucune)');

  console.log(`\n--- ? DOC/TEST SEULEMENT (mentionné mais pas de code actif) : ${byVerdict.DOC_TEST_SEULEMENT.length} ---`);
  console.log(byVerdict.DOC_TEST_SEULEMENT.join(', ') || '(aucune)');

  console.log(`\n--- ⚠️  AUCUNE RÉFÉRENCE dans tout le dépôt (table réelle mais code introuvable) : ${byVerdict.AUCUNE_REFERENCE.length} ---`);
  console.log('(ne veut PAS dire "à supprimer" — peut être une vue système, une table technique, ou un nom trop court capté ailleurs)');
  console.log(byVerdict.AUCUNE_REFERENCE.join(', ') || '(aucune)');

  const outPath = path.join(__dirname, 'real_tables_usage_report.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n\nRapport détaillé (avec fichiers sources) : ${outPath}`);
  console.log('\n=== Fin. Aucune modification apportée. ===');
}

main();
