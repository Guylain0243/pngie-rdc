# FOUNDATION-004 — Référentiel National des Structures Organisationnelles (RNSO)

**Statut :** Proposé — en attente de validation
**Date :** 2026-09-05
**Type :** Document fondateur (stable)
**Dépend de :** FOUNDATION-002 (Métamodèle National, fiches 4.2 à 4.5), FOUNDATION-003 (RNI)
**Portée :** Ce document définit le fonctionnement interne des institutions — comment chaque institution du RNI est structurée, organisée et dotée de postes occupés par des personnes.

**Constat préalable important :** contrairement au RNI (FOUNDATION-003), le RNSO ne s'appuie sur aucune donnée existante. L'analyse exhaustive du 2026-09-05 a confirmé qu'aucune des 80 lignes actuelles de la table technique `organization` ne correspond à ce concept. Ce document pose donc un modèle à construire, pas un modèle à documenter après coup.

---

## 1. Objectif du RNSO

Le RNSO complète le RNI selon une séparation stricte des responsabilités :

```
RNI   → décrit QUI compose l'État (les institutions)
RNSO  → décrit COMMENT chaque institution est organisée en interne
```

Sans RNSO, toute tentative de modéliser un organigramme interne (cabinet, direction, service) forcerait soit une duplication dans le RNI (violant le principe « une seule source de vérité », FOUNDATION-002 §2), soit l'absence pure et simple de cette information dans le système.

---

## 2. Définition d'une Organisation

**Source unique de la définition : FOUNDATION-002 §4.2.** Ce document n'en reprend pas la définition — il en détaille l'application concrète (structure interne, rattachement, gouvernance).

Rappel synthétique (non normatif, voir FOUNDATION-002 pour le texte de référence) : une Organisation est une subdivision interne d'une Institution, sans existence juridique autonome — elle agit exclusivement au nom et pour le compte de l'Institution qui la porte, contrairement à l'Institution elle-même qui peut exister seule (voir FOUNDATION-003).

---

## 3. Relation Institution → Organisation

```
Institution (RNI)
      │
      │ 1 institution possède 0..N organisations
      ▼
Organisation (RNSO)
```

**Règle de rattachement obligatoire :** toute Organisation référence exactement une Institution (`institution_id` non nul, contrainte technique à imposer dès la création du schéma). Une Organisation ne peut jamais exister sans Institution porteuse — contrairement à une Institution elle-même, qui peut être une racine (voir FOUNDATION-003 §3, les 4 racines de niveau 0).

**Cas des organisations transversales :** si une organisation sert plusieurs institutions à la fois (rare mais possible, ex. un secrétariat mutualisé), le modèle par défaut est de la rattacher à l'institution qui en a la responsabilité administrative principale, avec une relation fonctionnelle secondaire vers les autres (mécanisme à définir, cf. le point ouvert FOUNDATION-003 §3 sur les relations fonctionnelles vs. institutionnelles — le même principe de séparation s'applique ici).

---

## 4. Structure organisationnelle

Une **Structure organisationnelle** est une unité de travail au sein d'une Organisation.

```
Organisation
      │
      │ 1 organisation contient 0..N structures
      ▼
Structure organisationnelle
      │
      │ une structure peut avoir une structure parente (hiérarchie interne)
      ▼
Structure organisationnelle (enfant)
```

Niveaux typiques observés dans l'administration publique congolaise (à valider et affiner avec le métier) :
- Direction
- Division
- Service
- Bureau
- Cellule

Le nombre de niveaux n'est pas fixé a priori dans le modèle — chaque Organisation peut avoir une profondeur différente selon sa taille et sa complexité (un petit cabinet peut n'avoir qu'un seul niveau, une grande direction peut en avoir trois ou quatre).

---

## 5. Unités organisationnelles

*(Note : ce terme recouvre, dans le métamodèle FOUNDATION-002, le même concept que « Structure organisationnelle » ci-dessus. Il est conservé ici comme synonyme le temps de stabiliser la terminologie officielle — un seul terme devra être retenu avant validation finale de ce document, pour éviter toute ambiguïté dans le RNSO.)*

---

## 6. Postes

Un **Poste** est une position fonctionnelle définie au sein d'une Structure organisationnelle (ou, à défaut, directement d'une Organisation pour les structures très simples), indépendante de la personne qui l'occupe.

```
Structure organisationnelle
      │
      │ 1 structure définit 0..N postes
      ▼
Poste
```

Un Poste porte :
- un intitulé (ex. « Directeur des Ressources Humaines ») ;
- un niveau hiérarchique ;
- éventuellement des responsabilités et pouvoirs associés (à articuler avec le référentiel des permissions, RNPERM, hors périmètre de ce document).

Un Poste peut être vacant à un instant donné — l'absence d'occupant ne supprime pas le Poste (cf. FOUNDATION-002, fiche 4.4).

---

## 7. Affectations

Une **Affectation** est la relation datée entre une Personne (RNP) et un Poste, matérialisant l'occupation effective.

```
Personne (RNP)  ──────  Affectation  ──────  Poste (RNSO)
                  (datée, historisée)
```

Règles :
- Une Affectation a toujours une date de début ; une date de fin est optionnelle (affectation en cours si nulle).
- Deux Affectations actives simultanées sur le même Poste sont interdites, sauf intérim explicitement modélisé (mécanisme à définir).
- Aucune suppression physique d'une Affectation : seule une clôture (renseignement de la date de fin) est permise, pour préserver l'historique complet des mouvements.

Ce mécanisme est détaillé plus en profondeur dans FOUNDATION-002 (fiche 4.5) ; ce document n'en reprend que l'articulation avec le RNSO.

---

## 8. Relations avec le RNI

Résumé de la chaîne complète, du RNI au RNSO :

```
RNI                    RNSO
─────                  ──────────────────────────────────
Institution
   │
   └── Organisation
          │
          └── Structure organisationnelle
                 │
                 └── Poste
                        │
                        └── Affectation ── Personne (RNP)
```

**Principe de non-duplication :** aucune information sur une Institution (RNI) ne doit être dupliquée dans une Organisation. Par exemple, le nom officiel, le type institutionnel ou le statut juridique restent uniquement dans le RNI ; l'Organisation ne porte que ce qui lui est propre (son propre nom interne, sa propre structure).

---

## 9. Règles de gouvernance du RNSO

1. **Création d'une Organisation** : nécessite de désigner explicitement l'Institution porteuse (aucune création orpheline possible).
2. **Suppression/réorganisation** : plus souple que pour une Institution (RNI) — relève d'une décision interne à l'Institution, sans nécessiter d'acte juridique externe. Les Postes et Affectations rattachés doivent être traités (clôturés ou réaffectés) avant suppression d'une Structure.
3. **Historisation** : toute réorganisation interne (fusion de directions, création de nouveaux services) doit être tracée comme un Événement (RNAUD), pas comme une simple modification silencieuse.
4. **Cohérence avec le RNI** : si une Institution est supprimée ou fusionnée (acte officiel), toutes ses Organisations doivent être explicitement traitées (transfert vers la nouvelle Institution ou clôture) — jamais laissées orphelines silencieusement.

---

## 10. Exemple complet (illustratif, à construire réellement lors de la mise en œuvre)

```
RNI : Ministère de la Santé (institution_id = <uuid>, type = MINISTERE)
│
└── RNSO : Organisation principale du Ministère de la Santé
       │
       ├── Structure : Cabinet du Ministre
       │      └── Poste : Directeur de Cabinet
       │             └── Affectation : Personne X, du 2024-01-01 à aujourd'hui
       │
       ├── Structure : Secrétariat Général
       │      └── Structure : Direction des Ressources Humaines
       │             └── Poste : Directeur des Ressources Humaines
       │                    └── Affectation : Personne Y, du 2023-06-01 à aujourd'hui
       │
       └── Structure : Inspection Générale
              └── Poste : Inspecteur Général
                     └── Affectation : (vacant depuis 2026-03-01)
```

---

## 11. Actions ouvertes avant validation finale

- [ ] Trancher la terminologie « Structure organisationnelle » vs « Unité organisationnelle » (voir §5) — retenir un seul terme officiel
- [ ] Définir le mécanisme de rattachement pour les organisations transversales/mutualisées (voir §3)
- [ ] Définir le mécanisme d'intérim pour les Affectations (voir §7)
- [ ] Articuler ce document avec le futur RNPERM (référentiel des permissions) pour la définition des pouvoirs associés à un Poste (voir §6)
- [ ] Valider avec le métier les niveaux typiques de Structure organisationnelle (Direction/Division/Service/Bureau/Cellule) proposés au §4

---

## 12. Ce que ce document ne couvre pas

- Le détail des permissions et pouvoirs associés aux Postes → futur **FOUNDATION-00X (RNPERM)**
- La stratégie technique de création du schéma RNSO (nouvelles tables, migration éventuelle de la table `organization` existante) → **ADR** à venir, une fois ce document validé
- Le référentiel des Personnes lui-même → FOUNDATION-002 fiche 4.6, RNP

---

## 13. Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente — actions ouvertes du §11 à lever |
| Validation technique | *(à compléter)* | | En attente |
