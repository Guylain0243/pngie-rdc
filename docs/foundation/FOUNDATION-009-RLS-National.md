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

## C.5 Décisions de gouvernance retenues

> **Statut des décisions**
> Les décisions ci-dessous constituent la position architecturale retenue pour le PNGIE. Leur mise en œuvre technique est normative. Les paramètres dépendant de la réglementation nationale restent configurables afin de permettre leur adaptation sans remettre en cause le métamodèle.

### C.5.1 Historique vs périmètre courant

**Décision retenue :** séparation stricte entre deux modes de filtrage :
- **Donnée courante :** filtrée selon le périmètre *courant* de l'utilisateur (périmètre actif au moment de la requête).
- **Historique :** filtrée selon le périmètre *enregistré au moment de l'événement* — l'Institution/Unité telle qu'elle était au moment où l'Affectation concernée était active — jamais selon le périmètre actuel de la personne qui consulte.

**Implication technique à vérifier lors de l'implémentation :** cette décision suppose que le périmètre (institution_id / unite_id) soit conservé de façon stable sur chaque enregistrement historique d'Affectation, et non recalculé dynamiquement à la lecture à partir d'un état courant qui aurait pu changer depuis (ex. une Unité renommée, déplacée, ou fusionnée). Le modèle RNPST actuel (Historique des affectations, §2.6) doit être relu pour confirmer qu'il permet de retrouver le périmètre exact tel qu'il était à la clôture d'une Affectation — sinon une historisation explicite du périmètre lui-même sera nécessaire, en plus de l'Affectation.

### C.5.2 Comptes sans périmètre

**Décision retenue :** blocage strict, sans exception.

```
scope absent → accès refusé → message explicite
```

Jamais d'élargissement implicite de l'accès en cas de périmètre absent. Le Bug G (`BUG_G_RLS_SCOPE_NATIONAL.md`) a montré concrètement qu'un élargissement implicite (ici, une comparaison NULL mal gérée en SQL) peut devenir une faille de sécurité plutôt qu'une simple gêne fonctionnelle.

**Précision de cohérence avec le patch déjà validé (§C.4) :** cette décision ne contredit pas la correction déjà appliquée sur `personne_role_scope_institution` (opérateur `IS NOT DISTINCT FROM`). Les rôles à portée nationale (`scope_institution_id IS NULL` **par conception**, ex. MI/PM/PR/AN/GV/SN) ne sont pas des comptes « sans périmètre » au sens de cette décision : leur périmètre est explicitement national, un état valide et prévu — pas une donnée manquante. La décision C.5.2 s'applique au cas où un périmètre *devrait* exister mais fait défaut par erreur ou omission : dans ce cas, refus strict et message explicite, jamais de fallback silencieux qui masquerait l'anomalie.

### C.5.3 Peuplement de `scope_institution_id`

**Décision retenue :** le champ devient obligatoire pour toute Affectation nécessitant un périmètre institutionnel. Le peuplement est réalisé automatiquement :
- à la création de l'Affectation ;
- lors d'un changement d'Affectation ;
- lors d'une migration de données.

Jamais de saisie manuelle dans plusieurs points du système différents — une seule source de vérité, dérivée de la chaîne déjà établie (`affectation.poste_id → poste.unite_id → institution`).

## C.6 Décision de principe — périmètre national (résumé, mis à jour)

Cette règle reste la référence par défaut de ce document : **toute policy RLS future doit systématiquement utiliser `IS NOT DISTINCT FROM` plutôt que `=`** dès qu'elle compare une colonne de périmètre pouvant légitimement être NULL (portée nationale, C.5.2) à un `current_setting`. Ce n'est plus une exception au cas par cas mais une règle normative de ce document.

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
