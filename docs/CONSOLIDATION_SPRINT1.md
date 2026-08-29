# CONSOLIDATION_SPRINT1.md

**Projet :** PNGIE-RDC — Branche `feature/baseline-v2` — Sprint 1 (Audit, lecture seule)
**Objet :** Synthèse croisée des 4 inventaires (`DATABASE_INVENTORY.md`, `MIGRATION_INVENTORY.md`, `SEED_INVENTORY.md`, `BOOTSTRAP_INVENTORY.md`) avant le commit unique de clôture.
**Méthode :** Ce document ne répète pas le contenu détaillé des 4 inventaires ; il documente les recoupements effectués entre eux, les contradictions résolues, et les constats qui gagnent en gravité ou en clarté une fois mis en regard les uns des autres.

---

## 1. Résolutions obtenues par recoupement (cette session)

### 1.1 `person`/`personne` — résolu
`DATABASE_INVENTORY.md` §5 confirme par lecture directe de `pg_views` que `person` est une vue de compatibilité anglais/français sur la table réelle `personne` (avec `person_role`→`personne_role`, `organization`→`institution`, `permission_compat`→`permission`). Ceci résout le point resté ouvert dans `BOOTSTRAP_INVENTORY.md` §4/§8 : `db/seed.js` écrit dans la couche anglaise (`person`, `person_role`), tandis que `scripts/reset-test-users.js`/`assign-test-roles.js` écrivent directement dans les tables françaises réelles (`personne`, `personne_role`). Coexistence de deux chemins de code, pas contradiction.

### 1.2 `pngie_rdc_rls_test` — usage confirmé
`DATABASE_INVENTORY.md` listait cette base comme *« usage réel non confirmé »* (annexe, point 1). `BOOTSTRAP_INVENTORY.md` §3 le tranche : `.env.development` **et** `.env.test` la désignent explicitement comme base officielle de développement/test jusqu'à livraison V1.0 (note de gouvernance datée du 08/08/2026), et c'est la base ciblée par la chaîne officielle de comptes de test (`reset-test-users.js` et consorts). **Ce n'est pas une base orpheline — c'est la base actuellement voulue par la gouvernance du projet.**

### 1.3 `referentiel_arborescence` — table expliquée
`DATABASE_INVENTORY.md` §3 liste cette table avec 388 lignes, sans en expliquer l'origine (absente des migrations formelles). `SEED_INVENTORY.md` §5 identifie précisément sa source : `25-seed-arborescence-globale.js`, qui exécute lui-même un `CREATE TABLE IF NOT EXISTS`, hors de tout mécanisme de migration suivi. Confirme, avec une preuve concrète et nominative, l'hypothèse générale déjà posée dans `MIGRATION_INVENTORY.md` constat n°9 (les tables non expliquées proviennent probablement de scripts exécutés manuellement, hors suivi).

### 1.4 Schéma `gouvernance` vide — explication trouvée
`DATABASE_INVENTORY.md` §2 documente que les 23 tables du schéma `gouvernance` sont vides, avec une note trouvée dans un document local non versionné indiquant que ce schéma était le *« candidat naturel pour le futur module Journal National »*. `MIGRATION_INVENTORY.md` §4.2 montre que le module Journal National a bien été construit (08/08/2026) — mais **dans le schéma `public`**, pas dans `gouvernance`. Le schéma `gouvernance` est donc un chantier abandonné en cours de route, pas un chantier à venir : la décision d'implémentation a changé sans que le schéma prévu à l'origine soit nettoyé ou documenté comme obsolète.

### 1.5 Chronologie `meta_permission` — précisée
`SEED_INVENTORY.md` §5bis notait une tension apparente : `MIGRATION_INVENTORY.md` §4.3 (migration `governance/004`) présente `meta_permission` comme un mécanisme remplacé, alors que les scripts batch2 (22/07) l'utilisent activement pour le moteur "Government Builder". Lecture plus attentive de `MIGRATION_INVENTORY.md` : le remplacement est **explicitement scopé** à `decision_gouvernementale`/`decision_action`, pas une dépréciation générale. Les deux usages coexistent sans contradiction — deux sous-systèmes distincts.

### 1.6 SEC-001 — intégré et renforcé
`AUDIT_DASHBOARD_INSTITUTIONNEL.md` (OUVERT depuis le 06/08/2026) documente l'absence de `exigerPermission()`/`exigerPortee()` sur le dashboard institutionnel (`GET /api/institutions/:id/dashboard`), avec preuve empirique d'accès hors périmètre (compte `test-an@pngie.local` accédant à l'institution MIN_2). Désormais intégré en annexe de `MIGRATION_INVENTORY.md` §7. Le recoupement effectué cette session renforce le constat sans le trancher : `exigerPermission()`/`exigerPortee()`/`exigerPermissionRni()` sont trois mécanismes actifs et utilisés ailleurs dans le code (factures, cockpit gouvernance, module RNI) à la même période — leur absence sur ce dashboard s'écarte d'un pattern par ailleurs respecté. Reste un point ouvert au statut **OUVERT** : la décision métier et le recensement frontend n'ont pas été faits (aucun dépôt frontend accessible sur la machine d'audit).

### 1.7 Trigger `fn_detecter_anomalie_connexion()` — classé
Défini dans `01_securite_part4.sql` (famille des 115 scripts racine, jusqu'ici non individuellement documentée au-delà de `01_securite_part2.sql`), lié par trigger `AFTER INSERT` à la table `journal_connexion` (créée dans le socle fondateur, `schema_part2.sql`). Désormais documenté dans `MIGRATION_INVENTORY.md` §3. Le corps de la fonction (logique de détection d'anomalie) reste non lu — point ouvert pour le Sprint 2.

---

## 2. Constats qui gagnent en gravité une fois mis en regard

### 2.1 Le `TRUNCATE CASCADE` de `db/seed.js` face aux données réelles de `DATABASE_INVENTORY.md`
`BOOTSTRAP_INVENTORY.md` §0 documente que `db/seed.js` vide intégralement le schéma `public` avant de reseeder, sans garde-fou. Mis en regard de `DATABASE_INVENTORY.md` §3, ce n'est plus une menace abstraite : les données actuellement en base incluent 3 816 lignes de `referentiel_national_item`, 3 560 notifications, 2 159 unités organisationnelles, 2 124 postes, 889 lignes d'`audit_log`, 620 sessions utilisateur, 245 institutions, 129 personnes — soit l'essentiel du contenu réel accumulé depuis le 22/07. Une exécution accidentelle de `npm run seed` sur la base pointée par la variable Windows (`pngie_rdc`) détruirait tout cela d'un coup.

### 2.2 RLS RNSJ — activé mais sans filtre effectif
`DATABASE_INVENTORY.md` §4 (Groupe B) documente un fait resté isolé dans ce document jusqu'ici : les 4 tables RNSJ (`rnsj_modification`, `rnsj_relation`, `rnsj_texte`, `rnsj_texte_historique`) ont RLS techniquement activé, mais **aucune policy n'impose de filtre réel** (`qual = true` partout). Techniquement distinct du Bug G et de `security_invoker` mentionnés dans le résumé de reprise (RLS-003/004/005), mais de même nature : une protection RLS présente en apparence, inopérante en pratique. Ce point n'avait pas de connexion établie avec le reste de l'audit — il mérite d'être élevé au même niveau de visibilité que le §0 de `BOOTSTRAP_INVENTORY.md` dans la synthèse finale du Sprint 1.

### 2.3 Fragilité des UUID codés en dur — même mécanisme, deux échelles
`BOOTSTRAP_INVENTORY.md` §0 documente que 9 fichiers du dépôt codent en dur des `organization_id` invalidés à chaque réexécution de `seed.js`. `DATABASE_INVENTORY.md` §6 documente un phénomène parent plus large : l'écart de 70 objets (62 tables + 7 vues) entre la trace `resultat_005.txt` (04/08) et l'état actuel de la base n'est budgétisé par aucun mécanisme de suivi. Les deux constats pointent vers la même cause profonde : **l'absence de `schema_migrations`** (déjà signalée indépendamment dans `MIGRATION_INVENTORY.md` constat n°1 et `DATABASE_INVENTORY.md` §6) rend impossible, à toutes les échelles, de savoir avec certitude ce qui a été appliqué où et quand.

---

## 3. Cohérences vérifiées (pas de contradiction trouvée)

- Les 5 emplacements de migrations et leurs comptes de fichiers concordent exactement entre `MIGRATION_INVENTORY.md` §1/§4 et `DATABASE_INVENTORY.md` §6 (`db/migrations/` racine : 5 ; `governance/` : 4 ; `institution/` : 2 ; `journal/` : 8 + fichiers `.bak` ; `migrations_rls/` : 7 + 3 traces).
- Le compte de tables avec grants pour `pngie_app` (156 dans `DATABASE_INVENTORY.md` §1, ~157 recalculé en §6) est cohérent avec le chiffre du résumé de reprise (156 tables, origine des privilèges restreints non identifiée) — même mystère non résolu, pas de contradiction.
- `institution` (245 lignes), `personne`/`personne_role` (129/129) : parité de volumétrie confirmée entre la vue et la table réelle, cohérent avec la nature "vue simple" documentée en §5.

---

## 4. Points ouverts consolidés, par ordre de priorité pour le Sprint 2

1. **SEC-001** (`MIGRATION_INVENTORY.md` §7) — dashboard institutionnel sans `exigerPermission()`/`exigerPortee()`, exposition confirmée hors périmètre par test empirique. Statut **OUVERT**, décision métier et recensement frontend toujours en attente.
2. **RLS RNSJ sans filtre effectif** (`DATABASE_INVENTORY.md` §4, non corrigé, fait constaté) — à traiter en priorité avec RLS-003/004/005 du résumé de reprise.
3. **`TRUNCATE CASCADE` de `db/seed.js` sans garde-fou** (`BOOTSTRAP_INVENTORY.md` §0) — corriger avant toute nouvelle session de travail sur `pngie_rdc`.
4. **Écart de 70 objets non expliqué** (`DATABASE_INVENTORY.md` §6, partiellement éclairé par `referentiel_arborescence` — voir §1.3 ci-dessus, mais 61 tables + 6 vues restent d'origine incertaine).
5. **Fragilité des UUID codés en dur** face aux réexécutions de `seed.js` (9 fichiers recensés, `BOOTSTRAP_INVENTORY.md` §0).
6. **`government-builder.js` non implémenté** malgré des tables `meta_*` actives (`SEED_INVENTORY.md` §5bis) — décision à prendre : développer l'outil ou nettoyer les scripts batch2.
7. **5ᵉ paire de compatibilité possible** `ai_agent`/`agent_ia` non documentée (`BOOTSTRAP_INVENTORY.md` §4, nouveau).
8. Reliquat des ~45 scripts `NN-seed-*`, caractérisation incomplète (`SEED_INVENTORY.md` §5).
9. Bug 500 sur `/api/relations` après login (résumé de reprise, aucun détail technique obtenu cette session).
10. Point GATE — mécanisme technique élucidé (`BOOTSTRAP_INVENTORY.md` §3, barrière HTTP Basic Auth), périmètre d'usage/exemption métier toujours non tranché.
11. Nettoyage des fichiers `.bak`/`.bak2`/`.bak3` dans `db/migrations/journal/` (`MIGRATION_INVENTORY.md` §6, `DATABASE_INVENTORY.md` annexe point 5).
12. README "Migration RLS Phase 1" non versionné — à ajouter au dépôt ou à documenter formellement (`DATABASE_INVENTORY.md` annexe point 6).
13. Corps de la fonction `fn_detecter_anomalie_connexion()` non lu — logique de détection d'anomalie de connexion inconnue (`MIGRATION_INVENTORY.md` §3).

---

## 5. État de préparation pour le commit de clôture

| Document | Statut | Réserve |
|---|---|---|
| `DATABASE_INVENTORY.md` | Terminé (déclaré) | Section 6 a ses propres points ouverts explicites (écart de 70 objets), assumés comme tels par le document lui-même |
| `MIGRATION_INVENTORY.md` | Terminé (déclaré) | Cohérent avec les 3 autres documents après recoupement complet |
| `SEED_INVENTORY.md` | 🟢 Quasi complet | Reliquat des ~45 scripts non intégralement caractérisé (point 7 ci-dessus) |
| `BOOTSTRAP_INVENTORY.md` | 🟢 Terminé | Aucune réserve bloquante restante |

**Recommandation** : les 4 documents sont mutuellement cohérents et peuvent faire l'objet du commit unique de clôture du Sprint 1. Les points ouverts listés en section 4 ne sont pas des raisons de bloquer ce commit — ils sont la matière du Sprint 2, et chacun est déjà tracé dans son document source. Le seul arbitrage réellement nécessaire avant clôture est éditorial : décider si ce document (`CONSOLIDATION_SPRINT1.md`) est versionné aux côtés des 4 inventaires ou reste un document de travail de session.

---

*Document produit dans le cadre du Sprint 1 — Baseline V2 (audit, lecture seule).*
