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

## B.5 Points nécessitant une décision de gouvernance (ouverts, à trancher)

| # | Question |
|---|---|
| 1 | Qui administre le catalogue national des Rôles applicatifs et leur association aux Fonctions — une instance nationale unique, ou une délégation par Institution ? |
| 2 | Un Rôle applicatif peut-il être attribué directement à une Personne à titre dérogatoire (hors Fonction), pour des cas exceptionnels (mission transverse, délégation temporaire) — ou le modèle reste-t-il strictement dérivé de la Fonction sans exception ? |
| 3 | Articulation avec les questions de gouvernance déjà ouvertes en RNPST §8 (validation création de Fonction, durée d'Intérim) : ces décisions RH ont un impact direct sur les droits RBAC et devraient être tranchées de façon cohérente, pas séparément. |

## B.6 Dette / dépendances à vérifier avant finalisation

Le code existant (`scope-resolver.js`, `institution-authority.js`) documente déjà une partie de la chaîne de périmètre. Cette ébauche part du principe que cette logique est réutilisable telle quelle pour le calcul du périmètre RBAC ; une revue technique de ces fichiers est nécessaire avant validation finale pour confirmer qu'aucune divergence n'existe entre le modèle proposé ici et l'implémentation réelle.

## B.7 Validation (Partie B)

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente |
| Validation technique | *(à compléter)* | | En attente |

---
