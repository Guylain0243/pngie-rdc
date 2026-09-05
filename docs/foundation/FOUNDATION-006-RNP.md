# FOUNDATION-006 — Référentiel National des Personnes (RNP)

**Statut :** Proposé — en attente de validation
**Date :** 2026-09-05
**Type :** Document fondateur (stable)
**Dépend de :** FOUNDATION-002 (Métamodèle National, fiche 4.6 « Personne »), FOUNDATION-003 (RNI), FOUNDATION-004 (RNSO)
**Précède (dans l'ordre des dépendances réelles) :** FOUNDATION-005 (Identité Numérique) et FOUNDATION-007 (RNPST, Postes) s'appuient sur les concepts posés ici — voir §7 sur la réorganisation de l'ordre de dépendance.

---

## 1. Mission

Le RNP est le référentiel officiel et unique des personnes physiques manipulées par le PNGIE.

**Principe fondamental : une personne n'est créée qu'une seule fois dans le système, et conserve son identité indépendamment de tout emploi, institution ou compte informatique.**

Ce document ne décrit pas une table technique — il fixe la définition métier de l'identité humaine dans le PNGIE, dont la table `personne` n'est qu'une implémentation.

---

## 2. Les concepts fondamentaux

Le RNP distingue strictement cinq concepts que la plupart des systèmes administratifs finissent par confondre :

```
Personne
    │
    ├── peut devenir Agent public
    │
    ├── peut disposer d'un Compte numérique
    │
    ├── peut recevoir une ou plusieurs Affectations
    │
    └── peut exercer un ou plusieurs Rôles
```

### 2.1 Personne

Un être humain. Elle existe indépendamment d'un emploi, d'une institution ou d'un compte informatique. Une Personne reste la même personne toute sa vie, quels que soient les postes qu'elle occupe ou quitte.

### 2.2 Agent public

Qualité administrative qu'une Personne acquiert lorsqu'elle reçoit une Affectation à un Poste au sein d'une Institution (RNI) via une Organisation (RNSO). **L'agent n'est pas une nouvelle personne** — c'est un rôle que la Personne endosse, réversible (fin d'affectation, retraite).

### 2.3 Utilisateur

Une Personne autorisée à utiliser le PNGIE. Toutes les Personnes ne sont pas nécessairement Utilisateurs (une Personne peut être enregistrée au RNP — par exemple comme partenaire ou expert externe — sans jamais se connecter au système), et tous les Agents publics ne sont pas nécessairement Utilisateurs actifs.

### 2.4 Compte

Entité purement technique, support de l'authentification (voir FOUNDATION-005 §6). Contient login, mot de passe, MFA, certificats, état, dates. Un Compte peut être suspendu, réinitialisé ou supprimé — **la Personne continue d'exister indépendamment de ces événements techniques.**

### 2.5 Rôle

Ensemble d'autorisations accordées à une Personne (généralement via son Compte et son Affectation). Détaillé dans le futur FOUNDATION-008 (RBAC National) — ce document se limite à situer le Rôle dans la chaîne conceptuelle.

### 2.6 Affectation

Lien daté entre une Personne, un Poste (RNPST) et une période — déjà défini en détail dans FOUNDATION-002 fiche 4.5. Rappelé ici car central à la distinction Personne/Agent public.

---

## 3. Schéma relationnel complet

```
                    Personne
                       │
        ┌──────────────┼──────────────┐
        │                              │
  Agent Public                   Utilisateur
        │                              │
        │ (via Affectation)            │ (via Compte)
        │                              │
   Poste (RNPST)                    Compte
        │                              │
   Institution (RNI)              Rôle(s)
   via Organisation (RNSO)
```

**Note de lecture :** Agent public et Utilisateur sont deux qualités indépendantes d'une même Personne — une Personne peut être l'un sans l'autre (un agent public récemment recruté sans compte encore créé ; un utilisateur externe au système sans être agent, ex. un partenaire consultant un portail public).

---

## 4. Cycle de vie

```
Personne (créée une seule fois)
      │
      ▼
Recrutement ─────────────► (si non-recrutement : reste Personne simple,
      │                      éventuellement Utilisateur externe)
      ▼
Agent public
      │
      ▼
Affectation (à un Poste, une Institution)
      │
      ▼
Création du Compte
      │
      ▼
Utilisateur actif
      │
      ▼
Suspension (temporaire — congé, sanction, enquête)
      │
      ▼
Retraite / Fin de fonction
      │
      ▼
Archivage du Compte ──────► Le Compte disparaît (techniquement clos).
                              La Personne reste (RNP conserve l'historique complet).
```

**Règle de non-suppression :** aucune étape de ce cycle ne supprime la Personne elle-même. Seuls le Compte et l'Affectation peuvent être clos — cohérent avec FOUNDATION-002 fiches 4.5 et 4.6 (pas de suppression physique, préservation de l'historique).

---

## 5. Principes de gouvernance

1. **Une Personne, une seule identité** — dédoublonnage obligatoire au RNP.
2. **Une Personne, plusieurs Affectations possibles** — successives dans le temps, ou exceptionnellement simultanées si justifié (ex. intérim, cumul de fonctions autorisé).
3. **Une Personne, plusieurs Postes possibles dans le temps** — l'historique complet est conservé via les Affectations.
4. **Une Personne, un Compte dans le cas général** — plusieurs Comptes uniquement dans des cas exceptionnels et justifiés (environnements techniques distincts, exigences spécifiques), avec une gouvernance explicite à documenter au cas par cas. *(Point ouvert — voir §8.)*
5. **Le Compte n'est jamais la Personne** — un Compte suspendu, réinitialisé ou supprimé ne dit rien de l'existence ou du statut de la Personne elle-même.

---

## 6. Identifiants (application du modèle FOUNDATION-002 §5 / FOUNDATION-005 §2)

| Type d'identifiant | Description |
|---|---|
| `personne_id` (UUID technique) | Clé primaire, conservée à l'identique lors de toute migration |
| Matricule | Si Agent public — attribué à l'affectation, pas à la Personne elle-même |
| Numéro national | Si applicable et disponible (identité civile nationale) |
| Code métier | Non systématique pour une Personne (contrairement à une Institution) — le nom seul n'est jamais un identifiant fiable |
| Identifiant canonique (URN) | `urn:rdc:rnp:<identifiant-national>` si retenu — voir FOUNDATION-005 §2, action ouverte sur la disponibilité effective d'un identifiant national |

---

## 7. Relations avec les autres référentiels et réorganisation de l'ordre de dépendance

Schéma de dépendance conceptuelle corrigé (l'Identité Numérique s'appuie sur les Personnes, Postes et Institutions — elle ne les précède pas) :

```
FOUNDATION-002 (Métamodèle)
      │
      ├── FOUNDATION-003 (RNI — Institutions)
      ├── FOUNDATION-004 (RNSO — Organisations)
      ├── FOUNDATION-006 (RNP — Personnes)          ← ce document
      └── FOUNDATION-007 (RNPST — Postes, à venir)
                     │
                     ▼
           FOUNDATION-005 (Identité Numérique)
```

**Action de cohérence à reporter sur FOUNDATION-005 :** l'en-tête de FOUNDATION-005 (rédigé avant ce document) ne reflète pas encore cette direction de dépendance. À corriger dans une prochaine révision de FOUNDATION-005 : ajouter FOUNDATION-006 et FOUNDATION-007 comme dépendances amont, pas comme documents « à venir » référencés en aval.

Articulation avec le RNSO (FOUNDATION-004) : une Affectation relie une Personne à un Poste, lui-même rattaché à une Structure organisationnelle d'une Organisation d'une Institution — la chaîne complète RNI→RNSO→RNPST→RNP est déjà posée dans FOUNDATION-004 §8, ce document n'en reprend que la perspective côté Personne.

---

## 8. Conséquences pour l'implémentation (sans détailler les migrations elles-mêmes)

- `personne` devient la source unique de vérité pour l'identité humaine.
- Les vues de compatibilité (`person`, actuellement maintenue dans le code pour compatibilité API) ne sont qu'une étape transitoire, à documenter par un ADR dédié (ADR-003, déjà anticipé dans la feuille de route du 2026-09-05) et à supprimer une fois tous les consommateurs migrés.
- Les services d'authentification (login, déjà migré vers `personne`/`personne_role`), d'audit (dette `audit_log.person_id` documentée dans FOUNDATION-002 fiche 4.9) et de gestion des rôles doivent progressivement converger vers ce modèle.
- `/api/me`, non encore migré à ce jour, devra s'appuyer explicitement sur la distinction Personne/Agent public/Utilisateur/Compte posée dans ce document plutôt que de simplement recopier la logique de `/login`.

---

## 9. Actions ouvertes avant validation finale

- [ ] Trancher la gouvernance exacte des cas exceptionnels de Comptes multiples pour une même Personne (§5, principe 4)
- [ ] Confirmer la disponibilité effective d'un numéro d'identité nationale exploitable pour l'URN canonique (§6)
- [ ] Reporter la correction de dépendance sur FOUNDATION-005 (§7)
- [ ] Définir le mécanisme exact de dédoublonnage au RNP (règles de rapprochement en cas de doublon suspecté)

---

## 10. Ce que ce document ne couvre pas

- Le détail des Postes eux-mêmes → **FOUNDATION-007 (RNPST, à venir)**
- Le détail des Rôles et permissions → **FOUNDATION-008 (RBAC National, à venir)**
- Les mécanismes techniques d'authentification, MFA, PKI, signature → **FOUNDATION-005 (Identité Numérique)**
- La stratégie technique précise de suppression de la vue de compatibilité `person` → **ADR-003 (à venir)**

---

## 11. Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente — actions ouvertes du §9 à lever |
| Validation technique | *(à compléter)* | | En attente |
