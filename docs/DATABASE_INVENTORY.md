# DATABASE_INVENTORY.md

## Statut
En cours d'élaboration (Sprint 1 — Baseline V2).
Toutes les informations de ce document sont appuyées par une commande, une requête
SQL, ou la lecture du dépôt. Aucune supposition n'est présentée comme un fait établi
sans preuve associée. Les points encore ouverts sont signalés explicitement.

---

## 1. Environnement PostgreSQL

### Version
- PostgreSQL 16.14 (compiled by Visual C++ build 1944, 64-bit)
  (preuve : `SELECT version();`)

### Bases présentes

| Base | Propriétaire | Encodage | Usage | Statut |
|---|---|---|---|---|
| pngie_rdc | postgres | UTF8 | Base principale de l'application | Confirmé (`DATABASE_URL` y pointe, `SELECT current_database();`) |
| pngie_rdc_rls_test | postgres | UTF8 | Base de tests RLS (présumé) | **Ouvert** — usage réel non confirmé, à vérifier si utilisée par `tests/e2e/` ou orpheline d'un chantier antérieur |
| postgres | postgres | UTF8 | Administration | Système |
| template0 | postgres | UTF8 | Système | Système |
| template1 | postgres | UTF8 | Système | Système |

(preuve : `\l`)

### Comptes PostgreSQL

| Rôle | Attributs |
|---|---|
| postgres | Superutilisateur, Créer un rôle, Créer une base, Réplication, Contournement RLS |
| pngie_app | Aucun attribut spécial (rôle applicatif standard) |

(preuve : `\du`)

Aucun autre rôle applicatif n'existe sur l'instance.

### Privilèges de `pngie_app`

- 156 objets accessibles dans le schéma `public` (SELECT, INSERT, UPDATE, DELETE
  pour la grande majorité — voir exceptions ci-dessous)
- Aucun privilège sur le schéma `gouvernance`
  (preuve : `information_schema.role_table_grants` filtré sur `grantee = 'pngie_app'`)

**Exceptions notables** (privilèges partiels, cohérents avec une logique métier
d'audit/historique en écriture restreinte) :
- `index_recherche_global` : INSERT, SELECT, UPDATE (pas de DELETE)
- `journal_audit` : INSERT uniquement
- `rnsj_texte_historique` : INSERT, SELECT uniquement (pas d'UPDATE ni DELETE)

---

## 2. Schémas

| Schéma | Propriétaire | Tables | Vues | Index | Séquences | Table partitionnée |
|---|---|---|---|---|---|---|
| public | pg_database_owner | 148 | 7 | 267 | 29 | 1 (`journal_audit`) |
| gouvernance | postgres | 23 | 0 | 85 | 0 | 0 |

(preuve : requêtes sur `pg_class` / `pg_namespace`)

### Point majeur — schéma `gouvernance` entièrement vide

**Les 23 tables du schéma `gouvernance` ont toutes 0 ligne, sans exception**
(preuve : `pg_stat_user_tables`, `n_live_tup = 0` pour les 23 tables `gouv_*`).
Ce schéma est dormant. Cohérent avec la mention, trouvée dans un document local
non versionné ("Migration RLS Phase 1"), indiquant que ce schéma est un
"candidat naturel pour le futur module Journal National".

---

## 3. Tables — volumétrie

### Top 20 tables par volume (schémas gouvernance + public)

| Table | Lignes |
|---|---|
| referentiel_national_item | 3816 |
| notification | 3560 |
| unite_organisationnelle | 2159 |
| poste | 2124 |
| audit_log | 889 |
| journal_audit_default | 796 |
| poste_role_metier | 638 |
| session_utilisateur | 620 |
| referentiel_arborescence | 388 |
| referentiel_national_section | 255 |
| institution | 245 |
| permission | 241 |
| fonction | 149 |
| meta_attribute | 142 |
| entity_event | 136 |
| personne | 129 |
| personne_role | 129 |
| agent_ia | 127 |
| fiche_tome | 127 |
| institution_relation | 118 |

(preuve : `pg_stat_user_tables`, `n_live_tup`)

### Tables vides (0 ligne)

- **23 tables** dans `gouvernance` (voir section 2)
- **67 tables** dans `public`, notamment : la plupart des `ref_*_historique`,
  les `rnso_*`, `rnsj_texte`/`rnsj_relation`/`rnsj_modification`, et plusieurs
  tables métier jamais peuplées (`facture`, `permis_minier`, `licence_commerciale`,
  `dossier_scolaire`, `bien_patrimonial`, etc.)

(preuve : `pg_stat_user_tables`, `n_live_tup = 0`, liste complète disponible
dans les logs de session du Sprint 1)

### Table partitionnée

- `public.journal_audit` (type `p` dans `pg_class.relkind`)

---

## 4. Row-Level Security (RLS)

### Tables avec RLS activé

**Seulement 8 tables sur 171 ont RLS activé, toutes dans `public`. Aucune dans
`gouvernance`** (cohérent avec le fait que ce schéma soit vide).

(preuve : `pg_class.relrowsecurity = true`)

#### Groupe A — scope institutionnel (RLS forcée, `relforcerowsecurity = true`)

| Table | Policy | Logique |
|---|---|---|
| document | document_scope_institution | bypass_rls OU institution_id = current_institution_id |
| index_recherche_global | index_recherche_scope_institution | bypass_rls OU institution_id IS NULL OU institution_id = current_institution_id |
| institution | institution_scope | bypass_rls OU current_institution_id IS NULL OU institution_id = current_institution_id OU institution_id parmi les descendants (`fn_institutions_descendantes()`) |
| personne_role | personne_role_scope_institution | bypass_rls OU scope_institution_id = current_institution_id |

Seule la policy sur `institution` inclut une logique de hiérarchie descendante
(via la fonction `fn_institutions_descendantes()`) ; les trois autres comparent
uniquement l'égalité stricte à `current_institution_id`.

#### Groupe B — RNSJ (RLS activée mais NON forcée, `relforcerowsecurity = false`)

| Table | Policies | Condition |
|---|---|---|
| rnsj_modification | rnsj_modification_lecture (SELECT) | `true` (aucun filtre) |
| rnsj_relation | rnsj_relation_lecture (SELECT), rnsj_relation_ecriture (INSERT) | `true` (aucun filtre), `with_check = true` |
| rnsj_texte | rnsj_texte_lecture (SELECT), rnsj_texte_ecriture (INSERT) | `true` (aucun filtre), `with_check = true` |
| rnsj_texte_historique | rnsj_historique_lecture (SELECT) | `true` (aucun filtre) |

**Point ouvert, à consigner tel quel : le sous-système RNSJ a RLS techniquement
activé, mais aucune policy n'impose de filtre réel — l'accès est fonctionnellement
non restreint par le scope institutionnel.** Ce constat est factuel ; aucune
correction n'est appliquée à ce stade (Sprint 1 = audit uniquement).

(preuve : `pg_policies`, colonnes `qual` et `with_check`)

---

## 5. Vues de compatibilité anglais / français

Le modèle métier réel est implémenté **en français**. Il existe une couche de
**vues de compatibilité en anglais**, confirmée par lecture directe de leur
définition SQL (`pg_views`) — ce ne sont pas des tables dupliquées, mais des
`SELECT` simples avec renommage de colonnes.

| Vue (anglais) | Type | Table réelle (français) | Type |
|---|---|---|---|
| person | vue | personne | table |
| person_role | vue | personne_role | table |
| organization | vue | institution | table |
| permission_compat | vue | permission | table |

Volumétrie identique de part et d'autre (129/129, 245/245, 241/241 lignes),
confirmée par `COUNT(*)` direct — cohérent avec des vues, pas des copies figées.

### Correspondances de colonnes observées

| Vue | Colonne (anglais) | Table réelle | Colonne (français) |
|---|---|---|---|
| person | person_id | personne | personne_id |
| organization | organization_id | institution | institution_id |
| organization | parent_id | institution | institution_parent_id |
| person_role | person_id | personne_role | personne_id |
| person_role | **scope_org_id** | personne_role | **scope_institution_id** |
| permission_compat | code | permission | entite \|\| ':' \|\| action |

### Point de vigilance pour les développements futurs

La colonne `scope_org_id` (nom utilisé dans plusieurs scripts de la session
Baseline V1, notamment pour les corrections de scope institutionnel) est un
**alias exposé par la vue `person_role`**. La colonne réelle, sur la table
`personne_role`, s'appelle `scope_institution_id`. Les corrections effectuées
pendant Baseline V1 ont été appliquées directement sur `personne_role`
(la table réelle), pas sur la vue.

Aucune contrainte de clé étrangère ne référence `person` ou `personne`
directement (0 ligne dans les deux cas lors de la recherche de FK) — les
relations du modèle passent par les tables réelles françaises.

---

## 6. Migrations — inventaire des fichiers présents dans le dépôt

**Aucun mécanisme de suivi automatisé n'existe** : la table `schema_migrations`
n'existe pas dans `pngie_rdc`, et aucune autre table `%migration%` n'a été
trouvée. Il est donc impossible de déterminer par une simple requête SQL quelles
migrations ont été appliquées. Ce point conditionne toute la suite de l'étape 6.

### Quatre emplacements distincts de fichiers de migration identifiés

| Emplacement | Numérotation | Nb fichiers SQL | État de nettoyage |
|---|---|---|---|
| `db/migrations/` (racine) | 007 à 011 | 5 | Propre |
| `db/migrations/governance/` | 001 à 004 | 4 | Propre |
| `db/migrations/institution/` | 001 à 002 | 2 | Propre |
| `db/migrations/journal/` | 001 à 008 | 8 | **Pollué** — 6 fichiers `.bak`/`.bak2`/`.bak3` non nettoyés |
| `migrations_rls/` (racine du dépôt, hors `db/`) | 000 à 006 | 7 (+ 3 fichiers `resultat_00N.txt`) | Propre (mais emplacement distinct, hors convention `db/`) |

### Détail `migrations_rls/`

Ce dossier correspond à un chantier de migration RLS antérieur, documenté par un
fichier `README.md` **non versionné dans le dépôt** (présent uniquement en local,
hors Git, découvert par erreur pendant le nettoyage de Baseline V1 — intitulé
"PNGIE-RDC — Migration RLS Phase 1").

Fichiers présents :
- `000_precheck.sql`
- `001_create_pngie_app.sql`
- `002_grants_pngie_app.sql`
- `003_validation.sql`
- `004_test_transactionnel.sql`
- `005_revoke_and_regrant.sql`
- `006_postcheck.sql`
- `resultat_003.txt`, `resultat_004.txt`, `resultat_005.txt` (traces d'exécution,
  datées du 04/08/2026 entre 23:05 et 23:24)

**Preuve d'exécution réelle** : `resultat_005.txt` montre l'exécution de
`005_revoke_and_regrant.sql`, avec GRANT accordés sur **87 tables** au moment de
cette exécution.

**Écart constaté, en partie expliqué par preuve directe** : l'état actuel de
`pngie_app` (157 tables avec grants, valeur exacte après nettoyage des
comparaisons — voir détail ci-dessous) est supérieur de 70 objets à ce que
documente la trace `resultat_005.txt` (87 tables). Détail de ces 70 objets
obtenu par requête directe sur `pg_class` (import via table temporaire) :

| Type | Nombre |
|---|---|
| Tables réelles | 62 (dont 1 non résolue dans la jointure, écart 69/70 à vérifier) |
| Vues | 7 |

Les 7 vues supplémentaires (`meta_permission`, `organization`, `permission_compat`,
`person`, `person_role`, `rnso_hierarchie`, `role_permission`) sont cohérentes
avec la couche de compatibilité anglais/français décrite en section 5 — elles
ont nécessairement été créées après le 04/08/2026 (date de la trace), puisque
des vues ne peuvent pas avoir de grants tant qu'elles n'existent pas.

Les 62 tables se répartissent en deux familles principales, toutes vides ou
peu peuplées (voir section 3) :
- Référentiel judiciaire (`ref_*`, `ref_*_historique`) : tribunaux, cours,
  greffes, parquets, juridictions militaires
- RNSO (`rnso_*`) : affectations, fonctions, hiérarchie, postes, structures

**Confirmé par preuve** : aucune des migrations 007 à 011 (`db/migrations/`
racine) ne contient d'instruction `CREATE TABLE` — seulement des
`ALTER TABLE ... FORCE ROW LEVEL SECURITY` (007) et `CREATE POLICY` (009).
Elles n'expliquent donc pas la création de ces tables.

**Point qui reste ouvert** : l'origine exacte de la création de ces 62 tables
(et des 7 vues) n'est pas établie avec certitude — ni `db/migrations/`
(4 sous-dossiers confondus) ni `migrations_rls/` ne contiennent de `CREATE TABLE`
correspondant. Hypothèses à vérifier dans `SEED_INVENTORY.md` /
`BOOTSTRAP_INVENTORY.md` : script de bootstrap direct, ou migration non
retrouvée dans l'arborescence actuelle du dépôt.

### Prochaines étapes pour compléter cette section (Phase B)

- Déterminer par lecture de contenu SQL (recherche de `CREATE TABLE`,
  `ALTER TABLE`, noms de colonnes) si chaque migration a laissé une trace
  compatible avec l'état actuel de la base
- Expliquer l'écart des 69 tables entre `resultat_005.txt` et l'état actuel
- Retrouver l'origine des migrations 007 à 011 (racine `db/migrations/`) :
  confirmer si elles ont été appliquées et par quel mécanisme
- Décider du sort des fichiers `.bak` dans `db/migrations/journal/`

---

## 7. Sections restantes (non commencées)

- Seeds (`SEED_INVENTORY.md`)
- Bootstrap (`BOOTSTRAP_INVENTORY.md`)
- Comparaison exhaustive migrations dépôt vs état réel de la base

---

## Annexe — Points ouverts consolidés

1. `pngie_rdc_rls_test` : usage réel à confirmer
2. RNSJ : RLS activé mais sans filtre effectif (fait constaté, non corrigé dans ce sprint)
3. Écart de 70 objets (62 tables + 7 vues) entre la trace de migration RLS (87)
   et l'état actuel des grants — type d'objets identifié par preuve, mais
   origine de création (quelle migration/script) non retrouvée
4. Origine des migrations 007-011 de `db/migrations/` (racine) non tracée
5. 6 fichiers `.bak` non nettoyés dans `db/migrations/journal/`
6. README "Migration RLS Phase 1" non versionné dans le dépôt (existe seulement en local)
