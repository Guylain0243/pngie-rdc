# DEBT-0002 — Divergence entre le schéma SQLite et le code applicatif (permission)



## Statut



Identifiée — non corrigée



## Contexte



Lors de la stabilisation du backend SQLite (Sprint 2D), une divergence a été identifiée entre :



- db/schema.sqlite.sql

- src/server.js



La table d'association role_permission existe toujours et est utilisée normalement.



Le problème ne provient donc pas de la relation rôle ↔ permission.



## Preuve



### Schéma SQLite



CREATE TABLE role_permission (

  role_id TEXT REFERENCES role(role_id),

  permission_id TEXT REFERENCES permission(permission_id),

  PRIMARY KEY (role_id, permission_id)

);



### Code applicatif



src/server.js



SELECT 1

FROM role_permission rp

JOIN role r ON r.role_id = rp.role_id

JOIN permission p ON p.permission_id = rp.permission_id

WHERE r.code = ?

  AND p.code = ?



et



SELECT DISTINCT p.code

FROM role_permission rp

...



## Constat



Les requêtes utilisent la colonne :



permission.code



Or la structure actuelle de la table permission ne contient plus cette colonne.



Le nouveau modèle repose sur :



- entite

- action



La requête actuelle devient donc invalide dès que schema.sqlite.sql est utilisé.



L'erreur attendue est du type :



no such column: p.code



## Impact



Les fonctions de contrôle d'autorisation :



- hasPermission()

- récupération des permissions d'un rôle



ne fonctionneront plus avec le nouveau schéma SQLite.



## Ce qui fonctionne encore



La table role_permission est correcte.



Les relations role ↔ role_permission ↔ permission restent valides.



Le problème concerne uniquement le changement du modèle de représentation des permissions.



## Décision



Aucune correction dans Sprint 2D.



Le problème est volontairement isolé afin de garder les correctifs de stabilisation indépendants des évolutions fonctionnelles.



## Travail prévu (Sprint 2E)



Étudier l'adaptation de hasPermission().



Deux pistes seront évaluées :



### Option A



Reconstruire un identifiant logique : entite + ":" + action, pour conserver une API proche de l'existant.



### Option B



Faire évoluer toute l'API d'autorisation pour travailler directement avec (entite, action), sans notion de permission.code.



La décision sera prise après analyse complète du modèle de permissions.



## Différence avec DEBT-0001



- DEBT-0001 : schéma incomplet — la table personne est référencée par 11 clés étrangères mais n'a jamais de CREATE TABLE personne. Le problème est une absence.



- DEBT-0002 : schéma et code applicatif divergents — la table permission existe et role_permission reste cohérente, mais le code interroge une colonne (code) supprimée par l'évolution du schéma. Le problème est un décalage entre deux parties du projet qui ont évolué séparément, pas une absence de structure.



Ces deux dettes ont des causes et des correctifs distincts et sont traitées séparément afin de ne pas mélanger un problème de modèle de données incomplet avec un problème d'adaptation du code métier à un modèle déjà changé.



## Références



- Sprint 2D

- DEBT-0001 — Table personne absente


