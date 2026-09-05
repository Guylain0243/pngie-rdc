# FOUNDATION-009 — RLS National (Row-Level Security)

**Statut :** Proposé — en attente de validation. *(Révision v2 : réconcilié avec `AUDIT_RLS_PRE_SWITCH.md` et `BUG_G_RLS_SCOPE_NATIONAL.md`.)*
**Date :** 2026-09-05
**Dépend de :** FOUNDATION-004 (RNSO), FOUNDATION-007 (RNPST), FOUNDATION-008 (RBAC National).
**Réconcilié avec :** `docs/audits/AUDIT_RLS_PRE_SWITCH.md`, `docs/audits/BUG_G_RLS_SCOPE_NATIONAL.md`.

## Changelog v1 → v2

| Point | v1 | v2 |
|---|---|---|
| Filtrage périmètre national | Question ouverte (§C.5.3) | **Tranché** — voir §C.4 et §C.6 |
| Fallback si scope NULL | Non traité | **Confirmé comme risque réel** (R2 de l'audit), reste ouvert en arbitrage métier |
| `security_invoker` sur les vues | Absent de la v1 | **Ajouté comme contrainte obligatoire non négociable** (§C.2bis) — découverte majeure de l'audit |
| Protocole de déploiement RLS | Absent de la v1 | **Ajouté** (§C.7) — repris tel que validé par l'audit (environnement isolé, 77/77 avant tout report) |
| Historisation vs périmètre courant | Question ouverte (§C.5.1) | **Reste ouverte** — non traitée par les audits disponibles |

---

## C.1 Objectif

*(inchangé)* Traduire le périmètre RBAC (FOUNDATION-008) en politiques de sécurité au niveau ligne (Row-Level Security PostgreSQL), pour que le filtrage d'accès aux données ne dépende pas uniquement de la couche applicative.

## C.2 Principe directeur

*(inchangé)* Une politique RLS ne doit jamais dupliquer indépendamment la logique de périmètre — elle doit s'appuyer sur la même chaîne que le RBAC : Personne → Affectation active → Poste → Unité → Institution.

## C.2bis Contrainte obligatoire : `security_invoker` sur toute vue exposant une table à policy RLS

**Origine :** découverte empirique documentée dans `AUDIT_RLS_PRE_SWITCH.md` §8, confirmée par test A/B sur `pngie_rdc_rls_test`.

**Constat :** une vue créée sans l'option `security_invoker = true` (disponible depuis PostgreSQL 15) s'exécute avec les privilèges du **propriétaire de la vue**, pas de l'utilisateur appelant. Si la vue est créée par un rôle superuser (`postgres`), elle contourne RLS structurellement — même si `FORCE ROW LEVEL SECURITY` est actif sur la table sous-jacente. Le rôle applicatif (`pngie_app`) interroge en pratique presque exclusivement des vues de compatibilité, jamais les tables brutes directement : sans cette option, RLS est donc **invisible sur la quasi-totalité du trafic applicatif réel**, sans qu'aucune erreur ne le signale.

**Règle retenue pour ce document (contrainte d'architecture, non négociable) :**
> Toute vue exposant, directement ou indirectement (via jointure), une table portant une policy RLS **doit** être créée ou modifiée avec `security_invoker = true`. Cette règle s'applique à toute nouvelle vue créée dans le cadre du RNPST (Poste, Fonction, Affectation, Effectif autorisé) et à toute vue de compatibilité existante qui les exposerait.

**Vérification requise avant toute mise en production d'une nouvelle vue :** confirmer via
```sql
SELECT relname, reloptions FROM pg_class WHERE relkind = 'v' AND relname = '<nom_vue>';
```
que `security_invoker=true` figure bien dans `reloptions`.

## C.3 Politiques proposées, par table

*(inchangé dans sa structure, complété par la contrainte C.2bis ci-dessus)*

| Table | Portée de filtrage | Règle proposée |
|---|---|---|
| `poste` | Institution / Unité | Visible si l'Unité du Poste est dans le périmètre de l'Affectation active de l'utilisateur courant. |
| `affectation` | Institution / Unité, via le Poste concerné | Même règle, via `affectation.poste_id → poste.unite_id`. |
| `fonction` (catalogue national) | National, lecture seule pour tous | Pas de filtrage RLS. |
| `effectif_autorise` | Institution / Unité | Même règle que `poste`. |

**Point de vigilance issu de l'audit :** toute vue de compatibilité qui exposerait ces tables (à l'image de `person_role` exposant `personne_role`) doit suivre la contrainte §C.2bis dès sa création — ne pas reproduire l'écart constaté sur les 7 vues historiques (`person`, `person_role`, `organization`, `permission_compat`, `role_permission`, `meta_permission`, `rnso_hierarchie`).

## C.4 Cas particuliers RNPST à couvrir explicitement

- **Historique des affectations (RNPST §2.6) :** *(inchangé — reste ouvert, voir §C.5.1)*.
- **Intérim :** *(inchangé)* une Affectation d'intérim suit la même politique RLS que l'Affectation du titulaire.
- **Rôles/périmètres à portée nationale — tranché par l'audit (Bug G) :** lorsqu'un périmètre est national par nature (`scope_institution_id IS NULL`, ex. rôles MI/PM/PR/AN/GV/SN dans le RBAC existant), une policy RLS comparant ce champ à `current_setting('app.current_institution_id')` avec l'opérateur `=` classe ces lignes comme invisibles, car en SQL `NULL = NULL` est indéterminé (jamais vrai) — y compris au moment de la connexion, avant sélection d'une institution. **Décision confirmée et déjà appliquée (validée par 77/77 tests E2E) :** utiliser l'opérateur `IS NOT DISTINCT FROM` plutôt que `=` dans toute policy RLS comparant un champ de périmètre nullable à `current_setting`. Cette règle s'applique par extension à toute future policy RLS du RNPST portant sur un champ de périmètre potentiellement NULL (ex. un Poste ou une Fonction à portée nationale, si ce cas existe).

## C.5 Points nécessitant une décision (mise à jour v2)

| # | Question | Statut v2 |
|---|---|---|
| 1 | Filtrage sur périmètre *actuel* vs union des périmètres historiques (cohérence avec l'Historique RNPST §2.6) | **Toujours ouvert.** Aucun des deux audits disponibles ne traite ce point — il est spécifique au RNPST et ne recoupe pas les tables déjà auditées (`personne_role`, `document`). À trancher séparément. |
| 2 | Réconciliation avec `BUG_G_RLS_SCOPE_NATIONAL.md` / `AUDIT_RLS_PRE_SWITCH.md` | **Traité par cette révision** — voir §C.2bis et §C.4. |
| 3 | Bypass RLS complet vs policy explicite pour le périmètre national | **Tranché par la pratique déjà validée** (§C.4) : policy explicite avec `IS NOT DISTINCT FROM`, pas de bypass superuser. Cohérent avec la recommandation initiale de ce document. |
| 4 | *(nouveau, issu de l'audit — R2)* Une policy RLS sur un champ de périmètre doit-elle bloquer strictement (0 ligne) l'accès d'un compte sans périmètre renseigné, ou prévoir un fallback explicite (comme déjà présent sur `institution` et `index_recherche_global` dans le système existant) ? | **Ouvert, arbitrage métier requis** (ce n'est pas une décision technique). Signalé dans l'audit comme bloquant potentiel de connexion pour tout compte réel sans `scope_institution_id` renseigné — donc pertinent dès la conception des policies RNPST, pas seulement pour le système existant. |
| 5 | *(nouveau)* Stratégie de peuplement des champs de périmètre nullable (quand doivent-ils être renseignés : création de compte ? Affectation ? jamais pour les rôles nationaux ?) | **Ouvert, arbitrage métier requis.** Directement lié au point 4 : sans règle claire de peuplement, aucun fallback ni contrainte stricte ne peut être validé sereinement. |

## C.6 Décision de principe — périmètre national (résumé)

Pour éviter que cette question ne se reproduise indépendamment pour chaque nouvelle table du RNPST : **toute policy RLS future doit systématiquement utiliser `IS NOT DISTINCT FROM` plutôt que `=`** dès qu'elle compare une colonne de périmètre pouvant légitimement être NULL (portée nationale) à un `current_setting`. C'est désormais la règle par défaut de ce document, pas une exception au cas par cas.

## C.7 Protocole de déploiement RLS (repris de l'audit, applicable au RNPST)

Toute nouvelle policy RLS issue de ce document doit suivre la même discipline que celle déjà validée pour le système existant, plutôt que d'être déployée directement :

1. Créer/rafraîchir un environnement isolé (copie réelle des données via `pg_dump`/`pg_restore`, pas seulement le schéma).
2. Vérifier que les `GRANT` nécessaires existent pour `pngie_app` sur toutes les tables et vues concernées (un `GRANT ... ON ALL TABLES IN SCHEMA public` ne couvre pas les vues créées séparément).
3. Vérifier `security_invoker = true` sur toute vue exposant ces tables (§C.2bis).
4. Basculer `DATABASE_URL` vers `pngie_app` **uniquement sur l'environnement isolé**.
5. Exécuter la suite de tests E2E sans corriger à chaud ; documenter chaque échec et sa cause précise avant correction.
6. Ne reporter sur la base principale qu'après validation complète et indépendante sur l'environnement isolé — jamais de bascule directe même partielle.

## C.8 Validation (Partie C — v2)

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction v1 | — | 2026-09-05 | Proposé |
| Révision v2 (réconciliation audits) | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente — arbitrage requis sur §C.5 points 4 et 5 |
| Validation technique | *(à compléter)* | | En attente |
