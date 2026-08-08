// ============================================================================
// PNGIE-RDC - Module SIRH : Agents
// Premier routeur construit integralement selon le standard PNGIE Secure API v1.0
// Chaine : requireAuth -> resoudreRoleDepuisJWT (global) -> exigerPermission ->
//          exigerPortee (ScopeResolver) -> validate -> db.transaction -> enregistrerEvenement -> sendSuccess/sendError
// ============================================================================
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../src/db");
const { exigerPermission } = require("../src/security-engine");
const { exigerPortee } = require("../src/security/scope-engine");
const { validate, sendError } = require("../src/middleware/validation");
const { sendSuccess } = require("../src/lib/errors");
const { enregistrerEvenement } = require("../src/event-engine");

const schemaAgentBody = {
  nom: { type: "string", required: true, maxLength: 200 },
  prenom: { type: "string", required: true, maxLength: 200 },
  date_naissance: { type: "date", required: true },
  matricule: { type: "string", required: true, maxLength: 20 },
  numero_identite_nationale: { type: "string", maxLength: 50 },
  sexe: { type: "enum", required: true, values: ["M", "F"] },
  email: { type: "string", maxLength: 200 },
  telephone: { type: "string", maxLength: 30 },
  institution_id: { type: "uuid", required: true },
  personne_id: { type: "uuid" },
  grade_id: { type: "uuid" },
  corps_id: { type: "uuid" },
  statut: { type: "enum", values: ["ACTIF", "SUSPENDU", "RADIE", "RETRAITE"] },
};

// LISTE - filtree par institutions visibles
router.get("/agents-rh", exigerPermission("agent", "READ"), exigerPortee({ type: "agent" }), async (req, res) => {
  try {
    const placeholders = req.scope.institutionsVisibles.map(() => "?").join(",");
    if (!placeholders) return sendSuccess(res, []);
    const rows = await db.all(`SELECT * FROM agent WHERE institution_id IN (${placeholders}) ORDER BY created_at DESC`, req.scope.institutionsVisibles);
    return sendSuccess(res, rows);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture des agents.");
  }
});

// DETAIL
router.get("/agents-rh/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("agent", "READ"), exigerPortee({ type: "agent", source: "params.id" }), async (req, res) => {
  try {
    const row = await db.get("SELECT * FROM agent WHERE agent_id = ?", [req.params.id]);
    if (!row) return sendError(res, 404, "NOT_FOUND", "Agent introuvable.");
    return sendSuccess(res, row);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture de l'agent.");
  }
});

// CREATION - le scope verifie l institution_id cible dans le corps de la requete
router.post("/agents-rh", exigerPermission("agent", "CREATE"), validate({ body: schemaAgentBody }), exigerPortee({ type: "institution", source: "body.institution_id" }), async (req, res) => {
  const b = req.body;
  const id = crypto.randomUUID();
  try {
    const row = await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO agent (agent_id, nom, prenom, date_naissance, matricule, numero_identite_nationale, sexe, email, telephone, institution_id, grade_id, corps_id, personne_id, statut)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, b.nom, b.prenom, b.date_naissance, b.matricule, b.numero_identite_nationale || null, b.sexe, b.email || null, b.telephone || null, b.institution_id, b.grade_id || null, b.corps_id || null, b.personne_id || null, b.statut || "ACTIF"]
      );
      return await tx.get("SELECT * FROM agent WHERE agent_id = ?", [id]);
    });
    await enregistrerEvenement("agent", id, "CREATION", null, row, req.user && req.user.sub);
    return sendSuccess(res, row, 201);
  } catch (err) {
    if (err.message && err.message.includes("unique")) {
      return sendError(res, 409, "CONFLICT", "Un agent avec ce matricule existe deja.");
    }
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la creation de l'agent.");
  }
});

// MODIFICATION - verifie l institution actuelle de l agent ET la nouvelle institution_id cible
router.put("/agents-rh/:id", validate({ params: { id: { type: "uuid", required: true } }, body: schemaAgentBody }), exigerPermission("agent", "UPDATE"), exigerPortee({ type: "agent", source: "params.id" }), exigerPortee({ type: "institution", source: "body.institution_id" }), async (req, res) => {
  const b = req.body;
  try {
    const existant = await db.get("SELECT * FROM agent WHERE agent_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Agent introuvable.");

    const row = await db.transaction(async (tx) => {
      await tx.run(
        `UPDATE agent SET nom=?, prenom=?, date_naissance=?, matricule=?, numero_identite_nationale=?, sexe=?, email=?, telephone=?, institution_id=?, grade_id=?, corps_id=?, statut=?, updated_at=CURRENT_TIMESTAMP
         WHERE agent_id = ?`,
        [b.nom, b.prenom, b.date_naissance, b.matricule, b.numero_identite_nationale || null, b.sexe, b.email || null, b.telephone || null, b.institution_id, b.grade_id || null, b.corps_id || null, b.statut || existant.statut, req.params.id]
      );
      return await tx.get("SELECT * FROM agent WHERE agent_id = ?", [req.params.id]);
    });
    await enregistrerEvenement("agent", req.params.id, "MODIFICATION", existant, row, req.user && req.user.sub);
    return sendSuccess(res, row);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la modification de l'agent.");
  }
});

// SUPPRESSION
router.delete("/agents-rh/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("agent", "DELETE"), exigerPortee({ type: "agent", source: "params.id" }), async (req, res) => {
  try {
    const existant = await db.get("SELECT * FROM agent WHERE agent_id = ?", [req.params.id]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Agent introuvable.");

    await db.run("DELETE FROM agent WHERE agent_id = ?", [req.params.id]);
    await enregistrerEvenement("agent", req.params.id, "SUPPRESSION", existant, null, req.user && req.user.sub);
    return sendSuccess(res, null, 204);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la suppression de l'agent.");
  }
});

// HISTORIQUE
router.get("/agents-rh/:id/historique", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("agent", "READ"), exigerPortee({ type: "agent", source: "params.id" }), async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM entity_event WHERE entity = ? AND entity_id = ? ORDER BY created_at DESC", ["agent", req.params.id]);
    return sendSuccess(res, rows);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture de l'historique.");
  }
});

module.exports = router;
