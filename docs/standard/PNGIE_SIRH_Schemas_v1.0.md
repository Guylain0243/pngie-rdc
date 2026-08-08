# PNGIE SIRH - Schemas RBAC et Validation v1.0
Statut : Conception de reference. Fonde sur audit meta_permission, personne_role, dossier_agent_rh.

## Constats
Les role_code existants (AN, GV, MI, PM, PR, SN) sont des codes institutionnels, pas des roles metier.
meta_permission.condition_json existe deja mais inexploite - voie pour AGENT_SOI_MEME.
dossier_agent_rh existe deja mais est un suivi de mouvements RH, pas un registre d'agents. Aucun doublon.

## 1. Roles RBAC du SIRH
RH_ADMIN : acces complet CRUD sur tous les sous-modules de son institution.
RH_GESTIONNAIRE : CRUD Agents/Carrieres/Conges/Formations ; lecture seule Sanctions/Evaluations.
RH_CONSULTATION : lecture seule sur tout.
AGENT_SOI_MEME : lecture de son propre dossier, creation demande de conge pour soi-meme.

## 2. Les 13 sous-modules et permissions (entity : RH_ADMIN / RH_GESTIONNAIRE / RH_CONSULTATION / AGENT_SOI_MEME)
Agents(agent): CRUD/CRU/R/R(son dossier)
Grades(grade): CRUD/R/R/-
Corps(corps): CRUD/R/R/-
Postes(poste): CRUD/R/R/-
Affectations(affectation): CRUD/CRU/R/R(la sienne)
Organigrammes(organigramme): R/R/R/-
Carrieres(carriere): CRUD/CRU/R/R(la sienne)
Conges(conge): CRUD/CRUD/R/CR(la sienne)
Evaluations(evaluation): CRUD/R/R/R(la sienne)
Sanctions(sanction): CRUD/R/R/R(la sienne)
Formations(formation): CRUD/CRUD/R/CR(inscription)
Mobilite(mobilite): CRUD/CRU/R/R(la sienne)
Retraite(retraite): CRUD/R/R/R(la sienne)

## 3. Schema de validation - module Agents (reference)
schemaAgent = {
  nom: requis string, prenom: requis string, date_naissance: requis date,
  matricule: requis string regex AG-000000, sexe: requis enum M/F,
  email: optionnel string regex email, institution_id: requis uuid,
  grade_id: optionnel uuid, corps_id: optionnel uuid,
  statut: requis enum ACTIF/SUSPENDU/RADIE/RETRAITE
}
Les 12 autres schemas a ecrire au moment de la construction de chaque routeur.
