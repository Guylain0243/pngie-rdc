# Sprint 2B — Phase 5, Étape 1 : clarification des 10 candidats "faux positifs"

> **Correction (même session) :** une première version de ce document
> affirmait à tort que les 8 tables de la Catégorie 2 étaient "sans
> définition Postgres, à auditer séparément" et concluait à un périmètre
> de 26 tables. Une vérification directe des données a montré que
> l'hypothèse de départ était fausse : ces 8 tables **existent déjà**
> dans `schema.sqlite.sql`. Elles ne faisaient donc jamais partie des
> 36 tables manquantes. Le périmètre correct est de **34 tables**, pas 26.
> Ce document a été corrigé en conséquence.

## Contexte

La liste des 36 tables manquantes (voir `PHASE_5_CORRECTION_PERIMETRE.md`)
contenait 10 noms suspectés d'être des faux positifs de la regex
d'extraction (`decision`, `controle`, `rapport`, `suivi`, `descendants`,
`remontee`, `audit_mission`, `integration_flux`, `recommandation`,
`systeme_externe`), car absents à la fois de `schema.sqlite.sql` et de
Postgres — c'était l'hypothèse de départ, vérifiée ensuite point par
point.

## Ce qui est démontré

Les 10 candidats se répartissent en **deux catégories factuellement
différentes**.

### Catégorie 1 — CTE récursives (2 éléments)

`descendants` et `remontee` apparaissent dans des blocs
`WITH RECURSIVE descendants AS (...)` et
`WITH RECURSIVE remontee AS (...)` (fichiers
`src/security/hierarchy-service.js` et
`src/domains/governance/cockpit.repository.js`). Ce sont des noms de
requêtes CTE, pas des tables.

**Décision : retirer définitivement du périmètre. Ces 2 éléments étaient
bien comptés dans les 36 manquantes et en sont retirés.**

### Catégorie 2 — Tables orphelines du schéma SQLite (8 éléments)

`decision`, `controle`, `rapport`, `suivi`, `audit_mission`,
`recommandation`, `systeme_externe`, `integration_flux`.

Vérification faite en deux temps :
1. Lecture du code source (`src/server.js`, `src/aiAgent.js`) : ce sont
   bien de vraies requêtes SQL (`FROM decision dec JOIN organization...`,
   `LEFT JOIN audit_mission am ON am.controle_id = c.controle_id`, etc.),
   utilisées par les routes `/api/gouvernance/cycle` et
   `/api/integrations`.
2. Croisement direct avec les deux listes de référence
   (`docs/phase5-tables-schema-sqlite-sql.txt` et
   `docs/phase3-colonnes-postgres.txt`) : **les 8 tables sont présentes
   dans `schema.sqlite.sql` et absentes de Postgres** — l'inverse de
   l'hypothèse initiale.

Cela signifie que ces 8 tables font partie du **socle hérité** du
snapshot du 08/08/2026 (schéma orienté judiciaire — `magistrat`,
`tribunal`, `jugement`, etc. — voir `PHASE_5_CORRECTION_PERIMETRE.md`).
Elles fonctionnent donc déjà dans les tests SQLite, mais **n'ont pas
d'équivalent dans le modèle Postgres actuel**.

Conséquence non résolue, à garder en tête pour un audit ultérieur : ces
8 tables représentent un point de divergence structurel — le code
applicatif s'appuie dessus en environnement de test SQLite, mais rien ne
garantit qu'elles reflètent encore la réalité fonctionnelle attendue par
Postgres. Ce n'est ni une action à mener en Sprint 2B (aucune donnée
Postgres à recopier, puisqu'elles n'y existent pas), ni un cas clos —
seulement un fait documenté.

**Décision : ces 8 tables ne faisaient déjà pas partie des 36 tables
manquantes (elles sont dans le groupe des 17 "déjà présentes"). Aucun
recalcul n'est nécessaire pour elles côté périmètre Sprint 2B.**

## Nouveau calcul du périmètre Sprint 2B (corrigé)

```
53 tables utilisees par src/
       |
       +-- 17 deja presentes dans schema.sqlite.sql
       |         (dont 8 sans equivalent Postgres actuel --
       |          heritage du schema judiciaire, hors action Sprint 2B)
       +-- 2 CTE (descendants, remontee) -- retirees du perimetre
       +-- 34 tables PostgreSQL reellement manquantes dans schema.sqlite.sql
```

**X = 34 tables.** C'est le périmètre définitif et stabilisé de la suite
du Sprint 2B, Phase 5 — corrigé par rapport à la première estimation
erronée de 26.

## Prochaine étape

1. Geler la liste nominative des 34 tables (fichier
   `docs/phase5-tables-prioritaires.txt`).
2. Classer ces 34 tables par motif (comme en Phase 4A), en vérifiant en
   particulier si le pattern `institution_id` s'y retrouve.
3. Décider, sur cette base, si une automatisation partielle (Sprint 2C)
   est justifiée.

## Leçon méthodologique

La première version de ce document concluait à 26 tables sur la base
d'une hypothèse plausible mais non vérifiée (que les 8 tables Catégorie 2
manquaient d'une définition dans les deux systèmes). Le calcul de
contrôle (34 au lieu de 26 attendu) a signalé l'écart, et la vérification
croisée a montré que l'hypothèse de départ était inversée par rapport à
la réalité. Ceci confirme, une fois de plus dans cette même session,
l'utilité de vérifier chaque chiffre calculé contre une attente explicite
plutôt que d'accepter un résultat sans le confronter à ce qu'on pensait
obtenir.
