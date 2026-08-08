# Bug G — Rôles à portée nationale invisibles sous RLS (lié à R2)

## Constat
La policy RLS `personne_role_scope_institution` sur `personne_role` compare
`scope_institution_id = NULLIF(current_setting('app.current_institution_id', true), '')::uuid`.
En SQL, NULL = NULL est indéterminé (jamais vrai). Les rôles à portée nationale
(scope_institution_id = NULL, ex. MI/PM/PR/AN/GV/SN) sont donc invisibles pour
l'application dès que app.current_institution_id n'est pas positionné — notamment
au moment du login, avant qu'aucune institution ne soit sélectionnée.

## Reproduction
1. Assigner un rôle avec scope_institution_id = NULL à un compte.
2. Sans bypass_rls ni current_institution_id positionné, SELECT sur la vue
   person_role (ou la table personne_role) pour ce compte retourne 0 ligne,
   alors que la ligne existe en base (vérifié avec bypass_rls actif).
3. Conséquence directe observée : /api/me plante en 500 (erreur SQL 42601,
   IN () vide) car req.user.roles reste vide après le login.

## Lien avec l'audit du matin
Ceci est un cas concret de la question R2 (« fallback vs peuplement
scope_institution_id ») restée en arbitrage. Ce n'est pas spécifique aux
comptes de test : tout compte à portée nationale en production sera affecté
de la même façon.

## Options (non tranchées, à valider avant application)
- Option A : policy RLS avec IS NOT DISTINCT FROM au lieu de =.
- Option B : peupler app.current_institution_id avec une valeur sentinelle
  nationale plutôt que NULL, y compris au login.

## Statut
Découvert le 07/08/2026. Aucun changement appliqué à la policy RLS ou au code
applicatif. En attente d'arbitrage (même circuit que R1/R2/R3).

## Cause racine confirmée

La policy RLS `personne_role_scope_institution` utilisait l'opérateur `=` pour
comparer `scope_institution_id` à `current_setting('app.current_institution_id')`.
En SQL, `NULL = NULL` est indéterminé (jamais vrai), donc toute ligne à portée
nationale (`scope_institution_id IS NULL`) devenait invisible pour l'utilisateur
concerné dès que `app.current_institution_id` n'était pas positionné — notamment
au moment du login.

## Patch appliqué (pngie_rdc_rls_test)

Remplacement de l'opérateur `=` par `IS NOT DISTINCT FROM` dans la clause
`USING` et `WITH CHECK` de la policy `personne_role_scope_institution`,
via `ALTER POLICY` (exécuté avec le rôle superuser `postgres`, seule
opération réalisée avec ce rôle). Aucun autre GRANT, policy, ou middleware
n'a été modifié en même temps, pour isoler strictement la cause.

Sauvegarde de la policy d'origine : `BUG_G_POLICY_BACKUP_AVANT_PATCH.json`
Commande de rollback : `BUG_G_ROLLBACK_COMMAND.sql`

## Résultat de validation

Environnement : `pngie_rdc_rls_test`

Suite E2E (avant patch) : 77 tests, 9 pass, 68 fail
Suite E2E (après patch) : 77 tests, 77 pass, 0 fail

## Conclusion

Le Bug G était la cause unique des échecs restants. Le correctif RLS rétablit
correctement la visibilité des rôles à portée nationale sans provoquer de
régression observée sur la suite E2E.

**Statut : VALIDÉ SUR ENVIRONNEMENT DE TEST**

**Décision restante : validation indépendante avant report sur pngie_rdc.**
Ce report est une décision distincte, à exécuter selon la procédure de
migration définie dans AUDIT_RLS_PRE_SWITCH.md — pas automatique de fait
de ce résultat.
