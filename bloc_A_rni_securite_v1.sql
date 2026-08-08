// ============================================================================
// PNGIE-RDC — Middleware de validation API commun
// Patron "PNGIE Secure API v1" — bloc B
//
// Usage :
//   const { validate, validatePagination, sendError } = require('./middleware/validation');
//
//   router.post('/rni/liens', validate({
//     body: {
//       institution_id: { type: 'uuid', required: true },
//       institution_parent_id: { type: 'uuid', required: true },
//       type_lien: { type: 'enum', values: ['TUTELLE','HIERARCHIQUE','FONCTIONNEL','COORDINATION'], required: true },
//       reference_juridique: { type: 'string', maxLength: 500 }
//     }
//   }), wrap(async (req, res) => { ... }));
//
// Toute violation renvoie 400 VALIDATION_ERROR avant d'atteindre la logique
// métier ou PostgreSQL. Jamais de détail SQL/stack trace dans la réponse.
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ----------------------------------------------------------------------------
// Enveloppe d'erreur uniforme — utilisée par TOUT le backend, pas seulement
// la validation. Convention : 400/401/403/404/409/500.
// ----------------------------------------------------------------------------
function sendError(res, httpStatus, code, message, details) {
    const body = { success: false, error: { code, message } };
    if (details !== undefined) body.error.details = details;
    return res.status(httpStatus).json(body);
}

// ----------------------------------------------------------------------------
// Validation d'un champ unique selon sa définition de schéma
// Retourne null si valide, ou une chaîne décrivant l'erreur sinon
// ----------------------------------------------------------------------------
function validateField(value, def, fieldName) {
    const isEmpty = value === undefined || value === null || value === '';

    if (isEmpty) {
        if (def.required) return `Le champ "${fieldName}" est requis.`;
        return null; // champ optionnel absent : pas d'erreur, pas de validation de type
    }

    switch (def.type) {
        case 'uuid':
            if (typeof value !== 'string' || !UUID_REGEX.test(value)) {
                return `Le champ "${fieldName}" doit être un UUID valide.`;
            }
            break;

        case 'enum':
            if (!Array.isArray(def.values) || !def.values.includes(value)) {
                return `Le champ "${fieldName}" doit être l'une des valeurs suivantes : ${def.values.join(', ')}.`;
            }
            break;

        case 'string':
            if (typeof value !== 'string') {
                return `Le champ "${fieldName}" doit être une chaîne de caractères.`;
            }
            if (def.maxLength && value.length > def.maxLength) {
                return `Le champ "${fieldName}" ne doit pas dépasser ${def.maxLength} caractères.`;
            }
            if (def.minLength && value.length < def.minLength) {
                return `Le champ "${fieldName}" doit contenir au moins ${def.minLength} caractères.`;
            }
            break;

        case 'date':
            if (typeof value !== 'string' || !DATE_REGEX.test(value) || isNaN(Date.parse(value))) {
                return `Le champ "${fieldName}" doit être une date valide au format AAAA-MM-JJ.`;
            }
            break;

        case 'integer':
            if (!Number.isInteger(Number(value))) {
                return `Le champ "${fieldName}" doit être un nombre entier.`;
            }
            if (def.min !== undefined && Number(value) < def.min) {
                return `Le champ "${fieldName}" doit être supérieur ou égal à ${def.min}.`;
            }
            if (def.max !== undefined && Number(value) > def.max) {
                return `Le champ "${fieldName}" doit être inférieur ou égal à ${def.max}.`;
            }
            break;

        case 'boolean':
            if (typeof value !== 'boolean') {
                return `Le champ "${fieldName}" doit être un booléen.`;
            }
            break;

        default:
            // Type non reconnu dans le schéma : erreur de programmation, pas de l'utilisateur.
            // On ne bloque pas la requête pour ça, mais on pourrait logger côté serveur.
            break;
    }
    return null;
}

// ----------------------------------------------------------------------------
// Middleware principal : valide params / query / body selon un schéma déclaratif
// ----------------------------------------------------------------------------
function validate(schema) {
    return (req, res, next) => {
        const violations = [];

        for (const source of ['params', 'query', 'body']) {
            const fields = schema[source];
            if (!fields) continue;
            const data = req[source] || {};

            for (const [fieldName, def] of Object.entries(fields)) {
                const error = validateField(data[fieldName], def, fieldName);
                if (error) violations.push({ field: fieldName, message: error });
            }
        }

        if (violations.length > 0) {
            return sendError(
                res, 400, 'VALIDATION_ERROR',
                'Une ou plusieurs valeurs fournies sont invalides.',
                violations
            );
        }
        next();
    };
}

// ----------------------------------------------------------------------------
// Pagination commune — query ?page=&limit=
// Plafonne limit pour éviter qu'un client demande 1 000 000 lignes d'un coup.
// ----------------------------------------------------------------------------
function validatePagination(options = {}) {
    const maxLimit = options.maxLimit || 100;
    const defaultLimit = options.defaultLimit || 20;

    return (req, res, next) => {
        let { page, limit } = req.query;

        page = page === undefined ? 1 : Number(page);
        limit = limit === undefined ? defaultLimit : Number(limit);

        if (!Number.isInteger(page) || page < 1) {
            return sendError(res, 400, 'VALIDATION_ERROR', 'Le paramètre "page" doit être un entier supérieur ou égal à 1.');
        }
        if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
            return sendError(res, 400, 'VALIDATION_ERROR', `Le paramètre "limit" doit être un entier entre 1 et ${maxLimit}.`);
        }

        req.pagination = { page, limit, offset: (page - 1) * limit };
        next();
    };
}

module.exports = { validate, validatePagination, sendError, UUID_REGEX, DATE_REGEX };