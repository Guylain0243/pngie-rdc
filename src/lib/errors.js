// ============================================================================
// PNGIE-RDC — Module central d'erreurs normalisées
// Patron "PNGIE Secure API v1" — bloc D
//
// Convention unique pour TOUT le backend :
//   { success: false, error: { code, message, details? } }
//
// Codes HTTP réservés :
//   400 VALIDATION_ERROR        — entrée invalide (UUID, enum, champ manquant...)
//   401 AUTHENTICATION_REQUIRED — token absent, invalide ou expiré
//   403 FORBIDDEN                — authentifié mais permission refusée
//   403 FORBIDDEN_INSTITUTION    — authentifié, permission ok, mais institution non autorisée
//   404 NOT_FOUND                 — ressource inexistante
//   409 CONFLICT                  — conflit métier (statut incompatible, transition refusée...)
//   500 INTERNAL_ERROR            — incident serveur (jamais de détail SQL/stack au client)
// ============================================================================

const ERROR_CODES = Object.freeze({
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    FORBIDDEN: 'FORBIDDEN',
    FORBIDDEN_INSTITUTION: 'FORBIDDEN_INSTITUTION',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
});

const DEFAULT_HTTP_STATUS = Object.freeze({
    VALIDATION_ERROR: 400,
    AUTHENTICATION_REQUIRED: 401,
    FORBIDDEN: 403,
    FORBIDDEN_INSTITUTION: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
});

function sendError(res, httpStatusOrCode, codeOrMessage, messageOrDetails, maybeDetails) {
    let httpStatus, code, message, details;

    if (typeof httpStatusOrCode === 'string') {
        code = httpStatusOrCode;
        httpStatus = DEFAULT_HTTP_STATUS[code] || 500;
        message = codeOrMessage;
        details = messageOrDetails;
    } else {
        httpStatus = httpStatusOrCode;
        code = codeOrMessage;
        message = messageOrDetails;
        details = maybeDetails;
    }

    const body = { success: false, error: { code, message } };
    if (details !== undefined) body.error.details = details;
    return res.status(httpStatus).json(body);
}

// Succes : { success: true, data: {...} }
// httpStatus optionnel (defaut 200 ; 201 pour une creation, 204 sans corps pour une suppression).
function sendSuccess(res, data, httpStatus = 200) {
    if (httpStatus === 204) return res.status(204).end();
    return res.status(httpStatus).json({ success: true, data });
}

function globalErrorHandler(err, req, res, next) {
    console.error('[ERREUR NON GEREE]', {
        method: req.method,
        path: req.originalUrl,
        message: err.message,
        stack: err.stack,
    });

    if (res.headersSent) return next(err);

    return sendError(
        res, 500, ERROR_CODES.INTERNAL_ERROR,
        'Une erreur interne est survenue. Veuillez réessayer ou contacter un administrateur.'
    );
}

module.exports = { ERROR_CODES, DEFAULT_HTTP_STATUS, sendError, sendSuccess, globalErrorHandler };