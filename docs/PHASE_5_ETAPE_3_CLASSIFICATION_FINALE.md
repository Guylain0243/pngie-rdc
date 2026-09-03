# Sprint 2B — Phase 5, Étape 3 : classification finale des 33 tables

## Méthode

Inventaire complet (colonnes, types, nullabilité, défauts, clés
primaires, contraintes FK) des 33 tables du périmètre officiel
(`docs/phase5-tables-prioritaires.txt`), extrait directement de Postgres.

La grille de classification a été affinée en deux temps au cours de
l'analyse : la détection initiale sur les noms littéraux
`created_at`/`updated_at` laissait un résidu de 5 tables "sans aucun
signal". L'examen détaillé a montré que 3 d'entre elles avaient en fait
un défaut écrit `CURRENT_TIMESTAMP` plutôt que `now()`, et 2 autres un
timestamp de création sous un nom métier (`date_changement`,
`date_debut`). La grille finale retient donc trois critères binaires,
indépendants du nom de colonne :
- présence d'au moins une colonne dont le défaut contient `now()` ou
  `CURRENT_TIMESTAMP` (signal "timestamp") ;
- présence d'une colonne nommée `updated_at` ;
- présence d'une vraie FK sortante `institution_id → institution(institution_id)`
  (la table `institution` elle-même est exclue de ce critère : sa seule
  contrainte est sa propre clé primaire, pas une FK).

Chaque table a été classée par un script (pas d'assignation manuelle),
avec vérification du total : 33/33, sans doublon ni orphelin.

## Cartographie (vérifiée, total = 33)

| Motif | timestamp | updated_at | institution_id | Nb tables | % |
|---|:-:|:-:|:-:|---:|---:|
| **A** | oui | non | non | 14 | 42 % |
| **B** | oui | non | oui | 7 | 21 % |
| **C** | oui | oui | oui | 6 | 18 % |
| **D** | oui | oui | non | 4 | 12 % |
| **E** | non | non | non | 2 | 6 % |

### Détail par motif

**Motif A (14 tables)** — timestamp de création uniquement :
acte_historique, acte_signature, agent_ia_interaction,
delegation_pouvoir, entity_event, instruction_historique,
meta_notification_rule, meta_rule, meta_workflow_transition,
nocode_formulaire, nocode_workflow_etape, notification,
session_utilisateur, type_acte_ref

**Motif B (7 tables)** — timestamp + institution_id, pas d'updated_at :
agent_ia, delegation_perimetre, execution_rapport, nocode_workflow,
personne_role, rni_lien_hierarchique, verification

**Motif C (6 tables)** — timestamp complet + institution_id :
acte_officiel, agent, decision_action, decision_gouvernementale,
institution_relation, unite_organisationnelle

**Motif D (4 tables)** — timestamp complet, sans institution_id :
affectation, institution, nocode_workflow_instance, poste

**Motif E (2 tables)** — aucun signal temporel, définitions de workflow
statiques (id integer auto-incrémenté, colonnes `statut_origine` /
`statut_cible` / `permission_requise`, sans notion de création
horodatée) :
acte_workflow_transition, decision_workflow_transition

## Lecture de la cartographie

Les motifs A, B, C, D (31 tables, 94 %) partagent un même schéma de
base : clé primaire UUID, colonnes métier, timestamp de création
(nom variable mais mécanisme identique), avec deux paramètres de
variation seulement — présence d'`updated_at` et présence
d'`institution_id`. Ce n'est pas une dispersion en 4 motifs
indépendants : c'est **un seul gabarit structurel avec deux
interrupteurs booléens**.

Le motif E (2 tables, 6 %) est fondamentalement différent : pas de
timestamp, id integer plutôt qu'uuid — structure de règles statiques,
pas de données créées dans le temps.

## Réponse à la question de sortie de la Phase 5

> Combien de motifs différents existent réellement parmi ces 33 tables ?

**Un seul gabarit générique, à deux paramètres, couvrant 31/33 tables
(94 %) ; et 2 tables (6 %) hors gabarit, à traiter manuellement.**

Ce résultat est net et dépasse le seuil de 80–90 % fixé comme critère de
décision pour un Sprint 2C. Il tranche nettement avec la première
lecture obtenue avec la grille brute (6 groupes disjoints, aucun >36 %),
qui reflétait une faiblesse de détection (noms de colonnes non
normalisés) plutôt qu'une réelle hétérogénéité des données.

## Décision

**Sprint 2C — automatisation des motifs validés — est justifié** pour
les 31 tables des motifs A/B/C/D, sous la forme d'un générateur de
`CREATE TABLE` paramétrable (pas un template rigide unique comme
envisagé initialement en Phase 4A) :
- colonne PK (nom variable selon la table, type uuid) ;
- colonnes métier (à lister table par table, non génériques) ;
- timestamp de création, optionnellement nommé différemment de
  `created_at` (motif A vs D/instruction_historique/session_utilisateur) ;
- `updated_at`, présent ou non ;
- `institution_id UUID NOT NULL REFERENCES institution(institution_id)`,
  présent ou non.

Les 2 tables du motif E (`acte_workflow_transition`,
`decision_workflow_transition`) restent en traitement manuel classique
(Phase 4B), leur structure étant hors gabarit.

## Prochaine étape

1. Choisir une table pilote pour valider le générateur avant
   généralisation. Candidat simple : `poste` (motif D, 4 colonnes
   seulement d'après l'inventaire — structure minimale pour un premier
   test).
2. Écrire manuellement (pas encore automatisé) son `CREATE TABLE` dans
   `schema.sqlite.sql`, régénérer `test.db`, relancer seed + tests e2e.
3. Si vert : cette étape manuelle sert de spécification exacte pour
   écrire le générateur ; l'appliquer ensuite aux 30 tables restantes
   des motifs A/B/C/D, en gardant `instruction_historique` et
   `session_utilisateur` comme cas à vérifier individuellement (nom de
   colonne temporelle non standard).
4. Traiter séparément, à la main, `acte_workflow_transition` et
   `decision_workflow_transition`.
5. Si l'étape pilote échoue : documenter l'échec avant toute
   généralisation, et retomber sur une correction table par table
   classique (Phase 4B) pour l'ensemble des 33.
