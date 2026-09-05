# FOUNDATION-002 — Métamodèle National du PNGIE

**Statut :** Proposé — en attente de validation. Revue d'architecture effectuée le 2026-09-05 (cohérence terminologique et relationnelle avec FOUNDATION-003/004 vérifiée).
**Date :** 2026-09-05
**Type :** Document fondateur (stable) — voir FOUNDATION-000 pour la distinction FOUNDATION/ADR
**Dépendance résolue :** ce document présupposait une vision d'ensemble du PNGIE, désormais formalisée en FOUNDATION-001 (Vision), voir docs/foundation/FOUNDATION-001-Vision.md.
**Portée :** Ce document définit le langage commun du PNGIE. Aucun développement, aucune migration de données, aucune décision de schéma ne devrait s'écarter des définitions ci-dessous sans passer par une révision explicite de ce document.

---

## 1. Objet du document

Le PNGIE RDC repose sur un principe simple mais structurant : **une donnée de référence n'existe qu'une seule fois**. Pour que ce principe soit applicable, il faut d'abord que les concepts eux-mêmes soient définis sans ambiguïté, indépendamment de toute implémentation technique.

Ce document est le « code civil » du PNGIE : il fixe les définitions officielles des concepts fondamentaux, leurs relations, et les règles qui les gouvernent. Les référentiels nationaux (RNI, RNSO, RNP, etc., voir FOUNDATION-003 et suivants) sont des applications concrètes de ce métamodèle.

---

## 2. Principe fondamental

```
Une donnée  →  Une seule source  →  Un seul référentiel
```

Corollaire : deux enregistrements représentant la même réalité dans deux tables différentes constituent une violation du métamodèle, sauf si l'une des deux est explicitement une **vue de compatibilité** documentée par un ADR (voir par exemple la vue `person` maintenue pour compatibilité API pendant la transition vers `personne`).

---

## 3. Schéma relationnel global

```
État (RDC)
 │
 └── Institution                    (RNI — FOUNDATION-003)
      │
      ├── possède une Organisation  (RNSO — FOUNDATION-004)
      │        │
      │        └── contient des Structures organisationnelles
      │                 │
      │                 └── contiennent des Postes
      │                          │
      │                          └── occupés par des Affectations
      │                                   │
      │                                   └── concernant des Personnes
      │
      └── exerce des Compétences

Transversal à toute la hiérarchie ci-dessus :
      Document      (attaché à une Institution, une Organisation, un Processus...)
      Processus     (orchestre des actions impliquant Institutions/Personnes/Documents)
      Événement     (trace toute création/modification/suppression des entités ci-dessus)
      Référentiel   (le mécanisme lui-même : catalogue officiel d'un type d'entité)
```

---

## 4. Fiches conceptuelles

Chaque concept est décrit selon le même gabarit : **Définition · Rôle · Cycle de vie · Identifiant métier · Relations · Contraintes · Référentiel d'appartenance · Exemples**.

### 4.1 Institution

| | |
|---|---|
| **Définition** | Entité étatique reconnue par l'ordre juridique de la RDC, dotée d'une existence institutionnelle propre (constitutionnelle, légale ou réglementaire). |
| **Rôle** | Point d'ancrage de toute l'action publique : porte les compétences, la hiérarchie administrative, et sert de racine pour l'imputation budgétaire, documentaire et décisionnelle. |
| **Cycle de vie** | Création (loi, décret, ordonnance) → Activité → éventuelle Suspension/Fusion/Suppression (toujours par acte officiel, jamais par simple suppression technique). |
| **Identifiant métier** | Code court stable (ex. `PRESIDENCE`, `MIN_3`), voir §5 pour le modèle d'identification complet. |
| **Relations** | Une Institution peut avoir une Institution parente (`institution_parent_id`) ; possède zéro, une ou plusieurs Organisations. *Cette relation simple ne couvre pas toutes les nuances observées (coordination gouvernementale, tutelle administrative) — voir FOUNDATION-003 §3 pour l'approfondissement de ce point, actuellement en question ouverte.* |
| **Contraintes** | Une Institution ne peut pas être son propre parent (contrainte déjà présente dans le code, `rni-commandement-routes.js`). Le type (`type_institution`) doit appartenir à un vocabulaire contrôlé (voir FOUNDATION-003). |
| **Référentiel d'appartenance** | RNI — Référentiel National des Institutions. |
| **Exemples vérifiés dans les données actuelles** | Présidence, Primature, 42 ministères (ex. « Justice et Garde des Sceaux »), 26 provinces, Assemblée Nationale, Sénat, Cour Constitutionnelle, Cour de Cassation, Conseil d'État, 5 institutions d'appui et de contrôle. |

### 4.2 Organisation

| | |
|---|---|
| **Définition** | Subdivision interne d'une Institution, sans existence juridique autonome propre : elle agit au nom et pour le compte de l'Institution qui la porte. |
| **Rôle** | Structure le fonctionnement interne d'une Institution (répartition du travail, des responsabilités et des ressources humaines). |
| **Cycle de vie** | Création/suppression par décision interne de l'Institution (arrêté ministériel, note de service), plus souple que le cycle de vie d'une Institution. |
| **Identifiant métier** | Code interne, unique au sein de l'Institution porteuse (pas nécessairement unique au niveau national). |
| **Relations** | **Rattachement obligatoire à exactement une Institution** (`institution_id` non nul). Peut avoir une Organisation parente au sein de la même Institution. Contient des Structures organisationnelles. |
| **Contraintes** | Une Organisation ne peut pas exister sans Institution porteuse. Pas de rattachement direct à l'État. |
| **Référentiel d'appartenance** | RNSO — Référentiel National des Structures Organisationnelles. |
| **Exemples (à créer — aucun encore présent dans les données actuelles)** | Cabinet du Ministre, Secrétariat Général, Direction des Ressources Humaines, Inspection Générale, Cellule Juridique. |
| **Constat empirique (2026-09-05)** | L'analyse exhaustive des 80 lignes actuellement dans la table technique `organization` confirme qu'aucune ne correspond à ce concept : toutes représentent en réalité des Institutions au sens de la fiche 4.1. Le concept d'Organisation reste, à ce jour, non peuplé dans le système. |

### 4.3 Structure organisationnelle

| | |
|---|---|
| **Définition** | Unité de travail au sein d'une Organisation (division, bureau, service, cellule). |
| **Rôle** | Niveau de granularité le plus fin de l'organigramme interne, porte les Postes. |
| **Cycle de vie** | Lié au cycle de vie de l'Organisation parente ; peut évoluer indépendamment (réorganisation interne). |
| **Identifiant métier** | Code interne à l'Organisation. |
| **Relations** | Rattachement obligatoire à une Organisation ; peut avoir une Structure parente. Contient des Postes. |
| **Contraintes** | Pas de rattachement direct à une Institution — doit toujours transiter par une Organisation. |
| **Référentiel d'appartenance** | RNSO (sous-ensemble). |
| **Exemples** | Division des Affaires Administratives, Bureau du Courrier, Cellule Informatique. |

### 4.4 Poste

| | |
|---|---|
| **Définition** | Position fonctionnelle définie au sein d'une Structure organisationnelle (ou, à défaut, directement d'une Organisation), indépendante de la personne qui l'occupe. |
| **Rôle** | Porte les responsabilités, le niveau hiérarchique et, potentiellement, les permissions/pouvoirs associés à une fonction. |
| **Cycle de vie** | Création (organigramme approuvé) → Vacance/Occupation alternées → Suppression (réorganisation). |
| **Identifiant métier** | Code de poste, stable même quand la personne titulaire change. |
| **Relations** | Rattaché à une Structure (ou Organisation) ; occupé par zéro ou une Affectation active à un instant donné (un poste peut être vacant). |
| **Contraintes** | Un Poste ne « contient » pas une Personne directement — la relation passe toujours par une Affectation, pour garder l'historique. |
| **Référentiel d'appartenance** | RNPST — Référentiel National des Postes. |
| **Exemples** | Directeur des Ressources Humaines, Chef de Division, Secrétaire Général. |

### 4.5 Affectation

| | |
|---|---|
| **Définition** | Relation datée entre une Personne et un Poste, matérialisant l'occupation effective de ce poste par cette personne durant une période donnée. |
| **Rôle** | Permet de conserver l'historique complet des mouvements (nominations, mutations, fins de fonction) sans jamais perdre l'information passée. |
| **Cycle de vie** | Ouverture (date de début) → éventuelle clôture (date de fin) — jamais de suppression physique, seulement une clôture. |
| **Identifiant métier** | Technique (UUID) — pas de code métier naturel, l'identité est portée par le triplet (Personne, Poste, période). |
| **Relations** | Référence exactement une Personne et exactement un Poste. Plusieurs Affectations historiques peuvent exister pour un même Poste (successivement) ou une même Personne (au fil du temps). |
| **Contraintes** | Deux Affectations actives simultanées sur le même Poste sont interdites (sauf intérim explicitement modélisé). |
| **Référentiel d'appartenance** | RNA — Référentiel National des Affectations. |
| **Exemples** | « Jean Kabila, Directeur des RH, du 2023-01-01 au 2025-06-30 ». |

### 4.6 Personne

| | |
|---|---|
| **Définition** | Individu physique identifié dans le système, qu'il occupe ou non un poste au sein de l'administration. |
| **Rôle** | Support de l'identité pour l'authentification, les affectations, et la traçabilité (auteur d'une action, d'un document, d'une décision). |
| **Cycle de vie** | Création (enregistrement) → Activité → éventuelle désactivation (jamais de suppression physique pour préserver l'historique d'audit). |
| **Identifiant métier** | Identifiant national si disponible (à définir), sinon technique. |
| **Relations** | Peut avoir zéro, une ou plusieurs Affectations (successives ou, exceptionnellement, simultanées). |
| **Contraintes** | Une Personne physique ne doit être enregistrée qu'une seule fois dans le référentiel (dédoublonnage). |
| **Référentiel d'appartenance** | RNP — Référentiel National des Personnes. |
| **Statut technique actuel** | Migration `person` → `personne` en cours (Bloc 1 du Sprint 2E, login déjà migré ; `/api/me` restant à migrer). |

### 4.7 Document

| | |
|---|---|
| **Définition** | Tout objet documentaire officiel produit ou reçu dans le cadre de l'activité d'une Institution (décret, arrêté, rapport, courrier, décision). |
| **Rôle** | Support de traçabilité juridique et administrative. |
| **Cycle de vie** | Création → Validation/Signature → Diffusion → Archivage (jamais de suppression pour les documents officiels). |
| **Identifiant métier** | Numéro d'enregistrement officiel (ex. numéro de décret). |
| **Relations** | Émis par ou destiné à une Institution ; peut être lié à un Processus ou une Décision. |
| **Référentiel d'appartenance** | RND — Référentiel National Documentaire. |

### 4.8 Processus

| | |
|---|---|
| **Définition** | Séquence structurée d'étapes métier représentant un cas d'usage administratif reproductible. |
| **Rôle** | Cadre d'exécution des Workflows (nomination, mutation, création d'institution, vote budgétaire...). |
| **Cycle de vie** | Défini une fois (modélisation), instancié à chaque exécution. |
| **Relations** | Implique des Institutions, Personnes, Documents ; produit des Événements à chaque étape. |
| **Référentiel d'appartenance** | RNWF — Référentiel National des Workflows. |

### 4.9 Événement

| | |
|---|---|
| **Définition** | Trace normalisée et immuable d'un fait survenu dans le système (création, modification, suppression, action métier). |
| **Rôle** | Alimente le Journal national d'audit ; support de la traçabilité et de la conformité. |
| **Cycle de vie** | Émis une fois, jamais modifié ni supprimé. |
| **Relations** | Référence l'entité concernée et, si applicable, la Personne à l'origine de l'action. |
| **Référentiel d'appartenance** | RNAUD — Référentiel National d'Audit. |
| **Note technique actuelle** | La dette `audit_log.person_id` (FK vers l'ancienne table `person`) doit être résolue dans le cadre de cette définition — un Événement doit référencer une Personne du RNP actuel, pas un vestige du modèle legacy. |

### 4.10 Référentiel

| | |
|---|---|
| **Définition** | Le mécanisme lui-même : catalogue officiel, unique et faisant autorité, d'un type d'entité donné (Institutions, Personnes, Postes...). |
| **Rôle** | Garantit le principe fondamental du §2 : une seule source de vérité par type de donnée. |
| **Relations** | Chacun des concepts 4.1 à 4.9 appartient à exactement un Référentiel. |
| **Contraintes** | Un Référentiel ne duplique jamais les données d'un autre Référentiel — il les référence par identifiant. |

---

## 5. Modèle d'identification (3 niveaux)

Chaque entité des référentiels nationaux porte trois identifiants complémentaires :

| Niveau | Exemple | Rôle |
|---|---|---|
| UUID technique | `b8234179-67f0-46e1-976d-5300deb32a6f` | Clé primaire, intégrité relationnelle |
| Code métier | `PRESIDENCE` | Lisible, stable, utilisable dans les règles fonctionnelles |
| Identifiant canonique (URN) | `urn:rdc:rni:presidence` | Référence pérenne inter-systèmes, indépendante de la technologie |

**Règle de conservation :** lors de toute migration technique (changement de table, de moteur de base de données), l'UUID technique est conservé à l'identique. L'UUID représente l'identité logique de l'entité, pas un artefact de son stockage.

---

## 6. Hors périmètre de ce document

Ce document ne couvre pas :
- Le détail du vocabulaire contrôlé des types d'Institution → **FOUNDATION-003 (RNI)**
- Le détail du modèle RNSO et des règles de rattachement Organisation → Institution → **FOUNDATION-004 (RNSO)**
- L'identité numérique, l'authentification, la PKI → **FOUNDATION-005**
- La gouvernance des données (versioning, historisation) → **FOUNDATION-006**
- Les décisions techniques d'implémentation (schéma SQL, migration) → **ADR-001 et suivants**

---

## 7. Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente |
| Validation technique | *(à compléter)* | | En attente |
