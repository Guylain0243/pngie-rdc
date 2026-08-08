// ============================================================
// MOTEUR DE NOTIFICATIONS - module reutilisable, generique pour toutes les entites
// Se declenche apres un evenement (CREATION/MODIFICATION/SUPPRESSION).
//
// NOTE : genere des notifications en base (canal INTERNE). N'envoie pas
// reellement de SMS/email dans ce pilote - voir 18-create-notification-engine.js
// pour le detail.
// ============================================================

const crypto = require('crypto');
const db = require('./db');

function evaluerCondition(cond, donnees) {
    const valeur = donnees ? donnees[cond.champ] : undefined;
    switch (cond.operateur) {
        case '=': return String(valeur) === String(cond.valeur);
        case '!=': return String(valeur) !== String(cond.valeur);
        default: return false;
    }
}

function rendreMessage(template, donnees) {
    return template.replace(/\{(\w+)\}/g, (_, champ) => (donnees && donnees[champ] !== undefined) ? donnees[champ] : `{${champ}}`);
}

/**
 * Evalue les regles de notification actives pour une entite/evenement et
 * genere les notifications correspondantes. Retourne la liste generee.
 */
async function declencherNotifications(entity, entityId, evenement, donneesApres) {
    const regles = await db.all(
        `SELECT * FROM meta_notification_rule WHERE entite = ? AND evenement = ? AND statut = 'ACTIF'`,
        [entity, evenement]
    );

    const generees = [];
    for (const regle of regles) {
        let conditions;
        try {
            conditions = typeof regle.condition_json === 'string' ? JSON.parse(regle.condition_json) : regle.condition_json;
        } catch (e) {
            continue;
        }
        const declenche = conditions.every(c => evaluerCondition(c, donneesApres));
        if (!declenche) continue;

        const message = rendreMessage(regle.message_template, donneesApres);

        const destinataires = await db.all(
            `SELECT p.person_id FROM person_role pr JOIN role r ON r.role_id = pr.role_id JOIN person p ON p.person_id = pr.person_id WHERE r.code = ?`,
            [regle.destinataire_role_code]
        );

        for (const dest of destinataires) {
            const notifId = crypto.randomUUID();
            await db.run(
                `INSERT INTO notification (notification_id, destinataire_id, type_notification, canal, titre, contenu, entite_liee, entite_liee_ref_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [notifId, dest.person_id, evenement, regle.canal || 'INTERNE', entity, message, entity, entityId]
            );
            generees.push({ notification_id: notifId, destinataire_id: dest.person_id, canal: regle.canal, message });
        }
    }
    return generees;
}

module.exports = { declencherNotifications };




