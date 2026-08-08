// ==============================================================
// DEMO du moteur de regles : "Une facture PAYEE ne peut plus etre modifiee"
//
// Usage : node 14-demo-regle-facture-payee.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 13-create-rule-engine.js
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');

async function main() {
    const nomRegle = 'Facture payee non modifiable';

    const existante = await db.get(
        'SELECT rule_id FROM meta_rule WHERE entity = ? AND nom = ?',
        ['facture', nomRegle]
    );
    if (existante) {
        console.log(`(i) Regle "${nomRegle}" existe deja - ignoree.`);
        return;
    }

    const condition = [
        { champ: 'statut', source: 'existant', operateur: '=', valeur: 'PAYEE' }
    ];

    await db.run(
        `INSERT INTO meta_rule (rule_id, entity, nom, description, evenement, condition_json, message_erreur)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            crypto.randomUUID(),
            'facture',
            nomRegle,
            'Empeche toute modification d\'une facture dont le statut est deja PAYEE',
            'AVANT_MODIFICATION',
            JSON.stringify(condition),
            'Cette facture est deja payee et ne peut plus etre modifiee.'
        ]
    );

    console.log(`OK - Regle "${nomRegle}" enregistree.`);
    console.log('Rappel : cette regle est purement declarative (donnee en base), aucun code n\'a ete ecrit pour elle.');
    console.log('\nProchaine etape : regenerer le routeur avec le moteur de regles branche :');
    console.log('  node government-builder.js facture');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
