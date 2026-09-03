# PNGIE-RDC — Migration RLS Phase 1

Procédure reproductible de création et validation du rôle applicatif
`pngie_app`, avec privilèges minimaux, sur PostgreSQL. Conçue pour être
rejouée sur un nouvel environnement (recette, nouveau serveur) sans
dépendre de l'historique d'une session de travail particulière.

## Prérequis

- PostgreSQL 16.x, outils client (`psql`) accessibles dans le PATH.
- Variable d'environnement `DATABASE_URL` pointant vers la base cible
  (format `postgresql://utilisateur:motdepasse@hote:port/base`), avec
  un compte disposant des droits `CREATEROLE` / propriétaire de schéma
  (typiquement `postgres`).
- Une variable pour le mot de passe du futur rôle `pngie_app`, par
  exemple `$env:PNGIE_TEST_PASSWORD` en PowerShell — jamais en dur
  dans les scripts ni dans l'historique de commandes.

## Fichiers

| Fichier | Rôle |
|---|---|
| `000_precheck.sql` | Vérifications avant migration (bonne base, état du rôle existant). Arrête réellement l'exécution si un point critique échoue. |
| `000_run_migration_phase1.sql` | Script maître : enchaîne 001 → 002 → 003. |
| `001_create_pngie_app.sql` | Création du rôle `pngie_app`, sans privilèges élevés. |
| `002_grants_pngie_app.sql` | GRANT minimaux : 84 tables utilisées directement par le code + 3 tables « invisibles » (écrites uniquement par effet de bord de triggers). |
| `003_validation_pngie_app.sql` | Requêtes de contrôle post-GRANT (comptages, comparaison à la liste attendue). |
| `004_test_transactionnel.sql` | Valide les privilèges directement sur la base réelle, sans risque : chaque test est encapsulé dans `BEGIN ... ROLLBACK`. |
| `005_revoke_and_regrant.sql` | Nettoyage : retire tout privilège existant puis réapplique uniquement la liste minimale (utile si des GRANT trop larges ont été posés par un outil tiers). |
| `006_run_nettoyage_privileges.sql` | Script maître pour lancer 005. |
| `007_postcheck.sql` | Vérifie l'état réel après migration : rôle, nombre de tables, absence de tables hors périmètre, absence de privilèges dangereux, RLS actif sur les tables concernées. |

## Points d'architecture importants

- **Aucun script n'encapsule un autre script contenant déjà ses propres
  `BEGIN`/`COMMIT`/`ROLLBACK` dans une transaction englobante.**
  PostgreSQL n'a pas de transactions imbriquées : un `ROLLBACK` à
  l'intérieur d'un bloc déjà ouvert annule tout ce qui précède, pas
  seulement le sous-bloc concerné. C'est pourquoi `004` et `005` sont
  toujours exécutés comme scripts autonomes, jamais inclus via `\i`
  dans un bloc `BEGIN ... COMMIT` d'un autre script.
- **Chaque script utilise `\set ON_ERROR_STOP on`**, pour que
  `$LASTEXITCODE` (PowerShell) reflète fidèlement un échec — sans ce
  réglage, `psql -f` continue après une erreur SQL et renvoie tout de
  même un code de sortie 0.
- **Le pré-check et le post-check utilisent `\quit` pour arrêter
  réellement l'exécution**, pas seulement afficher un avertissement à
  relire soi-même.

## Séquence d'exécution

```powershell
cd C:\pngie-rdc\pngie-backend
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
chcp 65001 > $null

$env:PNGIE_TEST_PASSWORD = "..."   # mot de passe du role pngie_app

# 0. Pre-check
psql --dbname="$env:DATABASE_URL" -f 000_precheck.sql

# 1. Role + GRANT + validation
psql --dbname="$env:DATABASE_URL" -v pngie_app_password=$env:PNGIE_TEST_PASSWORD -f 000_run_migration_phase1.sql

# 2. Tests transactionnels (sans risque, ROLLBACK systematique)
psql --dbname="$env:DATABASE_URL" -f 004_test_transactionnel.sql

# 3. Nettoyage des privileges (si necessaire — verifier 003/004 d'abord)
psql --dbname="$env:DATABASE_URL" -f 006_run_nettoyage_privileges.sql

# 4. Post-check
psql --dbname="$env:DATABASE_URL" -f 007_postcheck.sql
```

Vérifier `$LASTEXITCODE` après chaque étape avant de passer à la
suivante. En cas d'échec, ne pas continuer — corriger la cause avant
de relancer.

## Tables hors périmètre (confirmées inutilisées, session d'audit)

Sous-système `rnso_*` (12 tables), et `ref_gouvernorat`,
`service_public`, `meta_attribute`, `meta_entity`, `ref_cour_appel`,
`ref_cour_appel_historique`, `ref_tribunal_militaire_garnison`,
`ref_tribunal_militaire_garnison_historique` : zéro référence dans
`src/` et `routes-generated/`, zéro référence dans les fonctions et
vues PostgreSQL (vérifié par grep + requêtes sur
`information_schema.routines` et `information_schema.views`).

Le schéma `gouvernance` (23 tables `gouv_*`) est également dormant
mais réside dans un schéma séparé, hors du périmètre de GRANT sur
`public` — candidat naturel pour le futur module Journal National.

## Point ouvert : `journal_connexion`

Le trigger `fn_detecter_anomalie_connexion` est posé sur cette table,
mais elle n'apparaît pas dans le grep des 84 tables utilisées
directement par le code. Deux hypothèses : trigger dormant, ou
écriture via un mécanisme non détecté par le grep textuel. Non résolu
au moment de la rédaction — `journal_connexion` reste hors du GRANT
par défaut (voir commentaire dans `002_grants_pngie_app.sql`).
