# Sprint 2E — Préparation de la prochaine session

**Dernière session :** 2026-09-05
**État du dépôt à la clôture :** branche `feature/baseline-v2`, 12 commits locaux poussés, baseline 27 pass / 10 fail stable.

---

## Prochaine priorité

**FOUNDATION-007 — Référentiel National des Postes et Affectations (RNPST)**

Complète la chaîne conceptuelle :
```
Institution (RNI, FOUNDATION-003)
        │
Organisation (RNSO, FOUNDATION-004)
        │
Structure organisationnelle (RNSO, FOUNDATION-004)
        │
Poste (RNPST, FOUNDATION-007 — à rédiger)
        │
Affectation (RNPST, FOUNDATION-007 — à rédiger)
        │
Personne (RNP, FOUNDATION-006)
```

Une fois FOUNDATION-007 rédigé, la chaîne complète Institution → Personne sera documentée de bout en bout — base nécessaire avant d'aborder les modules RH, organigrammes, délégations et contrôle d'accès.

---

## Pré-requis (déjà satisfaits)

- ✔ FOUNDATION-002 — Métamodèle National
- ✔ FOUNDATION-003 — RNI
- ✔ FOUNDATION-004 — RNSO
- ✔ FOUNDATION-005 — Identité Numérique Nationale
- ✔ FOUNDATION-006 — RNP

---

## Questions ouvertes (héritées des sessions précédentes, à garder en tête)

- Séparation physique `personne` / `compte` (table `personne` mélange actuellement identité civile et champs techniques d'authentification) — candidat ADR-004
- Migration de données `organization` → `institution` (Bloc 3, en pause) — nécessite ADR-001 (migration) et ADR-002 (conservation UUID)
- Hiérarchie institutionnelle vs relations fonctionnelles (coordination, tutelle) — FOUNDATION-003 §3, action ouverte — candidat ADR-003
- Terminologie « Structure organisationnelle » vs « Unité organisationnelle » à trancher (FOUNDATION-004 §5)
- Correction de l'ordre de dépendance dans l'en-tête de FOUNDATION-005 (doit citer FOUNDATION-006/007 en amont, pas en aval) — signalé dans FOUNDATION-006 §7

---

## Ordre de reprise recommandé (après FOUNDATION-007)

1. FOUNDATION-008 — RBAC National
2. FOUNDATION-009 — RLS Nationale
3. FOUNDATION-010 — Workflow National
4. FOUNDATION-011 — Journal National
5. FOUNDATION-012 — Interopérabilité Nationale
6. ADR-001 à ADR-005 (application des principes FOUNDATION aux décisions techniques)
7. Retour au code : migration `organization` → `institution` (Bloc 3), séparation `personne`/`compte`, finalisation RBAC/RLS

---

## Rappel de discipline (inchangé)

Correctif minimal → `node --check` → 2 exécutions complètes des tests → `Compare-Object` (hors `duration_ms`) → ne documenter/committer que si les deux runs convergent → `git add` ciblé, jamais `git add .`.

Aucune évolution du schéma ou du code sans qu'elle puisse être rattachée explicitement à une Foundation validée.
