// ==============================================================
// MOTEUR DE SECURITE - module reutilisable, generique pour toutes les entites
// Politique : REFUS PAR DEFAUT.
//
// SUBSTITUT TEMPORAIRE D'AUTHENTIFICATION :
// Ce module lit le role de l'appelant via l'en-tete HTTP "x-role-code".
// A REMPLACER en production par le decodage du role depuis le JWT
// verifie par votre middleware d'authentification existant
// (celui qui alimente deja /api/auth/login).
// ==============================================================

const db = require('./db');

async function verifierPermission(roleCode, entity, action) {
    if (!roleCode) return false;
    const row = await db.get(
        `SELECT permission_id FROM meta_permission
         WHERE role_code = ? AND entity = ? AND action = ? AND statut = 'ACTIF'`,
        [roleCode, entity, action]
    );
    return !!row;
}

/**
 * Middleware Express : exige qu'une permission soit accordee pour continuer.
 * Usage : router.get('/factures', exigerPermission('facture', 'READ'), async (req, res) => {...})
 */
function exigerPermission(entity, action) {
    return async (req, res, next) => {
        const roleCode = req.header('x-role-code');
        if (!roleCode) {
            return res.status(401).json({ error: 'Role non identifie (en-tete x-role-code manquant)' });
        }
        try {
            const autorise = await verifierPermission(roleCode, entity, action);
            if (!autorise) {
                return res.status(403).json({
                    error: `Permission refusee : le role "${roleCode}" ne peut pas faire "${action}" sur "${entity}"`
                });
            }
            req.roleCode = roleCode;
            next();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
}

module.exports = { verifierPermission, exigerPermission };
