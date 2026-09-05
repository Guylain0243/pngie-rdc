# PNGIE RDC — Feuille de route consolidée
**Date : 2026-09-05 — Branche : feature/baseline-v2**

---

## 1. Où on en est réellement (état technique vérifié)

Baseline stable et committée :
- `dc491f6` fix(seed) : institution peuplée sous SQLite
- `4c2b8bd` fix(audit) : 9 appels audit() neutralisés (FK person_id)
- `4aaf4a1` fix(seed) : non-idempotence institution/personne
- **37 tests, 27 pass / 10 fail**, stable sur runs consécutifs (hors duration_ms)

Découverte majeure de cette session (non prévue par la feuille de route initiale) :
- `institution` ne contient qu'**1 ligne** (Présidence)
- `organization` contient **80 lignes** : 42 ministères, 26 provinces, 5 organes de contrôle, Parlement (2 chambres), Primature, Présidence, 3 hautes juridictions — avec une hiérarchie `parent_id` cohérente (Présidence → Primature/Sénat/AN, Primature → ministères)
- Aucune trace d'« organisation interne » (cabinet, direction, service) dans les données actuelles
- Plusieurs tables (`instruction`, `rapport`, `controle`, `recommandation`, `decision`, `systeme_externe`) référencent encore `*_org_id`, pas `*_institution_id`

**Conclusion technique :** le Bloc 3 initial (« renommer organization en institution dans server.js ») était mal posé. Ce n'est pas un renommage, c'est une décision de modélisation (cf. §2). **Le Bloc 3 est mis en pause** tant que le modèle conceptuel n'est pas fixé.

---

## 2. Le changement de séquence adopté

Ancienne séquence (abandonnée) :
```
ADR → Script → Migration
```

Nouvelle séquence (adoptée) :
```
FOUNDATION (concepts stables) → ADR (décisions ponctuelles) → Script d'analyse
→ Script de migration (écrit, relu, versionné, non exécuté) → Migration (exécutée)
```

Distinction retenue :
- **FOUNDATION** = répond à « qu'est-ce que le PNGIE ? ». Documents stables, évoluent peu.
- **ADR** = répond à « pourquoi avons-nous choisi cette solution ? ». Décisions ponctuelles, datées, traçables.

Arborescence cible :
```
docs/
├── foundation/
│   ├── FOUNDATION-001-Vision-PNGIE.md
│   ├── FOUNDATION-002-Metamodele-National.md
│   ├── FOUNDATION-003-RNI.md
│   ├── FOUNDATION-004-RNSO.md
│   ├── FOUNDATION-005-Identite-Numerique.md
│   └── FOUNDATION-006-Gouvernance-des-donnees.md
└── adr/
    ├── ADR-001-conservation-uuid-rni.md
    ├── ADR-002-migration-organization-vers-institution.md
    ├── ADR-003-vue-compatibilite-person.md
    └── ADR-004-modele-permission-entite-action.md
```

---

## 3. Décisions déjà actées (à formaliser dans les documents ci-dessus)

| Décision | Statut |
|---|---|
| `institution` (RNI) ≠ `organization` (futur RNSO) — deux concepts distincts, pas une migration 1:1 | Acté |
| `institution` = entité étatique reconnue (Présidence, Primature, Ministère, Province, Parlement, Justice, organe de contrôle) | Acté |
| `organization` (futur) = structure interne rattachée à une institution (cabinet, secrétariat général, direction, division, bureau) | Acté |
| Conservation des UUID lors de toute migration de données (l'UUID est l'identité logique de l'entité, indépendante de la table) | Acté |
| Identifiant à 3 niveaux par entité : UUID technique + code métier (ex. `PRESIDENCE`) + identifiant canonique (ex. `urn:rdc:rni:presidence`) | Acté en principe, à détailler dans FOUNDATION-003 |
| Les 80 lignes actuelles de `organization` sont, à ce jour, **toutes** des institutions au sens RNI (aucune structure interne encore modélisée) | Vérifié empiriquement (§1) |
| Ne pas migrer les données maintenant : `server.js` et plusieurs tables (`instruction`, `rapport`, etc.) dépendent encore du schéma actuel | Acté |

---

## 4. Feuille de route immédiate (priorités concrètes, dans l'ordre)

### Étape 1 — FOUNDATION-002 : Métamodèle National *(priorité absolue)*
Le document fondateur. Doit définir, pour chacun des concepts suivants : définition, rôle, cycle de vie, identifiant métier, relations, contraintes, référentiel d'appartenance, exemples.
- Institution
- Organisation (structure interne)
- Structure organisationnelle
- Poste
- Affectation
- Personne
- Document
- Processus
- Événement
- Référentiel

Schéma relationnel à inclure :
```
État
 └── Institution (RNI)
      ├── possède une Organisation (RNSO)
      │      └── contient des Structures
      │             └── contiennent des Postes
      │                    └── occupés par des Affectations
      │                           └── concernant des Personnes
      └── exerce des Compétences
```

### Étape 2 — FOUNDATION-003 : RNI (Référentiel National des Institutions)
Définition précise du périmètre : Présidence, Primature, Ministères, Provinces, Parlement, Justice, organes de contrôle. Règle d'appartenance (qu'est-ce qui est/n'est pas une institution).

### Étape 3 — FOUNDATION-004 : RNSO (Référentiel National des Structures Organisationnelles)
Définition du futur contenu de `organization` : cabinet, secrétariat général, direction, division, bureau. Règle de rattachement obligatoire à une institution.

### Étape 4 — ADR-001 : Conservation des UUID lors de la migration RNI
Documente la décision technique déjà actée (§3), avec justification (audit, source unique de vérité, migration incrémentale).

### Étape 5 — ADR-002 : Migration organization → institution
Contenu technique complet : conservation des UUID, conservation de la hiérarchie (`parent_id` → `institution_parent_id`), mapping des types (`organization_type` table de lookup → `type_institution` TEXT), compatibilité ascendante, stratégie de retour arrière.

### Étape 6 — Script d'analyse (pas de migration)
Objectif : confirmer par une requête que les 80 lignes de `organization` sont bien exhaustivement classifiables comme institutions, sans exception. (Premier jet déjà exécuté cette session — à formaliser et conserver dans `docs/`.)

### Étape 7 — Script de migration de données
Écrit, relu, versionné dans le dépôt — **non exécuté** tant que :
- le code (`server.js`, `aiAgent.js`) n'est pas prêt à lire `institution` à la place d'`organization` ;
- les tables dépendantes (`instruction`, `rapport`, `controle`, `recommandation`, `decision`, `systeme_externe`) n'ont pas de plan de migration propre pour leurs colonnes `*_org_id` ;
- une stratégie de retour arrière est définie et testée.

### Étape 8 — Migration exécutée + Bloc 3 technique
Reprise du patch de `server.js`/`aiAgent.js` une fois les étapes 1-7 validées, avec la même discipline que pour le Bloc 1 (correctif minimal → node --check → double run → comparaison → commit ciblé).

---

## 5. Ce qui reste hors périmètre immédiat (rappel, ne pas anticiper)

- Bloc 1 restant : migration de `/api/me` (lignes 187-191 de la baseline, encore sur `person`/`person_role`)
- Dette `audit_log.person_id` (contournement en place, FK non résolue)
- Blocs 4 (Governance, 6 tests en échec) et 5 (NoCode) — inchangés, à traiter après stabilisation du modèle Institution/Organisation
- Programmes stratégiques 5 à 15 du document PNGIE 2040 (identité numérique, IA gouvernementale, portails, interopérabilité...) — hors échelle de cette session, à reprendre une fois la Phase 1 (Fondations) close

---

## 6. Discipline de travail (rappel, inchangée)

1. Modification minimale
2. `node --check`
3. Deux exécutions complètes des tests
4. Comparaison à la baseline (`Compare-Object`, hors `duration_ms`)
5. Ne documenter/committer que si les deux runs convergent
6. `git add` ciblé, jamais `git add .`
7. Pour toute décision de modélisation : FOUNDATION avant ADR avant script avant exécution

---

## 7. Prochaine action immédiate

Rédiger **FOUNDATION-002 (Métamodèle National)**. C'est le document bloquant : tant qu'il n'existe pas, aucune migration de données ni modification de `server.js` ne devrait être entreprise sur le sujet Institution/Organisation.
