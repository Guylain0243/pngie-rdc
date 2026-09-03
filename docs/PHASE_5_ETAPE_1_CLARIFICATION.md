# Sprint 2B — Phase 5, Étape 1 : clarification des 10 candidats "faux positifs"

## Contexte

La liste des 36 tables manquantes (voir `PHASE_5_CORRECTION_PERIMETRE.md`)
contenait 10 noms suspectés d'être des faux positifs de la regex
d'extraction (`decision`, `controle`, `rapport`, `suivi`, `descendants`,
`remontee`, `audit_mission`, `integration_flux`, `recommandation`,
`systeme_externe`), car absents à la fois de `schema.sqlite.sql` et de
Postgres.

Vérification faite en lisant le code source réel autour de chaque
occurrence (fichiers `src/server.js`, `src/aiAgent.js`,
`src/security/hierarchy-service.js`,
`src/domains/governance/cockpit.repository.js`), puis en confirmant
l'absence en base via `information_schema.tables` sur tous les schémas
(pas seulement `public`).

## Ce qui est démontré

Les 10 candidats se répartissent en **deux catégories factuellement
différentes**, à ne pas traiter de la même façon.

### Catégorie 1 — CTE récursives (2 éléments)

`descendants` et `remontee` apparaissent dans des blocs
`WITH RECURSIVE descendants AS (...)` et
`WITH RECURSIVE remontee AS (...)` (fichiers
`src/security/hierarchy-service.js` et
`src/domains/governance/cockpit.repository.js`). Ce sont des noms de
requêtes CTE, pas des tables. Ils avaient été capturés par la regex
d'extraction parce qu'un `JOIN descendants d ON ...` et un
`SELECT ... FROM descendants` apparaissent syntaxiquement à l'intérieur
du bloc CTE, sans qu'il s'agisse d'une vraie table.

**Décision : retirer définitivement du périmètre SQLite/PostgreSQL.**
Aucune action nécessaire, ni côté schéma SQLite, ni côté Postgres.

### Catégorie 2 — Tables référencées par le code mais absentes du schéma PostgreSQL actuel (8 éléments)

`decision`, `controle`, `rapport`, `suivi`, `audit_mission`,
`recommandation`, `systeme_externe`, `integration_flux`.

Preuve :
- Ces 8 noms apparaissent dans de vraies requêtes SQL
  (`FROM decision dec JOIN organization...`,
  `LEFT JOIN audit_mission am ON am.controle_id = c.controle_id`, etc.),
  utilisées par les routes `/api/gouvernance/cycle` et
  `/api/integrations` dans `src/server.js`.
- Une recherche sur `information_schema.tables` (tous schémas confondus,
  pas seulement `public`) ne retourne aucune ligne pour ces 8 noms : ils
  n'existent nulle part dans la base Postgres actuelle.
- Ces mêmes 8 noms apparaissent aussi dans une liste codée en dur dans la
  route `/api/db-summary`, ce qui suggère qu'ils étaient prévus/attendus
  par un développeur à un moment donné.

Ce qui n'est **pas** démontré, et doit rester une question ouverte :
- Que ces routes sont réellement appelées en usage normal de
  l'application (code mort possible).
- Que ces tables ont existé un jour puis été supprimées/renommées
  (migration incomplète possible).
- Que ces routes sont des fonctionnalités inachevées, jamais terminées.

**Décision : ces 8 tables n'ont aucune définition PostgreSQL à recopier.
Elles ne relèvent donc pas du Sprint 2B (dont l'objet est d'aligner
SQLite sur PostgreSQL). Elles relèvent d'un audit applicatif distinct,
à mener séparément.**

Formulation retenue pour le suivi (neutre, sans conclusion prématurée) :

> Tables référencées par le code mais absentes du schéma PostgreSQL
> actuel. À auditer séparément.

## Nouveau calcul du périmètre Sprint 2B

```
53 tables utilisees par src/
       |
       +-- 17 deja presentes dans schema.sqlite.sql
       +-- 2 CTE (hors perimetre, pas des tables)
       +-- 8 tables fantomes (audit applicatif distinct, hors Sprint 2B)
       +-- 26 tables PostgreSQL reellement manquantes dans schema.sqlite.sql
```

**X = 26 tables.** C'est le périmètre définitif et stabilisé de la suite
du Sprint 2B, Phase 5.

## Chantier distinct identifié (hors Sprint 2B)

Un audit applicatif séparé est à ouvrir plus tard pour déterminer, pour
chacune des 8 tables fantômes, si les routes qui les utilisent
(`/api/gouvernance/cycle`, `/api/integrations`) sont :
- effectivement appelées en production (auquel cas ces routes
  échoueraient contre Postgres dès leur premier appel) ;
- du code mort non exécuté ;
- des fonctionnalités inachevées.

Ce chantier n'a pas de priorité fixée à ce stade et ne bloque pas la
poursuite du Sprint 2B.

## Prochaine étape

1. Geler la liste des 26 tables comme périmètre officiel de la Phase 5.
2. Classer ces 26 tables par motif (comme en Phase 4A), en vérifiant en
   particulier si le pattern `institution_id` s'y retrouve.
3. Décider, sur cette base, si une automatisation partielle (Sprint 2C)
   est justifiée.
