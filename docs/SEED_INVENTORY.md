# SEED_INVENTORY.md

**Projet :** PNGIE-RDC
**Branche :** feature/baseline-v2
**Sprint :** Baseline V2 — Sprint 1 (Audit, lecture seule)
**Statut :** 🟢 Quasi complet — §4 et §5 requalifiés par lecture directe cette session ; un point structurel nouveau (divergence de hiérarchie institutionnelle) reste ouvert
**Méthode :** Chaque affirmation marquée « vérifié par lecture directe » est appuyée par une commande PowerShell effectivement exécutée dans cette session. Ce document prend le relais de `BOOTSTRAP_INVENTORY.md` pour tout ce qui concerne le **contenu** du jeu de données de démonstration (le §0 de `BOOTSTRAP_INVENTORY.md` documente le risque opérationnel de `db/seed.js` — sa capacité à vider la base — ce document documente ce qu'il sème une fois exécuté).

---

## 1. Objet de l'inventaire

Documenter le contenu et la structure des scripts de seed du projet : essentiellement `db/seed.js` (script principal, ~1060 lignes, cartographié dans cette session), les fichiers SQL de seed dédiés à des modules spécifiques (ex. `002_seed_type_acte.sql` du module journal, déjà référencé dans `MIGRATION_INVENTORY.md`), et le reliquat non classé d'environ 45 scripts `NN-seed-rnXXX.js` trouvés hors dépôt (`C:\Users\pc\Downloads`).

---

## 2. `db/seed.js` — vue d'ensemble

**[vérifié par lecture directe]** Fichier unique de **1058+ lignes**, à double moteur : PostgreSQL si `DATABASE_URL` est définie, sinon SQLite via `better-sqlite3` (fichier local `pngie.db`, recréé à chaque exécution à partir de `schema.sqlite.sql`, non lu dans cette session).

**Commentaire d'en-tête du fichier** (cité intégralement car il fait office de spécification déclarée par l'auteur) :
> *Initialise la base (SQLite ou PostgreSQL, selon DATABASE_URL) + insère des données réelles : institutions (Présidence, Primature, Sénat, AN, 42 ministères, 26 provinces), rôles/permissions RBAC, cycle de gouvernance complet, registre d'intégration logicielle, référentiels transversaux, et un utilisateur de démonstration par rôle (mot de passe RÉELLEMENT haché avec bcrypt). Async de bout en bout : fonctionne identiquement sur SQLite (dev/tests) et PostgreSQL (production) via `src/db.js` — un seul jeu de requêtes, deux moteurs.*

**⚠️ Voir `BOOTSTRAP_INVENTORY.md` §0** : la branche PostgreSQL commence par un `TRUNCATE TABLE ... CASCADE` sur l'intégralité du schéma `public`. Ce document ne revient pas sur ce risque, déjà documenté comme constat central de l'inventaire bootstrap.

### Table des matières reconstituée (via les marqueurs `console.log('✓...')` du fichier)

| Ligne | Section |
|---|---|
| ~1-165 | Setup moteur (SQLite/PostgreSQL), fonction factorisée `creerCompteInstitution()`, `POUVOIRS`, `TYPES` d'organisation |
| 166-315 | Institutions racines (Présidence, Primature, Sénat/AN, Cours, 42 ministères, 26 provinces, organes de contrôle), RBAC (rôles/pages/permissions), 6 comptes démo de rôle |
| ~316-389 | Cycle de gouvernance de démonstration (instruction → plan_action → rapport → contrôle → audit_mission → recommandation → décision → suivi) ; registre de systèmes externes (`systeme_externe`, flux d'intégration) ; catalogue d'agents IA (`ai_agent`) |
| 389-449 | Extension du catalogue : 4 agents IA et 4 applications no-code supplémentaires (Justice, Santé, Économie, Sécurité) ; référentiels transversaux (géographie, fonction publique, compétences, types de documents, services numériques) |
| ~480-535 | Complément : affectations manquantes comblées pour Présidence, Sénat, AN, Gouvernorat (Kinshasa) |
| ~540-614 | Missions institutionnelles (finances, présidence, sénat, AN, province) ; 3 agences ajoutées avec compte/poste/mission propres (DGI, DGRAD, Inspection Générale du Travail) |
| ~614-778 | Traitement systématique des organisations sans compte (ministères/provinces/institutions de contrôle/hautes cours) ; ajout des catégories ETD (entités territoriales décentralisées) et Entreprises Publiques (Gécamines, SNEL, REGIDESO, SNCC) ; 10 institutions nationales majeures ajoutées (CSM, CSAC, CES, ARMP, BCC, Trésor Public, DGDA, FARDC, PNC, DGM) |
| ~778-870 | Processus budgétaire (`process`/`process_step`) ; hiérarchie portail/dashboard/module/menu/page/widget/KPI de démonstration pour le ministère des Finances |
| ~870-1039 | Second cycle de gouvernance de démonstration (audit/recommandation/décision/suivi) |
| ~1039 | Programme PNGIE-RDC et 3 projets rattachés (budget total 750 000 000 USD) |
| ~1041-1058 | **`FICHES_MINISTERES`** : contenu détaillé (mission + 5-8 responsabilités) pour une trentaine de ministères, injecté par correspondance approximative de nom (`normFR2`, normalisation + `includes`) ; 5 directions internes réelles pour le seul ministère de l'Intérieur (explicitement noté comme le seul à bénéficier de ce niveau de détail) ; activités/valeurs KPI dans le temps ; log récapitulatif final (nombre de ministères/provinces/rôles, moteur BDD utilisé, mot de passe démo **affiché en clair**) |

### Constat structurant

`db/seed.js` n'est **pas** un script de bootstrap de comptes — c'est un **générateur monolithique du jeu de données de démonstration complet** de la plateforme : institutions, RBAC, agents IA, systèmes externes, cycle de gouvernance, référentiels, UI de démonstration (dashboards/KPI), et fiches détaillées de mission ministérielle. Le mécanisme de création de compte (`creerCompteInstitution()`) est réutilisé de façon extensive à travers toutes ces sections — c'est un sous-produit du peuplement institutionnel, pas son objectif premier.

**Pattern récurrent observé** : plusieurs blocs du fichier portent des commentaires du type *"Complément"*, *"Traitement systématique des organisations restantes sans compte"*, *"Ajout de deux catégories manquantes"* — signe que le fichier a été construit par itérations successives, chaque itération comblant un manque identifié après coup (cohérent avec le pattern déjà noté dans `MIGRATION_INVENTORY.md`, constat n°4, et dans `BOOTSTRAP_INVENTORY.md` §4, à propos des migrations SQL et de la partie RBAC de ce même fichier).

**Limitation explicitement documentée par l'auteur** : seul le ministère de l'Intérieur bénéficie d'une décomposition en directions internes réelles (`DIRECTIONS_INTERIEUR`, 5 directions nommées) — les 40+ autres ministères n'ont que leur fiche mission/responsabilités, sans structure interne détaillée.

**Nouveau point découvert en fin de fichier** : `db/seed.js` se termine par `const seedExtension = require('./seed-extension'); await seedExtension();` — un module externe non catalogué, exécuté systématiquement à la fin du seed principal. **Point ouvert**, non lu dans cette session.

---

## 3. Secrets et comptes générés par `db/seed.js`

Cf. `BOOTSTRAP_INVENTORY.md` §4 pour le détail comparatif avec la famille de comptes de test officiels. Rappel synthétique :
- Mot de passe unique `DEMO_PASSWORD = 'Pngie#2027'` réutilisé pour **tous** les comptes créés par ce fichier — les 6 comptes de rôle initiaux, mais aussi tous les comptes créés a posteriori pour combler les organisations sans compte (ministères, provinces, ETD, entreprises publiques, institutions de contrôle, hautes cours) — potentiellement plusieurs dizaines de comptes au total, tous avec le même mot de passe.
- Affiché en clair dans les logs console à la fin de l'exécution (déjà noté dans `BOOTSTRAP_INVENTORY.md`).
- Table cible : `person` (contradiction non résolue avec `personne`, voir `BOOTSTRAP_INVENTORY.md` §4/§8 point 9).

---

## 4. Fichiers SQL de seed dédiés à un module

**[vérifié par lecture directe]**

### `002_seed_type_acte.sql` (module journal)
Confirme et complète ce que documentait déjà `MIGRATION_INVENTORY.md` §4.2 : 11 types d'actes officiels (`type_acte_ref`), et deux circuits de transition de workflow (`acte_workflow_transition`) — un circuit complet à 8 étapes (LOI, DECRET, ORDONNANCE, ARRETE, TRAITE_ACCORD, DECISION_JUDICIAIRE, RECTIFICATIF, ABROGATION) et un circuit allégé à 6 étapes sans validation séparée (INSTRUCTION, DIRECTIVE, NOTE_SERVICE, COMMUNIQUE). Le fichier contient sa propre note de prudence : *« ce jeu de transitions est une proposition de départ. Point ouvert #4 du document de conception : à valider avec le métier avant mise en production »* — cohérent avec la note déjà relevée dans `MIGRATION_INVENTORY.md`.

### `02_seed_liens_hierarchiques.sql`
En-tête explicite : *« Amorçage des liens hiérarchiques réels (RNI). Généré à partir des données réelles (94 institutions) et des mappings confirmés dans le récapitulatif de session (domaine Finances). Uniquement des liens CONFIRMÉS par les sessions précédentes — rien deviné. »*

Peuple une table dédiée `rni_lien_hierarchique` (`lien_id`, `institution_id`, `institution_parent_id`, `type_lien`, `reference_juridique`), avec un `DELETE` idempotent par `lien_id` avant les `INSERT` (bonne pratique, contraste avec le `TRUNCATE` global de `db/seed.js`). Une requête de vérification interne au fichier attend `count(*) >= 48`.

**✅ Point corrigé** : au tour précédent, j'avais flaggé une divergence apparente — la quasi-totalité des ministères rattachés `TUTELLE` au même `institution_parent_id` (`ae011056-e941-4cb0-9504-9d1478324fc5`), et la Primature elle-même rattachée `HIERARCHIQUE` à ce même identifiant, ce qui semblait contredire le modèle de `db/seed.js` (ministères rattachés à la Primature). **Cette hypothèse est infirmée** : un commentaire trouvé dans `db/migrations/institution/002_fix_scope_pm_null.sql` (`SET scope_institution_id = 'ae011056-...' -- Primature`) confirme que cet UUID **est** la Primature. Les deux fichiers sont cohérents entre eux — il n'y a pas de divergence de hiérarchie institutionnelle. Voir `BOOTSTRAP_INVENTORY.md` §0 pour le risque réel que cette vérification a mis au jour à la place (fragilité des UUID codés en dur face aux réexécutions de `seed.js`).

---

## 5. Reliquat des scripts `NN-seed-*`

**[vérifié par lecture directe]** Situation largement clarifiée ce tour-ci — **ce ne sont pas des artefacts orphelins**, contrairement à l'hypothèse posée initialement. Mieux : trois d'entre eux ne sont même pas des scripts de seed de données au sens propre (voir §5bis).

### Doublons `(1)`/`(2)` : confirmés identiques
Comparaison de hash SHA256 :

| Fichier | Hash `(1)` | Hash `(2)` |
|---|---|---|
| `19-seed-meta-batch2` | `392AB6FCE6...` | **identique** |
| `20-seed-workflow-batch2` | `04C26463524C...` | **identique** |
| `21-seed-permissions-batch2` | `A10D346D239C...` | **identique** |

Les trois paires sont des doublons byte-pour-byte. L'hypothèse d'un double téléchargement du même contenu (posée dans `BOOTSTRAP_INVENTORY.md`) est confirmée pour ces trois fichiers.

### Présence confirmée dans le dépôt
Ces scripts existent bien dans le dépôt (`C:\pngie-rdc\pngie-backend\`), sans le suffixe `(1)`/`(2)` — ce ne sont donc pas des fichiers "perdus dans Downloads", mais des copies de travail de scripts réellement déployés :
- `19-seed-meta-batch2.js`
- `20-seed-workflow-batch2.js` (+ une variante `.js.backup`)
- `21-seed-permissions-batch2.js`
- `82-seed-manuel-ch663-671.js`

(`25-seed-arborescence-globale.js` n'a pas été explicitement confirmé présent dans le dépôt dans les résultats retournés cette session — à vérifier.)

### Caractérisation du contenu

**`25-seed-arborescence-globale.js`** — script d'une nature différente de tout ce qui a été documenté jusqu'ici : crée une table dédiée `referentiel_arborescence` codant une **taxonomie globale unique de référence** pour toute la plateforme (« 10 Livres → 32 Domaines / 9 Plateformes / Référentiels / Registres / Moteurs transversaux → leurs sous-éléments »), hiérarchique par `parent_code`, interrogeable via API. Utilise un pattern **upsert idempotent** (`upsertNoeud()`, vérifie l'existence avant insertion, `ignore` si déjà présent) — bonne pratique, à l'opposé du `TRUNCATE` destructeur de `db/seed.js` (voir `BOOTSTRAP_INVENTORY.md` §0).

**`82-seed-manuel-ch663-671.js`** — nature encore différente : ne seed pas des données structurées mais du **contenu documentaire long-format** (chapitres numérotés CH663 et suivants), avec du texte rédactionnel complet. Exemple lu : chapitre 663 (« Présentation Générale » du Ministère de la Pêche et de l'Élevage, décrit comme *"Pilier National de Gouvernance de la Pêche, de l'Aquaculture et de l'Élevage"*) et chapitre 664 (« Architecture Institutionnelle », organigramme textuel complet : Cabinet, Vice-Ministre, Secrétaire Général, 9 directions générales, Cellule PNGIE, Coordinations Provinciales). C'est un seed de **documentation/manuel**, catégoriquement différent des scripts de seed de données.

---

## 5bis. `db/seed-extension.js` et le moteur « Government Builder » — découverte architecturale

**[vérifié par lecture directe]**

### `db/seed-extension.js`
Appelé automatiquement en fin d'exécution de `db/seed.js` (`require('./seed-extension'); await seedExtension();`), mais aussi exécutable seul (`if (require.main === module) {...}`, `module.exports = seedExtension`). En-tête : *« Peuple les 18 nouvelles tables (Justice, Santé, Économie, Sécurité renforcée) »*.

Peuple des tables métier réelles, organisées en 4 blocs :
- **Justice** : `tribunal`, `magistrat`, `dossier_judiciaire`, `jugement`
- **Santé** : `etablissement_sante`, `patient`, `consultation`, `campagne_vaccination`
- **Économie** : `entreprise`, `permis_minier`, `exploitation_agricole`, `projet_energie`, `infrastructure_projet`, `parcelle_cadastrale`
- **Sécurité MFA/PKI** : `mfa_backup_code` (code `'BACKUP-CODE-DEMO-0001'`, bcrypt coût 10), `mfa_event`, `pki_certificate` (clé publique placeholder), `pki_signature` (hash factice `sha256:demo0000`)

**Point positif à noter** : contrairement à `db/seed.js`, ce fichier a une garde défensive explicite — il ne crée un `document` de démonstration que si aucun n'existe déjà (*« Le seed de base ne peuple jamais `document` — on insère un document de démonstration pour que `pki_signature` ait quelque chose de réel à référencer »*). Dépend de l'exécution préalable de `db/seed.js` (utilise `SELECT ... LIMIT 1` sur `lieu`/`organization`/`person` comme ancrages).

### Le moteur « Government Builder » — non catalogué avant cette session

**Découverte majeure** : `19-`, `20-`, `21-seed-*-batch2.js` **ne sont pas des scripts de seed de données** — ce sont des **scripts de test/validation d'un moteur générique de définition d'entités métier**, révélé par le dernier `console.log` de `21-seed-permissions-batch2.js` : *« Prochaine étape : générer les 5 tables + API avec `government-builder.js` »*. Ce fichier `government-builder.js` n'a jamais été catalogué dans cet audit — **point ouvert prioritaire**.

En-têtes explicites des 3 scripts, à exécuter dans l'ordre (19 → 20 → 21) :
- **`19-seed-meta-batch2.js`** : *« TEST DE GÉNÉRALISATION — Batch 2 : 5 entités métier, 5 domaines (Mines, Santé, Justice, Cybersécurité, Finances). Objectif : vérifier que le socle `meta_entity`/`meta_attribute` et le Government Builder fonctionnent pour AUTRE CHOSE que "Facture", sans modifier une seule ligne des moteurs génériques. »* Définit 2 entités test observées (Permis Minier, Signalement Sanitaire) avec leurs attributs typés.
- **`20-seed-workflow-batch2.js`** : peuple `meta_workflow_transition` — cycles de vie des entités test (ex. `permis_minier` : BROUILLON→SOUMIS→OCTROYE/REJETE).
- **`21-seed-permissions-batch2.js`** : peuple `meta_permission` — teste que le rôle `MI` (déjà utilisé pour les ministères) peut lire/créer/modifier les 5 nouvelles entités **mais pas les supprimer**, refus `DELETE` par défaut explicitement documenté comme choix de sécurité (*« cohérent avec la règle appliquée à "Facture" »*).

**Constat structurant** : le projet comporte donc (au moins en test) un **second système de permissions**, `meta_permission`, distinct du RBAC applicatif (`role`/`permission`/`role_permission`) documenté partout ailleurs dans cet audit. `MIGRATION_INVENTORY.md` (constat n°2) décrivait `meta_permission` comme un **mécanisme ancien en cours de remplacement** par `permission` — mais ces scripts, actifs et datés du 22/07, l'utilisent au contraire comme le mécanisme central d'un moteur de génération d'entités actif à cette date. **Ces deux lectures ne sont peut-être pas contradictoires** : `meta_permission` pourrait être legacy pour le RBAC applicatif classique tout en restant le mécanisme vivant du moteur "Government Builder" — deux sous-systèmes distincts partageant un nom de table proche. **Non tranché.**

Référence croisée notée en passant : `20-seed-workflow-batch2.js` inclut une transition pour une entité `dossier_recouvrement`, jamais définie dans `19-seed-meta-batch2.js` — incohérence mineure ou entité définie ailleurs, non investiguée.

**Constat final sur `government-builder.js`** : **le fichier n'existe pas dans le dépôt.** Recherche par nom de fichier (`Get-ChildItem -Recurse`) et recherche croisée du texte `government-builder` dans tous les `.js`/`.sql` du dépôt : les deux retournent un résultat vide. Le seul point de référence à cet outil, dans tout le dépôt, est ce `console.log` de `21-seed-permissions-batch2.js`. Le moteur "Government Builder" décrit ci-dessus est donc, à ce stade de l'audit, un **projet annoncé mais non implémenté (ou non versionné)** — les tables `meta_entity`/`meta_attribute`/`meta_workflow_transition`/`meta_permission` existent et sont peuplées par les scripts batch2, mais l'outil de génération automatique de tables+API censé les consommer n'a laissé aucune trace dans le dépôt.

---

## 6. Points ouverts

1. ~~Contenu de `002_seed_type_acte.sql` et `02_seed_liens_hierarchiques.sql` non lu~~ → **résolu.**
2. ~~Statut des ~45 scripts `NN-seed-*`~~ → **largement résolu, avec reclassification majeure** (§5, §5bis) : doublons confirmés identiques, présence en dépôt confirmée pour 4 des 5 fichiers examinés, et 3 d'entre eux (19/20/21) reclassés comme scripts de test d'un moteur de génération d'entités, pas comme seed de données. Reste : confirmation de présence en dépôt pour `25-seed-arborescence-globale.js`, et caractérisation des ~40 scripts non examinés.
3. Contradiction `person`/`personne` héritée de `BOOTSTRAP_INVENTORY.md` — affecte directement la validité de tous les comptes créés par `db/seed.js` documentés en §3.
4. Définition exacte de `schema.sqlite.sql` (schéma SQLite alternatif) non lue.
5. ~~Divergence hiérarchie institutionnelle `organization` vs `rni_lien_hierarchique`~~ → **infirmée** (§4) : l'UUID en question est confirmé être la Primature dans les deux fichiers, pas une divergence.
6. ~~Module `./seed-extension`~~ → **résolu** (§5bis) : 18 tables Justice/Santé/Économie/Sécurité MFA-PKI.
7. ~~`government-builder.js` non lu~~ → **résolu : le fichier n'existe pas dans le dépôt** (recherche par nom et recherche croisée toutes deux vides). Le moteur "Government Builder" est un projet annoncé, pas un outil implémenté et versionné (§5bis).
8. **Nouveau, affiné** : coexistence de deux mécanismes de permission (`permission`/`role_permission` pour le RBAC applicatif classique, vs `meta_permission` pour le moteur Government Builder). Recoupement avec `MIGRATION_INVENTORY.md` §4.3 : la migration `governance/004` (09/08) précise qu'elle *remplace `meta_permission` explicitement pour `decision_gouvernementale`/`decision_action`* — un remplacement ciblé, pas une dépréciation générale. Cohérent avec l'usage vivant de `meta_permission` par les scripts batch2 (22/07) pour un domaine sans rapport (Government Builder). Les deux lectures ne se contredisent donc plus : `meta_permission` est abandonné pour le RBAC du module governance spécifiquement, tout en restant le mécanisme actif du moteur Government Builder, non lié au premier usage.
9. **Nouveau, hérité de `BOOTSTRAP_INVENTORY.md` §0** : au moins 9 fichiers du dépôt codent en dur des `organization_id` (Primature, Finances) qui deviennent invalides à chaque réexécution de `db/seed.js` (génération aléatoire par `crypto.randomUUID()` + `TRUNCATE` systématique). Liste complète dans `BOOTSTRAP_INVENTORY.md` §0.
10. Entité `dossier_recouvrement` référencée dans `20-seed-workflow-batch2.js` sans définition correspondante dans `19-seed-meta-batch2.js` — incohérence mineure non investiguée (§5bis).

---

## 7. Conclusion

`db/seed.js` et `db/seed-extension.js` sont cartographiés en détail : un générateur de démonstration institutionnelle complet, complété par 18 tables métier réelles (Justice/Santé/Économie/Sécurité). Le reliquat des scripts historiques s'avère nettement plus structuré et légitime qu'anticipé — mais surtout, il révèle un moteur de génération d'entités métier (« Government Builder ») actif au moins en test (tables `meta_*` peuplées), dont l'outil central annoncé (`government-builder.js`) **n'a jamais été trouvé dans le dépôt**. C'est un projet mentionné mais non implémenté (ou non versionné) — à signaler pour Baseline V2 : soit l'outil doit être développé, soit les scripts batch2 documentent une intention abandonnée qu'il faudrait clarifier avec l'équipe avant le Sprint 2.

---

*Document produit dans le cadre du Sprint 1 — Baseline V2 (audit, lecture seule). Prochaine étape : traiter le reliquat des ~45 scripts (comparaison de hash, présence dépôt) ; lire `002_seed_type_acte.sql` et `02_seed_liens_hierarchiques.sql` ; puis passer à la consolidation finale des 4 inventaires avant le commit de clôture du Sprint 1.*
