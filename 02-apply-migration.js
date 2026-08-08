// ============================================================
// Applique la migration SQL sur la base pngie.db existante
// Usage : node 02-apply-migration.js
// A executer depuis C:\pngie-rdc\pngie-backend
// ============================================================

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'db', 'pngie.db');
const SQL_PATH = path.join(__dirname, '01-migration-institutions.sql');

if (!fs.existsSync(DB_PATH)) {
    console.error('ERREUR : base introuvable a ' + DB_PATH);
    console.error('Verifiez que ce script est place dans C:\\pngie-rdc\\pngie-backend');
    process.exit(1);
}

if (!fs.existsSync(SQL_PATH)) {
    console.error('ERREUR : fichier SQL introuvable a ' + SQL_PATH);
    console.error('Placez 01-migration-institutions.sql dans le meme dossier que ce script');
    process.exit(1);
}

const db = new Database(DB_PATH);
const sql = fs.readFileSync(SQL_PATH, 'utf8');

try {
    db.exec(sql);
    console.log('OK - Migration appliquee avec succes.');
    console.log('Tables creees : institutions, comptes_institution');

    const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('institutions','comptes_institution')"
    ).all();
    console.log('Verification :', tables.map(t => t.name).join(', '));
} catch (err) {
    console.error('ERREUR lors de la migration :', err.message);
    process.exit(1);
} finally {
    db.close();
}
