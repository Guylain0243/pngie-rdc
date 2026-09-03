# Sprint 2B — Phase 4A : Classification des divergences de colonnes

## Objectif

Classer les 48 tables communes présentant des divergences de colonnes entre
Postgres et SQLite, afin de déterminer si elles relèvent d'une correction
manuelle table par table ou justifient un traitement semi-automatique.

Méthode : échantillon initial de 10 tables (5 premières / 5 dernières par
ordre alphabétique), puis vérification systématique sur l'ensemble des 48
avant toute conclusion.

## Résultats

### Groupe A — Pattern homogène (26 tables)

Écart strictement identique sur les 26 tables : une seule colonne manquante
côté SQLite, `institution_id`, avec les mêmes caractéristiques partout :

```
institution_id
uuid
NOT NULL
FOREIGN KEY -> institution(institution_id)
```

Observations vérifiées (preuve, pas hypothèse) :
- même nom de colonne sur les 26 tables (aucune variante) ;
- même type (`uuid`) sur les 26 ;
- même nullabilité (`NOT NULL`) sur les 26, sans exception ;
- aucune valeur par défaut ;
- la colonne `institution_id` est la forme très majoritaire du pattern FK
  vers `institution` (61 contraintes sur 66 au total dans la base ; les 5
  restantes sont des variantes métier nommées différemment —
  `emetteur_institution_id`, `destinataire_institution_id`,
  `scope_institution_id`, `verificateur_institution_id` — et ne concernent
  aucune des 26 tables du Groupe A).

Liste des 26 tables :
appel_offres, autorisation_industrielle, bien_culturel_protege,
bien_patrimonial, certificat_pki, declaration_douaniere,
declaration_fiscale, dossier_administratif, dossier_agent_rh,
dossier_entreprise, dossier_logistique_defense, dossier_recouvrement,
dossier_scolaire, ecriture_comptable, enquete_statistique,
etude_impact_environnemental, facture, federation_sportive,
immatriculation_vehicule, incident_securitaire, licence_commerciale,
licence_telecom, permis_minier, raccordement_energetique,
reclamation_citoyenne, signalement_sanitaire

**Conclusion (prudente) :** ces 26 tables constituent un candidat fortement
justifié pour un traitement semi-automatique. La décision définitive
(ouverture ou non d'un Sprint 2C) sera prise après validation sur une
première table pilote : appliquer le template à une seule table, régénérer
le schéma SQLite, relancer seed + tests, et confirmer que tout reste vert
avant de généraliser.

### Groupe B — Cas particuliers (22 tables)

Écarts hétérogènes : colonnes manquantes multiples, colonnes en trop,
indices de renommage (ex. `referentiel_national_item`,
`referentiel_national_section`), mélange de colonnes d'audit et de colonnes
métier (ex. `role`).

Liste des 22 tables :
competence, decision_institutionnelle, document, dossier_judiciaire,
entity_relation, exploitation_agricole, instruction, ligne_budgetaire,
meta_entity, meta_notification_rule, meta_permission,
meta_workflow_transition, notification, ordre_paiement, organization,
permission, person_role, referentiel_national, referentiel_national_item,
referentiel_national_section, role

Nature encore inconnue au-delà du constat "hétérogène" — plusieurs
sous-motifs possibles (`meta_*`, `referentiel_national*`) restent à
examiner individuellement. Aucune automatisation n'est décidée pour ce
groupe. Traitement prévu : Phase 4B, manuelle, table par table.

### Hors périmètre (non étudié à ce stade)

- 104 tables présentes dans Postgres mais absentes de SQLite
- 62 tables présentes dans SQLite mais absentes de Postgres

## Décision

Sprint 2B se poursuit sur deux branches :

```
Phase 4A (terminee)
      |
      +-- Groupe A (26 tables) -> pattern unique, verifie
      |         |
      |         +-- Phase 4A-bis : validation sur 1 table pilote
      |                   |
      |                   +-- si OK -> Sprint 2C (semi-automatise)
      |                   +-- si KO -> retour Phase 4B manuelle
      |
      +-- Groupe B (22 tables) -> Phase 4B, manuelle, une table a la fois
```

La décision d'ouvrir un Sprint 2C **n'est pas prise**. Elle dépend :
- de la validation du traitement du Groupe A sur une table pilote
  (schéma régénéré + seed + tests verts) ;
- de l'analyse ultérieure du Groupe B, qui pourrait elle-même révéler
  des sous-motifs justifiant un traitement partiellement automatisé.

## Prochaine étape (début de la prochaine session)

1. Vérifier l'état du dépôt : `git log --oneline -6` et `git status`.
2. Choisir une table pilote dans le Groupe A (candidat naturel :
   `appel_offres`, déjà entièrement documentée avec sa contrainte FK).
3. Ajouter manuellement `institution_id` au schéma SQLite pour cette
   seule table, régénérer, relancer seed + tests e2e.
4. Si vert : formaliser le template et statuer sur Sprint 2C.
   Si rouge : documenter l'échec avant toute généralisation.
