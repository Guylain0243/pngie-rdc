const Database = require('better-sqlite3');
const db = new Database('C:/pngie-rdc/pngie-backend/db/pngie.db', { readonly: true });

console.log('=== VUES (VIEWS) ===');
const views = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='view' ORDER BY name").all();
views.forEach(function(v) {
    console.log('\n--- ' + v.name + ' ---');
    console.log(v.sql);
});

console.log('\n\n=== Test rapide: la vue institution existe et repond ===');
try {
    const cnt = db.prepare('SELECT COUNT(*) as n FROM institution').get();
    console.log('institution: ' + cnt.n + ' lignes');
} catch (e) { console.log('institution: ERREUR - ' + e.message); }

try {
    const cnt2 = db.prepare('SELECT COUNT(*) as n FROM poste').get();
    console.log('poste: ' + cnt2.n + ' lignes');
} catch (e) { console.log('poste: ERREUR - ' + e.message); }

try {
    const cnt3 = db.prepare('SELECT COUNT(*) as n FROM unite_organisationnelle').get();
    console.log('unite_organisationnelle: ' + cnt3.n + ' lignes');
} catch (e) { console.log('unite_organisationnelle: ERREUR - ' + e.message); }

try {
    const cnt4 = db.prepare('SELECT COUNT(*) as n FROM personne').get();
    console.log('personne: ' + cnt4.n + ' lignes');
} catch (e) { console.log('personne: ERREUR - ' + e.message); }

try {
    const cnt5 = db.prepare('SELECT COUNT(*) as n FROM affectation').get();
    console.log('affectation: ' + cnt5.n + ' lignes');
} catch (e) { console.log('affectation: ERREUR - ' + e.message); }

db.close();
