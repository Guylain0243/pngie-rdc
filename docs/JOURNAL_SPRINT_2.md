# Journal Sprint 2 — Garde-fou anti-TRUNCATE

**Statut : terminé et validé**

## Objectif

Empêcher toute exécution accidentelle de `db/seed.js` (qui effectue des `TRUNCATE`)
sur une base de production ou sur une base non explicitement autorisée.

## Réalisations

### 1. Garde-fou à 2 niveaux

- Ajout de `config/bootstrap.config.js` : liste blanche des bases autorisées pour le seed.
- Ajout d'un contrôle à 2 niveaux dans `db/seed.js` :
  1. Vérification du nom de la base présente dans `DATABASE_URL` contre la liste blanche.
  2. Refus explicite et arrêt (`process.exit(1)`) si la base n'est pas autorisée,
     avec message `[SEED BLOQUÉ] DATABASE_URL suspecte : ...` (mot de passe masqué dans le log).

### 2. Bugs découverts et corrigés pendant les tests grandeur nature

1. **Boucle `role_permission` supprimée.**
   `role_permission` est une **vue** construite directement sur `permission`, pas une vraie
   table. Le seed tentait d'y insérer des lignes, ce qui écrasait les colonnes `entite` et
   `action` en `NULL` par effet de bord sur la vue sous-jacente.

2. **Table `ai_agent` renommée en `agent_ia`, colonnes réalignées** sur le schéma réel :
   - `organization_id` → `institution_id`
   - `role_ia` → `type_agent`
   - `modele` → `modele_reference`
   - `permission_code` → `perimetre_donnees`
   - ajout de la colonne `code` (NOT NULL, manquante dans le seed original)
   Les 3 appels concernés (agents ARIA, Anti-fraude, Prévision Budgétaire) ont été corrigés
   en conséquence.

3. **Désalignement majeur schéma/code découvert** : environ 35 tables référencées dans
   `seed.js` à partir de la ligne ~235 (`instruction`, `plan_action`, `rapport`, `controle`,
   `mission`, `unit`, `position`, `assignment`, `dashboard`, `kpi`, etc.) **n'existent pas**
   dans le schéma réel de la base — confirmé de manière exhaustive via une requête sur
   `pg_class` (163 objets réels recensés au total). Le même constat s'applique à
   `db/seed-extension.js` (tables `tribunal`, `magistrat`, `patient`, `mfa_*`, `pki_*`, etc.).

### 3. Décision : troncature de `seed.js` (option A)

Plutôt que de tenter de réconcilier ~35 tables fantômes avec un schéma cible encore
indéfini, décision de :
- tronquer `db/seed.js` pour ne garder que la partie vérifiée et fonctionnelle
  (rôles, permissions, personnes, organisation, agents IA) ;
- désactiver l'appel à `seedExtension()` (même constat de désalignement, hors périmètre
  Sprint 2 — nécessite une refonte séparée).

Patch appliqué, `git diff` vérifié propre.

## Tests de validation (4 scénarios)

| # | Scénario | Base | Résultat attendu | Résultat obtenu |
|---|----------|------|-------------------|------------------|
| 1 | Seed autorisé | `pngie_rdc_rls_test` | Succès, exit 0 | ✅ Succès, exit 0 |
| 2 | Seed autorisé (rejeu) | `pngie_rdc_rls_test` | Succès, exit 0, reproductible | ✅ Succès, exit 0 (identique) |
| 3 | Seed bloqué | `pngie_rdc` | Refus explicite, exit 1, aucun TRUNCATE/INSERT | ✅ `[SEED BLOQUÉ] DATABASE_URL suspecte`, exit 1 |

Détail du scénario 3 : le blocage intervient dans `main()` (`db/seed.js:29`), **avant**
tout accès aux données (le point d'entrée du seed proprement dit est à la ligne 263) —
donc aucune opération destructive n'a lieu sur `pngie_rdc`.

Sortie du seed autorisé (`pngie_rdc_rls_test`) : 42 ministères, 26 provinces, 6 rôles,
activités et valeurs de KPI peuplées, 6 comptes démo créés (`pr@rdc.gouv.cd`,
`pm@rdc.gouv.cd`, `sn@rdc.gouv.cd`, `an@rdc.gouv.cd`, `mi@rdc.gouv.cd`, `gv@rdc.gouv.cd`).

## Leçon apprise

Le code du seed avait dérivé du schéma réel de la base sans que cela soit détecté plus tôt,
faute de test d'exécution de bout en bout régulier. Environ un tiers des tables référencées
dans le seed n'ont jamais existé dans le schéma actuel. À l'avenir : exécuter `seed.js` de
bout en bout dès qu'une table est ajoutée/modifiée dans le schéma, plutôt que de supposer
que le code du seed reste synchronisé avec les migrations.

## Hors périmètre (reporté)

- Refonte de `db/seed-extension.js` et des ~35 tables non implémentées référencées dans
  `seed.js` (mission, dashboard, kpi, tribunal, magistrat, mfa_*, pki_*, etc.) : nécessite
  une décision de schéma cible et une refonte dédiée, hors périmètre Sprint 2.

## Prochaine étape

Commit de :
- `config/bootstrap.config.js`
- `db/seed.js` (tronqué + corrections)
- ce journal (`JOURNAL_SPRINT_2.md`)
