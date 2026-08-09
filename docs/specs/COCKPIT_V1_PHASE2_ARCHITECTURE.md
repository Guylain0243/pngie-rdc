# Cockpit Gouvernemental V1 — Phase 2 : Architecture
09/08/2026 — suite de COCKPIT_GOUVERNEMENTAL_SPEC_V1.md (Phase 1, figée)

---

## 1. Mécanisme de portée nationale en lecture seule (nouveau)

Voir décision d'architecture validée : le rôle **Analyste Cockpit** n'a pas d'institution
propre. Sa vision nationale est accordée par une capacité explicite, pas par un rattachement
hiérarchique fictif.

- **Nouvelle colonne** : `role.lecture_nationale BOOLEAN NOT NULL DEFAULT false`
  (migration additive, Phase 3).
- **`scope-engine.js`** (`exigerPortee`) : si le rôle connecté a `lecture_nationale = true`,
  la liste complète des institutions est utilisée pour `req.scope.institutionsVisibles`,
  obtenue par une lecture `bypassRls` encadrée (lecture seule, jamais pour une action
  d'écriture), au lieu du calcul via `resoudrePorteeInstitution()`.
- **Aucune policy RLS n'est modifiée.** Le mécanisme vit entièrement côté application, avant
  que la requête SQL ne parte — zéro impact sur `institution_scope`, `pol_acte_officiel_scope`,
  `fn_institutions_descendantes()`, la hiérarchie ou les 99 tests E2E existants.
- Extensible : tout futur rôle transverse (Inspection Générale, Cour des Comptes...) réutilise
  la même colonne, sans nouveau mécanisme.

## 2. Mapping vues du Cockpit ↔ graphe institutionnel

Rappel (`ARCHITECTURE_V2.md` §4.8) : Graphe 1 = `institution_parent_id` (subordination stricte,
protège la table `institution` via RLS) ; Graphe 2 = `institution_relation` (périmètre
fonctionnel élargi, filtrage applicatif via `hierarchy-service.js`).

| Vue Cockpit | Graphe utilisé | Justification |
|---|---|---|
| Décisions en cours (PR) | Graphe 2 | PR doit voir Primature + AN + SN + les 7 institutions d'appui — nécessite le rattachement fonctionnel, pas seulement la subordination |
| Décisions en cours (PM) | Graphe 2 | Périmètre gouvernemental = Primature + descendants réels (déjà le comportement de `resoudrePorteeInstitution`) |
| Décisions en cours (MI/GV) | Graphe 1 = Graphe 2 (portée à soi-même, aucune divergence possible) | Portée triviale, un seul niveau |
| Décisions en cours (AN/SN) | Ni l'un ni l'autre — règle métier dédiée | Filtre sur `statut = 'PUBLIEE'` uniquement, indépendant de la hiérarchie institutionnelle (cf. Q1, séparation des pouvoirs) |
| Décisions en cours (Analyste Cockpit) | Aucun des deux — mécanisme national dédié (§1) | Ni Graphe 1 ni Graphe 2 ne le couvrent puisqu'il n'a pas d'institution |
| Tableau de bord d'une décision | Suit le graphe de la vue "Décisions en cours" qui y mène | Cohérence de périmètre |
| Journal National récent | Graphe existant (déjà stabilisé, `pol_acte_officiel_scope`) | Inchangé, hors périmètre de ce chantier |

## 3. Structure de fichiers (patron RNI/Journal National, validé et déjà testé)

```
src/domains/governance/
├── cockpit.controller.js       # reçoit req/res, appelle le service, ne contient aucune logique métier
├── cockpit.service.js          # logique métier : agrégation, calcul des indicateurs, règles Q1-Q4
├── cockpit.repository.js       # requêtes SQL uniquement, aucune logique métier
├── cockpit.validators.js       # schémas de validation des entrées
├── cockpit.routes.js           # déclaration des routes, chaîne de middlewares
├── decision.controller.js      # CRUD décisions (distinct du cockpit : le cockpit consomme, ne possède pas les données)
├── decision.service.js
├── decision.repository.js
└── README.md                   # mis à jour (statut : implémenté, plus "squelette")
```

Séparation volontaire `cockpit.*` vs `decision.*` : le Cockpit est un **agrégateur en lecture**
des décisions existantes (`decision_gouvernementale`/`decision_action`), pas leur propriétaire.
Les routes de création/modification de décision restent dans `decision.*`, appelées par les
rôles habilités (cf. matrice RBAC §Q3) ; `cockpit.*` ne fait que lire et agréger.

## 4. Ce que la Phase 2 NE fait PAS

- Ne crée aucune table (Phase 3).
- Ne crée aucune route réelle (Phase 4/8).
- Ne modifie aucune policy RLS existante.
- Ne crée pas encore le rôle Analyste Cockpit en base (Phase 3/4).

---

## Prochaine étape

Phase 3 — Modèle de données : migration `role.lecture_nationale`, création du rôle
Analyste Cockpit, vérification/complément du schéma `decision_gouvernementale`/`decision_action`
pour les transitions d'état (Q3 : remplacement de DELETE par ARCHIVE/ANNULATION).
