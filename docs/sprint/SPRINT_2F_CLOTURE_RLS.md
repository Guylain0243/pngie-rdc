# Sprint 2F — Clôture RLS

**Statut :** En cours.
**Date d'ouverture :** 2026-09-05
**Objectif :** clore définitivement le chantier RLS (validé sur `pngie_rdc_rls_test`, 77/77 tests) avant d'ouvrir FOUNDATION-010 (Workflow National).
**Contexte :** fait suite à `AUDIT_RLS_PRE_SWITCH.md`, `BUG_G_RLS_SCOPE_NATIONAL.md`, `JOURNAL_MIGRATIONS_RLS.md` et FOUNDATION-009 (RLS National, v2 + décisions de gouvernance).

---

## Étape 1 — Statut définitif de `journal_connexion`

**Objectif :**
- vérifier son rôle exact ;
- déterminer s'il doit être soumis au RLS ;
- vérifier les triggers associés ;
- vérifier les politiques (POLICY) éventuelles ;
- vérifier les privilèges (GRANT).

**Livrable :** ADR-00X « Statut définitif de `journal_connexion` ».

**Statut :** ⬜ Non commencé.

## Étape 2 — Origine des anciens GRANT excessifs

**Objectif :** retrouver précisément quel script SQL, quelle migration, quel seed a généré les anciens privilèges excessifs (156 tables avec GRANT préexistant sur `pngie_app`, incluant `TRUNCATE`, `TRIGGER`, `REFERENCES`, accès à des sous-systèmes dormants). Il ne s'agit plus de corriger mais de documenter *pourquoi* cette situation est apparue.

**Livrable :** section historique dans l'ADR RLS de clôture (Étape 5).

**Statut :** ⬜ Non commencé.

## Étape 3 — Validation de `006_postcheck.sql`

**Checklist :**
- [ ] toutes les policies présentes ;
- [ ] `security_invoker` sur toutes les vues concernées ;
- [ ] Bug G absent (roles à portée nationale visibles) ;
- [ ] lecture nationale conforme ;
- [ ] aucun GRANT excessif restant ;
- [ ] `scope_institution_id` correctement alimenté (cohérent avec FOUNDATION-009 §C.5.3).

Quand cette checklist est entièrement verte : **Migration RLS terminée.**

**Statut :** ⬜ Non commencé.

## Étape 4 — Bascule applicative

Seulement après les trois étapes précédentes :

```
DATABASE_URL → pngie_app
```

Puis : tests E2E complets, audit, validation finale — sur `pngie_rdc` (base principale), pas seulement sur `pngie_rdc_rls_test`.

**Statut :** ⬜ Non commencé — bloqué par Étapes 1 à 3.

## Étape 5 — ADR de clôture

Document unique résumant : contexte initial, problèmes rencontrés (Bug G, `security_invoker` manquant), décisions retenues (FOUNDATION-009 §C.4-C.6), état final. Devient la référence historique de toute la migration RLS.

**Statut :** ⬜ Non commencé.

---

## Après ce sprint

Une fois la clôture RLS réalisée, reprise de la série FOUNDATION dans l'ordre :

1. FOUNDATION-010 — Workflow National
2. FOUNDATION-011 — Journal National
3. FOUNDATION-012 — Interopérabilité Nationale
4. ADR métier (ADR-001 à ADR-005)
5. Retour au développement (migration `organization`→`institution`, séparation `personne`/`compte`, finalisation RBAC/RLS dans le code)

**Raison de cet ordre :** le Workflow National (FOUNDATION-010) doit s'appuyer sur un modèle RBAC/RLS stabilisé et réellement déployé, pas seulement documenté — éviter d'avoir à revenir modifier FOUNDATION-010 si la clôture RLS révèle un écart entre la théorie (documents) et la pratique (base réelle).

---

## Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction du plan de sprint | — | 2026-09-05 | Proposé |
