// ----------------------------------------------------------------
// PNGIE-RDC � Middleware d'authentification unique
// Patron "PNGIE Secure API v1"
//
// Extraction FID�LE du requireAuth historique de server.js (lignes
// 129-151). AUCUN changement de comportement m�tier : m�me
// v�rification JWT, m�me r�solution institutionId via
// personne_role.scope_institution_id, m�me propagation requestContext.run().
// Seuls ajouts : r�ponses normalis�es via sendError() (lib/errors.js)
// et audit des �checs d'authentification (AUTHENTICATION_FAILED).
//
// Remplace toutes les copies locales de requireAuth (server.js et
// rni-commandement-routes.js) : une seule impl�mentation partag�e.
// ----------------------------------------------------------------
const jwt = require('jsonwebtoken');
const db = require('../db');
const requestContext = require('../request-context');
const { sendError } = require('../lib/errors');
const audit = require('../lib/audit');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("ERREUR FATALE : JWT_SECRET absent ou trop faible (minimum 32 caracteres). Definir une variable d'environnement JWT_SECRET valide avant de demarrer le serveur.");
  process.exit(1);
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    await audit(null, 'AUTHENTICATION_FAILED', 'auth', null, { raison: 'Token manquant' });
    return sendError(res, 'AUTHENTICATION_REQUIRED', 'Token manquant.');
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
  } catch {
    await audit(null, 'AUTHENTICATION_FAILED', 'auth', null, { raison: 'Token invalide ou expir�' });
    return sendError(res, 'AUTHENTICATION_REQUIRED', 'Token invalide ou expir�.');
  }

  // R�solution de l'institution de port�e (scope_institution_id), identique � l'original.
  let institutionId = null;
  try {
    if (req.user.roles && req.user.roles.length > 0) {
      const scope = await db.get(
        'SELECT scope_institution_id FROM personne_role WHERE personne_id = ?::uuid AND scope_institution_id IS NOT NULL LIMIT 1',
        [req.user.sub]
      );
      institutionId = scope ? scope.scope_institution_id : null;
    }
  } catch (e) {
    institutionId = null;
  }

  requestContext.run({ institutionId }, next);
}

module.exports = requireAuth;
