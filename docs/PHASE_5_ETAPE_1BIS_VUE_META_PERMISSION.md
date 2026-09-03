# Sprint 2B — Phase 5, Étape 1bis : meta_permission est une vue, pas une table

## Découverte

En préparant l'extraction des clés primaires des 34 tables du périmètre
(étape préalable à la classification par motif), une table sur 34
n'avait aucune clé primaire détectée : `meta_permission`.

Vérification directe via `psql \d meta_permission` : la commande affiche
`Vue "public.meta_permission"` ("Vue" = traduction française de "View").
**`meta_permission` n'est pas une table, c'est une vue Postgres.** C'est
la raison structurelle de l'absence de clé primaire : les vues n'en ont
jamais.

Vérification étendue à l'ensemble des 34 tables via
`information_schema.tables` (colonne `table_type`) : **`meta_permission`
est le seul cas parmi les 34** — toutes les 33 autres sont bien de
vraies `BASE TABLE`.

## Rapprochement avec un précédent connu

Ce cas rejoint directement celui de `role_permission`, déjà identifié
comme une vue (et non une table) lors du Sprint 2A, tel que documenté
dans le résumé de reprise de session au tout début de ce travail. Les
deux vues partagent une racine `*_permission`, ce qui pourrait indiquer
un pattern de conception délibéré (vues dérivées pour l'agrégation des
permissions) plutôt qu'un hasard isolé — hypothèse à garder en tête sans
la confirmer davantage à ce stade, ce n'est pas nécessaire pour la suite
du Sprint 2B.

## Décision

`meta_permission` est retirée du périmètre Sprint 2B : une vue n'a pas de
`CREATE TABLE` à répliquer côté SQLite. Sa présence ou son absence dans
un environnement de test dépend de la disponibilité des tables sources
qu'elle agrège, pas d'une structure propre à créer.

## Périmètre corrigé

```
34 tables (avant verification du type)
       |
       +-- 1 vue (meta_permission) -- retiree
       +-- 33 tables reellement a creer dans schema.sqlite.sql
```

**Nouveau X = 33 tables.** Fichier `docs/phase5-tables-prioritaires.txt`
mis à jour en conséquence.

## Point de vigilance pour la suite

Avant de lancer la classification par motif (Étape 3), il est recommandé
de vérifier une dernière fois, sur la liste finale des 33, qu'aucune
autre vue ne s'est glissée dans les données déjà extraites
(`docs/phase5-colonnes-34-tables.txt`,
`docs/phase5-pk-34-tables.txt`,
`docs/phase5-fk-34-tables.txt` — ces trois fichiers contiennent encore
les données de `meta_permission` et doivent être régénérés sur la
liste corrigée des 33 avant d'être utilisés pour la classification).
