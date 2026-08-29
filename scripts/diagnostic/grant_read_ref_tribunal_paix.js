/**
 * Sprint 4 - Insertion des permissions READ sur ref_tribunal_paix.
 * VERSION CORRIGÉE : cible la vraie table "permission", pas la vue
 * "meta_permission" (qui a rejeté l'INSERT initial — voir
 * inspect_view_definition.js pour la définition de la vue).
 *
 * Définition de la vue meta_permission :
 *   SELECT p.permission_id, r.code AS role_code, p.entite AS entity,
 *          p.action, p.statut, p.condition_json, p.created_at
 *   FROM permission p JOIN role r ON r.role_id = p.role_id
 *
 * Donc pour écrire, il faut utiliser sur la table "permission" :
 *   - role_id (uuid, PAS role_code texte)
 *   - entite  (PAS entity — colonne en français)
 *
 * ⚠️ CECI EST UN SCRIPT D'ÉCRITURE (INSERT sur la vraie table "permission").
 *
 * Portée : identique à la version précédente — READ uniquement, 6 rôles
 * nationaux, aucune permission WRITE, idempotent.
 *
 * Usage :
 *   $env:DATABASE_URL = "postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test"
 *   node scripts/diagnostic/grant_read_ref_tribunal_paix.js --dry-run
 *   node scripts/diagnostic/grant_read_ref_tribunal_paix.js
 */

const crypto = require('crypto');

const ENTITE = 'ref_tribunal_paix';
const ACTION = 'READ';
const ROLE_CODES = ['AN', 'PM', 'SN', 'PR', 'GV', 'MI'];

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non défini.');
    process.exit(1);
  }
  if (!/pngie_rdc_rls_test/.test(dbUrl)) {
    console.error('❌ Prévu pour pngie_rdc_rls_test uniquement. Arrêt par précaution.');
    process.exit(1);
  }

  const { Client } = require('pg');
  const client = new Client({ connectionString: dbUrl });

  console.log(`=== Attribution READ sur "${ENTITE}" pour ${ROLE_CODES.length} rôle(s) (table "permission") ===`);
  console.log(dryRun ? '⚠️  MODE DRY-RUN : aucune écriture ne sera faite.\n' : '⚠️  MODE RÉEL : des lignes vont être insérées dans "permission".\n');

  try {
    await client.connect();

    // Résout role_code -> role_id (uuid) en interrogeant la vraie table role
    const rolesRes = await client.query(
      `SELECT role_id, code FROM role WHERE code = ANY($1::text[])`,
      [ROLE_CODES]
    );
    const roleIdParCode = {};
    for (const row of rolesRes.rows) roleIdParCode[row.code] = row.role_id;

    const rolesManquants = ROLE_CODES.filter(c => !roleIdParCode[c]);
    if (rolesManquants.length > 0) {
      console.log(`⚠️  Rôles introuvables : ${rolesManquants.join(', ')} (ignorés)\n`);
    }
    const rolesAInserer = ROLE_CODES.filter(c => roleIdParCode[c]);

    let insertes = 0;
    let dejaExistants = 0;

    for (const roleCode of rolesAInserer) {
      const roleId = roleIdParCode[roleCode];

      // Idempotence : vérifie sur la vraie table "permission", avec les
      // vrais noms de colonnes (role_id, entite).
      const existeRes = await client.query(
        `SELECT permission_id FROM permission
         WHERE role_id = $1 AND entite = $2 AND action = $3 AND statut = 'ACTIF'`,
        [roleId, ENTITE, ACTION]
      );

      if (existeRes.rowCount > 0) {
        console.log(`~ ${roleCode} : permission déjà présente, ignorée.`);
        dejaExistants++;
        continue;
      }

      if (dryRun) {
        console.log(`+ ${roleCode} (role_id=${roleId}) : serait inséré (dry-run, rien écrit).`);
        insertes++;
        continue;
      }

      const permissionId = crypto.randomUUID();
      await client.query(
        `INSERT INTO permission (permission_id, role_id, entite, action, statut, created_at)
         VALUES ($1, $2, $3, $4, 'ACTIF', now())`,
        [permissionId, roleId, ENTITE, ACTION]
      );
      console.log(`✓ ${roleCode} : permission insérée (${permissionId}).`);
      insertes++;
    }

    console.log(`\nRésumé : ${insertes} ${dryRun ? 'à insérer' : 'inséré(s)'}, ${dejaExistants} déjà présent(s).`);
    console.log(`Rappel : AUCUNE permission WRITE insérée par ce script (décision actée).`);

    if (!dryRun && insertes > 0) {
      // Vérification finale : relire via la VUE meta_permission pour
      // confirmer que la traduction role_id->role_code / entite->entity
      // fonctionne bien côté lecture (c'est ce que security-engine.js
      // utilisera réellement).
      const verifRes = await client.query(
        `SELECT role_code, entity, action, statut FROM meta_permission
         WHERE entity = $1 AND action = $2 ORDER BY role_code`,
        [ENTITE, ACTION]
      );
      console.log(`\n--- Vérification via la vue meta_permission (${verifRes.rowCount} ligne(s)) ---`);
      console.log(JSON.stringify(verifRes.rows, null, 2));
    }

    console.log(`\n=== Fin. ${dryRun ? 'Aucune modification (dry-run).' : 'Terminé.'} ===`);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();