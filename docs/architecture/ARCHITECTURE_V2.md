> Statut : CANONIQUE
> Derni�re r�vision : 2026-08-07
# PNGIE-RDC — Architecture v2 (document de référence technique)

> Document vivant. Statut global : 🟡 En construction — Section 4 (Cartographie PostgreSQL / Sécurité) amorcée à partir des audits RLS existants (AUDIT_RLS_PRE_SWITCH.md, résumés de session Chantier B). Toutes les autres sections sont en squelette, à compléter au fil des prochaines sessions.
>
> Dernière mise à jour : 07/08/2026

---

## 1. Vision globale

**Statut : ⬜ à rédiger**

- Objectifs du PNGIE-RDC (mission, périmètre fonctionnel actuel vs cible).
- Principes d'architecture directeurs (ex. : sécurité par défaut / defer-deny, RLS systématique sur les tables métier, pas d'accès superuser en prod applicative, tests E2E comme filet de sécurité avant toute bascule).
- Contraintes de sécurité (RBAC, RLS, scope_institution_id, audit).
- Conventions de développement (nommage, structure de dossiers, gestion des secrets, style SQL/JS).

*À compléter : reprendre les décisions déjà actées dans les sessions précédentes (ex. "ne jamais modifier pngie_rdc directement", "mots de passe via $env:PGPASSWORD", etc.) et les élever au rang de principes documentés.*

---

## 2. Cartographie fonctionnelle

**Statut : ⬜ à rédiger**

```
PNGIE-RDC
│
├── Sécurité
│     ├── Auth
│     ├── RBAC
│     ├── ScopeResolver
│     ├── RLS
│
├── RH
├── Documents
├── Gouvernance          (23 tables identifiées, non encore inventoriées)
├── Journal National      (suspendu, priorité 1 de la feuille de route)
├── Recherche
├── Finances
├── Marchés publics
├── IA
└── Administration
```

*À compléter : pour chaque bloc, lister les cas d'usage couverts aujourd'hui vs prévus, et l'état (actif / dormant / à créer). Le bloc Gouvernance est actuellement "dormant" (tables présentes, non exploitées).*

---

## 3. Cartographie technique

**Statut : 🟡 amorcée (volet sécurité uniquement)**

### 3.1 Middleware de sécurité (connu)

- `requireAuth.js` — point d'entrée d'authentification applicatif.
- Le pool de connexion applicatif utilise le rôle `pngie_app` (et non `postgres`) — condition nécessaire pour que RLS s'applique réellement.
- ⚠️ Point de vigilance documenté : des **vues de compatibilité** (`person`, `person_role`, `organization`, `permission_compat`, `role_permission`, `meta_permission`, `rnso_hierarchie`) sont interrogées par le code applicatif à la place des tables sources (`personne`, `personne_role`, etc.). Ces vues doivent impérativement porter `security_invoker = true` (PostgreSQL 15+), sans quoi elles s'exécutent avec les privilèges du propriétaire de la vue et **contournent silencieusement RLS**.

*À compléter : routes, services, helpers, modèles, triggers applicatifs — inventaire systématique à faire (ex. via `Get-ChildItem -Recurse` + revue des fichiers `routes/*.js`, `services/*.js`).*

### 3.2 Routes / services

**Statut : ⬜ à rédiger** — nécessite l'arborescence réelle du dépôt (`tree src` ou équivalent) pour être documentée fidèlement plutôt que supposée.

---

## 4. Cartographie PostgreSQL

**Statut : 🟢 amorcée avec des données concrètes issues des audits**

### 4.1 Généralités

- Serveur PostgreSQL en version **16.14**.
- Base de développement réelle : `pngie_rdc`.
- Base de test isolée (copie fidèle via `pg_dump`/`pg_restore`) : `pngie_rdc_rls_test` — **156 tables**, 6 comptes de test avec `scope_institution_id = NULL`.
- Rôle superuser historique : `postgres` (utilisé jusqu'ici par l'application — anomalie corrigée par le Chantier B).
- Rôle applicatif cible : `pngie_app` (privilèges limités, RLS appliquée).

### 4.2 Vues de compatibilité (7 identifiées, corrigées sur l'environnement de test)

| Vue | security_invoker (test) | security_invoker (prod/dev réelle `pngie_rdc`) |
|---|---|---|
| `person` | ✅ corrigé | ❌ pas encore reproduit |
| `person_role` | ✅ corrigé | ❌ pas encore reproduit |
| `organization` | ✅ corrigé | ❌ pas encore reproduit |
| `permission_compat` | ✅ corrigé | ❌ pas encore reproduit |
| `role_permission` | ✅ corrigé | ❌ pas encore reproduit |
| `meta_permission` | ✅ corrigé | ❌ pas encore reproduit |
| `rnso_hierarchie` | ✅ corrigé | ❌ pas encore reproduit |

> ⚠️ La correction n'a été appliquée que sur `pngie_rdc_rls_test`. **Ne pas considérer le problème comme résolu tant que la Priorité 5 (reproduction sur `pngie_rdc`) n'est pas faite.**

**Action de suivi non close** : auditer l'ensemble des vues du schéma `public` (pas seulement ces 7) pour détecter d'autres cas de `security_invoker` manquant, en particulier celles pouvant wrapper `document` ou `index_recherche_global` (tables déjà connues pour porter une policy RLS) :

```sql
SELECT viewname FROM pg_views WHERE schemaname='public';
SELECT relname, reloptions FROM pg_class WHERE relkind='v' AND relnamespace = 'public'::regnamespace;
```

### 4.3 GRANTs applicatifs (rôle `pngie_app`)

- **7 vues de compatibilité** (voir 4.2) : GRANT appliqué sur l'environnement de test.
- **11 tables prioritaires** (référencées dans le code applicatif) : GRANT appliqué sur l'environnement de test —
  `entity_relation`, `entity_scope`, `indicateur`, `manuel_architecture`, `meta_attribute`, `meta_entity`, `referentiel_national`, `referentiel_national_item`, `referentiel_national_section`, `relation_type`, `type_document`.
- **51 tables restantes sans GRANT**, non référencées dans le code scanné (majoritairement `ref_*` et `rnso_*`) — statut : à vérifier avant de les classer "non prioritaires". Cas particulier `rnso_*` : semble porter l'organigramme mais n'apparaît dans aucun fichier `.js` scanné → accès probablement indirect via une vue non encore identifiée (à croiser avec l'audit 4.2).

### 4.4 Policies RLS connues

- Table `person_role` (via la vue `person_role`) : policy s'appuyant sur `scope_institution_id`. Sans fallback : un compte avec `scope_institution_id = NULL` perd tout accès une fois RLS réellement appliquée (comportement confirmé par le test A/B, cf. 4.6).
- `institution` et `index_recherche_global` : policies **avec fallback explicite déjà présent** (contre-exemple utile pour la décision R2, cf. section 7).
- Policy nommée `personne_role_scope_institution` : au cœur de la décision R2 (fallback vs peuplement systématique de `scope_institution_id`).

*À compléter : inventaire exhaustif de toutes les policies RLS du schéma (`SELECT * FROM pg_policies;`), pas seulement celles déjà rencontrées au fil des audits.*

### 4.5 Comptes de test connus

- `test-mi@pngie.local` (rôle MI) — `scope_institution_id = NULL` dans l'environnement de test, utilisé pour le test A/B de la découverte `security_invoker`.
- Comptes PR et SN — utilisés dans les tests E2E manuels ; ont déclenché un rate-limiter applicatif (429) lors de sollicitations répétées pendant la session du 07/08.

### 4.6 Découverte de sécurité majeure — traçabilité

**Constat** : les 7 vues de compatibilité créées par `postgres` sans `security_invoker = true` s'exécutaient avec les privilèges du propriétaire (superuser), contournant RLS pour la quasi-totalité du trafic réel (le code applicatif interroge systématiquement les vues de compatibilité, jamais les tables sources directement).

**Test A/B réalisé** (documenté dans `AUDIT_RLS_PRE_SWITCH.md`, section 8.2) :
- Avant correction : requête sur `person_role` pour `test-mi@pngie.local` → 1 ligne trouvée, alors que `scope_institution_id = NULL` aurait dû bloquer l'accès.
- Après `ALTER VIEW ... SET (security_invoker = true)` sur les 7 vues → 0 ligne. RLS s'applique enfin réellement.

**Portée** : sans cette correction, le problème serait resté invisible indéfiniment tant que l'application se connectait en superuser — un cas d'école pour justifier l'inventaire systématique prévu en 4.2.

### 4.7 État des tests E2E (à date du 07/08/2026)

- Run historique (rôle `postgres`, base `pngie_rdc`) : suite de référence, doit rester verte avant toute bascule.
- Run sur `pngie_rdc_rls_test` (rôle `pngie_app`), **avant** correction `security_invoker` : 59 pass / 18 fail — majoritairement dus à un rate-limiter applicatif, pas à un vrai problème RLS/GRANT.
- Run **après** correction `security_invoker` : **pas encore relancé** — c'est la Priorité 0 en cours.

---

## 5. Dépendances

**Statut : ⬜ à rédiger**

```
Journal National
        │
        ├── Documents
        ├── Recherche
        ├── Workflow
        ├── Audit
        ├── Notification
        └── IA
```

*À compléter pour chaque module cible une fois la cartographie fonctionnelle (section 2) stabilisée.*

---

## 6. Modularisation cible

**Statut : ⬜ à rédiger**

```
src/
    domains/
        security/
        rh/
        documents/
        journal/
        gouvernance/
        recherche/
        workflow/
        finances/
        administration/
```

*À compléter : mapping fichier-par-fichier entre l'arborescence actuelle et cette cible, une fois l'inventaire du code (section 3.2) fait.*

---

## 7. Feuille de route

**Statut : 🟡 amorcée**

### 7.1 Court terme — Chantier B (sécurité RLS), en cours

| # | Action | Statut |
|---|---|---|
| P0 | Relancer les tests E2E complets sur `pngie_rdc_rls_test` après correction `security_invoker` | 🔴 à faire — priorité immédiate |
| P1 | Auditer toutes les vues du schéma public pour d'autres cas `security_invoker` manquant | 🔴 à faire |
| P2 | Trancher le sort des 51 tables restantes sans GRANT | 🔴 à faire |
| P3 | Décision métier R2 : fallback explicite vs peuplement de `scope_institution_id` | 🔴 en attente d'arbitrage métier |
| P4 | Décision métier R3 : stratégie de peuplement/maintenance de `scope_institution_id` | 🔴 en attente d'arbitrage métier |
| P5 | Reproduire GRANTs + `security_invoker` sur `pngie_rdc` (base réelle) | 🔴 bloqué tant que P0–P4 non clos |
| P6 | Débloquer Chantier A (`projet_recherche`) | 🔴 bloqué tant que Chantier B non clos |
| P7 | Rotation des mots de passe `postgres` / `pngie_app` (échangés en clair en session) | 🔴 urgent, jamais fait |

### 7.2 Moyen terme — consolidation

1. ✅ Terminer la Phase 2 RLS (Chantier B).
2. 📘 **Architecture v2** — ce document (en cours).
3. 🧱 Modularisation progressive du backend par domaines, sans régression fonctionnelle.

### 7.3 Long terme — modules métier (feuille de route stratégique)

4. 📰 Journal National
5. 📊 Cockpit Gouvernemental (après inventaire des 23 tables gouvernance)
6. 🤖 IA décisionnelle
7. 🔍 Recherche nationale avancée
8. 🔄 Workflows gouvernementaux
9. Phase 3+ : finances publiques, marchés publics, RH étendue, patrimoine, projets nationaux, puis phases 4 à 15 (intelligence gouvernementale, plateforme citoyenne, interopérabilité, SIGI-RDC).

---

## Annexe — Points de méthode actés (à respecter dans toutes les sessions futures)

- Ne jamais modifier `pngie_rdc` directement : toujours valider sur `pngie_rdc_rls_test` d'abord.
- Toujours tester empiriquement (A/B avant/après) plutôt que déduire du code seul.
- Mots de passe à caractères spéciaux : toujours via `$env:PGPASSWORD`, jamais dans une URL construite à la main.
- Contenu Markdown à sauvegarder : utiliser le bouton de copie des blocs de code, pas une sélection manuelle (risque d'antislashs parasites). Vérifier avec `Get-Content -Tail N` en cas de doute.
- Sécurité : les mots de passe `postgres` et `pngie_app` ont été échangés en clair à plusieurs reprises dans les sessions — rotation à faire dès que possible (cf. 7.1 P7).
