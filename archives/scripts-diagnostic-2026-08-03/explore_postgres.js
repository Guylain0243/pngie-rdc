const fs = require('fs');
const { Pool } = require('pg');

const content = fs.readFileSync('C:/pngie-rdc/pngie-backend/db_url.txt', 'utf8');
const match = content.match(/DATABASE_URL=(.+)/);
if (!match) {
    console.log('DATABASE_URL introuvable dans le fichier');
    process.exit(1);
}
const connectionString = match[1].trim();

const pool = new Pool({ connectionString });

async function main() {
    console.log('=== LISTE DES TABLES (schema public) ===');
    const tablesRes = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    tablesRes.rows.forEach(function(r) { console.log(r.table_name); });

    console.log('\n=== SCHEMA DES TABLES CLES ===');
    const targets = ['institution', 'poste', 'unite_organisationnelle', 'personne', 'affectation', 'fonction', 'role_metier', 'poste_role_metier', 'fiche_tome', 'document', 'relations', 'relation', 'gov_relation'];

    for (const tname of targets) {
        console.log('\n--- ' + tname + ' ---');
        try {
            const colsRes = await pool.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
                [tname]
            );
            if (colsRes.rows.length === 0) {
                console.log('  N EXISTE PAS');
                continue;
            }
            colsRes.rows.forEach(function(c) {
                console.log('  ' + c.column_name + ' (' + c.data_type + ')');
            });
            const countRes = await pool.query('SELECT COUNT(*) as n FROM ' + tname);
            console.log('  [' + countRes.rows[0].n + ' lignes]');
        } catch (e) {
            console.log('  ERREUR: ' + e.message);
        }
    }

    await pool.end();
}

main().catch(function(e) {
    console.error('ERREUR GENERALE: ' + e.message);
    process.exit(1);
});
