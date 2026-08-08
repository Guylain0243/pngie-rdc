// ==============================================================
// PILOTE Government Meta Platform - Moteur de NOTIFICATIONS
//
// Cree meta_notification_rule (regles declaratives : "quand X arrive,
// notifier Y") + notification (les notifications generees).
//
// IMPORTANT - honnetete technique :
// Ce pilote GENERE des notifications en base (canal "INTERNE"), il
// n'envoie PAS reellement de SMS/email. Je n'ai pas de service d'envoi
// (Twilio, SMTP...) connecte a cet environnement de test. Brancher un
// vrai envoi est une etape separate, simple a ajouter une fois ce
// pilote valide (juste remplacer l'INSERT par un appel au service choisi).
//
// Usage : node 18-create-notification-engine.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES 09-10-11-13-14-15-16-17
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');

async function main() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS meta_notification_rule (
            rule_id TEXT PRIMARY KEY,
            entity TEXT NOT NULL,
            evenement TEXT NOT NULL,
            condition_json TEXT NOT NULL,
            canal TEXT NOT NULL,
            destinataire_role_code TEXT NOT NULL,
            message_template TEXT NOT NULL,
            statut TEXT DEFAULT 'ACTIF',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await db.run(`
        CREATE TABLE IF NOT EXISTS notification (
            notification_id TEXT PRIMARY KEY,
            entity TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            canal TEXT NOT NULL,
            destinataire_role_code TEXT NOT NULL,
            message TEXT NOT NULL,
            statut TEXT DEFAULT 'GENEREE',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
    await db.run(`CREATE INDEX IF NOT EXISTS idx_notification_entity ON notification(entity, entity_id)`);

    console.log('OK - Tables meta_notification_rule et notification creees (ou deja existantes).');

    const nomRegle = 'Notifier Finances quand une facture est payee';
    const existante = await db.get(
        'SELECT rule_id FROM meta_notification_rule WHERE entity = ? AND evenement = ? AND canal = ?',
        ['facture', 'MODIFICATION', 'INTERNE']
    );
    if (existante) {
        console.log(`(i) Regle de notification existe deja - ignoree`);
    } else {
        const condition = [{ champ: 'statut', operateur: '=', valeur: 'PAYEE' }];
        await db.run(
            `INSERT INTO meta_notification_rule
             (rule_id, entity, evenement, condition_json, canal, destinataire_role_code, message_template)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                crypto.randomUUID(),
                'facture',
                'MODIFICATION',
                JSON.stringify(condition),
                'INTERNE',
                'MI',
                'Facture {numero} de {montant} {devise} a ete payee.'
            ]
        );
        console.log('+-- Regle de notification enregistree : facture PAYEE -> notifie le role MI');
    }

    console.log('\nProchaine etape : node government-builder.js facture (regenere avec notifications branchees)');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
