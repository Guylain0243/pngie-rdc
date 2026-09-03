# Sprint 2B — Correction de trajectoire

## Pourquoi cette correction ?

L'analyse initiale (Phase 3 / Phase 4A) comparait PostgreSQL avec
`db/pngie.db`, un fichier qui n'est **pas** la référence SQLite réellement
utilisée par les tests. Preuve : `tests/helpers.js` utilise `db/test.db`,
construit par `db/seed.js` à partir de `db/schema.sqlite.sql`. C'est donc
`db/schema.sqlite.sql` qui est la vraie source de vérité, pas `pngie.db`.

Cette comparaison erronée produisait :
- 104 tables absentes
- 62 tables spécifiques SQLite
- 48 divergences de colonnes (dont le pattern `institution_id` sur 26
  tables)

Ces chiffres restent **factuellement corrects** pour la comparaison
Postgres / `pngie.db` qu'ils décrivent. Ils ne décrivent simplement pas
le périmètre réellement nécessaire pour faire fonctionner l'application
et ses tests.

Cause racine : `db/schema.sqlite.sql` n'a qu'un seul commit dans son
historique — `48a7c15 "Snapshot initial - etat du projet au 08/08/2026
avant reprise Journal National"`. C'est un instantané figé, jamais mis à
jour depuis, alors que tout le développement postérieur (le chantier
"Journal National" et le modèle institutionnel actuel) a fait évoluer
Postgres sans jamais être répercuté dans ce fichier.

## Nouvelle référence

La nouvelle analyse est basée sur :
- les tables réellement utilisées par le code applicatif (`src/`, scan de
  36 fichiers `.js`) ;
- `db/schema.sqlite.sql` comme schéma SQLite de référence (70 tables,
  contre 122 pour `pngie.db`).

## Nouveau périmètre

**Tables utilisées par l'application : 53**

Répartition :
- **17** déjà présentes dans `schema.sqlite.sql`
- **36** réellement manquantes — nouveau périmètre prioritaire
- **10** faux positifs (identifiants capturés par la recherche regex mais
  absents des deux bases — probablement des alias de CTE ou de
  sous-requêtes : `decision`, `controle`, `rapport`, `suivi`,
  `descendants`, `remontee`, `audit_mission`, `integration_flux`,
  `recommandation`, `systeme_externe`)

Ces 10 faux positifs ne doivent plus être pris en compte tels quels ; ils
seront vérifiés individuellement au moment de nettoyer la liste des 36
(certains pourraient être de vraies tables sous un nom légèrement
différent).

Fichiers produits :
- `docs/phase5-tables-schema-sqlite-sql.txt` — 70 tables de schema.sqlite.sql
- `docs/phase5-tables-utilisees-src.txt` — 53 tables utilisées par src/
- `docs/phase5-tables-prioritaires-manquantes.txt` — 36 tables prioritaires

## Conséquence

Le Sprint 2B ne consiste plus à aligner les 166 tables PostgreSQL avec
SQLite. Il consiste à rendre SQLite compatible avec les 36 tables
réellement nécessaires au fonctionnement du code. Le périmètre est donc
réduit de manière importante (de 104 tables absentes à 36 tables
prioritaires).

## Conséquence sur la Phase 4A

Le document `docs/PHASE_4A_CLASSIFICATION.md` reste utile comme trace
historique et comme preuve que le pattern `institution_id` existe
réellement dans le modèle Postgres actuel. En revanche :
- ses statistiques ne sont plus la référence de travail ;
- les futurs développements devront repartir du périmètre des 36 tables ;
- rien ne garantit encore que ce pattern se retrouve tel quel parmi les
  36 — cela reste à vérifier.

## Prochaine étape : nouvelle Phase 4B

1. Inventorier les 36 tables (nettoyer d'abord les faux positifs
   résiduels).
2. Les classer par motif (table entièrement absente vs simple divergence
   de colonnes, comme en Phase 4A).
3. Identifier les motifs répétitifs parmi ces 36 — notamment vérifier si
   `institution_id` (ou un autre pattern) s'y retrouve.
4. Décider ensuite seulement si une automatisation est justifiée, et sur
   quel sous-ensemble précis.

## Ajustement de la feuille de route

Renommage :
- ~~Sprint 2C : automatisation~~
- **Sprint 2C : automatisation des motifs validés**

Cette nuance est importante. L'automatisation ne portera pas sur "36
tables" globalement, mais uniquement sur les motifs répétitifs démontrés
au sein de ce périmètre (comme le pattern `institution_id`, si celui-ci
est confirmé sur des tables du nouveau périmètre). Les cas particuliers
continueront à être traités manuellement en Phase 4B classique.

Cette reformulation reste fidèle à la méthode suivie depuis le début du
sprint : partir des preuves, isoler les régularités, puis automatiser
uniquement ce qui est suffisamment homogène — jamais l'inverse.

## Leçon méthodologique

Cette erreur de périmètre n'a été détectée qu'au moment de vouloir
modifier concrètement un fichier (`schema.sqlite.sql`) pour la validation
pilote, pas plus tôt lors des Phases 3/4A. Elle confirme l'utilité de
vérifier, avant toute analyse comparative, quel fichier est *réellement*
exécuté par le chemin de code testé — plutôt que de supposer qu'un
fichier au nom plausible (`db/pngie.db`) est le bon. Rien n'a été perdu :
la méthode de comparaison reste valide et réutilisable telle quelle, seul
le fichier cible était erroné. Découvrir l'erreur maintenant était
préférable à la découvrir après une Phase 4B entière construite dessus.
