# ARCH-002 — Nettoyer le stub x-role-code dans security-engine.js

**Statut :** À faire (dette technique, non bloquant)
**Priorité :** Normale — après Cockpit V2
**Ouvert le :** 2026-08-12
**Origine :** Baseline V1

## Constat

`src/security-engine.js` lit le rôle de l'appelant via `req.header('x-role-code')`.
Le commentaire en tête de fichier le décrit comme un "substitut temporaire
d'authentification à remplacer en production par le décodage du JWT".

**Audit réalisé (Baseline V1) :** ce header est en réalité déjà écrasé de façon
fiable par `src/middleware/resoudreRoleDepuisJWT.js`, monté globalement sur
`/api` (`src/server.js:370`), à partir de `req.user.roles[0]` (rôle JWT
vérifié par requireAuth en amont). Un client ne peut donc pas forger son rôle
via ce header — **ce n'est pas une faille de sécurité active**, mais une couche
d'indirection inutile et un commentaire trompeur.

## Objectifs

- Faire lire le rôle directement depuis `req.user.roles` (ou un `req.roleCode`
  posé explicitement par `resoudreRoleDepuisJWT`) plutôt que de repasser par un
  header HTTP intermédiaire.
- Supprimer la dépendance à `resoudreRoleDepuisJWT` réécrivant un header HTTP —
  fragile si ce middleware est un jour retiré du chemin `/api` par erreur.
- Mettre à jour le commentaire obsolète en tête de `security-engine.js`.
- Clarifier la logique de `req.user.roles[0]` (que se passe-t-il si plusieurs rôles ?).
- Ajouter un test qui vérifie qu'un `x-role-code` forgé par le client est bien
  ignoré (test de non-régression pour documenter la garantie actuelle).

## Non-objectif

Ne pas retarder Cockpit V2 pour ce ticket — le risque actuel est nul, la
correction est architecturale, pas urgente.
