// src/security/scope-engine.js
// Middleware generique : exigerPortee({type, source})
// - Sans source : mode liste, attache req.scope pour que le controleur filtre lui-meme.
// - Avec source : verifie qu une ressource precise (params.id, body.xxx_id, ...) est dans le perimetre.
const { resoudrePorteeInstitution } = require("./scope-resolver");
const { RESOLVERS } = require("./resource-resolver");

function getFromPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

function exigerPortee({ type, source } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.scope) {
        const { institutionId, institutionsVisibles } = await resoudrePorteeInstitution(req.user.sub);
        req.scope = { institutionId, institutionsVisibles };
      }
      if (!source) {
        return next();
      }
      const resolver = RESOLVERS[type];
      if (!resolver) {
        return res.status(500).json({ error: "Type de ressource non supporte par le ScopeResolver: " + type });
      }
      const valeur = getFromPath(req, source);
      if (!valeur) {
        return res.status(400).json({ error: "Valeur manquante pour la verification de portee (" + source + ")" });
      }
      const institutionCible = await resolver(valeur);
      if (!institutionCible) {
        return res.status(404).json({ error: "Ressource introuvable pour la verification de portee." });
      }
      if (!req.scope.institutionsVisibles.includes(institutionCible)) {
        return res.status(403).json({ error: "Cette ressource est hors de votre perimetre de visibilite." });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
}

module.exports = { exigerPortee };
