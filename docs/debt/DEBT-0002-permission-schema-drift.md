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



## Statut mis a jour (correctif applique)

**Statut :** Resolved

Deux points d'usage actif de l'ancien modele de permission ont ete
corriges dans src/server.js :

- hasPermission() : interrogeait p.code (colonne inexistante) via la
  table de jonction role_permission (vide, obsolete). Corrige pour
  interroger permission.entite / permission.action, avec permission.role_id
  comme lien direct vers role.
- /api/me : meme correctif applique a la resolution des pages accessibles
  par utilisateur.

Portee non couverte par ce correctif (a noter, pas a assumer comme resolu) :
- server.js:263 reference encore role_permission dans la liste de tables
  utilisee pour la generation de routes CRUD generiques. Non investigue ici ;
  la table etant vide, l'impact fonctionnel attendu est nul (route retournant
  une liste vide), mais ce point n'a pas ete verifie directement.

## Validation

- Tests RBAC precedemment en echec (perimetre Presidence/Gouvernorat,
  verification permission /api/ministeres) passent desormais.
- Recherche ciblee sur les echecs restants (403, FORBIDDEN,
  PERMISSION_DENIED, AUTHORIZATION, p.code, role_permission) : aucune
  correspondance.
- Suite de tests : 37 tests, 27 reussis, 10 echecs.
- Les 10 echecs restants sont confines aux domaines governance et nocode
  (ecarts d'assertion, reponses 404, tables absentes) - signatures sans
  rapport avec le modele de permission, hors perimetre de DEBT-0002.

## Piste identifiee pour un futur chantier (non ouverte comme dette a ce stade)

Le test "aucune table ne doit etre absente/en erreur" (governance.test.js)
signale 5 tables citees dans le schema mais absentes ou en erreur en base
reelle : rnsj_texte, rnsj_relation, rnsj_modification,
ref_tribunal_grande_instance, dossier_agent_rh. Cause racine non
diagnostiquee. A investiguer avant toute qualification en dette technique.
