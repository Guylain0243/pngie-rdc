// ============================================================================
// PNGIE-RDC - Centre National de Decision
// Conforme au standard PNGIE Secure API v1.0
// ============================================================================
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const db = require("../src/db");
const { exigerPermission } = require("../src/security-engine");
const { validate, sendError } = require("../src/middleware/validation");
const { sendSuccess } = require("../src/lib/errors");
const { enregistrerEvenement } = require("../src/event-engine");

const schemaDecisionBody = {
  emetteur_institution_id: { type: "uuid", required: true },
  titre: { type: "string", required: true, maxLength: 300 },
  description: { type: "string" },
  date_emission: { type: "date", required: true },
  institutions_concernees: { type: "string", required: true }, // liste UUID separee par virgules, validee manuellement
  date_echeance: { type: "date" },
};

// LISTE des decisions
router.get("/decisions", exigerPermission("decision_gouvernementale", "READ"), async (req, res) => {
  try {
    const rows = await db.all("SELECT * FROM decision_gouvernementale ORDER BY created_at DESC");
    return sendSuccess(res, rows);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture des decisions.");
  }
});

// DETAIL d'une decision + ses actions par institution
router.get("/decisions/:id", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("decision_gouvernementale", "READ"), async (req, res) => {
  try {
    const decision = await db.get("SELECT * FROM decision_gouvernementale WHERE decision_id = ?", [req.params.id]);
    if (!decision) return sendError(res, 404, "NOT_FOUND", "Decision introuvable.");
    const actions = await db.all(
      `SELECT da.*, i.nom AS institution_nom FROM decision_action da
       JOIN institution i ON i.institution_id = da.institution_id
       WHERE da.decision_id = ? ORDER BY i.nom`,
      [req.params.id]
    );
    return sendSuccess(res, { ...decision, actions });
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la lecture de la decision.");
  }
});

// CREATION : la decision + une ligne decision_action par institution concernee, en transaction
router.post("/decisions", exigerPermission("decision_gouvernementale", "CREATE"), validate({ body: schemaDecisionBody }), async (req, res) => {
  const b = req.body;
  const institutionIds = String(b.institutions_concernees).split(",").map(s => s.trim()).filter(Boolean);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const invalides = institutionIds.filter(id => !uuidRegex.test(id));
  if (institutionIds.length === 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Au moins une institution concernee est requise.");
  }
  if (invalides.length > 0) {
    return sendError(res, 400, "VALIDATION_ERROR", "Identifiants d'institution invalides.", { invalides });
  }

  const decisionId = crypto.randomUUID();
  try {
    const result = await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO decision_gouvernementale (decision_id, emetteur_institution_id, titre, description, date_emission, statut)
         VALUES (?, ?, ?, ?, ?, 'EN_COURS')`,
        [decisionId, b.emetteur_institution_id, b.titre, b.description || null, b.date_emission]
      );
      for (const instId of institutionIds) {
        await tx.run(
          `INSERT INTO decision_action (action_id, decision_id, institution_id, statut, taux_execution, date_echeance)
           VALUES (?, ?, ?, 'NON_DEMARREE', 0, ?)`,
          [crypto.randomUUID(), decisionId, instId, b.date_echeance || null]
        );
      }
      return await tx.get("SELECT * FROM decision_gouvernementale WHERE decision_id = ?", [decisionId]);
    });
    await enregistrerEvenement("decision_gouvernementale", decisionId, "CREATION", null, result, req.user && req.user.sub);
    return sendSuccess(res, result, 201);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la creation de la decision.");
  }
});

// MISE A JOUR d'une action (declaration d'avancement par une institution)
const schemaActionBody = {
  statut: { type: "enum", required: true, values: ["NON_DEMARREE", "EN_COURS", "TERMINEE", "BLOQUEE"] },
  taux_execution: { type: "integer", required: true, min: 0, max: 100 },
  commentaire: { type: "string" },
};
router.put("/decisions/actions/:actionId", validate({ params: { actionId: { type: "uuid", required: true } }, body: schemaActionBody }), exigerPermission("decision_action", "UPDATE"), async (req, res) => {
  const b = req.body;
  try {
    const existant = await db.get("SELECT * FROM decision_action WHERE action_id = ?", [req.params.actionId]);
    if (!existant) return sendError(res, 404, "NOT_FOUND", "Action introuvable.");

    await db.run(
      `UPDATE decision_action SET statut=?, taux_execution=?, commentaire=?, updated_at=CURRENT_TIMESTAMP WHERE action_id = ?`,
      [b.statut, b.taux_execution, b.commentaire || null, req.params.actionId]
    );
    const row = await db.get("SELECT * FROM decision_action WHERE action_id = ?", [req.params.actionId]);
    await enregistrerEvenement("decision_action", req.params.actionId, "MODIFICATION", existant, row, req.user && req.user.sub);
    return sendSuccess(res, row);
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors de la mise a jour de l'action.");
  }
});

// TABLEAU DE BORD consolide : taux d'execution moyen par decision
router.get("/decisions/:id/tableau-bord", validate({ params: { id: { type: "uuid", required: true } } }), exigerPermission("decision_gouvernementale", "READ"), async (req, res) => {
  try {
    const decision = await db.get("SELECT * FROM decision_gouvernementale WHERE decision_id = ?", [req.params.id]);
    if (!decision) return sendError(res, 404, "NOT_FOUND", "Decision introuvable.");
    const stats = await db.get(
      `SELECT COUNT(*) AS total, AVG(taux_execution)::int AS taux_moyen,
              SUM(CASE WHEN statut = 'TERMINEE' THEN 1 ELSE 0 END) AS terminees,
              SUM(CASE WHEN statut = 'BLOQUEE' THEN 1 ELSE 0 END) AS bloquees
       FROM decision_action WHERE decision_id = ?`,
      [req.params.id]
    );
    return sendSuccess(res, { decision, stats });
  } catch (err) {
    return sendError(res, 500, "INTERNAL_ERROR", "Erreur lors du calcul du tableau de bord.");
  }
});

module.exports = router;
