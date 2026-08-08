// ==============================================================
// PNGIE-RDC — Activation en lot des modules generes (government-builder.js)
//
// Lit tous les fichiers routes-generated/*.routes.js, detecte ceux qui
// suivent le patron CRUD standard (const CHAMPS = [...] / const CHAMPS_OBLIGATOIRES),
// et pour chaque table absente de PostgreSQL :
//   - la cree (colonnes TEXT generiques + colonnes techniques standard)
//   - enregistre sa metadonnee dans meta_entity
//   - accorde CREATE/READ/UPDATE au role MI
//
// Choix assume : colonnes en TEXT plutot que des types precis devines au cas
// par cas (comme fait pour dossier_agent_rh / ligne_budgetaire / ecriture_comptable).
// A la difference de ces trois modules traites individuellement, ici on
// privilegie la couverture large et rapide sur ~35 entites. Rien ne casse
// (le routeur generique ne fait aucune hypothese de type non plus), mais un
// module precis pourra etre retype plus tard si necessaire, avec la meme
// methode que pour Finances.
//
// Les fichiers qui ne suivent pas ce patron (routeurs de lecture/agregation
// comme institutions_dashboard, annuaire, arborescence...) sont ignores et
// listes dans le rapport final, pas traites automatiquement.
//
// Usage : node activer_modules_batch.js
// (necessite DATABASE_URL definie dans l'environnement, comme pour le serveur)
// ==============================================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const CONNECTION_STRING = process.env.DATABASE_URL || process.env.PNGIE_DB_URL;
if (!CONNECTION_STRING) {
    console.error('ERREUR : ni DATABASE_URL ni PNGIE_DB_URL ne sont definies dans cet environnement.');
    process.exit(1);
}

const pool = new Pool({ connectionString: CONNECTION_STRING });
const ROUTES_DIR = path.join(__dirname, 'routes-generated');
const ROLE_CODE = 'MI'; // role beneficiaire par defaut ; a ajuster manuellement si un module doit dependre d'un autre role

async function main() {
    const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.routes.js'));
    const rapport = [];

    for (const file of files) {
        const contenu = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8');

        const champsMatch = contenu.match(/const CHAMPS = (\[[\s\S]*?\]);/);
        const obligatoiresMatch = contenu.match(/const CHAMPS_OBLIGATOIRES = (\[[\s\S]*?\]);/);
        const tableMatch = contenu.match(/SELECT \* FROM (\w+) ORDER BY created_at/);

        if (!champsMatch || !tableMatch) {
            rapport.push({ fichier: file, table: '—', statut: 'IGNORE (pas un CRUD genere standard)' });
            continue;
        }

        const champs = JSON.parse(champsMatch[1]);
        const obligatoires = obligatoiresMatch ? JSON.parse(obligatoiresMatch[1]) : [];
        const table = tableMatch[1];
        const pk = `${table}_id`;

        const client = await pool.connect();
        try {
            const exists = await client.query(
                `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
                [table]
            );
            if (exists.rows.length > 0) {
                rapport.push({ fichier: file, table, statut: 'DEJA EXISTANTE (non modifiee)' });
                continue;
            }

            const colonnesSql = champs.map(c => {
                const obligatoire = obligatoires.includes(c) ? ' NOT NULL' : '';
                const defaut = c === 'statut' ? " DEFAULT 'EN_ATTENTE'" : '';
                return `    "${c}" TEXT${obligatoire}${defaut}`;
            }).join(',\n');

            await client.query('BEGIN');

            await client.query(`
                CREATE TABLE "${table}" (
                    "${pk}" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
${colonnesSql},
                    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
                );
            `);

            await client.query(`
                CREATE OR REPLACE FUNCTION fn_${table}_set_updated_at() RETURNS TRIGGER AS $f$
                BEGIN NEW.updated_at := now(); RETURN NEW; END; $f$ LANGUAGE plpgsql;
            `);
            await client.query(`
                CREATE TRIGGER trg_${table}_updated_at BEFORE UPDATE ON "${table}"
                FOR EACH ROW EXECUTE FUNCTION fn_${table}_set_updated_at();
            `);

            await client.query(
                `INSERT INTO meta_entity (nom_table, pk_column, libelle) VALUES ($1,$2,$3) ON CONFLICT (nom_table) DO NOTHING`,
                [table, pk, table]
            );

            const roleRes = await client.query(`SELECT role_id FROM role WHERE code=$1`, [ROLE_CODE]);
            if (roleRes.rows.length) {
                const roleId = roleRes.rows[0].role_id;
                for (const action of ['CREATE', 'READ', 'UPDATE']) {
                    await client.query(
                        `INSERT INTO permission (role_id, entite, action) VALUES ($1,$2,$3) ON CONFLICT (role_id, entite, action) DO NOTHING`,
                        [roleId, table, action]
                    );
                }
            }

            await client.query('COMMIT');
            rapport.push({ fichier: file, table, statut: `CREEE (${champs.length} champs, role ${ROLE_CODE})` });
        } catch (err) {
            await client.query('ROLLBACK').catch(() => {});
            rapport.push({ fichier: file, table, statut: 'ERREUR: ' + err.message });
        } finally {
            client.release();
        }
    }

    console.log('\n=== RAPPORT ACTIVATION EN LOT ===\n');
    for (const r of rapport) {
        console.log(`${r.table.padEnd(30)} ${r.statut}`);
    }
    console.log(`\nTotal fichiers scannes : ${files.length}`);
    console.log(`Crees  : ${rapport.filter(r => r.statut.startsWith('CREEE')).length}`);
    console.log(`Existants : ${rapport.filter(r => r.statut.startsWith('DEJA')).length}`);
    console.log(`Ignores : ${rapport.filter(r => r.statut.startsWith('IGNORE')).length}`);
    console.log(`Erreurs : ${rapport.filter(r => r.statut.startsWith('ERREUR')).length}`);

    await pool.end();
}

main().catch(err => { console.error('ERREUR FATALE :', err); process.exit(1); });
