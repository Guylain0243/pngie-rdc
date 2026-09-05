# FOUNDATION-001 — Vision du PNGIE

**Statut :** Proposé — formalisation de docs/vision/00_VISION_PROJET.md et 01_FEUILLE_DE_ROUTE.md, déjà canoniques.
**Date :** 2026-09-05
**Type :** Document fondateur (stable) — voir FOUNDATION-000 pour la distinction FOUNDATION/ADR.
**Portée :** Ce document cadre le sens et la raison d'être du PNGIE. Toute la chaîne FOUNDATION-002 à 009 en découle.

**Dette résolue :** FOUNDATION-002 signalait que ce document 'n'est pas encore formalisée en FOUNDATION-001'.
Le contenu existait déjà dans docs/vision/00_VISION_PROJET.md et 01_FEUILLE_DE_ROUTE.md ; ce document
les reprend fidèlement selon le gabarit FOUNDATION, sans en changer le sens.

---

## 1. Objectif du document

Fixer, avant toute définition conceptuelle (FOUNDATION-002 et suivants),
la raison d'être du PNGIE : ce qu'il vise à accomplir, les problèmes
qu'il résout, et les principes qui guident toutes les décisions
d'architecture ultérieures.

---

## 2. Mission du PNGIE

PNGIE-RDC est un système d'information destiné aux institutions
publiques de la République Démocratique du Congo. Il vise à fournir
une plateforme commune permettant à différentes institutions —
ministères, provinces, services territoriaux — de gérer leurs
données, leurs processus et leurs décisions de manière sécurisée,
traçable et interopérable.

---

## 3. Problèmes que le projet résout

- Dispersion des données entre institutions, sans référentiel commun.
- Absence de traçabilité fiable des décisions et actions administratives.
- Difficulté à faire collaborer plusieurs institutions sur un même dossier ou processus.
- Manque d'outils numériques modernes, sécurisés et adaptés au contexte institutionnel congolais.

---

## 4. Grands principes directeurs

| Principe | Définition |
|---|---|
| **Sécurité** | Authentification forte, contrôle d'accès par rôle (RBAC), cloisonnement des données par institution (RLS). |
| **Traçabilité** | Toute action significative est journalisée (journal d'audit), aucune donnée n'est modifiée silencieusement. |
| **Modularité** | Le système est conçu pour accueillir de nouveaux domaines métier (finances publiques, cadastre, marchés publics, etc.) sans reconstruction complète. |
| **Interopérabilité** | Le système doit pouvoir s'intégrer avec d'autres systèmes existants ou futurs, plutôt que de fonctionner en silo. |

Ces quatre principes ne sont pas de simples intentions : ils motivent
directement des choix déjà actés dans les FOUNDATION suivants — par
exemple, le principe de Traçabilité est ce qui impose qu'aucune
Affectation (FOUNDATION-007 §2.6) ne soit jamais supprimée
physiquement, seulement clôturée.

---

## 5. Relation avec la feuille de route (01_FEUILLE_DE_ROUTE.md)

La Vision (ce document) répond à *pourquoi*. La feuille de route
(docs/vision/01_FEUILLE_DE_ROUTE.md) répond à *comment, et dans quel
ordre* : elle décline la mission en 3 programmes stratégiques
(Sécurité, Gouvernance, Gestion), puis en 10 étapes séquencées, avec
un principe directeur explicite : chaque étape s'appuie sur la
précédente, sans anticiper prématurément sur les suivantes.

Ce document (FOUNDATION-001) est stable et ne devrait changer que
rarement. La feuille de route, elle, est mise à jour au fil de
l'avancement du projet.

---

## 6. Relation avec les autres FOUNDATION

`
FOUNDATION-001  Vision (pourquoi)
      |
      v
FOUNDATION-002  Metamodele (avec quels concepts)
      |
      v
FOUNDATION-003  RNI
FOUNDATION-004  RNSO
FOUNDATION-005  Identite Numerique
FOUNDATION-006  RNP
FOUNDATION-007  RNPST
FOUNDATION-008  RBAC (a venir)
FOUNDATION-009  RLS (a venir)
`

FOUNDATION-001 ne définit aucun concept technique — il cadre le sens.
Toute décision d'architecture qui semblerait contredire les principes
du §4 (par exemple, une fonctionnalité qui affaiblirait la
traçabilité) doit être considérée comme une alerte, pas comme un
simple choix technique parmi d'autres.

---

## 7. Hors périmètre de ce document

Ce document ne couvre pas :
- Le détail des concepts métier -> **FOUNDATION-002 et suivants**
- Le calendrier précis d'exécution -> **docs/vision/01_FEUILLE_DE_ROUTE.md**
- Les décisions de gouvernance, budget ou organisation liées au déploiement national -> hors du périmètre d'une équipe de développement, voir note dans 01_FEUILLE_DE_ROUTE.md

---

## 8. Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente |
| Validation technique | *(à compléter)* | | En attente |
