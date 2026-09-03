# Sprint E2E — Septembre 2026

**Projet :** pngie-rdc-backend
**Branche :** `feature/baseline-v2`
**Tag de référence :** `v0.9-e2e-green`
**Statut final :** ✅ 106/106 tests e2e verts

---

## 1. Objectifs du sprint

- Stabiliser la suite de tests end-to-end (`tests/e2e/`) couvrant RBAC, RLS, Cockpit,
  Journal National, gestion des agents RH et résolution de scope.
- Éliminer les identifiants UUID codés en dur dans les fixtures de test, au profit
  d'une résolution dynamique via les codes métier (code institution, code poste,
  matricule agent), pour rendre les tests robustes aux changements de données de seed.

## 2. Résultat final

```
tests 106
suites 0
pass 106
fail 0
cancelled 0
skipped 0
todo 0
```

Commande de vérification :
```powershell
node --test tests/e2e/*.test.js
```

## 3. Travail réalisé

### 3.1 Stabilisation fonctionnelle (sprint précédent, tag `d5f9056`)

Couverture apportée / consolidée sur :
- RBAC (contrôle d'accès par rôle)
- RLS (Row-Level Security institutionnelle vs nationale)
- Cockpit (tableau de bord exécutif, indicateurs agrégés)
- Journal National (cycle de vie complet d'un acte : brouillon → soumis →
  validé → signé → publié → archivé, avec traçabilité dans `journal_audit`)
- Gestion des agents RH et affectations
- ScopeResolver (résolution de périmètre agent)

### 3.2 Élimination des UUID codés en dur (cette session)

Fonctions ajoutées à `tests/e2e/helpers.js` :

| Fonction | Rôle |
|---|---|
| `connexionAdmin()` | Connexion Postgres via compte superuser (lit `.env.admin.local`) |
| `resolveInstitutionByCode(code)` | Résout un institution_id à partir du code institution |
| `resolvePosteByCode(code)` | Résout un poste_id à partir du code poste |
| `resolveAgentByMatricule(matricule)` | Résout un agent_id à partir du matricule |
| `resolvePersonneByMatricule(matricule)` | Résout une personne_id à partir du matricule |
| `resolveAffectationByPosteCode(posteCode)` | Résout l'affectation_id active sur un poste donné |

Fichiers convertis (UUID en dur → résolution dynamique) :

| Fichier | Résultat |
|---|---|
| `003_scoperesolver.test.js` | 5/5 — `AGENT_ID` résolu via `resolveAgentByMatricule("TESTSCOPE-006")` |
| `004_postes.test.js` | 20/20 — `POSTE_ID` résolu via `resolvePosteByCode(...)` |
| `005_affectations.test.js` | 19/19 — `AFFECTATION_MIN9_ID` / `AFFECTATION_MIN2_ID` résolues via `resolveAffectationByPosteCode("POSTE-POURVU")` / `("POSTE-MIN2-B")` |
| `006_agents.test.js` | 20/20 — conversion similaire |
| `007_journal_national.test.js` | 22/22 — suppression d'un bloc dupliqué `chargerEnvAdmin`/`connexionAdmin` (déjà fourni par `helpers.js`), `INSTITUTION_MI` résolue via `resolveInstitutionByCode("MIN_0")`, suppression d'`INSTITUTION_SN` (jamais utilisée dans le fichier) |

Détail 007 : deux versions du helper d'accès admin coexistaient dans le fichier
(une locale, une importée) suite à un refactoring antérieur incomplet. La version
locale a été retirée pour ne conserver que l'import centralisé.

## 4. Incident rencontré et résolu : `db/seed.js` non idempotent

**Contexte :** `npm test` exécute `node --test tests/*.test.js`, ce qui inclut
*tous* les fichiers de test à la racine de `tests/` (`auth.test.js`, `rbac.test.js`,
etc.), pas seulement `tests/e2e/`. Ces tests hors e2e déclenchent `db/seed.js`.

**Symptôme :** après un lancement accidentel de `npm test` (au lieu de cibler
`tests/e2e/` uniquement), le seed a échoué à mi-parcours avec des violations de
contrainte unique (`organization_type_code_key`, `pouvoir_code_key` — clé déjà
existante), car la base contenait déjà les données du sprint précédent.
Les tests e2e sont alors passés de 106/106 à quasi tout rouge (401 "Identifiants
invalides" généralisé), signe que les comptes de test avaient été supprimés ou
altérés par l'exécution partielle du seed.

**Diagnostic :** requête directe sur `personne` (comptes `test-%@pngie.local`)
confirmant 0 compte de test présent, alors que les tables de référence
(`organization_type`) étaient déjà peuplées — état incohérent, ni vierge ni seedé.

**Résolution :** restauration de la base depuis la sauvegarde prise en fin de
sprint précédent :
```powershell
& "<chemin_pg>\dropdb.exe"   -U $env:PGSUPERUSER -h localhost --if-exists pngie_rdc_rls_test
& "<chemin_pg>\createdb.exe" -U $env:PGSUPERUSER -h localhost pngie_rdc_rls_test
& "<chemin_pg>\pg_restore.exe" -U $env:PGSUPERUSER -h localhost -d pngie_rdc_rls_test backup_e2e_106_verts.backup
```
Point d'attention : la première tentative de restauration (sans `dropdb --if-exists`
préalable réussi) a produit 924 erreurs "objet existe déjà" — la restauration
n'est fiable que sur une base recréée à vide.

**Vérification post-restauration :** les 6 comptes de test (`test-an`, `test-gv`,
`test-mi`, `test-pm`, `test-pr`, `test-sn`) retrouvés, puis suite e2e complète
relancée avec succès : 106/106.

**Cause racine :** `db/seed.js` n'est pas idempotent (pas de `ON CONFLICT DO NOTHING`
ou équivalent sur les tables de référence), et `npm test` ne distingue pas les
tests e2e (qui gèrent leurs propres fixtures via `ON CONFLICT DO NOTHING`) des
tests plus anciens qui dépendent d'un seed complet depuis une base vierge.

**Non traité dans ce sprint (volontairement) :** rendre `db/seed.js` idempotent
et/ou séparer clairement `npm test` (suite complète, nécessite base vierge) de
la suite e2e (`tests/e2e/`, robuste et idempotente). Voir Sprint 2 ci-dessous.

## 5. Commits de ce sprint

```
9597ca5 refactor(tests-e2e): elimination UUID codes en dur (003, 004, 006)
05a2013 refactor(tests-e2e): elimination UUID codes en dur (005, 007)
9d81172 Nettoyage : suppression des fichiers .bak et temporaires post-sprint
d5f9056 (tag: v0.9-e2e-green) Sprint E2E termine : 106/106 tests verts (RBAC, RLS, Journal, Cockpit, RH)
```

Branche `feature/baseline-v2` et tag `v0.9-e2e-green` poussés sur
`origin` (GitHub).

## 6. Sprints suivants (hors scope de ce sprint)

### Sprint 2 — Automatisation complète des tests
- Rendre `db/seed.js` idempotent.
- Clarifier / séparer les cibles `npm test` (suite complète) et une commande
  dédiée pour `tests/e2e/` seule, pour éviter le piège rencontré en §4.
- Démarrage/arrêt automatique du serveur et de Postgres si nécessaire.
- Objectif : une seule commande, sans manipulation manuelle, du seed jusqu'au
  rapport 106/106.

### Sprint 3 — Intégration continue
- Mise en place GitHub Actions (ou équivalent).
- Exécution automatique de la suite à chaque push.
- Blocage des régressions avant fusion.
