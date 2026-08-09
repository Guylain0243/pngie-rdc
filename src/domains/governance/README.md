# Domaine : governance

Statut : **implémenté** (09/08/2026) — Cockpit Gouvernemental V1, Phase 4.

## Structure

- `decision.*` — propriétaire des données `decision_gouvernementale`/`decision_action`.
  CRUD, workflow (`decision_workflow_transition`), RBAC via `permission`/`personne_role`
  (même mécanisme que le Journal National). `decision_institutionnelle` reste hors
  périmètre (cf. `docs/specs/CLARIFICATION_decision_institutionnelle.md`).
- `cockpit.*` — agrégateur en lecture seule. Ne possède aucune donnée métier ; consomme
  `decision.repository.js` et interroge directement `acte_officiel` (Journal National,
  déjà protégé par sa propre RLS) pour produire des indicateurs.

## Particularité importante

`decision_gouvernementale`/`decision_action` n'ont **aucune RLS** (contrairement à
`acte_officiel`). Le filtrage par périmètre institutionnel est donc explicite en code
(`decision.service.js` → `resoudreFiltresListe`), pas délégué à PostgreSQL. Voir
`ARCHITECTURE_V2.md` §4.8 pour le choix entre `institution_parent_id` (Graphe 1) et
`institution_relation` (Graphe 2) selon le rôle.

## Migration en cours

`routes-generated/decision_gouvernementale.routes.js` (préfixe `/decisions`, ancien
mécanisme `meta_permission`) reste monté en parallèle de `decision.routes.js` (préfixe
`/governance/decisions`, nouveau mécanisme `permission`) le temps de valider ce dernier
par les tests E2E. À retirer une fois confirmé — pas avant.

## Référence

`docs/specs/COCKPIT_GOUVERNEMENTAL_SPEC_V1.md` (Phase 1),
`docs/specs/COCKPIT_V1_PHASE2_ARCHITECTURE.md` (Phase 2).
