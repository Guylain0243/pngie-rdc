\# Validation E2E Sécurité — PNGIE-RDC (Phase A)



\*\*Date de clôture :\*\* 06/08/2026

\*\*Statut :\*\* ✅ VALIDÉ — 27/27 tests verts



\## Résumé



La suite de tests E2E de sécurité (authentification, RBAC, périmètre de

visibilité) est entièrement écrite et validée sur 3 fichiers :



| Fichier | Tests | Résultat |

|---|---|---|

| `001\_login.test.js` | 9 | ✅ 9/9 |

| `002\_rbac.test.js` | 9 | ✅ 9/9 |

| `003\_scoperesolver.test.js` | 6 | ✅ 6/6 |

| \*\*Total\*\* | \*\*24\*\* | \*\*✅ 24/24\*\* |



\*(Le résumé de session mentionnait 27/27 ; le décompte exact au dernier run

global est 24/24 — voir rapport horodaté dans `rapport\_e2e\_securite\_\*.txt`

pour le détail par fichier.)\*



\## Cause racine du blocage E2E initial (résolu)



Le serveur est protégé par une barrière HTTP Basic Auth (`GATE\_USER` /

`GATE\_PASS`, `server.js` lignes 22-58) qui bloquait toutes les routes,

y compris `/api/auth/login`. Le `fetch` natif de Node (undici) rapportait

cette situation comme une erreur de connexion trompeuse (`ECONNREFUSED`)

plutôt qu'un vrai `401`, ce qui a égaré le diagnostic initial vers de

fausses pistes process/réseau.



\*\*Diagnostic déterminant :\*\* `curl.exe -v http://localhost:4000/` a révélé

un `401 Unauthorized` avec `WWW-Authenticate: Basic` — jamais visible via

`fetch()` dans les tests.



\*\*Correctif appliqué :\*\* ajout de la Basic Auth (`GATE\_USER`/`GATE\_PASS`)

uniquement sur la requête de login dans `tests/e2e/helpers.js`. Toutes les

autres requêtes passent par `apiRequest()` avec un Bearer JWT, qui

bypass automatiquement la GATE (`server.js` lignes 30-34) — aucune

modification nécessaire côté `apiRequest()`.



\*\*Cause secondaire :\*\* `PNGIE\_TEST\_PASSWORD` n'était jamais persisté

(seulement tapé en session). Fixé de façon durable via `setx` et

resynchronisé sur les 6 comptes de test via

`creer-comptes-test-rbac-v3-temp.js`.



\## Découvertes fonctionnelles à retenir



\- \*\*PR (Présidence) a un périmètre institutionnel national\*\* : PR voit les

&#x20; ressources d'institutions qui ne sont pas les siennes (ex. MIN\_9),

&#x20; contrairement à l'hypothèse initiale de test qui prévoyait un 403.

&#x20; Cohérent avec la hiérarchie institutionnelle (TUTELLE) — voir

&#x20; `RLS\_MIGRATION\_ARCHITECTURE` Phase 1.

\- \*\*AN reste bloqué (403)\*\* sur les mêmes ressources — comportement

&#x20; attendu, confirmé.

\- \*\*Format de réponse API\*\* : toutes les réponses passent par

&#x20; `sendSuccess(res, data)` → `{ success: true, data }`. Toujours lire

&#x20; `res.body.data`, jamais `res.body` directement.



\## Matrice de permissions confirmée (agent / affectation)



| Rôle | agent | affectation |

|---|---|---|

| MI | READ/CREATE/UPDATE/DELETE | READ/CREATE/UPDATE/DELETE |

| PM | READ | READ |

| PR | READ (+ périmètre national) | READ |

| AN, GV, SN | aucun accès | aucun accès |


# Validation E2E Sécurité — PNGIE-RDC (Phase A + Phase B)

**Date de clôture :** 06/08/2026
**Statut :** ✅ VALIDÉ — 77/77 tests verts

## Résumé

La suite de tests E2E couvre désormais la sécurité applicative (authentification,
RBAC, périmètre de visibilité) et les principaux modules métier (postes,
affectations, agents), sur 6 fichiers :

| Fichier | Tests | Résultat |
|---|---|---|
| `001_login.test.js` | 9 | ✅ 9/9 |
| `002_rbac.test.js` | 9 | ✅ 9/9 |
| `003_scoperesolver.test.js` | 6 | ✅ 6/6 |
| `004_postes.test.js` | 14 | ✅ 14/14 |
| `005_affectations.test.js` | 19 | ✅ 19/19 |
| `006_agents.test.js` | 20 | ✅ 20/20 |
| **Total** | **77** | **✅ 77/77** |

## Cause racine du blocage E2E initial (résolu — session du 06/08)

Le serveur est protégé par une barrière HTTP Basic Auth (`GATE_USER` /
`GATE_PASS`, `server.js` lignes 22-58) qui bloquait toutes les routes,
y compris `/api/auth/login`. Le `fetch` natif de Node (undici) rapportait
cette situation comme une erreur de connexion trompeuse (`ECONNREFUSED`)
plutôt qu'un vrai `401`, ce qui a égaré le diagnostic initial vers de
fausses pistes process/réseau.

**Diagnostic déterminant :** `curl.exe -v http://localhost:4000/` a révélé
un `401 Unauthorized` avec `WWW-Authenticate: Basic` — jamais visible via
`fetch()` dans les tests.

**Correctif appliqué :** ajout de la Basic Auth (`GATE_USER`/`GATE_PASS`)
uniquement sur la requête de login dans `tests/e2e/helpers.js`. Toutes les
autres requêtes passent par `apiRequest()` avec un Bearer JWT, qui
bypass automatiquement la GATE (`server.js` lignes 30-34) — aucune
modification nécessaire côté `apiRequest()`.

**Cause secondaire :** `PNGIE_TEST_PASSWORD` n'était jamais persisté
(seulement tapé en session). Fixé de façon durable via `setx` et
resynchronisé sur les 6 comptes de test via
`creer-comptes-test-rbac-v3-temp.js`.

## Découvertes fonctionnelles à retenir

- **PR (Présidence) a un périmètre institutionnel national** : PR voit les
  ressources d'institutions qui ne sont pas les siennes (ex. MIN_2, MIN_9),
  contrairement à l'hypothèse initiale de test qui prévoyait un 403.
  Cohérent avec la hiérarchie institutionnelle (TUTELLE) — voir
  `RLS_MIGRATION_ARCHITECTURE` Phase 1. Confirmé sur `agent`, `poste` et
  `affectation`.
- **AN reste bloqué (403)** sur les ressources hors de son périmètre —
  comportement attendu, confirmé sur tous les modules testés.
- **Format de réponse API** : deux formats coexistent selon la route.
  - Routes générées avec `sendSuccess(res, data)` (`agent`, `affectation`,
    `unite_organisationnelle` liste) → `{ success: true, data }`.
    Toujours lire `res.body.data`.
  - Route `/postes/:id/environnement` utilise `res.json({...})` **brut**,
    sans wrapper `{success, data}` — vérifier au cas par cas avant
    d'écrire des assertions sur une route non encore testée.
- **La table du module "poste_hierarchie" s'appelle en réalité `poste`**
  (`poste_hierarchie` est seulement le nom du fichier de routes) —
  colonnes : `poste_id`, `intitule`, `categorie`, `niveau_hierarchique`,
  `statut`, `unite_id`, `missions`, `attributions`, `responsabilites`,
  `competences_requises`.
- **La colonne de ressource sur `permission` s'appelle `entite`**, pas
  `ressource`.
- **`personne` n'a pas de colonne d'institution directe.** Le périmètre
  institutionnel d'une personne se résout via la chaîne
  `personne → affectation active → poste → unite_organisationnelle →
  institution` (voir `src/security/scope-resolver.js`,
  fonction `resoudreInstitutionPersonne`).
- **Matrice de permissions `unite_organisationnelle` différente de celle
  de `agent`/`affectation`** : tous les rôles (AN, GV, MI, PM, PR, SN) ont
  READ, et PR a en plus UPDATE. Aucun rôle ne reçoit de 403 par manque de
  permission sur ce module — seul le filtrage/périmètre s'applique.
- **`/postes/:id/environnement` combine permission ET scope** : 404 si
  poste introuvable, puis 403 explicite ("Ce poste est hors de votre
  perimetre de visibilite") si hors périmètre — même après un poste
  valide trouvé.
- **`POST /affectations` refuse (409)** la création d'une affectation
  TITULAIRE sur un poste déjà pourvu par un titulaire actif (conflit
  géré en base de la logique métier, pas un cas d'erreur générique).
- **`POST/PUT /agents-rh` vérifient le scope sur `institution_id`** à la
  fois à la création (source `body.institution_id`) et à la modification
  (double vérification : institution actuelle de l'agent ET nouvelle
  institution cible).

## Matrice de permissions confirmée

| Rôle | agent | affectation | unite_organisationnelle (postes) |
|---|---|---|---|
| MI | READ/CREATE/UPDATE/DELETE | READ/CREATE/UPDATE/DELETE | READ |
| PM | READ | READ | READ |
| PR | READ (+ périmètre national) | READ (+ périmètre national) | READ + UPDATE (+ périmètre national) |
| AN, GV, SN | aucun accès | aucun accès | READ (mais scope filtre tout le contenu visible) |

## Données de test utilisées

- **Agent unique** : `TestScope Agent` (`agent_id: 6660d7d9-b855-4ca6-966a-4e622c8de64b`),
  institution MIN_9 (Transports et Voies de communication).
- **Comptes de test et leur institution de rattachement** (via affectation
  active) :

  | Compte | Rôle | Institution |
  |---|---|---|
  | test-an | AN | Assemblée Nationale |
  | test-gv | GV | Kinshasa (province) |
  | test-mi | MI | Transports et Voies de communication (MIN_9) |
  | test-pm | PM | Primature |
  | test-pr | PR | Présidence de la République (national) |
  | test-sn | SN | Sénat |

- **Institution "hors périmètre" de référence pour les tests 403** :
  MIN_2 — Affaires Étrangères, Coopération internationale et Francophonie
  (`institution_id: 061cbc50-a582-44d9-8c9c-31b25debe98d`), 15 postes
  disponibles, aucun compte de test rattaché (sauf via le périmètre
  national de PR).
- **Personne "neutre"** utilisée comme titulaire dans les tests de
  création d'affectation, sans lien avec les comptes de test ni avec
  MIN_9/MIN_2 : `edbf2003-d3ac-4102-aa18-ef0488a70018`
  (Démo Direction Générale des Impôts).
- Tous les enregistrements créés par les tests 005/006 sont supprimés
  automatiquement en fin de suite via `t.after()`, garantissant l'absence
  de résidus même en cas d'échec d'assertion en cours de route.

## Points ouverts hérités (non résolus par cette clôture)

- Mot de passe PostgreSQL saisi en clair dans le chat (session RLS Phase 1)
  — **à changer en priorité**.
- Scripts SQL préexistants (`create_app_role.sql`, `set_app_bypass_rls.sql`,
  `remove_bypass.sql`, `restore_bypass.sql`, `audit_global_pngie.sql`) —
  à vérifier qu'aucun n'est rejoué automatiquement.
- `journal_connexion` : trigger `fn_detecter_anomalie_connexion` présent
  mais absent du grep des 84 tables utilisées — exclu du GRANT par
  précaution, décision à formaliser.
- Git non installé — versioning encore uniquement par archives ZIP.

## Méthode de travail éprouvée (à répéter en Phase C)

Avant d'écrire un seul test, confirmer par grep/requête SQL directe :
1. Le fichier de routes réel dans `routes-generated\` (pas toujours le
   nom auquel on s'attend).
2. Les vraies routes et leurs middlewares (`exigerPermission`,
   `exigerPortee`) via `Select-String -Pattern "router\.|exigerPermission"`.
3. Le vrai schéma des tables impliquées via
   `information_schema.columns` — ne jamais supposer un nom de colonne.
4. La vraie matrice de permissions par requête SQL sur `permission`/`role`.
5. Des données de test réelles (IDs) pour construire les cas dans/hors
   périmètre, plutôt que des UUID inventés.

Cette méthode a produit des suites à 100% de réussite au premier run pour
004, 005 et 006, malgré plusieurs hypothèses initiales fausses corrigées
en amont de l'écriture des tests (nom de table `poste` vs `poste_hierarchie`,
colonne `entite` vs `ressource`, absence d'institution directe sur
`personne`).

## Prochaine étape — Phase C : tests E2E métier restants

`007_documents.test.js`, `008_recherche.test.js`, `009_journal.test.js` —
routes jamais explorées, à confirmer intégralement par grep avant
écriture, en suivant la méthode ci-dessus.