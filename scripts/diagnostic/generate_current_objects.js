/**
 * Sprint 3 - Génère current_objects.txt SANS passer par la CLI psql.
 *
 * ⚠️ LECTURE SEULE : une seule requête SELECT sur pg_catalog. Aucune
 * écriture en base, aucun TRUNCATE, aucune modification.
 *
 * Utilise le même mécanisme de connexion que db/seed.js (DATABASE_URL +
 * driver 'pg'), donc pas besoin d'avoir psql installé en ligne de commande.
 *
 * Usage :
 *   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"
 *   node scripts/diagnostic/generate_current_objects.js
 *
 * Sortie : scripts/diagnostic/current_objects.txt (une table/vue par ligne)
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non défini. Exemple :');
    console.error('   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"');
    process.exit(1);
  }

  // Sécurité : on refuse d'exécuter ceci sur autre chose que la base de test,
  // même si ce script ne fait qu'une lecture — juste pour rester cohérent
  // avec la discipline du garde-fou Sprint 2.
  if (!/pngie_rdc_rls_test/.test(dbUrl)) {
    console.error(`❌ Ce script est prévu pour pngie_rdc_rls_test uniquement.`);
    console.error(`   DATABASE_URL actuel pointe ailleurs. Arrêt par précaution.`);
    process.exit(1);
  }

  let Client;
  try {
    ({ Client } = require('pg'));
  } catch (e) {
    console.error('❌ Le module "pg" est introuvable. Lancez ce script depuis le dossier');
    console.error('   du projet backend (là où "pg" est déjà installé pour seed.js) :');
    console.error('   cd C:\\pngie-rdc\\pngie-backend');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });

  console.log('=== Génération de current_objects.txt (lecture seule) ===\n');
  console.log(`Connexion à : ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);

  try {
    await client.connect();

    const query = `
      SELECT relname FROM pg_class
      WHERE relkind IN ('r','v','m')
      AND relnamespace = 'public'::regnamespace
      ORDER BY relname;
    `;

    const result = await client.query(query);
    const names = result.rows.map(r => r.relname);

    console.log(`✓ ${names.length} objet(s) trouvé(s) dans le schéma public.\n`);

    const outDir = path.join(__dirname);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, 'current_objects.txt');
    fs.writeFileSync(outPath, names.join('\n') + '\n', 'utf8');

    console.log(`Fichier écrit : ${outPath}`);
    console.log('\n=== Terminé. Aucune modification apportée à la base. ===');
    console.log('\nProchaine étape :');
    console.log('  node scripts/diagnostic/compare_schema_vs_db.js');
  } catch (err) {
    console.error('❌ Erreur pendant la requête :', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
