# PNGIE — Architecture Master

Carte globale des fondations conceptuelles du PNGIE.
Ce document évolue au fil de la validation de chaque FOUNDATION.
Dernière mise à jour : 2026-09-05

## Vision

Le PNGIE fournit un socle de référentiels nationaux partagés
(identité, organisation, poste, rôle, visibilité) sur lequel
s'appuient les modules sectoriels (Justice, Santé, Finances,
Gouvernance, etc.), plutôt que chacun ne redéfinisse ces notions.

## État des fondations

| Document | Sujet | Statut |
|---|---|---|
| FOUNDATION-001 | (à documenter) | ? |
| FOUNDATION-002 | (à documenter) | ? |
| FOUNDATION-003 | (à documenter) | ? |
| FOUNDATION-004 | (à documenter) | ? |
| FOUNDATION-005 | (à documenter) | ? |
| FOUNDATION-006 | RNP - distinction Personne/Agent public/Utilisateur/Compte/Role/Affectation | ? |
| FOUNDATION-007 | RNPST - Référentiel National des Postes et Affectations | ?? en cours |
| FOUNDATION-008 | RBAC National | ? à venir |
| FOUNDATION-009 | RLS National | ? à venir |
| FOUNDATION-010 | (à définir) | ? à venir |
| FOUNDATION-011 | (à définir) | ? à venir |
| FOUNDATION-012 | (à définir) | ? à venir |

## Dépendances connues

- FOUNDATION-007 doit rester cohérent avec le vocabulaire déjà posé
  dans FOUNDATION-006 (Role, Affectation) pour éviter toute ambiguïté
  transmise à FOUNDATION-008 (RBAC).
- FOUNDATION-008 (RBAC) s'appuiera sur FOUNDATION-007 (Poste/Affectation).
- FOUNDATION-009 (RLS) s'appuiera sur FOUNDATION-008 (RBAC).

## Historique des jalons Git

- `sprint2e-bloc1` : fin migration person -> personne
- `sprint2e-bloc1-final` : + nettoyage repository, point de reprise officiel
