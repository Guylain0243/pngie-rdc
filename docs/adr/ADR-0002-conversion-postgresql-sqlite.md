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
| boolean                    | BOOLEAN  |
| timestamp                  | TEXT     |
| timestamp with time zone   | TEXT     |
| date                       | TEXT     |
| numeric                    | REAL     |
| tsvector                   | TEXT     |

### Valeurs par defaut
- `now()` / `CURRENT_TIMESTAMP` -> `(datetime('now'))`
- `gen_random_uuid()` / `uuid_generate_v4()` -> supprime (pas de default)

### Detection des colonnes "institutionnelles" (documentation/classification)
La classification en motifs structurels (Phase 5B) ne doit jamais se baser
sur le nom de la colonne (ex: `institution_id`), mais sur la cible de la
contrainte FK : `REFERENCES institution(institution_id)`. Cette regle
couvre `institution_id`, `institution_emettrice_id`,
`institution_destinataire_id`, et toute variante future.
Note : le generateur (generate-schema.js) est deja agnostique au nom de
colonne par construction - les FK sont indexees par colonne reelle, pas
par convention de nommage. Ce point de l'ADR concerne la documentation
et la classification manuelle des 33 tables, pas le code du generateur.

## Justification
Voir Sprint 2C Phase 3 - cas acte_officiel.recherche_tsv (tsvector, aucun
precedent SQLite), acte_officiel.institution_emettrice_id (FK vers
institution mais nom non conforme a la convention supposee
institution_id), et acte_officiel.id (default gen_random_uuid(), jamais
teste avec poste).

## Consequences
- convertType() dans generate-schema.js gere desormais tsvector -> TEXT.
- convertDefault() reconnait gen_random_uuid() en plus de
  uuid_generate_v4().
- Toute colonne tsvector devient TEXT nullable, sans trigger de synchro.
