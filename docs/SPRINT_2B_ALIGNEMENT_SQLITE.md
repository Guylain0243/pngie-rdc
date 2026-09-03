# Sprint 2B — Alignement SQLite

**Projet :** pngie-rdc-backend
**Branche :** `feature/baseline-v2`
**Statut :** 📋 Cadré, non démarré
**Dépend de :** Sprint 2A (isolation `npm test` / `DATABASE_URL`) — ✅ terminé, commit `786c87a`

---

## 1. Contexte

Pendant le Sprint 2A (isolation de `npm test` vis-à-vis d'une `DATABASE_URL`
persistante au niveau utilisateur Windows), la correction a révélé un problème
préexistant, jusque-là masqué : une fois `npm test` réellement isolé sur
SQLite, `db/seed.js` échoue immédiatement.

```
Échec du seed: SqliteError: table permission has no column named role_id
    at Database.prepare (...node_modules\better-sqlite3\lib\methods\wrappers.js)
    at Object.run (...src\db.js:108:24)
    at main (...db\seed.js:205:14)
    code: 'SQLITE_ERROR'
```

## 2. Diagnostic établi (Sprint 2A, preuve à l'appui)

- `db/seed.js` insère `(permission_id, role_id, entite, action)` dans la table
  `permission`. C'est **correct** vis-à-vis du schéma PostgreSQL réel, confirmé
  par requête directe (`docs/DATABASE_INVENTORY.md §5`) : la table `permission`
  en production a pour colonnes `permission_id, role_id, entite, action, statut,
  condition_json, created_at` — pas de `code`, pas de `nom`.
- `role_permission` est, côté PostgreSQL, une **vue** de compatibilité
  (`SELECT ... FROM permission p JOIN role r ON r.role_id = p.role_id`), pas
  une table de jonction many-to-many.
- `db/schema.sqlite.sql` modélise au contraire `permission` (`permission_id,
  code, nom`) et `role_permission` (vraie table de jonction avec clé composite
  `role_id, permission_id`) selon un schéma normalisé classique, qui ne
  correspond plus au modèle réel utilisé en production depuis au moins deux
  sprints antérieurs (traces dans `docs/JOURNAL_SPRINT_2.md`, `docs/JOURNAL_SPRINT_4.md`).
- **Conclusion : c'est `db/schema.sqlite.sql` qui a pris du retard, pas
  `db/seed.js`.** Le schéma SQLite compte 69 tables au total ; l'écart n'est
  pas limité à `permission`/`role_permission`, son étendue réelle reste à
  établir table par table.

## 3. Objectif du Sprint 2B

Faire de `db/schema.sqlite.sql` un miroir fidèle du schéma PostgreSQL réel,
pour que `db/seed.js` s'exécute sans erreur en mode SQLite, sans modifier
`db/seed.js` lui-même.

## 4. Méthode proposée

1. **Générer le DDL réel de chaque table/vue PostgreSQL concernée** par
   requête directe (`information_schema.columns`, `pg_get_viewdef`) — ne pas
   se fier uniquement à `docs/DATABASE_INVENTORY.md`, qui documente une
   correspondance de colonnes mais pas le DDL brut complet.
2. **Comparer systématiquement**, table par table, schéma SQLite ↔ schéma
   PostgreSQL réel : colonnes, types, contraintes, vues, index nécessaires
   aux 69 tables listées dans `db/schema.sqlite.sql`.
3. **Produire une liste exhaustive des écarts** avant toute correction.
4. **Corriger uniquement `db/schema.sqlite.sql`** — un fichier, un seul type
   de changement, dans l'esprit de la méthode qui a fait ses preuves lors du
   Sprint 1 (une preuve, une correction, un test, un commit).

## 5. Critères de sortie

- `node db/seed.js` (avec `DB_PATH` pointant vers une base SQLite vierge)
  s'exécute sans erreur.
- Les tests utilisant `tests/helpers.js` (`node --test tests/*.test.js`,
  hors `tests/e2e/`) démarrent effectivement contre SQLite, seed inclus.
- Aucune modification de `db/seed.js` ni de `src/server.js`.

## 6. Explicitement hors périmètre

- **Le RBAC ancien dans `src/server.js`** (`hasPermission()` /
  `requirePermission()` inline, lignes ~88-177), qui traite `role_permission`
  comme une vraie table de jonction et utilise `permission.code` — colonnes
  qui n'existent pas dans le modèle réel. Ce point est déjà documenté comme
  potentiellement cassé/désynchronisé par un audit antérieur du projet
  (`docs/MIGRATION_INVENTORY.md`). Il constitue un chantier distinct, à
  traiter uniquement une fois le Sprint 2B terminé et sur une base saine.
- La suite `tests/e2e/` (106/106 verts, tag `v0.9-e2e-green`), qui gère sa
  propre connexion PostgreSQL indépendamment de `tests/helpers.js` et n'est
  pas affectée par ce chantier.

## 7. Risques identifiés

- L'écart peut ne pas se limiter à `permission`/`role_permission` : les 69
  tables du schéma SQLite couvrent des domaines métier variés (justice,
  santé, foncier, PKI...) qui n'ont peut-être pas tous été maintenus au même
  rythme que le schéma PostgreSQL de production.
- Certaines vues de compatibilité PostgreSQL (`person`, `organization`,
  `permission_compat`, etc. — voir `docs/DATABASE_INVENTORY.md §5`) n'ont
  pas d'équivalent évident en SQLite ; il faudra décider, table par table,
  si une vue SQLite équivalente est nécessaire ou si le code applicatif visé
  par les tests ne les sollicite jamais en dehors de PostgreSQL.
