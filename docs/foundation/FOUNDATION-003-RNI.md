# FOUNDATION-003 — Référentiel National des Institutions (RNI)

**Statut :** Proposé — en attente de validation
**Date :** 2026-09-05
**Type :** Document fondateur (stable)
**Dépend de :** FOUNDATION-002 (Métamodèle National), fiche 4.1 « Institution »
**Portée :** Ce document définit le périmètre exact du concept d'Institution, son vocabulaire contrôlé (types), sa structure hiérarchique de référence, et les règles d'appartenance au RNI.

---

## 1. Objet du document

Le RNI est le référentiel officiel et unique des institutions de l'État congolais. Ce document répond à la question : **qu'est-ce qui appartient au RNI, et selon quelle organisation ?**

Il s'appuie sur une analyse exhaustive des données existantes (voir `docs/SPRINT_2E_RNI_ANALYSE_EXHAUSTIVE.txt`, 2026-09-05), pas sur une hypothèse théorique.

---

## 2. Vocabulaire contrôlé des types d'institution

Huit types sont actuellement recensés. Ce vocabulaire est fermé : tout nouveau type doit faire l'objet d'un ADR avant d'être ajouté.

| Code | Libellé | Nombre d'occurrences vérifiées |
|---|---|---|
| `PRESIDENCE` | Présidence | 1 |
| `PRIMATURE` | Primature | 1 |
| `MINISTERE` | Ministère | 42 |
| `PROVINCE` | Province | 26 |
| `PARLEMENT` | Chambre du Parlement | 2 (Sénat, Assemblée Nationale) |
| `INSTITUTION_CONTROLE` | Institution d'appui et de contrôle | 5 |
| `COUR_CONSTITUTIONNELLE` | Cour Constitutionnelle | 1 |
| `COUR_CASSATION` | Cour de Cassation | 1 |
| `CONSEIL_ETAT` | Conseil d'État | 1 |

**Total : 80 institutions**, toutes au statut `ACTIF` (aucune institution suspendue ou supprimée à ce jour).

---

## 3. Structure hiérarchique de référence

L'analyse exhaustive du 2026-09-05 confirme une hiérarchie à **4 racines indépendantes** (niveau 0), et non une racine unique. Ceci reflète la séparation des pouvoirs de l'État :

```
Niveau 0 (racines, parent_id = null) — 4 institutions
│
├── Présidence de la République          (PRESIDENCE)
│     │
│     └── Niveau 1 — rattachées à la Présidence
│           ├── Primature                (PRIMATURE)
│           │     │
│           │     └── Niveau 2 — rattachés à la Primature
│           │           ├── 42 Ministères        (MINISTERE)
│           │           └── 26 Provinces         (PROVINCE)
│           ├── Sénat                     (PARLEMENT)
│           └── Assemblée Nationale        (PARLEMENT)
│
├── Cour Constitutionnelle                (COUR_CONSTITUTIONNELLE) — racine indépendante
├── Cour de Cassation                     (COUR_CASSATION) — racine indépendante
└── Conseil d'État                        (CONSEIL_ETAT) — racine indépendante
```

Répartition par niveau : niveau 0 → 4 institutions ; niveau 1 → 34 institutions ; niveau 2 → 42 institutions.

**Rattachement vérifié des 5 `INSTITUTION_CONTROLE`** (confirmé le 2026-09-05, toutes rattachées directement à la Présidence) :

| Code | Nom |
|---|---|
| `CTRL_0` | Cour des Comptes |
| `CTRL_1` | Inspection Générale des Finances (IGF) |
| `CTRL_2` | Inspection Générale de l'Administration (IGA) |
| `CTRL_3` | CENI |
| `CTRL_4` | ANR |

**Rattachement vérifié des 26 Provinces et des 42 Ministères** : les deux ensembles sont, sans exception, rattachés à la Primature (`PRIMATURE`). Aucune province ni aucun ministère n'a de rattachement différent.

**Point ouvert restant (question métier, pas technique) :** le rattachement des Provinces à la Primature reflète l'organisation actuelle des données, héritée de l'ancien modèle `organization`. Il reste à confirmer avec le métier si cela correspond à l'organisation constitutionnelle réelle de la RDC (décentralisation territoriale), ou si les Provinces devraient à terme relever d'un rattachement distinct (par exemple directement de la Présidence, en miroir du Parlement). Cette question n'affecte pas la validité du RNI en tant que tel, mais mérite d'être tranchée avant toute automatisation de règles métier fondées sur cette hiérarchie (ex. permissions en cascade, agrégations budgétaires).

---

## 4. Règle d'appartenance au RNI

Une entité appartient au RNI si et seulement si elle remplit les trois conditions cumulatives suivantes (cf. FOUNDATION-002 §4.1) :

1. Elle est créée par un acte juridique officiel (Constitution, loi, décret, ordonnance) — pas par une simple décision administrative interne ;
2. Elle dispose d'une existence institutionnelle propre, reconnaissable indépendamment des personnes qui la dirigent ;
3. Elle n'est pas une simple subdivision de travail interne à une autre entité déjà présente au RNI (auquel cas elle relève du RNSO — voir FOUNDATION-004).

**Test de démarcation utilisé lors de l'analyse du 2026-09-05 :** recherche des mots-clés `cabinet`, `direction`, `division`, `bureau`, `secrétariat`, `service` dans les noms des 80 entités actuelles — résultat vide. Ce test négatif confirme qu'aucune des 80 entités actuelles n'est une subdivision interne ; toutes satisfont la règle d'appartenance ci-dessus.

---

## 5. Identifiants (application du modèle FOUNDATION-002 §5)

| Niveau | Exemple concret vérifié |
|---|---|
| UUID technique | `4ca68a3d-ad19-4a65-a019-b68a7c34c37c` (Présidence) |
| Code métier | `PRESIDENCE` |
| Identifiant canonique (URN) | `urn:rdc:rni:presidence` *(convention proposée, à valider)* |

---

## 6. Actions ouvertes avant validation finale

- [x] Confirmer nommément le rattachement hiérarchique exact des 5 `INSTITUTION_CONTROLE` — fait, voir §3
- [ ] **Décision métier requise** : confirmer si le rattachement Provinces → Primature reflète l'organisation constitutionnelle réelle de la RDC, ou s'il s'agit d'un raccourci technique hérité de l'ancien modèle `organization` (voir §3, point ouvert restant)
- [ ] Valider la convention d'URN proposée (`urn:rdc:rni:<code-en-minuscules>`)
- [ ] Décider si ce document doit également couvrir les ETD (Entités Territoriales Décentralisées) mentionnées dans le vocabulaire PNGIE 2040, absentes des 80 lignes actuelles

---

## 7. Ce que ce document ne couvre pas

- Les structures internes rattachées à une institution → **FOUNDATION-004 (RNSO)**
- La stratégie technique de migration des données `organization` → `institution` → **ADR-002**
- Les champs de contact/localisation (adresse, téléphone, coordonnées GPS), déjà présents dans le schéma technique `institution` mais non couverts métier ici

---

## 8. Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente — actions ouvertes du §6 à lever |
| Validation technique | *(à compléter)* | | En attente |
