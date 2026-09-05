# FOUNDATION-009 — RLS National (Row-Level Security)

**Statut :** Proposé — en attente de validation.
**Date :** 2026-09-05
**Dépend de :** FOUNDATION-004 (RNSO), FOUNDATION-007 (RNPST), FOUNDATION-008 (RBAC National, Partie B ci-dessus).
**Avertissement explicite :** ce dépôt contient déjà des documents d'audit non consultés dans cette session (`AUDIT_RLS_PRE_SWITCH.md`, `BUG_G_RLS_SCOPE_NATIONAL.md`, `BUG_G_POLICY_BACKUP_AVANT_PATCH.json`, `JOURNAL_MIGRATIONS_RLS.md`). Cette ébauche pose un cadre de principe cohérent avec le RNPST et le RBAC (Partie B), mais **doit être confrontée à ces documents avant validation** — ils décrivent vraisemblablement des problèmes réels déjà rencontrés sur ce sujet précis (le nom `BUG_G_RLS_SCOPE_NATIONAL.md` suggère un incident déjà survenu sur exactement le périmètre national traité ici).

## C.1 Objectif

Traduire le périmètre RBAC (Partie B) en politiques de sécurité au niveau ligne (Row-Level Security PostgreSQL), pour que le filtrage d'accès aux données ne dépende pas uniquement de la couche applicative.

## C.2 Principe directeur

Une politique RLS ne doit jamais dupliquer indépendamment la logique de périmètre — elle doit s'appuyer sur la même chaîne que le RBAC (Partie B §B.2) : Personne → Affectation active → Poste → Unité → Institution. Deux implémentations séparées de la même règle de périmètre (une en RBAC applicatif, une en RLS base de données) finiraient nécessairement par diverger ; la politique RLS doit donc être définie comme la traduction SQL directe du même calcul de périmètre, pas comme une règle indépendante.

## C.3 Politiques proposées, par table

| Table | Portée de filtrage | Règle proposée |
|---|---|---|
| `poste` | Institution / Unité | Visible si l'Unité du Poste est dans le périmètre (Institution ou sous-unités) de l'Affectation active de l'utilisateur courant. |
| `affectation` | Institution / Unité, via le Poste concerné | Même règle, appliquée via `affectation.poste_id → poste.unite_id`. |
| `fonction` (catalogue national) | National, lecture seule pour tous | Pas de filtrage RLS — catalogue national partagé par construction (RNPST §2.2). |
| `effectif_autorise` (Partie A) | Institution / Unité | Même règle que `poste`. |

## C.4 Cas particuliers RNPST à couvrir explicitement

- **Historique des affectations (RNPST §2.6) :** les Affectations clôturées ne sont jamais supprimées physiquement. La politique RLS doit rester valable pour les lignes historiques (un gestionnaire ayant quitté un périmètre ne devrait probablement plus voir l'historique de ce périmètre) — **point à trancher explicitement**, car le principe d'historisation (§9 du RNPST : « aucune suppression physique ») entre potentiellement en tension avec un filtrage RLS strict basé sur le périmètre *actuel* de l'utilisateur, si celui-ci a changé de périmètre depuis.
- **Intérim :** une Affectation d'intérim suit la même politique RLS que l'Affectation du titulaire — aucune règle distincte, cohérent avec le principe retenu en B.4.

## C.5 Points nécessitant une décision d'architecture (ouverts, à trancher)

| # | Question |
|---|---|
| 1 | La politique RLS doit-elle filtrer sur le périmètre *actuel* de l'utilisateur uniquement, ou sur l'union de tous les périmètres qu'il a eus dans le temps (cohérence avec l'Historique RNPST §2.6, cf. C.4) ? |
| 2 | Comment réconcilier cette ébauche avec le contenu de `BUG_G_RLS_SCOPE_NATIONAL.md` et `AUDIT_RLS_PRE_SWITCH.md`, non consultés ici — un incident similaire a-t-il déjà été résolu différemment ? |
| 3 | Le filtrage national (accès transverse à toutes les Institutions, pour un rôle de supervision nationale) — prévu par le nom même de ce document — doit-il être un bypass RLS complet (rôle `SUPERUSER`/`BYPASSRLS` PostgreSQL) ou une politique RLS explicite avec un périmètre « National » comme valeur possible dans la chaîne Institution ? La seconde option est recommandée pour garder une traçabilité uniforme (cohérent avec le principe d'audit du RNPST §9), mais nécessite que le modèle de périmètre (FOUNDATION-004) prévoie explicitement ce niveau. |

## C.6 Validation (Partie C)

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente |
| Validation technique | *(à compléter)* | | En attente — revue obligatoire des audits RLS existants avant validation |

---

**Fin du document.** Prochaine étape suggérée : scinder ce fichier en trois (voir Note d'usage en tête) et faire relire la Partie C par la personne ayant traité `BUG_G_RLS_SCOPE_NATIONAL.md`, avant tout commit.
