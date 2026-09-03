# MIGRATION_INVENTORY.md

**Projet :** PNGIE-RDC
**Branche :** feature/baseline-v2
**Sprint :** Baseline V2 — Sprint 1 (Audit, lecture seule)
**Statut :** Terminé — annexe RBAC (SEC-001) et trigger `fn_detecter_anomalie_connexion()` ajoutés lors de la consolidation Sprint 1
**Méthode :** Chaque affirmation ci-dessous est appuyée par la lecture directe des fichiers du dépôt (commandes PowerShell, `Get-Content`, comparaisons de hash). Voir `docs/DATABASE_INVENTORY.md` pour l'état de la base capturé en amont de cet inventaire.

---

## Note post-clôture

Le présent document décrit l'inventaire réalisé et clôturé lors du Sprint 1
(Baseline V2).

Les développements intervenus après cette clôture ne modifient pas les constats
de l'inventaire. Lorsqu'ils apportent un contexte utile à sa lecture, ils sont
référencés en fin de document, à titre historique, sans remettre en cause le
statut « Terminé » du document.

---
## 1. Chronologie générale

La plateforme s'est construite en six vagues successives, réparties sur six emplacements physiques distincts dans le dépôt :

```
22/07 → 01/08/2026   Scripts racine du dépôt (115 fichiers .sql)
                     Socle fondateur + sécurité + référentiels + diagnostics
        ↓
04/08/2026           migrations_rls/ (7 fichiers .sql + 3 traces .txt)
                     Création du rôle applicatif pngie_app
        ↓
08/08/2026           db/migrations/journal/ (8 fichiers, 001→008)
                     Module Journal National, structuré et daté sur une seule journée
        ↓
09/08/2026           db/migrations/governance/ (4 fichiers, 001→004)
                     Module Cockpit Gouvernemental V1 — Phase 3
        ↓
09/08/2026           db/migrations/institution/ (2 fichiers, 001→002)
                     Consolidation de la policy RLS institution_scope
        ↓
11-12/08/2026        db/migrations/ racine (5 fichiers, 007→011)
                     Correctifs post-Baseline V1, déduits des tests E2E
```

**Aucune table `schema_migrations` n'existe dans la base** (confirmé dans `DATABASE_INVENTORY.md`). Il n'existe donc aucun mécanisme automatisé permettant de savoir, par simple requête SQL, quelles migrations ont réellement été appliquées à un instant donné. Cet inventaire reconstitue l'histoire par la lecture des fichiers et leurs dates de modification sur le système de fichiers, pas par un journal d'exécution fiable.

**Correction méthodologique** : une hypothèse de travail formulée en cours d'audit — la coexistence de fichiers de même nom entre `migrations_rls/` et `db/migrations/{governance,institution,journal}/` — a été vérifiée et **infirmée**. `migrations_rls/` ne contient que la séquence `000_precheck.sql` → `006_postcheck.sql` (création de `pngie_app`) et trois fichiers de traces d'exécution. Il n'y a pas de duplication ni de divergence entre emplacements.

---

## 2. Socle fondateur (schema_part1.sql → schema_part5.sql)

Chronologiquement les tout premiers fichiers du dépôt (24/07/2026, 12:22 → 12:31), à la racine. Ce socle précède tout le reste de la plateforme.

| Fichier | Taille | Contenu |
|---|---|---|
| `schema_part1.sql` | 2 064 o (46 lignes) | 3 extensions PostgreSQL (`uuid-ossp`, `pg_trgm`, `unaccent`) ; table `institution` (racine, auto-référencée) ; table `unite_organisationnelle` (dépend d'`institution`, auto-référencée) |
| `schema_part2.sql` | 6 318 o | Table `poste` — dépend de `unite_organisationnelle`, auto-référencée (`poste_hierarchique_id`), avec `nombre_postes_autorises` |
| `schema_part3.sql` | 4 504 o | Table `meta_workflow_transition` (mécanisme générique historique, remplacé plus tard par des tables dédiées type `acte_workflow_transition`) ; début de `meta_rule` |
| `schema_part4.sql` | 3 627 o | Table `journal_audit` — cible de la fonction `fn_audit_generique()`, **partitionnée par plage sur `created_at`** (`PARTITION BY RANGE`), avec une partition par défaut |
| `schema_part5.sql` | 2 074 o | Table `notification` — système multi-canal (défaut `IN_APP`), liée à `personne` |

**Conventions communes observées dans tout le socle et reprises dans la quasi-totalité des migrations ultérieures** :
- Clés primaires en UUID (`uuid_generate_v4()`), sauf tables d'événements/logs à forte volumétrie (`journal_audit`, `acte_historique`) qui utilisent des séquences (`BIGSERIAL`).
- Colonnes `statut` avec défaut `'ACTIF'`.
- Colonnes `created_at`/`updated_at` en `TIMESTAMPTZ`, défaut `now()`.
- Hiérarchies auto-référencées récurrentes (`institution_parent_id`, `unite_parent_id`, `poste_hierarchique_id`, `acte_reference_id`).

---

## 3. Les 115 scripts historiques de la racine (22/07 → 01/08/2026)

Catégorisation par préfixe de nom de fichier :

| Catégorie | Préfixes regroupés | Nombre | Observation |
|---|---|---|---|
| Vérification / diagnostic | `check`, `verif`, `test`, `inspect`, `show` | **43** | Travail exploratoire et de contrôle, non structurant |
| Création de référentiels | `creer`, `create`, `integrer`, `grant`, `insert` | **22** | DDL/DML de création — cœur structurant |
| Peuplement | `populate` | **15** | Seeds / données de référence métier (référentiels RDC : tribunaux, cours, parquets, juridictions militaires, etc.) |
| Schéma de base | `schema`, `01`/`01-migration` | **10** | Fondation (voir section 2) |
| Correctifs | `fix`, `complement`, `enrichir`, `suppression` | **12** | Ajustements post-création |
| Sécurité / audit / RLS | `bloc`, `audit`, `activer`, `restore`, `set`, `remove`, `hash`, `compat`, `fn` | **12** | Sécurité, bypass RLS, fonction d'audit générique |
| Divers | `gouv` | **1** | Non examiné individuellement |

**Total : 115 fichiers.**

**Constat clé : 43 fichiers sur 115 (37 %) sont des scripts de vérification/diagnostic** (`check_*`, `verif_*`, `test_*`), pas des migrations structurantes. Cela confirme un mode de travail exploratoire et itératif plutôt qu'un processus de migration formel dès l'origine du projet — cohérent avec l'absence de table `schema_migrations`.

**Fichier notable identifié dans cette masse et documenté en détail (car réutilisé par de nombreux modules ultérieurs)** :

### `01_securite_part2.sql`
Définit `fn_audit_generique()`, fonction trigger générique paramétrée par nom de colonne PK (`TG_ARGV[0]`) :
- Capture `personne_id` courant via `current_setting('app.current_personne_id')`, avec fallback `NULL`.
- Insère dans `journal_audit` (créée en `schema_part4.sql`) avec action `CREATION`/`MODIFICATION`/`SUPPRESSION`.
- **Exclut explicitement les champs sensibles** (`password_hash`, `mfa_secret`) des valeurs auditées — bonne pratique de sécurité.
- Crée 5 triggers d'audit sur `personne`, `document`, `institution`, `role`, `personne_role`.
- Réutilisée ensuite par le module journal (`db/migrations/journal/005`, `007`, `008`) — voir section 4.

### `01_securite_part4.sql` — trigger de détection d'anomalie de connexion (ajout Sprint 1, addendum)

**[vérifié par lecture directe, ajouté lors de la consolidation croisée]** Fichier de la même famille que `01_securite_part2.sql`, non individuellement documenté jusqu'ici. Définit :

```sql
CREATE OR REPLACE FUNCTION fn_detecter_anomalie_connexion() RETURNS TRIGGER AS $sig$
-- ...
CREATE TRIGGER trg_detecter_anomalie_connexion AFTER INSERT ON journal_connexion
FOR EACH ROW EXECUTE FUNCTION fn_detecter_anomalie_connexion();
```

Trigger `AFTER INSERT` sur la table `journal_connexion` (créée séparément, dans le socle fondateur — voir ci-dessous), avec garde `DROP TRIGGER IF EXISTS` avant recréation (idempotent, cohérent avec le pattern déjà observé pour `fn_audit_generique()`).

**Table `journal_connexion`** : créée dans `schema_part2.sql` (ligne 132), donc dans le socle fondateur (24/07/2026) — **avant** la fonction/trigger qui l'exploite (`01_securite_part4.sql`, famille des 115 scripts racine, 22/07→01/08). Deux index associés : `idx_journal_connexion_personne` (sur `personne_id`) et `idx_journal_connexion_date` (sur `created_at`). Référencée aussi dans `inspect_audit.sql`, aux côtés de `journal_audit_default`, `audit_log`, `journal_audit` — cohérent avec une famille de tables de journalisation/audit, mais `journal_connexion` semble dédiée spécifiquement aux événements de connexion (login), distincte de `journal_audit` (traçabilité CRUD générique).

**Point ouvert** : le corps complet de `fn_detecter_anomalie_connexion()` (la logique de détection elle-même — quels critères définissent une "anomalie") n'a pas été lu dans cette session, seules la déclaration et la liaison au trigger sont confirmées. À lire pour le Sprint 2 si ce mécanisme doit être audité en détail (utile pour SEC-001 et pour toute question de détection d'intrusion/anomalie d'authentification).

Deux fichiers révélateurs d'un mécanisme de contournement RLS documenté ailleurs dans les migrations structurantes : `remove_bypass.sql` (42 o) et `restore_bypass.sql` (49 o), `set_app_bypass_rls.sql` (49 o).

**Note méthodologique** : conformément à la décision prise en cours d'audit, les 43 scripts de vérification/diagnostic et la majorité des 72 scripts restants (hors socle et sécurité déjà détaillés) n'ont pas été lus individuellement. Ils sont référencés ici comme *scripts historiques d'investigation et de construction initiale, non nécessaires pour comprendre l'architecture actuelle de la plateforme*. La liste nominative complète des 115 fichiers reste disponible par `Get-ChildItem` à la racine du dépôt.

---

## 4. Migrations structurantes — détail complet

### 4.1 `migrations_rls/` — Création du rôle applicatif (04/08/2026)

| Fichier | Contenu |
|---|---|
| `000_precheck.sql` | Vérifie la connexion à la bonne base (`pngie_rdc`), sinon `\quit` |
| `001_create_pngie_app.sql` | `CREATE ROLE pngie_app` idempotent (`\if :role_exists`), avec mot de passe **placeholder en clair** (`'pngie_app_password'`), `LOGIN`, `NOSUPERUSER`, `NOBYPASSRLS`, `NOCREATEDB`, `NOCREATEROLE`, `NOREPLICATION`, `CONNECTION LIMIT 20` |
| `002_grants_pngie_app.sql` | `GRANT CONNECT`, `GRANT USAGE ON SCHEMA public`, puis `GRANT SELECT/INSERT/UPDATE/DELETE` sur l'ensemble des tables applicatives |
| `003_validation.sql` | Vérifie les attributs du rôle créé et compte les tables avec grant |
| `004_test_transactionnel.sql` | `SET ROLE pngie_app` dans une transaction test, puis `ROLLBACK` (non destructif) |
| `005_revoke_and_regrant.sql` | `REVOKE ALL` puis ré-exécution de `002` via `\i` — remise à plat des droits |
| `006_postcheck.sql` | Vérifie la présence finale du rôle |

**⚠️ Point critique — voir section 5.**

### 4.2 `db/migrations/journal/` — Module Journal National (08/08/2026, une seule journée)

| # | Fichier | Contenu |
|---|---|---|
| 001 | `create_journal_schema.sql` | 7 tables (`type_acte_ref`, `acte_numerotation`, `acte_officiel`, `acte_signature`, `acte_piece_jointe`, `acte_historique`, `acte_workflow_transition`) + fonction `fn_generer_numero_acte()` + 9 index |
| 002 | `seed_type_acte.sql` | 11 types d'actes officiels ; deux circuits de workflow (complet 8 étapes / court 6 étapes). **Note de l'auteur : "proposition de départ, à valider avec le métier avant mise en production"** |
| 003 | `permissions_journal.sql` (v3) | Matrice RBAC par UUID de rôle. **Note de l'auteur : "décision à confirmer institutionnellement"** |
| 004 | `rls_journal.sql` (v2) | Active RLS sur les 4 tables ; policy avec bypass de session (`app.bypass_rls`) |
| 005 | `triggers_journal.sql` (v2) | 4 fonctions/triggers, dont `fn_acte_controle_publication()` (bloque la publication sans signature) ; réutilise `fn_audit_generique()` |
| 006 | `fix_rls_journal_scope_national.sql` | **Correctif fail-open** : ajoute `OR NULLIF(app.current_institution_id) IS NULL` → accès élargi si contexte absent |
| 007 | `fix_trigger_audit_argument.sql` | Recréation défensive des triggers d'audit (aucun changement fonctionnel) |
| 008 | `retire_trigger_audit_historique.sql` | Retrait du trigger d'audit sur `acte_historique` (bug de type : PK `BIGSERIAL` incompatible avec le cast UUID de `fn_audit_generique`) |

### 4.3 `db/migrations/governance/` — Cockpit Gouvernemental V1, Phase 3 (09/08/2026)

| # | Fichier | Contenu |
|---|---|---|
| 001 | `role_lecture_nationale.sql` | Ajoute la colonne `role.lecture_nationale` ; crée le rôle `ANALYSTE_COCKPIT`. Portée gérée par `scope-engine.js` (applicatif), pas par RLS |
| 002 | `decision_gouvernementale_colonnes_workflow.sql` | Ajoute 5 colonnes de traçabilité à `decision_gouvernementale` (table préexistante, 1 ligne en base à ce moment) |
| 003 | `decision_workflow_transition.sql` | Table de transitions d'état pour les décisions gouvernementales. **Règle métier validée et datée** : aucune transition PUBLIEE → ANNULEE (décision du 09/08/2026) |
| 004 | `permissions_governance.sql` | Matrice RBAC complète pour `decision_gouvernementale`/`decision_action`. **Remplace explicitement l'ancien mécanisme `meta_permission`** (décision d'architecture datée). Point ouvert documenté : filtrage "PUBLIEE uniquement" pour AN/SN non géré en base, à implémenter côté applicatif ("Phase 6/7, ne pas oublier") |

### 4.4 `db/migrations/institution/` — Consolidation RLS (09/08/2026)

| # | Fichier | Contenu |
|---|---|---|
| 001 | `consolidate_institution_scope.sql` | Remplace 3 définitions concurrentes de la policy `institution_scope` par une version unique versionnée. **Principe fail-closed explicitement choisi** : accès refusé si résolution d'institution échoue. Applique `FORCE ROW LEVEL SECURITY`. Meilleure pratique de gouvernance de migration observée dans tout l'audit (état avant/après tracé, note de validation E2E post-migration) |
| 002 | `fix_scope_pm_null.sql` | Correctif de donnée ponctuel : `scope_institution_id` non renseigné pour un compte de test, cassé par le durcissement fail-closed de `001` |

### 4.5 `db/migrations/` racine — Correctifs post-Baseline V1 (11-12/08/2026)

| # | Fichier | Contenu |
|---|---|---|
| 007 | `force_rls_acte_rnsj.sql` | `FORCE ROW LEVEL SECURITY` sur 7 tables (module journal + 4 tables RNSJ). **Corrige une faille de sécurité réelle documentée** : SN voyait les actes de MI, car RLS active mais non forcée exemptait le propriétaire `pngie_app` de ses propres policies |
| 008 | `meta_permission_agent_rh.sql` | Permissions `agent`/`affectation`/`poste` manquantes. **Matrice déduite des tests E2E** (`002_rbac.test.js`), une partie explicitement qualifiée d'"hypothèse, à confirmer" |
| 009 | `lecture_nationale_pm_journal.sql` | Active `lecture_nationale` pour PM et câble le mécanisme dans la policy RLS d'`acte_officiel` (jusqu'ici seul le module governance l'utilisait) |
| 010 | `lecture_nationale_pr.sql` | Étend `lecture_nationale` à PR — omission de la migration 009, détectée via plusieurs tests E2E |
| 011 | `permission_unite_organisationnelle.sql` | Permission READ manquante sur `unite_organisationnelle` pour tous les rôles actifs, déduite de `004_postes.test.js` |

---

## 5. Constats d'audit

1. **Absence de `schema_migrations`.** Aucun mécanisme fiable ne permet de savoir par requête SQL directe quelles migrations ont été appliquées à l'instance actuelle. Cet inventaire repose sur la lecture du dépôt, pas sur un état d'exécution vérifié en base (l'accès à la base a été perdu en cours d'audit — voir point 7).

2. **Coexistence de plusieurs générations de mécanismes de permissions.** La table `permission` (moderne) remplace progressivement `meta_permission` (ancien mécanisme), mais la transition est incomplète : `agent.routes.js` utilise encore la vue `meta_permission` au moment de la migration `008`, tandis que les modules `journal` et `governance` utilisent directement `permission`. Cohérent avec les vues de compatibilité déjà notées dans `DATABASE_INVENTORY.md`.

3. **Contradiction de principe de sécurité entre modules.** Le module `institution` (migration `001`, 09/08) choisit explicitement un principe **fail-closed** (accès refusé si le contexte est absent), documenté et justifié. Le module `journal` (migration `006`, 08/08 — donc antérieure) avait fait le choix inverse, **fail-open** (accès élargi si le contexte est absent). Ces deux approches contradictoires coexistent actuellement dans la base pour des tables différentes.

4. **Pattern récurrent : permissions comblées a posteriori via les tests E2E**, plutôt que définies a priori par une spécification métier. Observé à trois reprises indépendantes (migrations `008`, `009`→`010`, `011`), avec au moins un cas explicitement qualifié d'hypothèse non confirmée. Les tests E2E font de facto office de spécification de référence pour le RBAC.

5. **Workflows métier à statut de validation inégal.** Le workflow du module journal est explicitement noté comme "proposition de départ, non validée métier" par son propre auteur (migration `journal/002`). Le workflow du module governance, à l'inverse, documente une décision métier validée et datée (migration `governance/003`).

6. **Faille de sécurité réelle corrigée a posteriori.** La migration `007` (11/08, post-"Baseline V1") documente et corrige un cas concret où le rôle SN pouvait voir des actes appartenant à MI, RLS étant active mais non forcée sur plusieurs tables. Le principe `FORCE ROW LEVEL SECURITY` n'était donc pas appliqué de façon systématique lors de la création initiale des policies.

7. **Rôle applicatif `pngie_app` non reproductible.** Le script `migrations_rls/001_create_pngie_app.sql` est idempotent (ne recrée jamais le rôle s'il existe déjà) et ne garantit donc jamais la synchronisation du mot de passe en cas de ré-exécution. Le mot de passe placeholder du script (`pngie_app_password`) ne correspond plus au mot de passe actif sur l'instance actuelle (vérifié par tentative de connexion directe, échec confirmé côté serveur PostgreSQL). Aucune autre source versionnée du dépôt ne documente sa valeur actuelle. **Une installation depuis zéro à partir du dépôt seul ne garantit donc pas une authentification fonctionnelle de `pngie_app`.**

8. **37 % des scripts historiques racine sont des scripts de diagnostic**, signe d'un mode de développement itératif et exploratoire avant la structuration en migrations formelles à partir du 04/08/2026.

9. **Écart non résolu, hérité de `DATABASE_INVENTORY.md`** : 62 tables et 7 vues présentes dans la base aujourd'hui mais absentes de la trace `resultat_005.txt` du 04/08. Cet inventaire des migrations ne permet pas de trancher formellement l'origine de ces objets, mais renforce l'hypothèse que la masse des 115 scripts racine (exécutés manuellement, hors tout système de suivi) en est la source la plus probable, notamment les 22 scripts de catégorie "création" et 15 de catégorie "peuplement".

---

## 6. Annexe

**Fichiers de sauvegarde (`.bak`, `.bak2`, `.bak3`) trouvés dans `db/migrations/journal/`** : 6 fichiers, correspondant aux itérations successives de `001_create_journal_schema.sql`, `003_permissions_journal.sql`, `004_rls_journal.sql`, `005_triggers_journal.sql`. Non supprimés du dépôt, à traiter lors du Sprint 2 (nettoyage).

**Fichiers référencés mais non localisés durant cet audit** : `007c` (mentionné dans `db/migrations/007_force_rls_acte_rnsj.sql` et `009_lecture_nationale_pm_journal.sql` comme source d'un test ayant révélé un bug) — probablement un fichier de test ou de session parmi les 115 scripts racine, non identifié précisément.

**Documents externes cités dans les migrations, non vérifiés dans le cadre de cet audit** :
- `JOURNAL_NATIONAL_MODELE_TECHNIQUE_V1.md`
- `COCKPIT_V1_PHASE2_ARCHITECTURE.md`

**Scripts historiques d'investigation, non utilisés pour reconstruire la plateforme** (annexe nominative disponible via `Get-ChildItem *.sql` à la racine du dépôt) : préfixes `check_*` (19), `verif_*` (18), `test_*` (3), `inspect_*` (2), `show_*` (1).

---

## 7. Annexe RBAC — SEC-001 (addendum Sprint 1, source : `docs/audits/AUDIT_DASHBOARD_INSTITUTIONNEL.md`)

**Intégration fidèle** du document d'audit existant (ouvert le 06/08/2026, statut **OUVERT**, chantier indépendant de la suite E2E Sécurité 001-006 déjà clôturée à 77/77). Contenu reproduit et complété par le recoupement effectué lors de la consolidation croisée du Sprint 1, sans altérer les conclusions de l'auteur original.

### Route concernée
`GET /api/institutions/:id/dashboard` — fichier `routes-generated/institutions_dashboard.routes.js`, montée dans `src/server.js` (`app.use('/api', requireAuth, institutionsDashboardRouter)`). Même constat sur la route sœur `GET /institutions/liste` du même fichier.

### Protection actuelle confirmée par lecture du code
- `requireAuth` : **OUI** (JWT obligatoire)
- `exigerPermission()` : **ABSENT**
- `exigerPortee()` : **ABSENT**

### Preuve empirique (test E2E manuel, non intégré à la suite automatisée)
Compte `test-an@pngie.local` (rôle AN) a pu accéder au dashboard de l'institution MIN_2 (Affaires Étrangères, Coopération internationale et Francophonie), **hors du périmètre AN** (Assemblée Nationale) — résultat obtenu : **HTTP 200**.

**Données exposées dans la réponse** : fiche institution complète, organigramme de 25 unités organisationnelles avec hiérarchie, 25 postes avec intitulé/catégorie/niveau, **nom et prénom réels du titulaire du poste "Ministre"**, liste des 20 derniers documents de l'institution (titre, référence, statut, confidentialité, date) — **aucun filtre sur le champ confidentialité dans la requête SQL** (vérifié par lecture du code, lignes 100-102 du fichier de routes).

### Constat (tel que documenté par l'audit source)
Comportement confirmé empiriquement et par lecture du code source. **Il n'est pas établi** si ce comportement est volontaire (dashboard "vitrine" national accessible à tout utilisateur authentifié, quel que soit son rôle) ou un oubli de contrôle RBAC/Scope lors du développement de ce module. Le seul document présent en base pour l'institution testée a une confidentialité `PUBLIC`, ce qui limite l'impact observé dans ce cas précis — mais l'absence de filtre signifie qu'un document de confidentialité plus élevée serait exposé de la même manière s'il existait.

### 🔎 Recoupement effectué lors de la consolidation croisée (nouveau, cette session)
`exigerPermission()` et `exigerPortee()` **existent et sont activement utilisés ailleurs** dans le code :
- `src/security-engine.js` : `exigerPermission(entity, action)` définie et utilisée (ex. `router.get('/factures', exigerPermission('facture','READ'), ...)`)
- `src/domains/governance/cockpit.routes.js` et `decision.routes.js` : utilisent `exigerPortee({})` (middleware générique de `src/security/scope-engine.js`) — avec un commentaire d'auteur explicite : *« exigerPortee() ici : decision_gouvernementale n'a pas de RLS, donc req.scope »*, confirmant que ce middleware sert de substitut applicatif à la RLS pour ce module (cohérent avec la section 4.3 de ce document, migration `governance/001`).
- `src/rni-commandement-routes.js` utilise une troisième variante, `exigerPermissionRni(entity, action)`, extensivement (11 occurrences relevées).

**Ce recoupement renforce, sans la trancher formellement, l'hypothèse de l'oubli plutôt que du choix délibéré** : le projet dispose d'au moins 3 mécanismes de contrôle de portée/permission actifs et utilisés dans d'autres modules à la même période ; leur absence spécifique sur le dashboard institutionnel s'écarte d'un pattern par ailleurs respecté ailleurs dans le code. Ceci reste un faisceau d'indices, pas une preuve d'intention — la décision métier documentée ci-dessous reste la voie à suivre.

### Décision (telle que documentée par l'audit source)
Aucune modification du code tant que deux points ne sont pas clarifiés :
1. Recensement des usages frontend de cette route (qui l'appelle, dans quel contexte : cockpit national, dashboard institution propre, autre).
2. Décision métier sur la politique d'accès voulue pour ce dashboard.

**Recensement frontend : non réalisé.** Aucun dépôt frontend présent sur la machine d'audit (vérifié le 06/08/2026, seul `C:\pngie-rdc\pngie-backend` existe localement). À effectuer dès que le dépôt frontend sera accessible, avant toute modification de la route.

### Prochaines étapes (reprises telles quelles de l'audit source, non closes)
- [ ] Recensement frontend des appels à `/institutions/:id/dashboard` et `/institutions/liste`
- [ ] Décision métier documentée (accès ouvert voulu vs correction requise)
- [ ] Si correction requise : ajout de `exigerPermission()`/`exigerPortee()` + tests E2E dédiés avant déploiement
- [ ] Mise à jour de `AUDIT_DASHBOARD_INSTITUTIONNEL.md` avec le statut final (CLOS / CORRIGÉ / ACCEPTÉ)

---

*Document produit dans le cadre du Sprint 1 — Baseline V2 (audit, lecture seule). Prochaine étape : `SEED_INVENTORY.md`.*

## Références post-clôture

### 2026-08-30 — Corrections E2E Journal National

Voir :
docs/sessions/SESSION_2026-08-30_JOURNAL_NATIONAL.md

Migrations associées :
- 009_grant_mi_journal_creer.sql
- 010_test_fixture_institution_mi.sql
- 011_fix_rls_acte_officiel_insert_national.sql
  (créé initialement sous 008, renommé pour éviter une collision avec
  008_retire_trigger_audit_historique.sql — voir le journal de session pour détail)
