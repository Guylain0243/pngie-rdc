const db = require("../src/db");

(async () => {
    try {
        const rows = await db.all("SELECT current_database() AS db, current_user AS usr, version() AS ver");
        console.log(rows[0]);
    } catch(e) {
        console.error("ERREUR:", e.message);
    }
    process.exit(0);
})();
