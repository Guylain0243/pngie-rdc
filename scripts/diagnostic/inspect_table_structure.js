/**
 * Sprint 4 (préparation) - Inspection de structure des tables à brancher.
 *
 * ⚠️ LECTURE SEULE. Interroge uniquement information_schema (métadonnées),
 * ne touche à aucune donnée, ne modifie rien.
 *
 * Objectif : avant d'écrire une route pour une table du référentiel
 * Justice/RNSO/RNSJ, connaître ses colonnes, types, contraintes NOT NULL,
 * clés primaires et clés étrangères.
 *
 * Usage :
 *   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"
 *   node scripts/diagnostic/inspect_table_structure.js ref_tribunal_paix rnso_affectation
 *
 * Sans argument, inspecte un échantillon par défaut représentatif de
 * Justice + RNSO + RNSJ.
 */

const path = require('path');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non défini.');
    console.error('   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"');
    process.exit(1);
  }
  if (!/pngie_rdc_rls_test/.test(dbUrl)) {
    console.error('❌ Ce script est prévu pour pngie_rdc_rls_test uniquement. Arrêt par précaution.');
    process.exit(1);
  }

  let Client;
  try {
    ({ Client } = require('pg'));
  } catch (e) {
    console.error('❌ Module "pg" introuvable. Lancez depuis C:\\pngie-rdc\\pngie-backend');
    process.exit(1);
  }

  const defaultTables = [
    'ref_tribunal_paix',
    'rnso_affectation',
    'rnsj_texte',
  ];
  const tables = process.argv.slice(2).length ? process.argv.slice(2) : defaultTables;

  const client = new Client({ connectionString: dbUrl });
  console.log('=== Inspection de structure (lecture seule, information_schema) ===\n');
  console.log(`Tables inspectées : ${tables.join(', ')}\n`);

  try {
    await client.connect();

    for (const table of tables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`TABLE : ${table}`);
      console.log('='.repeat(60));

      // Existence
      const existsRes = await client.query(
        `SELECT 1 FROM pg_class WHERE relname = $1 AND relnamespace = 'public'::regnamespace`,
        [table]
      );
      if (existsRes.rowCount === 0) {
        console.log(`❌ Table introuvable dans le schéma public.`);
        continue;
      }

      // Colonnes
      const colsRes = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table]
      );
      console.log(`\n--- Colonnes (${colsRes.rowCount}) ---`);
      for (const col of colsRes.rows) {
        const nullable = col.is_nullable === 'NO' ? 'NOT NULL' : 'nullable';
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${def}`);
      }

      // Clé primaire
      const pkRes = await client.query(
        `SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'`,
        [table]
      );
      console.log(`\n--- Clé primaire ---`);
      console.log(pkRes.rowCount ? pkRes.rows.map(r => r.column_name).join(', ') : '(aucune détectée)');

      // Clés étrangères sortantes (cette table référence quoi)
      const fkOutRes = await client.query(
        `SELECT
           kcu.column_name,
           ccu.table_name AS references_table,
           ccu.column_name AS references_column
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
         WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'`,
        [table]
      );
      console.log(`\n--- Clés étrangères SORTANTES (${table} référence...) ---`);
      if (fkOutRes.rowCount) {
        for (const fk of fkOutRes.rows) {
          console.log(`  ${fk.column_name} -> ${fk.references_table}.${fk.references_column}`);
        }
      } else {
        console.log('  (aucune)');
      }

      // Clés étrangères entrantes (qui référence cette table)
      const fkInRes = await client.query(
        `SELECT
           tc.table_name AS referencing_table,
           kcu.column_name AS referencing_column
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
         WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = $1 AND ccu.table_schema = 'public'`,
        [table]
      );
      console.log(`\n--- Référencée PAR (clés étrangères entrantes) ---`);
      if (fkInRes.rowCount) {
        for (const fk of fkInRes.rows) {
          console.log(`  ${fk.referencing_table}.${fk.referencing_column} -> ${table}`);
        }
      } else {
        console.log('  (aucune)');
      }

      // Volume de données (comptage, lecture seule)
      try {
        const countRes = await client.query(`SELECT COUNT(*) AS n FROM "${table}"`);
        console.log(`\n--- Volume actuel ---`);
        console.log(`  ${countRes.rows[0].n} ligne(s)`);
      } catch (e) {
        console.log(`\n--- Volume actuel --- (non accessible : ${e.message})`);
      }
    }

    console.log(`\n\n=== Fin de l'inspection. Aucune modification apportée. ===`);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();