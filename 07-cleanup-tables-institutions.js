// ============================================================
// Nettoyage : supprime les tables institutions/comptes_institution
// creees par erreur (elles font doublon avec organization/person
// qui existent deja dans le projet). Elles sont vides ou peu
// utilisees, donc sans risque de suppression.
// Usage : node 07-cleanup-tables-institutions.js
// ============================================================

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'db', 'pngie.db');
const db = new Database(DB_PATH);

try {
    db.exec('DROP TABLE IF EXISTS comptes_institution');
    db.exec('DROP TABLE IF EXISTS institutions');
    console.log('OK - Tables institutions et comptes_institution supprimees (elles ne servaient plus).');
} catch (err) {
    console.error('ERREUR :', err.message);
} finally {
    db.close();
}
