// src/domains/journal/journal.routes.js
// requireAuth n'est PAS applique ici : il est passe au montage dans server.js,
// comme pour toutes les autres routes (voir app.use('/api', requireAuth, require(...))).
const express = require("express");
const ctrl = require("./journal.controller");

const router = express.Router();

router.get("/journal/types", ctrl.types);
router.get("/journal/recherche", ctrl.rechercher);

router.post("/journal/actes", ctrl.creer);
router.get("/journal/actes", ctrl.lister);
router.get("/journal/actes/:id", ctrl.obtenir);
router.put("/journal/actes/:id", ctrl.modifier);
router.get("/journal/actes/:id/historique", ctrl.historique);

router.post("/journal/actes/:id/soumettre", ctrl.transitionVers("soumis"));
router.post("/journal/actes/:id/valider", ctrl.transitionVers("valide"));
router.post("/journal/actes/:id/signer", ctrl.signer);
router.post("/journal/actes/:id/publier", ctrl.transitionVers("publie"));
router.post("/journal/actes/:id/archiver", ctrl.transitionVers("archive"));
router.patch("/journal/actes/:id/diffusion", ctrl.diffusion);

module.exports = router;