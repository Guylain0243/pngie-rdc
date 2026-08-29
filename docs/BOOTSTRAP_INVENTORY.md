# BOOTSTRAP_INVENTORY.md

**Projet :** PNGIE-RDC
**Branche :** feature/baseline-v2
**Sprint :** Baseline V2 — Sprint 1 (Audit, lecture seule)
**Statut :** 🟢 Terminé — sections 2 à 6 et 8 requalifiées par lecture directe ; contradiction `person`/`personne` résolue par recoupement avec `DATABASE_INVENTORY.md` §5
**Méthode :** Chaque affirmation marquée « vérifié par lecture directe » est appuyée par une commande PowerShell effectivement exécutée dans cette session et son résultat observé.

**⚠️ Sur les secrets présents dans ce document** : documentés tels que lus, jamais testés (aucune tentative de connexion). Ce document contient un secret de sensibilité maximale (superuser PostgreSQL, accès total à l'instance) — à traiter avec une prudence renforcée.

---

## 🔴 0. Constat le plus critique de l'audit — à lire en premier

**[vérifié par lecture directe — `db/seed.js`]** Lorsqu'il est exécuté avec `DATABASE_URL` défini (branche PostgreSQL, systématiquement empruntée dans la configuration actuelle du projet), `db/seed.js` commence par :

```js
await db0.run(`SELECT set_config('app.bypass_rls', 'true', false)`);
const tables = await db0.all(`SELECT tablename FROM pg_tables WHERE schemaname='public'`);
if (tables.length) {
  await db0.run(`TRUNCATE TABLE ${tables.map(t => `"${t.tablename}"`).join(',')} RESTART IDENTITY CASCADE`);
}
```

**`db/seed.js` vide intégralement (`TRUNCATE ... CASCADE`) toutes les tables du schéma `public` avant de reconstruire le jeu de données de démonstration.** Le commentaire d'en-tête du fichier le confirme : *« fonctionne identiquement sur SQLite (dev/tests) et PostgreSQL (production) »* — l'auteur envisageait explicitement une exécution en production.

Combiné aux constats déjà établis dans ce document :
- aucun contrôle `NODE_ENV` dans `seed.js` (§4) ;
- aucun fichier `.env.production` dans le dépôt (§3) ;
- la variable d'environnement **Windows** `DATABASE_URL` pointe vers `pngie_rdc`, désignée par une note de gouvernance écrite (08/08/2026) comme base de référence à ne jamais utiliser pour du travail en cours (§3, §6).

**🟠 Fragilité supplémentaire découverte** : `db/seed.js` génère ses `organization_id` via `crypto.randomUUID()` (confirmé ligne 34, aléatoire à chaque exécution). Or au moins 9 fichiers du dépôt codent en dur des `organization_id` précis capturés à un instant T (Primature = `ae011056-...`, probable Finances = `caa61add-...`) : `archive\debug\fix-scope-pm.js`, `verif-primature-uuid.js`, `archive\session-2026-08-14\corriger-mi.js`, `corriger-scope-certains.js`, `verif-finances-organization.js`, `db\migrations\institution\002_fix_scope_pm_null.sql` (déjà référencé dans `MIGRATION_INVENTORY.md` §4.4), `scripts\audit-hierarchie-6-comptes.js`, `78-test-relations.js`, `test_fn_existe.sql`. **Toute réexécution de `db/seed.js` invalide silencieusement ces 9 références**, sans qu'aucune erreur explicite ne le signale — un correctif ou un test s'appuyant sur l'un de ces fichiers échouerait silencieusement ou opérerait sur le mauvais enregistrement après un nouveau seed.

*(Correction méthodologique : une hypothèse posée au tour précédent — que `02_seed_liens_hierarchiques.sql` rattacherait les ministères à un autre identifiant que celui utilisé par `db/seed.js`, suggérant une divergence de hiérarchie institutionnelle — est infirmée par le commentaire explicite `-- Primature` trouvé dans `002_fix_scope_pm_null.sql` en regard de ce même UUID `ae011056-...`. Il n'y a pas de divergence : les deux fichiers s'accordent sur le même rattachement. Voir `SEED_INVENTORY.md` §4 pour la mise à jour correspondante.)*

---

## 1. Objet de l'inventaire

Documenter la chaîne d'installation/bootstrap de PNGIE-RDC, les comptes de test/démo, les variables d'environnement et secrets impliqués, et les écarts entre l'installation théorique et l'état réel observé.

---

## 2. Chaîne officielle d'installation

**[vérifié par lecture directe — `package.json` + les 3 scripts `scripts/*.js`]**

Il n'existe toujours aucune commande `npm run bootstrap` unique, mais la **chaîne officielle des comptes de test (BOOTSTRAP-001) est maintenant intégralement lue et confirmée** :

| Script | Rôle |
|---|---|
| `scripts/reset-test-users.js` | Réinitialise le mot de passe des 6 comptes de test **uniquement**. Cible directement la table `personne` — commentaire du fichier : *« la vue `person` est en lecture seule »*. |
| `scripts/verify-test-users.js` | Vérifie (lecture seule) que le mot de passe des 6 comptes correspond bien à `PNGIE_TEST_PASSWORD`, via `bcrypt.compare`. |
| `scripts/assign-test-roles.js` | Assigne à chaque compte de test son rôle, via une table de correspondance `MAPPING` email → code rôle. Utilise explicitement `app.bypass_rls` (`SELECT set_config('app.bypass_rls','true',false)`) pour contourner RLS le temps de l'écriture — commentaire du fichier : *« mécanisme prévu par la policy elle-même »*. Fait un `DELETE` puis `INSERT` complet dans `personne_role` (remplacement, pas ajout). |

Les trois scripts chargent leur configuration via une fonction locale `loadEnvTest()`, qui lit **spécifiquement `.env.test`** (pas `.env.development`).

**Constat important** : ce mécanisme `app.bypass_rls` est le même que celui déjà repéré dans `MIGRATION_INVENTORY.md` (§3 de ce document, fichiers `remove_bypass.sql`/`restore_bypass.sql`/`set_app_bypass_rls.sql`, et réutilisé par le module journal). Confirme que c'est un mécanisme de contournement RLS générique et documenté du projet, pas un artefact isolé.

---

## 3. Variables d'environnement

**[vérifié par lecture directe]** Les trois fichiers `.env*` du dépôt sont maintenant tous lus.

### `.env.development` (rappel, cf. version précédente de ce document)
Déclare `pngie_rdc_rls_test` comme base officielle, `PGPASSWORD`, `JWT_SECRET`, `GATE_USER`/`GATE_PASS`, `RATE_LIMIT_DISABLED=true`, `PNGIE_TEST_PASSWORD`.

### `.env.test`
```
PNGIE_TEST_PASSWORD=Merci@0243?
DATABASE_URL=postgresql://pngie_app@localhost:5432/pngie_rdc_rls_test
PGPASSWORD=:NI=CcM#D.jL(i#ni1v&[^qU
JWT_SECRET=test-secret-temporaire-32-caracteres-minimum-xyz
RATE_LIMIT_DISABLED=true
GATE_USER=pngie_admin_cl0uj7
GATE_PASS=EZqA8-xBSyNWCKU2JG+mI5dQzpefTH!0
```
**Constat** : `.env.test` et `.env.development` partagent des valeurs identiques (`DATABASE_URL`, `PGPASSWORD`, `JWT_SECRET`, `GATE_USER`/`GATE_PASS`, `RATE_LIMIT_DISABLED`, `PNGIE_TEST_PASSWORD`). Les deux fichiers ciblent la même base `pngie_rdc_rls_test` — cohérent avec la politique de gouvernance du 08/08/2026. La désynchronisation identifiée en §6 ne vient donc **pas** d'une divergence entre fichiers du dépôt, mais uniquement de la variable d'environnement **au niveau du système Windows**, qui s'écarte des deux fichiers à la fois.

### `.env.admin.local` — nouveau secret de sensibilité maximale
```
# Identifiants superuser PostgreSQL – SENSIBILITÉ ÉLEVÉE (accès total à l'instance)
# Ne jamais committer ce fichier. Utilisé uniquement pour des opérations d'administration
# (ALTER POLICY, GRANT, migrations manuelles), pas pour le fonctionnement normal de l'app.
PGSUPERUSER=postgres
PGSUPERUSER_PASSWORD=PgSuperUser-2026-Definitif!Xk9m
```
**🔴 Constat** : ce fichier documente un accès **superuser PostgreSQL** (`postgres`), donc un accès total à l'instance — au-delà du périmètre applicatif de `pngie_app`. C'est, de tous les secrets recensés dans cet inventaire, celui dont la compromission aurait l'impact le plus large. Le nom du fichier (`.local`) et son commentaire interne suggèrent un usage ponctuel d'administration, non versionné dans le flux applicatif normal — cohérent avec son absence des deux autres `.env*`.

### Usage de `GATE_USER`/`GATE_PASS` dans le code — résolu

**[vérifié par lecture directe — `src/server.js` lignes 22-58]** C'est une **barrière d'accès HTTP (Basic Auth) optionnelle**, activée uniquement si les deux variables sont définies :

```js
// Activée uniquement si GATE_USER et GATE_PASS sont définis (utile surtout ...)
const GATE_USER = process.env.GATE_USER;
const GATE_PASS = process.env.GATE_PASS;
if (GATE_USER && GATE_PASS) {
  // ... comparaison via Buffer (probable usage de crypto.timingSafeEqual, non confirmé dans l'extrait lu)
  console.log('🔒 Barrière d\'accès HTTP activée (GATE_USER/GATE_PASS définis)');
} // sinon :
  console.log('⚠ Barrière d\'accès HTTP NON activée — GATE_USER/GATE_PASS non définis (recommandé si exposé publiquement)');
```

Trois scripts supplémentaires consomment ces variables, non catalogués jusqu'ici :
- `scripts/creer-env-development.js` (lignes 37-38) — **génère `.env.development` à partir des valeurs de `.env.test`**, `GATE_USER`/`GATE_PASS` inclus. Explique directement pourquoi `.env.test` et `.env.development` sont quasi identiques (§3) : ce n'est pas une coïncidence de configuration, c'est le résultat mécanique de ce script.
- `scripts/preload-env-test.js` (lignes 18-19) — **vide volontairement** `GATE_USER`/`GATE_PASS` (`""`) dans son propre contexte d'exécution, désactivant donc la barrière HTTP pour les scénarios qui l'utilisent.
- `scripts/verify-pm-content.js` (lignes 7-9) — construit un en-tête `Authorization: Basic ...` à partir de `GATE_USER`/`GATE_PASS` pour effectuer une requête HTTP authentifiée (contenu de la requête elle-même non lu dans cette session).

**Point désormais tranché** : le "point GATE" du résumé de reprise (périmètre d'exemption) est une barrière HTTP applicative standard, pas un mécanisme RLS ou RBAC. Reste un point mineur non vérifié : la méthode de comparaison des identifiants (Buffer-based, lignes 47-48) suggère un usage de comparaison à temps constant, mais l'extrait lu ne montre pas la ligne d'appel `crypto.timingSafeEqual` elle-même.

---

## 4. Comptes et authentification de test

**[vérifié par lecture directe]** Point majeur requalifié ce tour-ci : **deux familles de comptes totalement indépendantes coexistent**, et non une seule avec deux mots de passe incohérents comme le suggérait la lecture précédente.

| | Comptes « démo » (`db/seed.js`) | Comptes « test officiels » (`scripts/*.js`) |
|---|---|---|
| Emails | `pr@rdc.gouv.cd`, `pm@rdc.gouv.cd`, `sn@rdc.gouv.cd`, `an@rdc.gouv.cd`, `mi@rdc.gouv.cd`, `gv@rdc.gouv.cd` | `test-mi@pngie.local`, `test-pm@pngie.local`, `test-pr@pngie.local`, `test-an@pngie.local`, `test-gv@pngie.local`, `test-sn@pngie.local` |
| Mot de passe | `DEMO_PASSWORD = 'Pngie#2027'` (codé en dur dans `seed.js`) | `PNGIE_TEST_PASSWORD` (lu depuis `.env.test`, valeur `Merci@0243?`) |
| Coût bcrypt | 12 | 10 |
| Créé/géré par | `db/seed.js` (mélangé au reste du jeu de données de démo — agents IA, systèmes externes, cycle de gouvernance complet, cf. version précédente §4) | `scripts/reset-test-users.js` / `verify-test-users.js` / `assign-test-roles.js` — famille de scripts dédiée, maintenance ciblée uniquement |
| Table ciblée | `person` (selon commentaire du fichier `seed.js` déjà relevé — **à re-vérifier**, voir point ouvert ci-dessous) | `personne` explicitement — le fichier `reset-test-users.js` précise que `person` est **une vue en lecture seule** |
| Affectation de rôle | `person_role`, inline dans la boucle de création (`scope_org_id = null`) | `personne_role`, via `assign-test-roles.js`, avec bypass RLS explicite, remplacement complet (`DELETE` puis `INSERT`) |

**Point résolu (§8, ancien point 4)** : la question « quel compte utilise quel mot de passe » est maintenant sans objet — ce ne sont pas les mêmes comptes.

**Contradiction confirmée par lecture directe du SQL réel (non commenté)** : les 4 insertions de comptes démo dans `seed.js` ciblent toutes explicitement `person`, jamais `personne` :

```
db\seed.js:51:   INSERT INTO person (person_id,nom,email,password_hash) VALUES (?,?,?,?)
db\seed.js:199:  INSERT INTO person (person_id,matricule,nom,prenom,email,password_hash) VALUES (?,?,?,?,?,?)
db\seed.js:603:  INSERT INTO person (person_id,nom,email,password_hash) VALUES (?,?,?,?)
db\seed.js:658:  INSERT INTO person (person_id,nom,email,password_hash) VALUES (?,?,?,?)
```

Aucune occurrence de `INSERT INTO personne` dans `seed.js`. La contradiction avec le commentaire de `reset-test-users.js` (*« la vue `person` est en lecture seule »*) est donc réelle, pas un artefact de paraphrase.

**✅ Résolu par lecture directe de `DATABASE_INVENTORY.md` §5** : `person` est confirmé être une **vue de compatibilité anglais/français** sur la table réelle `personne` (définition SQL lue directement via `pg_views`, pas une hypothèse) — au même titre que `person_role`→`personne_role`, `organization`→`institution`, `permission_compat`→`permission`. Parité de volumétrie confirmée (129/129 lignes) pour `person`/`personne`.

**Nuance résolue** : `db/seed.js` écrit dans `person`/`person_role` (couche de compatibilité anglaise), tandis que `reset-test-users.js`/`assign-test-roles.js` écrivent directement dans `personne`/`personne_role` (tables françaises réelles). Ce sont deux chemins de code distincts pour la même donnée, pas une contradiction — cohérent avec le fait que ces scripts aient été écrits à des moments différents du projet. Le commentaire de `reset-test-users.js` (*"person est en lecture seule"*) reste possiblement imprécis : PostgreSQL rend automatiquement modifiables les vues simples mono-table sans agrégat ni jointure — ce qui est exactement le type de vue décrit en §5 de `DATABASE_INVENTORY.md` — ce qui pourrait expliquer que l'`INSERT INTO person` de `seed.js` fonctionne malgré tout. Ce dernier point reste une hypothèse technique non testée (conformément à la règle de ne jamais tester les accès), mais l'essentiel — l'existence et la nature de la vue `person` — est désormais un fait établi, pas une supposition.

**Point notable additionnel, découvert par recoupement** : le tableau de volumétrie de `DATABASE_INVENTORY.md` §3 liste une table `agent_ia` (127 lignes), alors que `db/seed.js` (`AGENT_SQL`) écrit explicitement dans une table `ai_agent`. Ce nommage divergent pourrait signaler une **5ᵉ paire de compatibilité anglais/français non documentée** dans `DATABASE_INVENTORY.md` §5 (qui n'en liste que 4) — hypothèse plausible vu le pattern déjà établi, mais non confirmée : aucune vue `ai_agent` n'est mentionnée dans la liste des vues de compatibilité. **Point ouvert pour le Sprint 2.**

---

## 5. Scripts de bootstrap et de seed

Statut inchangé par rapport à la version précédente : le reliquat des ~45 scripts `NN-seed-*` (trouvés dans `Downloads`, hors dépôt) reste non classé. La chaîne officielle des comptes de test étant maintenant confirmée comme étant `scripts/reset-test-users.js` / `verify-test-users.js` / `assign-test-roles.js`, il est probable que le reliquat des 45 scripts appartienne à une autre famille (peuplement de données métier, cf. `SEED_INVENTORY.md` à créer) plutôt qu'au bootstrap de comptes. **Point toujours ouvert.**

---

## 6. Désynchronisations observées

**Affinée ce tour-ci** : la désynchronisation `pngie_rdc` / `pngie_rdc_rls_test` n'est **pas** une divergence entre fichiers du dépôt — `.env.development` et `.env.test` sont d'accord entre eux et tous deux alignés avec la politique de gouvernance du 08/08/2026 (`pngie_rdc_rls_test` comme base de dev/test officielle). L'écart se situe **uniquement** au niveau de la variable d'environnement définie au niveau du système Windows, qui contourne silencieusement l'ensemble des fichiers `.env*` du dépôt (les trois, pas seulement `.env.development`).

**Conséquence pour la chaîne de test** : les scripts `reset-test-users.js`/`verify-test-users.js`/`assign-test-roles.js` chargent `.env.test` explicitement dans leur code (`path.join(__dirname, "..", ".env.test")`) — ils ne sont **pas** affectés par la variable Windows tant qu'ils sont exécutés tels quels, et opèrent donc bien sur `pngie_rdc_rls_test`. C'est l'application principale (`src/server.js`, lancée via `npm start`, qui lit probablement `process.env.DATABASE_URL` sans forcer `.env.test`) qui reste exposée à la divergence.

---

## 7. État cible (Baseline V2)

Inchangé — voir version précédente. Point à ajouter : la coexistence de deux familles de comptes (démo vs test officiel) devrait être tranchée explicitement dans la cible Baseline V2 — lesquelles sont destinées à survivre, lesquelles sont vouées à être supprimées.

---

## 8. Points ouverts

1. ~~Contenu de `scripts/reset-test-users.js`, `scripts/verify-test-users.js`, `scripts/assign-test-roles.js` non lu~~ → **résolu.**
2. ~~Contenu de `.env.admin.local` et `.env.test` non lu~~ → **résolu.**
3. ~~Usage fonctionnel de `GATE_USER`/`GATE_PASS`~~ → **résolu : barrière HTTP Basic Auth optionnelle dans `src/server.js`** (§3).
4. ~~Relation entre `DEMO_PASSWORD` et `PNGIE_TEST_PASSWORD`~~ → **résolu : deux familles de comptes indépendantes** (§4).
5. Statut réel des ~45 scripts de seed du reliquat — toujours non tranché, **hors périmètre de ce document**, traité dans `SEED_INVENTORY.md`.
6. Bug 500 sur `/api/relations` après login — aucun détail technique disponible dans cette session.
7. Impact potentiel de `RATE_LIMIT_DISABLED=true` — confirmé présent dans `.env.development` **et** `.env.test` — impact non évalué.
8. Origine de la divergence de la variable Windows `DATABASE_URL` — toujours non tranchée (écart système, pas de configuration versionnée).
9. ~~Contradiction `person`/`personne`~~ → **résolu par `DATABASE_INVENTORY.md` §5** : `person` est confirmé être une vue de compatibilité sur `personne`. Voir §4 pour le détail.
10. `PGSUPERUSER_PASSWORD` documenté dans `.env.admin.local` — secret de sensibilité maximale, prudence renforcée requise pour la suite de l'audit.
11. Méthode exacte de comparaison des identifiants GATE (Buffer-based, probable comparaison à temps constant) — extrait lu incomplet, ligne d'appel non vue.
12. Contenu de `scripts/verify-pm-content.js` non lu au-delà des lignes 7-9 (usage de `GATE_AUTH`) — objet de la vérification (quel "contenu PM") non identifié.

---

## 9. Conclusion

**Le constat central de ce document est désormais le §0** : `db/seed.js` vide intégralement la base PostgreSQL ciblée (`TRUNCATE ... CASCADE`) avant de reseeder, sans aucune barrière technique (ni `NODE_ENV`, ni `.env.production`, ni garde applicative) pour l'empêcher de s'exécuter contre la base de référence `pngie_rdc` si la variable Windows `DATABASE_URL` reste en l'état. C'est un risque opérationnel actif, pas seulement documentaire.

Ce tour de lecture résout 4 des 8 points ouverts précédents (chaîne de test, relation des mots de passe, usage GATE, origine de la similitude `.env.test`/`.env.development` via `creer-env-development.js`). Un seul point reste réellement bloquant pour la fiabilité totale du document : la contradiction `person`/`personne` (point 9), qui reste une hypothèse non tranchée. Le reliquat des ~45 scripts de seed (§5, point 5) est officiellement transféré au périmètre de `SEED_INVENTORY.md`, créé à la suite de ce document.

---

*Document produit dans le cadre du Sprint 1 — Baseline V2 (audit, lecture seule). Prochaine étape : corriger et relancer la recherche GATE_USER/GATE_PASS ; vérifier le SQL réel `person`/`personne` dans `db/seed.js` ; puis créer `SEED_INVENTORY.md`.*
