# PNGIE Secure API - Standard v1.0
Statut : Version de reference. Date : 03/08/2026.
Fonde sur audit du code reel de pngie-backend.

## STATUT DE SUIVI (03/08/2026, fin de chantier)
Les 6 points du plan d'action sont TOUS CLOS et VALIDES :
1. resoudreRoleDepuisJWT.js : fait, valide sur 40/40 modules.
2. db.transaction() : fait, teste (commit + rollback).
3. sendSuccess (lib/errors.js) : fait, teste.
4. Audit nominatif (req.user.sub) : fait, 108 appels, teste en base.
5. validerCorps.js : fait, 5/5 cas testes.
6. Schemas SIRH (RBAC + validation) : concu, voir PNGIE_SIRH_Schemas_v1.0.md

## 1. Architecture des modules
Trois couches : routes-generated/<module>.routes.js, src/<moteur>.js,
src/middleware/requireAuth.js, src/middleware/resoudreRoleDepuisJWT.js,
src/middleware/validerCorps.js.

## 2. Chaine des middlewares (etat final)
requireAuth -> resoudreRoleDepuisJWT -> exigerPermission -> validerCorps ->
logique metier (transaction) -> enregistrerEvenement (utilisateurId) -> sendSuccess/sendError

## 3. Format des reponses JSON
Succes : { success: true, data: {...} }
Erreur : { success: false, error: { code, message, details } }
