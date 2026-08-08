// ----------------------------------------------------------------
// PNGIE-RDC - Middleware de validation de corps de requete, nomme et reutilisable
// Remplace/etend le motif validerPayload() duplique dans 36 fichiers routes-generated.
//
// Usage minimal (equivalent a l'existant, champs obligatoires seulement) :
//   router.post('/agents', validerCorps({ nom: {requis:true}, prenom: {requis:true} }), ...)
//
// Usage etendu (type, regex, enum) :
//   router.post('/agents', validerCorps({
//     nom:            { requis: true, type: 'string' },
//     date_naissance: { requis: true, type: 'date' },
//     matricule:      { requis: true, type: 'string', regex: /^AG-[0-9]{6}$/ },
//     statut:         { requis: true, type: 'string', enum: ['ACTIF','SUSPENDU','RADIE'] },
//     salaire:        { requis: false, type: 'number' },
//   }), ...)
//
// Reponse d'erreur au format standard (lib/errors.js) : 400 VALIDATION_ERROR,
// avec la liste des champs en defaut dans error.details.champs.
// ----------------------------------------------------------------
const { sendError } = require("../lib/errors");

function valeurAbsente(v) {
  return v === undefined || v === null || v === "";
}

function typeValide(valeur, type) {
  switch (type) {
    case "string": return typeof valeur === "string";
    case "number": return typeof valeur === "number" || (typeof valeur === "string" && valeur.trim() !== "" && !isNaN(Number(valeur)));
    case "boolean": return typeof valeur === "boolean";
    case "date": return !isNaN(Date.parse(valeur));
    case "uuid": return typeof valeur === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valeur);
    default: return true; // type inconnu : pas de contrainte
  }
}

/**
 * Middleware Express de validation. schema = { nomChamp: { requis, type, regex, enum } }
 */
function validerCorps(schema) {
  return (req, res, next) => {
    const body = req.body || {};
    const erreurs = [];

    for (const [champ, regles] of Object.entries(schema)) {
      const valeur = body[champ];
      const absent = valeurAbsente(valeur);

      if (regles.requis && absent) {
        erreurs.push({ champ, probleme: "requis" });
        continue;
      }
      if (absent) continue; // champ optionnel absent : pas d'autre verification

      if (regles.type && !typeValide(valeur, regles.type)) {
        erreurs.push({ champ, probleme: `type attendu: ${regles.type}` });
      }
      if (regles.regex && typeof valeur === "string" && !regles.regex.test(valeur)) {
        erreurs.push({ champ, probleme: "format invalide" });
      }
      if (regles.enum && !regles.enum.includes(valeur)) {
        erreurs.push({ champ, probleme: `valeur attendue parmi: ${regles.enum.join(", ")}` });
      }
    }

    if (erreurs.length > 0) {
      return sendError(res, "VALIDATION_ERROR", "Corps de requete invalide.", { champs: erreurs });
    }
    next();
  };
}

module.exports = validerCorps;
