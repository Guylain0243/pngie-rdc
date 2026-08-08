const fs = require('fs');
const path = "src/db.js";
let raw = fs.readFileSync(path, "utf8");
const hadCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

const anchor = `  impl = {
    driver: "postgres",`;

if (!content.includes(anchor)) {
  console.log("ECHEC : ancre non trouvee. Aucune modification.");
  process.exit(1);
}

const transactionMethod = `  // Transaction explicite : une seule connexion pour plusieurs requetes liees.
  // Usage : await db.transaction(async (tx) => { await tx.run(...); await tx.run(...); });
  // Si tx.run/tx.get/tx.all leve une erreur, ROLLBACK automatique et l'erreur remonte.
  async function transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { institutionId } = getContext();
      await client.query("SELECT set_config('app.current_institution_id', $1, true)", [institutionId || ""]);
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

`;

content = content.replace(anchor, transactionMethod + anchor);

// Ajouter transaction a l'objet impl postgres (apres close)
const implCloseOld = `    async close() { await pool.end(); },
  };
} else {`;
const implCloseNew = `    async close() { await pool.end(); },
    transaction,
  };
} else {`;

if (!content.includes(implCloseOld)) {
  console.log("ECHEC : ancre close (postgres) non trouvee. Aucune modification.");
  process.exit(1);
}
content = content.replace(implCloseOld, implCloseNew);

// Pour SQLite : transaction "best effort" (une seule connexion partagee de toute facon, better-sqlite3 est synchrone)
const sqliteCloseOld = `    async close() { sqlite.close(); },
  };
}`;
const sqliteCloseNew = `    async close() { sqlite.close(); },
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
}`;

if (!content.includes(sqliteCloseOld)) {
  console.log("ECHEC : ancre close (sqlite) non trouvee. Aucune modification.");
  process.exit(1);
}
content = content.replace(sqliteCloseOld, sqliteCloseNew);

if (hadCRLF) content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(path, content, "utf8");
console.log("SUCCES : db.transaction() ajoute (postgres + sqlite).");
