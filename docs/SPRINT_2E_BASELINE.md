# Sprint 2E - Baseline

## Date
- 2026-09-04

## Reference
- Commit DEBT-0001 : 1df4254 (+ correctif documentaire 0bdd318)
- Commit DEBT-0002 : 7990c65

## Resultat
- Tests : 37
- Pass : 27
- Fail : 10
- Skipped : 0
- Cancelled : 0

## Echecs restants

governance.test.js
- not ok 18 - le cycle de gouvernance est complet et coherent de bout en bout
- not ok 19 - le registre d'integration contient bien 44 systemes classes par categorie
- not ok 20 - resume de base : aucune table en erreur (null)
- not ok 22 - au moins une application no-code publiee existe
- not ok 23 - recuperation de la definition JSON d'une app

nocode.test.js
- not ok 25 - soumission avec champ requis manquant est rejetee avec message clair
- not ok 26 - soumission complete et valide est acceptee
- not ok 27 - soumission avec data absente du corps -> geree sans crash (400, pas 500)
- not ok 29 - payload avec script XSS dans un champ texte : stocke tel quel (a sanitiser cote rendu)
- not ok 30 - objet JSON profondement imbrique dans data ne fait pas planter le serveur

## Constats
- DEBT-0001 : Resolved
- DEBT-0002 : Resolved
- RBAC : vert (tests precedemment en echec desormais verts)
- EBUSY : elimine
- Aucun echec restant ne presente de signature liee aux permissions
  (403 / FORBIDDEN / PERMISSION_DENIED / AUTHORIZATION / p.code / role_permission)

## Piste identifiee, non qualifiee en dette a ce stade
Le test "not ok 20" (governance) signale 5 tables citees dans le schema
mais absentes/en erreur en base reelle : rnsj_texte, rnsj_relation,
rnsj_modification, ref_tribunal_grande_instance, dossier_agent_rh.
Cause racine non diagnostiquee - a investiguer avec la meme methode
que DEBT-0001/DEBT-0002 avant toute correction.

## Migration restante (hors dette, chantier de fond)
- src/server.js utilise encore person / person_role / organization
- Le reste du projet (services, domains/governance, domains/journal)
  utilise deja personne / personne_role / institution
- Prochain bloc : migration progressive de server.js, une zone
  fonctionnelle a la fois (authentification, sessions, roles,
  organigramme), avec validation complete des 37 tests apres chaque etape

## Methode de validation

Avant d'interpreter une variation de la baseline (27/37) comme une
regression ou un correctif reel :

1. executer la suite complete des 37 tests ;
2. executer immediatement une seconde fois la meme suite ;
3. ne conclure que si les deux executions convergent.

En cas de divergence entre les deux executions, traiter le resultat
comme une instabilite (flake) et diagnostiquer cette instabilite avant
toute modification du code ou de la documentation.
