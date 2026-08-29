# PNGIE_MASTER_MAP.md

**Statut : document factuel, basé sur audit — pas un plan directeur**

Ce document ne décrit que ce qui a été **vérifié** par les 3 scripts d'audit du
Sprint 3 (`audit_orphan_tables.js`, `compare_schema_vs_db.js`,
`audit_real_tables_usage.js`). Aucune ligne ci-dessous n'est une supposition
ou une intention — chaque statut est dérivé d'un résultat de script daté et
reproductible (voir `scripts/diagnostic/*_report.json`).

Ce document ne couvre volontairement pas de vision à 5 ans, de portail
citoyen, de plateforme nationale ou d'IA décisionnelle : ces sujets touchent
à des décisions institutionnelles et politiques qui dépassent le cadre d'un
audit technique, et n'ont aujourd'hui aucune preuve de code ou de schéma
derrière eux. Ils ne sont pas rejetés — simplement hors périmètre tant qu'ils
n'ont pas été spécifiés et validés séparément.

## Méthode

Pour chaque table réelle de `pngie_rdc_rls_test` (163 objets recensés via
`pg_class`), un verdict a été calculé automatiquement :

- **CABLÉ** : référencée par une migration, un modèle, une route/API ou un service actif.
- **SEED_SEULEMENT** : référencée uniquement dans `db/seed.js` ou `db/schema.sql`, sans route/service.
- **DOC_TEST_SEULEMENT** : mentionnée en documentation ou en test, sans code structurel actif.
- **AUCUNE_RÉFÉRENCE** : aucune trace de code nulle part (0 table dans ce cas — voir note).

Séparément, `compare_schema_vs_db.js` a établi que le code du projet (routes,
seed, doc) référence aussi des tables qui **n'existent pas du tout** dans la
base réelle — ces cas sont marqués **NON_MIGRÉ** ci-dessous.

## Cartographie par module

| Module | Statut base | Détail | Preuve |
|---|---|---|---|
| **Institutions / RNI** (institution, organization, person, role, permission, document...) | ✅ Réel + câblé | CABLÉ | Migration + route + service trouvés |
| **Justice — référentiels** (ref_tribunal_commerce/paix/travail/militaire_garnison/enfants/grande_instance + historiques, ref_greffe, ref_parquet, ref_cour_appel, ref_juridiction_militaire, ref_casier_judiciaire, ref_condamnation, ref_execution_decision, ref_auditorat_militaire) | ✅ Réel, ❌ non branché | DOC_TEST_SEULEMENT | ~26 tables existent en base (pg_class), mentionnées en doc/test, **aucune route ne les interroge** |
| **RNSO** (rnso_affectation, rnso_fonction, rnso_hierarchie, rnso_historique, rnso_modele*, rnso_poste, rnso_structure, rnso_type_*) | ✅ Réel, ❌ non branché | DOC_TEST_SEULEMENT | Existe en base, aucun code actif trouvé |
| **RNSJ** (rnsj_modification, rnsj_relation, rnsj_texte, rnsj_texte_historique) | ✅ Réel, ❌ non branché | DOC_TEST_SEULEMENT | Existe en base, aucun code actif trouvé |
| **Référentiel national (transverse)** (referentiel_national, referentiel_national_item, referentiel_national_section, referentiel_niveau_national, referentiel_poste_type, referentiel_arborescence) | Mixte | referentiel_arborescence = CABLÉ ; les autres = DOC_TEST_SEULEMENT | Voir rapport détaillé |
| **PKI** (certificat_pki) | ✅ Réel + câblé | CABLÉ | `routes-generated/certificat_pki.routes.js` interroge réellement `certificat_pki` |
| **PKI (nom alternatif obsolète)** (pki_certificate, pki_signature) | ❌ NON_MIGRÉ | Déclaré dans `db/schema.sql`/`seed-extension.js` sous un nom différent (`pki_certificate` vs `certificat_pki` réel) | Absent des 163 objets réels sous ce nom |
| **Suivi de gestion** (mission, dashboard, kpi, plan_action, rapport, controle) | ❌ NON_MIGRÉ | Référencé par du code (seed, routes de démo) mais absent de la base réelle | Absent des 163 objets réels |
| **Santé** (patient, etablissement_sante, consultation, campagne_vaccination) | ❌ NON_MIGRÉ | Conçu dans `db/schema.sql` et `seed-extension.js`, jamais migré | Absent des 163 objets réels |
| **MFA** (mfa_backup_code, mfa_event) | ❌ NON_MIGRÉ | Conçu et documenté (`ARCHITECTURE_V2.md`), jamais migré | Absent des 163 objets réels |
| **IA / Agents** (agent_ia) | ~ Partiel | SEED_SEULEMENT | Table réelle et peuplée par le seed (Sprint 2), mais aucune route/service ne l'exploite encore |
| **Rôles & permissions** (role, permission, role_permission, person_role, organization_type) | ~ Partiel | SEED_SEULEMENT | Peuplé par seed, structure de base réelle, pas encore de service métier dédié au-delà de l'auth |

## Ce que ce document NE dit PAS

- Il ne dit pas si le module "Santé" ou "Finances" **doit** exister — seulement qu'il n'existe pas encore, ni en base ni en code actif.
- Il ne présuppose pas un calendrier de développement.
- Il ne couvre pas les phases de plateforme nationale, portail citoyen, ou gouvernance à long terme évoquées dans des documents de réflexion externes — celles-ci nécessitent une décision de produit séparée, pas une extension automatique de cette cartographie.

## Constat central

Sur les 163 tables réelles de `pngie_rdc_rls_test` :
- **75 sont câblées** (actives, utilisées par l'application)
- **~80 (Justice + RNSO + RNSJ + référentiels transverses) existent mais ne sont exploitées par aucune route** — c'est le gisement de valeur à plus faible risque, car rien à créer, seulement à brancher
- **10 sont peuplées par le seed mais sans service métier dédié** (agent_ia, role/permission de base)

Séparément, une **cinquantaine de tables** sont référencées par du code (seed, schéma, doc) mais **n'ont jamais été migrées** vers la base réelle (suivi de gestion, santé, MFA, ancien nommage PKI).

## Recommandation Sprint 4 (seule extension actée à ce stade)

**Sprint 4 — Branchement du référentiel Justice/RNSO/RNSJ**

Objectif unique : exposer via API les ~80 tables déjà réelles et déjà
testées, sans rien créer de nouveau en base. Livrables proposés :

1. Routes/API pour le référentiel Justice (`ref_tribunal_*`, `ref_greffe`, `ref_parquet`, etc.)
2. Routes/API pour RNSO (organigrammes, postes, hiérarchie)
3. Routes/API pour RNSJ (textes normatifs)
4. Tests d'intégration confirmant le branchement (au-delà des tests unitaires déjà présents)
5. Mise à jour de ce document (`PNGIE_MASTER_MAP.md`) une fois chaque module basculé de DOC_TEST_SEULEMENT à CABLÉ

Toute extension au-delà de ce périmètre (Cockpit V2, nouveaux modules Santé/RH/Finances, plateforme nationale) devrait faire l'objet d'une décision de produit séparée, documentée avec ses propres preuves, suivant la même discipline que ce Sprint 3.
