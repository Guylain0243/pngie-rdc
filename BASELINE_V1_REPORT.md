# Baseline V1 — Rapport de clôture

**Date de clôture :** 2026-08-12
**Commit :** d08a82834c4f445b8a5b2fc11f3325ebeccf3ab2
**Tag :** baseline-v1
**Dépôt :** https://github.com/Guylain0243/pngie-rdc

## Résultat des tests

- Tests exécutés : 106
- Tests réussis : 106
- Tests échoués : 0
- Statut : VALIDÉ

## Migrations appliquées et versionnées

Nombre total : 5

- 007_force_rls_acte_rnsj.sql — FORCE RLS sur acte_officiel et tables rnsj_*
- 008_meta_permission_agent_rh.sql — permissions agent/affectation/poste
- 009_lecture_nationale_pm_journal.sql — lecture_nationale pour PM
- 010_lecture_nationale_pr.sql — lecture_nationale pour PR (Présidence)
- 011_permission_unite_organisationnelle.sql — permission unite_organisationnelle/READ

## Corrections techniques incluses

- `src/db.js` : correction de `transaction()` (bypassRls manquant)
- `src/middleware/requireAuth.js` : correction du bug de portée (ReferenceError)
- `src/security/scope-resolver.js` : ajout du repli sur `personne_role.scope_institution_id`
- `db/seed.js` : ajout du bypass_rls pour compatibilité avec FORCE RLS
- Synchronisation des fixtures et tests E2E avec les UUID d'institution corrigés

## Audit de sécurité — x-role-code

**Statut : vérifié, non bloquant.**

`src/security-engine.js` lit le rôle via l'en-tête HTTP `x-role-code`. Ce header
est cependant systématiquement écrasé par `src/middleware/resoudreRoleDepuisJWT.js`,
monté globalement sur `/api` (`src/server.js:370`), à partir du rôle réel décodé
du JWT (`req.user.roles[0]`). Un client ne peut donc pas forger son propre rôle
via ce header. Le commentaire "substitut temporaire" dans `security-engine.js`
est obsolète — voir ticket ARCH-002 pour le nettoyage architectural.

## Points ouverts (non bloquants)

Voir `ARCH-002.md` — nettoyage du stub x-role-code dans security-engine.js.

## Ce qui est gelé à partir de cette baseline

- Migrations 001 à 011
- Seeds officiels (`db/seed.js`, `db/seed-extension.js`)
- Comptes de test (`scripts/creer-comptes-test.js`)
- Matrice RBAC

Toute modification de ces éléments doit passer par une nouvelle migration versionnée
ou un chantier identifié distinct.
