// Couche d'abstraction base de donnÃ©es. Un seul jeu de requÃªtes (placeholders `?`),
// deux moteurs possibles :
//   - SQLite (better-sqlite3)  : utilisÃ© par dÃ©faut, pour le dev local et les tests
//   - PostgreSQL (pg)          : utilisÃ© dÃ¨s que DATABASE_URL est dÃ©finie â€” c'est le
//                                moteur destinÃ© Ã  la production, seul capable de vraies
//                                Ã©critures concurrentes (voir l'audit de charge).
// Toutes les fonctions sont asynchrones (Promise), mÃªme pour SQLite, afin que le code
// appelant soit strictement identique quel que soit le moteur choisi.
const path = require("path");
const { getContext } = require("./request-context");

const usePostgres = !!process.env.DATABASE_URL;

function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

let impl;

if (usePostgres) {
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  // Chaque appel s'exÃ©cute dans une transaction courte (BEGIN/SET LOCAL/requÃªte/COMMIT)
  // plutÃ´t que via pool.query() direct, afin que app.current_institution_id soit bien
  // propagÃ© Ã  la connexion qui exÃ©cute la requÃªte (RLS par institution).
  async function withConnection(sql, params) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { institutionId, bypassRls, lectureNationale } = getContext();
      if (bypassRls) {
        await client.query("SELECT set_config('app.bypass_rls', 'true', true)");
      } else {
        await client.query("SELECT set_config('app.current_institution_id', $1, true)", [institutionId || ""]);
        await client.query("SELECT set_config('app.lecture_nationale', $1, true)", [lectureNationale ? "true" : "false"]);
      }
      const result = await client.query(toPg(sql), params);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try { await client.query("ROLLBACK"); } catch (e) {}
      throw err;
    } finally {
      client.release();
    }
  }

  // Transaction explicite : une seule connexion pour plusieurs requetes liees.
  // Usage : await db.transaction(async (tx) => { await tx.run(...); await tx.run(...); });
  // Si tx.run/tx.get/tx.all leve une erreur, ROLLBACK automatique et l'erreur remonte.
  async function transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { institutionId, bypassRls, lectureNationale } = getContext();
      if (bypassRls) {
        await client.query("SELECT set_config('app.bypass_rls', 'true', true)");
      } else {
        await client.query("SELECT set_config('app.current_institution_id', $1, true)", [institutionId || ""]);
        await client.query("SELECT set_config('app.lecture_nationale', $1, true)", [lectureNationale ? "true" : "false"]);
      }
      const tx = {
        async get(sql, params = []) { const { rows } = await client.query(toPg(sql), params); return rows[0] || null; },
        async all(sql, params = []) { const { rows } = await client.query(toPg(sql), params); return rows; },
        async run(sql, params = []) { const { rowCount } = await client.query(toPg(sql), params); return { changes: rowCount }; },
      };
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try { await client.query("ROLLBACK"); } catch (e) {}
      throw err;
    } finally {
      client.release();
    }
  }

  impl = {
    driver: "postgres",
    async get(sql, params = []) {
      const { rows } = await withConnection(sql, params);
      return rows[0] || null;
    },
    async all(sql, params = []) {
      const { rows } = await withConnection(sql, params);
      return rows;
    },
    async run(sql, params = []) {
      const { rowCount } = await withConnection(sql, params);
      return { changes: rowCount };
    },
    async close() { await pool.end(); },
    transaction,
  };
} else {
  const Database = require("better-sqlite3");
  const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "db", "pngie.db");
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL"); // autorise au moins des lectures concurrentes pendant une Ã©criture

  impl = {
    driver: "sqlite",
    async get(sql, params = []) { return sqlite.prepare(sql).get(...params) || null; },
    async all(sql, params = []) { return sqlite.prepare(sql).all(...params); },
    async run(sql, params = []) {
      const r = sqlite.prepare(sql).run(...params);
      return { changes: r.changes };
    },
    async close() { sqlite.close(); },
    async transaction(fn) {
      const tx = {
        async get(sql, params = []) { return sqlite.prepare(sql).get(...params) || null; },
        async all(sql, params = []) { return sqlite.prepare(sql).all(...params); },
        async run(sql, params = []) { const r = sqlite.prepare(sql).run(...params); return { changes: r.changes }; },
      };
      const runTx = sqlite.transaction(async () => await fn(tx));
      return runTx();
    },
  };
}

module.exports = impl;