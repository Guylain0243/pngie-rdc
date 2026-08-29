/**
 * Sprint 3 - Phase A (suite) : Comparaison schéma déclaré vs base réelle
 *
 * ⚠️ CE SCRIPT NE SUPPRIME, NE MODIFIE, NE CRÉE RIEN.
 * Il est purement diagnostique : il lit deux sources et affiche un écart.
 * Aucune décision de suppression n'est prise ici — seulement de la matière
 * pour remplir le tableau de qualification manuellement.
 *
 * Sources comparées :
 *   1. db/schema.sql          -> tables DÉCLARÉES (CREATE TABLE ...)
 *   2. un fichier listant les objets RÉELS de la base (pg_class), par
 *      exemple scripts/diagnostic/current_objects.txt généré au Sprint 2.
 *
 * Usage :
 *   node scripts/diagnostic/compare_schema_vs_db.js [chemin_schema.sql] [chemin_objets_reels.txt]
 *
 * Par défaut :
 *   chemin_schema.sql    = db/schema.sql
 *   chemin_objets_reels  = scripts/diagnostic/current_objects.txt
 *
 * Si current_objects.txt n'existe pas ou est vide, le script explique
 * comment le régénérer (requête pg_class) et s'arrête sans rien supposer.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const schemaPath = path.resolve(ROOT, process.argv[2] || 'db/schema.sql');
const realObjectsPath = path.resolve(ROOT, process.argv[3] || 'scripts/diagnostic/current_objects.txt');

function extractDeclaredTables(schemaSql) {
  // Capture CREATE TABLE [IF NOT EXISTS] nom (
  const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?\s*\(/gi;
  const tables = new Set();
  let match;
  while ((match = regex.exec(schemaSql)) !== null) {
    tables.add(match[1].toLowerCase());
  }
  return tables;
}

function extractRealObjects(text) {
  // Tolérant au format : une table/objet par ligne, ou une sortie psql avec
  // des colonnes. On extrait tout identifiant SQL plausible par ligne
  // (premier "mot" ressemblant à un nom de table), en ignorant les lignes
  // d'en-tête psql (---, (X rows), colonnes vides, etc.)
  const lines = text.split('\n');
  const objects = new Set();
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^-+\+?-*$/.test(line)) continue; // séparateur psql "----+----"
    if (/^\(\d+ rows?\)$/i.test(line)) continue;
    if (/^(schemaname|tablename|relname|table_name)\b/i.test(line)) continue; // en-tête

    // Cas "nom | type | ..." (sortie \dt ou requête pg_class avec |)
    const pipeParts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (pipeParts.length > 0) {
      const candidate = pipeParts[0];
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(candidate)) {
        objects.add(candidate.toLowerCase());
        continue;
      }
    }

    // Cas "nom" seul par ligne (fichier déjà nettoyé)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(line)) {
      objects.add(line.toLowerCase());
    }
  }
  return objects;
}

function main() {
  console.log('=== Sprint 3 - Comparaison schéma déclaré vs base réelle ===\n');
  console.log('⚠️  Script en lecture seule : aucune modification de fichier ou de base.\n');

  if (!fs.existsSync(schemaPath)) {
    console.log(`❌ Fichier schéma introuvable : ${schemaPath}`);
    console.log(`   Passez le bon chemin en argument, ex :`);
    console.log(`   node scripts/diagnostic/compare_schema_vs_db.js db/schema.sql scripts/diagnostic/current_objects.txt`);
    return;
  }

  if (!fs.existsSync(realObjectsPath)) {
    console.log(`❌ Fichier des objets réels introuvable : ${realObjectsPath}\n`);
    console.log('Pour le générer sans rien modifier, exécutez ceci dans psql sur pngie_rdc_rls_test :\n');
    console.log(`  \\o scripts/diagnostic/current_objects.txt`);
    console.log(`  SELECT relname FROM pg_class`);
    console.log(`  WHERE relkind IN ('r','v','m') -- tables, vues, vues matérialisées`);
    console.log(`  AND relnamespace = 'public'::regnamespace`);
    console.log(`  ORDER BY relname;`);
    console.log(`  \\o\n`);
    console.log('Puis relancez ce script.');
    return;
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const realObjectsText = fs.readFileSync(realObjectsPath, 'utf8');

  const declared = extractDeclaredTables(schemaSql);
  const real = extractRealObjects(realObjectsText);

  if (declared.size === 0) {
    console.log(`⚠️  Aucune table "CREATE TABLE" détectée dans ${schemaPath}. Vérifiez le format du fichier.`);
    return;
  }
  if (real.size === 0) {
    console.log(`⚠️  Aucun objet détecté dans ${realObjectsPath}. Vérifiez le format du fichier (voir instructions ci-dessus).`);
    return;
  }

  console.log(`Tables déclarées dans ${path.relative(ROOT, schemaPath)} : ${declared.size}`);
  console.log(`Objets réels trouvés dans ${path.relative(ROOT, realObjectsPath)} : ${real.size}\n`);

  const declaredNotInDb = [...declared].filter(t => !real.has(t)).sort();
  const inDbNotDeclared = [...real].filter(t => !declared.has(t)).sort();
  const inBoth = [...declared].filter(t => real.has(t)).sort();

  console.log(`--- ✓ Présentes des deux côtés (${inBoth.length}) ---`);
  console.log(inBoth.length ? inBoth.join(', ') : '(aucune)');

  console.log(`\n--- ⚠️  Déclarées dans schema.sql mais ABSENTES de la base réelle (${declaredNotInDb.length}) ---`);
  console.log('(candidates à "jamais migrées" — PAS candidates à suppression sans vérification manuelle des autres preuves : route/service/test)');
  console.log(declaredNotInDb.length ? declaredNotInDb.join(', ') : '(aucune — le schéma correspond entièrement à la base)');

  console.log(`\n--- ℹ️  Présentes en base mais ABSENTES de schema.sql (${inDbNotDeclared.length}) ---`);
  console.log('(schema.sql est peut-être partiel ou obsolète par rapport à la base réelle)');
  console.log(inDbNotDeclared.length ? inDbNotDeclared.join(', ') : '(aucune)');

  // Sauvegarde JSON pour trace/preuve
  const outPath = path.join(__dirname, 'schema_vs_db_report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    declared: [...declared].sort(),
    real: [...real].sort(),
    declared_not_in_db: declaredNotInDb,
    in_db_not_declared: inDbNotDeclared,
    in_both: inBoth,
  }, null, 2), 'utf8');

  console.log(`\n\nRapport complet sauvegardé dans : ${outPath}`);
  console.log('\n=== Fin. Aucune modification apportée. Ceci alimente le tableau de qualification, pas une suppression. ===');
}

main();
