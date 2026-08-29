/**
 * Sprint 3 - Phase A : Audit de qualification des tables orphelines
 *
 * Objectif : pour chaque groupe de tables suspectes, chercher dans TOUT le
 * dépôt (hors node_modules, .git) des références dans :
 *   - migrations (dossier migrations/, db/migrations/, etc.)
 *   - modèles (models/, db/models/)
 *   - routes/API (routes/, api/, controllers/)
 *   - services (services/)
 *   - tests (test/, tests/, __tests__/, *.test.js, *.spec.js)
 *   - documentation (*.md)
 *   - cahier des charges / specs (docs/, specs/)
 *
 * Usage :
 *   node scripts/diagnostic/audit_orphan_tables.js
 *
 * Sortie : rapport texte lisible + fichier JSON structuré dans
 *   scripts/diagnostic/audit_report.json
 *
 * Aucune connexion base de données requise : audit purement sur le code source.
 */

const fs = require('fs');
const path = require('path');

// === Configuration : groupes de tables à qualifier ===
// Ajoutez/retirez des entrées selon votre inventaire réel du Sprint 2.
const GROUPS = {
  'suivi_gestion (mission/dashboard/kpi)': [
    'mission', 'dashboard', 'kpi', 'plan_action', 'rapport', 'controle',
    'instruction', 'unit', 'position', 'assignment',
  ],
  'tribunal_magistrat': ['tribunal', 'magistrat'],
  'patient': ['patient'],
  'mfa': ['mfa_'],
  'pki': ['pki_'],
};

// === Config du scan ===
const ROOT = process.cwd();
const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out',
]);
const TEXT_EXTENSIONS = new Set([
  '.js', '.ts', '.jsx', '.tsx', '.sql', '.md', '.json', '.yml', '.yaml',
]);

function classifyPath(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (/(^|\/)migrations?\//i.test(rel)) return 'migration';
  if (/(^|\/)models?\//i.test(rel)) return 'modele';
  if (/(^|\/)(routes|api|controllers)\//i.test(rel)) return 'route_api';
  if (/(^|\/)services?\//i.test(rel)) return 'service';
  if (/(^|\/)(tests?|__tests__)\//i.test(rel) || /\.(test|spec)\.[jt]sx?$/i.test(rel)) return 'test';
  if (/(^|\/)(docs?|specs?)\//i.test(rel) || /\.md$/i.test(rel)) return 'documentation';
  return 'autre';
}

function walk(dir, files = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return files;
  }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      const ext = path.extname(entry.name);
      if (TEXT_EXTENSIONS.has(ext)) files.push(full);
    }
  }
  return files;
}

function scan() {
  console.log(`=== Audit Sprint 3 - Phase A ===`);
  console.log(`Racine du scan : ${ROOT}\n`);

  const allFiles = walk(ROOT);
  console.log(`${allFiles.length} fichiers texte scannés (hors node_modules/.git)\n`);

  const report = {};

  for (const [groupName, keywords] of Object.entries(GROUPS)) {
    report[groupName] = { keywords, matches: [] };

    for (const file of allFiles) {
      let content;
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch (e) {
        continue;
      }

      for (const keyword of keywords) {
        // Mot entier ou préfixe (mfa_, pki_) - recherche insensible à la casse
        const isPrefix = keyword.endsWith('_');
        const pattern = isPrefix
          ? new RegExp(keyword.replace('_', '_\\w*'), 'i')
          : new RegExp(`\\b${keyword}\\b`, 'i');

        if (pattern.test(content)) {
          const lines = content.split('\n');
          const matchingLines = lines
            .map((line, idx) => ({ line, idx: idx + 1 }))
            .filter(({ line }) => pattern.test(line))
            .slice(0, 3); // max 3 occurrences par fichier pour lisibilité

          report[groupName].matches.push({
            file: path.relative(ROOT, file).replace(/\\/g, '/'),
            category: classifyPath(file),
            keyword,
            sample_lines: matchingLines.map(({ idx, line }) => `L${idx}: ${line.trim().slice(0, 120)}`),
          });
          break; // un match par fichier suffit, on passe au fichier suivant
        }
      }
    }
  }

  // === Affichage du rapport ===
  for (const [groupName, data] of Object.entries(report)) {
    console.log(`\n--- Groupe : ${groupName} ---`);
    console.log(`Mots-clés : ${data.keywords.join(', ')}`);

    if (data.matches.length === 0) {
      console.log(`⚠️  AUCUNE référence trouvée nulle part dans le dépôt.`);
      console.log(`    → Candidat à la suppression (à confirmer manuellement).`);
      continue;
    }

    const byCategory = {};
    for (const m of data.matches) {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    }
    console.log(`✓ ${data.matches.length} fichier(s) avec référence(s).`);
    console.log(`  Répartition par catégorie : ${JSON.stringify(byCategory)}`);

    const hasStructural = data.matches.some(m =>
      ['migration', 'modele', 'route_api', 'service'].includes(m.category)
    );
    const hasTest = data.matches.some(m => m.category === 'test');
    const hasDoc = data.matches.some(m => m.category === 'documentation');

    if (hasStructural) {
      console.log(`  → Verdict provisoire : LÉGITIME (référencé dans migration/modèle/route/service)`);
    } else if (hasTest || hasDoc) {
      console.log(`  → Verdict provisoire : AMBIGU (seulement test/doc, pas de code structurel) — à investiguer manuellement`);
    } else {
      console.log(`  → Verdict provisoire : AMBIGU (références trouvées mais hors catégories clés) — à investiguer manuellement`);
    }

    console.log(`  Détail (max 10 premiers fichiers) :`);
    for (const m of data.matches.slice(0, 10)) {
      console.log(`    [${m.category}] ${m.file} (mot-clé: ${m.keyword})`);
      for (const l of m.sample_lines) {
        console.log(`        ${l}`);
      }
    }
    if (data.matches.length > 10) {
      console.log(`    ... et ${data.matches.length - 10} autre(s) fichier(s) (voir audit_report.json)`);
    }
  }

  // === Sauvegarde JSON ===
  const outPath = path.join(__dirname, 'audit_report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n\nRapport complet sauvegardé dans : ${outPath}`);
  console.log(`\n=== Fin de l'audit. Aucune modification n'a été apportée au dépôt. ===`);
}

scan();
