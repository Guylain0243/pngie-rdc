# SPRINT_2E — Cartographie Ancien / Nouveau modèle

| Ancien modèle       | Nouveau modèle                |
|---------------------|--------------------------------|
| organization        | institution                    |
| person              | personne                       |
| person_role         | personne_role                  |
| permission.code     | permission(entite, action)     |

## Point d'entrée

src/server.js est l'unique point d'entrée (package.json: main et start).
Il monte simultanément :
- les anciennes routes (routes-generated/*.routes.js)
- les nouveaux domaines (src/domains/journal, src/domains/governance)

## Dettes techniques associées

- DEBT-0001 : table personne absente du schéma
- DEBT-0002 : dérive permission.code vers permission(entite, action)
