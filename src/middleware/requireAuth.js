// ----------------------------------------------------------------------
// PNGIE-RDC - Middleware d'authentification unique
// Patron "PNGIE Secure API v1"
//
// Verification JWT, puis resolution de institutionId via
// personne_role.scope_institution_id, puis propagation via requestContext.run().
// Reponses normalisees via sendError() (lib/errors.js) et audit des echecs
// d'authentification (AUTHENTICATION_FAILED).
//
// Remplace toutes les copies locales de requireAuth (server.js et
// rni-commandement-routes.js) : une seule implementation partagee.
// ----------------------------------------------------------------------
const jwt = require('jsonwebtoken');
const db = require('../db');
const requestContext = require('../request-context');
const { possedeLectureNationale } = require('../security/scope-resolver');
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
    await audit(null, 'AUTHENTICATION_FAILED', 'auth', null, { raison: 'Token invalide ou expire' });
    return sendError(res, 'AUTHENTICATION_REQUIRED', 'Token invalide ou expire.');
  }

  // Resolution unique de l'institution de portee (scope_institution_id),
  // toujours via bypass RLS : la lecture de personne_role se heurterait
  // sinon a RLS elle-meme (l'utilisateur ne peut pas encore se voir tant
  // que le contexte n'est pas etabli). Pattern deja approuve : app.bypass_rls
  // (cf. policies RLS existantes et
  // db/migrations/journal/006_fix_rls_journal_scope_national.sql).
  let institutionId = null;
  let lectureNationale = false;
  let resolved = { institutionId: null, lectureNationale: false };
  if (req.user.roles && req.user.roles.length > 0) {
    resolved = await requestContext.run({ bypassRls: true }, async () => {
      try {
      const scope = await db.get(
          'SELECT scope_institution_id FROM personne_role WHERE personne_id = ?::uuid AND scope_institution_id IS NOT NULL LIMIT 1',
          [req.user.sub]
        );
        const national = await possedeLectureNationale(req.user.sub);
        return { institutionId: scope ? scope.scope_institution_id : null, lectureNationale: !!national };
      } catch (e) {
        console.error('requireAuth: echec resolution institutionId (bypass RLS) pour', req.user.sub, ':', e && e.message);
        return { institutionId: null, lectureNationale: false };
      }
    });
  }

  institutionId = resolved.institutionId;
  lectureNationale = resolved.lectureNationale;

  requestContext.run({ institutionId, lectureNationale }, next);
}

module.exports = requireAuth;
