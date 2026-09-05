# FOUNDATION-008 — RBAC National (Contrôle d'accès basé sur les rôles)

**Statut :** Proposé — en attente de validation.
**Date :** 2026-09-05
**Dépend de :** FOUNDATION-002 (Métamodèle), FOUNDATION-004 (RNSO), FOUNDATION-007 (RNPST), Partie A ci-dessus (fonction_id).
**Prépare :** FOUNDATION-009 (RLS National).

## B.1 Objectif

Définir comment les droits d'un utilisateur (une Personne, au sens RNP) sont déterminés à l'échelle nationale, en s'appuyant exclusivement sur des concepts déjà posés — Fonction, Poste, Affectation, Unité organisationnelle, Institution — sans introduire de notion de rôle indépendante du RNPST.

**Principe directeur :** un rôle applicatif n'est jamais assigné directement à une Personne ; il est dérivé de sa Fonction et de son périmètre d'Affectation active. Un changement d'Affectation change automatiquement les droits, sans opération RBAC séparée. Ce principe s'appuie sur la chaîne déjà documentée dans le code (`scope-resolver.js`, `institution-authority.js`) : Personne → Affectation active → Poste → Unité → Institution.

## B.2 Modèle à deux axes

Un droit effectif résulte du croisement de deux axes indépendants :

| Axe | Porté par | Exemple |
|---|---|---|
| **Rôle fonctionnel** (quoi) | `fonction_id` du Poste occupé via l'Affectation active | `FONCTION_DIRECTEUR` → droits d'administration RH |
| **Périmètre** (où) | Chaîne Poste → Unité → Institution (RNSO, FOUNDATION-004) | Directeur RH du Ministère de la Santé ≠ Directeur RH d'un autre ministère |

## B.3 Entités proposées

| Entité | Définition | Cycle de vie |
|---|---|---|
| **Rôle applicatif** | Regroupement de permissions (ex. `ADMIN_RH`, `LECTURE_ANNUAIRE`, `GESTION_AFFECTATIONS`). | Catalogue national stable, géré par la gouvernance technique. |
| **Association Fonction ↔ Rôle applicatif** | Table `fonction_role(fonction_id, role_id)` — une Fonction peut porter plusieurs rôles applicatifs, un rôle peut être porté par plusieurs Fonctions. | Modifiable par la gouvernance métier sans redéploiement de code. |
| **Droit effectif d'une Personne** | Calculé à la volée : Personne → Affectation(s) active(s) → Poste(s) → Fonction(s) → Rôle(s) applicatif(s), avec le périmètre borné par l'Unité/Institution du Poste. | Non stocké — dérivé, recalculé à chaque évaluation. |

## B.4 Cas particuliers héritsés du RNPST

- **Intérim (RNPST §2.5) :** l'intérimaire porte les droits liés à la Fonction du Poste occupé en intérim, au même titre qu'un titulaire, pour la durée de l'Affectation d'intérim. Aucune règle RBAC séparée n'est nécessaire : le modèle à deux axes s'applique identiquement, car il ne distingue pas titulaire/intérim — seule l'Affectation active compte.
- **Vacance (RNPST §2.4) :** un Poste vacant ne porte aucun droit effectif (aucune Affectation active à faire dériver). Une Personne peut cependant conserver des droits résiduels via d'autres Affectations actives simultanées si le RNPST le permet par ailleurs.
- **Une Personne avec plusieurs Affectations actives :** ses droits effectifs sont l'union des droits dérivés de chaque Affectation. Aucune priorité entre Affectations n'est nécessaire pour le RBAC (contrairement à l'Occupation d'un Poste unique, qui reste soumise à la contrainte d'unicité de FOUNDATION-002 §4.5).

## B.5 Décisions de gouvernance retenues

> **Statut des décisions**
> Les décisions ci-dessous constituent la position architecturale retenue pour le PNGIE. Leur mise en œuvre technique est normative. Les paramètres dépendant de la réglementation nationale restent configurables afin de permettre leur adaptation sans remettre en cause le métamodèle.

### B.5.1 Catalogue national des Rôles applicatifs

**Décision retenue :** le catalogue des Rôles applicatifs est national. Les institutions attribuent les rôles (via l'association Fonction ↔ Rôle, ou via une attribution dérogatoire, voir B.5.2) mais ne créent jamais de rôle au catalogue.

```
Catalogue   → National
Attribution → Institution
```

Cohérent avec la décision retenue en FOUNDATION-007 §8.1 sur le catalogue des Fonctions — même logique de catalogue partagé, même instance de gouvernance recommandée pour éviter deux circuits parallèles susceptibles de diverger.

### B.5.2 Rôles dérogatoires (hors Fonction)

**Décision retenue :** deux catégories distinctes de Rôles applicatifs sont prévues :

| Catégorie | Définition | Contraintes |
|---|---|---|
| **Permanent** | Créé et géré au catalogue national (B.5.1). | Gouvernance nationale, pas de limite de durée. |
| **Temporaire** | Créé localement, en dérogation au principe général « rôle dérivé de la Fonction ». | Date d'expiration **obligatoire**, traçabilité **obligatoire**, justification **obligatoire**. |

Cette distinction couvre les besoins réels d'exception (mission transverse, délégation temporaire d'un supérieur absent) sans affaiblir le principe directeur du RBAC (§B.1) pour le cas général.

### B.5.3 Articulation avec FOUNDATION-007 §8

Ces décisions et celles de FOUNDATION-007 §8 relèvent de la même instance de gouvernance, appliquées de façon cohérente dans le temps — un Rôle applicatif dérivé d'une Fonction n'a de sens que si la Fonction elle-même est gouvernée de façon cohérente.

## B.6 Dette / dépendances à vérifier avant finalisation

Le code existant (`scope-resolver.js`, `institution-authority.js`) documente déjà une partie de la chaîne de périmètre. Cette ébauche part du principe que cette logique est réutilisable telle quelle pour le calcul du périmètre RBAC ; une revue technique de ces fichiers est nécessaire avant validation finale pour confirmer qu'aucune divergence n'existe entre le modèle proposé ici et l'implémentation réelle.

## B.7 Validation (Partie B)

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente |
| Validation technique | *(à compléter)* | | En attente |

---
