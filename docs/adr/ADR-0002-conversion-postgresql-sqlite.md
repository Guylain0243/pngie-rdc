# ADR-0002 — Conversion PostgreSQL vers SQLite

## Statut
Accepté

## Contexte
Le Sprint 2C vise un schema.sqlite.sql structurellement compatible avec
PostgreSQL pour permettre l'execution des tests. Aucun precedent
(tsvector, FTS, triggers) n'existe dans schema.sqlite.sql.

## Decisions

### Mapping de types
| PostgreSQL                | SQLite   |
|----------------------------|----------|
| uuid                       | TEXT     |
| character varying          | TEXT     |
| text                       | TEXT     |
| integer                    | INTEGER  |
| bigint                     | INTEGER  |
| smallint                   | INTEGER  |
| boolean                    | BOOLEAN  |
| timestamp                  | TEXT     |
| timestamp with time zone   | TEXT     |
| date                       | TEXT     |
| numeric                    | REAL     |
| tsvector                   | TEXT     |
| jsonb                      | TEXT     |
| inet                       | TEXT     |

### Valeurs par defaut
- `now()` / `CURRENT_TIMESTAMP` -> `(datetime('now'))`
- `CURRENT_DATE` -> `(date('now'))`
- `gen_random_uuid()` / `uuid_generate_v4()` -> supprime (pas de default)
- `nextval(...)` (sequence Postgres) -> supprime (PK auto-incremente nativement en SQLite)
- `true` / `false` (litteraux booleens) -> `1` / `0`

### Detection des colonnes "institutionnelles" (documentation/classification)
La classification en motifs structurels (Phase 5B) ne doit jamais se baser
sur le nom de la colonne (ex: `institution_id`), mais sur la cible de la
contrainte FK : `REFERENCES institution(institution_id)`. Cette regle
couvre `institution_id`, `institution_emettrice_id`,
`institution_destinataire_id`, et toute variante future.
Note : le generateur (generate-schema.js / generate-all.js) est deja
agnostique au nom de colonne par construction - les FK sont indexees par
colonne reelle, pas par convention de nommage. Ce point de l'ADR concerne
la documentation et la classification manuelle des 33 tables, pas le code
du generateur.

## Justification
Voir Sprint 2C Phase 3 - cas acte_officiel.recherche_tsv (tsvector, aucun
precedent SQLite), acte_officiel.institution_emettrice_id (FK vers
institution mais nom non conforme a la convention supposee
institution_id), et acte_officiel.id (default gen_random_uuid(), jamais
teste avec poste).
Voir Sprint 2C Phase 5 - generation des 31 tables : ajout de bigint,
smallint, jsonb, inet (types), et nextval(...), true/false, CURRENT_DATE
(defaults), tous decouverts lors de la generalisation a l'ensemble des
33 tables (motifs A et B non testes auparavant).

## Consequences
- convertType() dans generate-all.js gere desormais : uuid, character
  varying, text, integer, bigint, smallint, boolean, timestamp (with
  time zone), date, numeric, tsvector, jsonb, inet.
- convertDefault() reconnait gen_random_uuid(), uuid_generate_v4(),
  nextval(...), now(), CURRENT_TIMESTAMP, CURRENT_DATE, true, false.
- Toute colonne tsvector devient TEXT nullable, sans trigger de synchro.
- Validation Phase 5 : 31/31 tables generees, deterministes (0 diff sur
  deux executions), syntaxiquement valides en SQLite reel
  (better-sqlite3), 0 probleme d'integrite avec PRAGMA foreign_keys=ON.
