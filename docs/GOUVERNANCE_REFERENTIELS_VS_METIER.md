\# Gouvernance : Référentiel national (`ref\_\*`) vs Donnée métier



\*\*Statut : règle actée, applicable au Sprint 4 et aux futurs modules\*\*



\## Règle



Avant de créer ou de brancher une table, répondre à cette question :



> "Cette valeur est-elle identique pour toute la RDC, ou dépend-elle d'une institution ?"



\- \*\*Identique pour toute la RDC\*\* → référentiel national. Pas de

&#x20; `institution\_id` obligatoire. Lecture ouverte à toutes les institutions.

&#x20; Écriture restreinte à un rôle national dédié.

\- \*\*Dépend d'une institution\*\* → donnée métier. `institution\_id`

&#x20; obligatoire, isolation stricte par RLS en lecture et en écriture.



\## Deux catégories



\### 1. Référentiels (`ref\_\*`)



Exemples : `ref\_tribunal\_paix`, `ref\_cour\_appel`, `ref\_commune`,

`ref\_profession`, `ref\_type\_document`, `ref\_nationalite`.



Caractéristiques :

\- uniques pour tout le pays ;

\- n'appartiennent à aucune institution ;

\- servent de listes de référence consultées par tous les modules.



→ Pas de `institution\_id`. RLS lecture : `USING (true)`. RLS écriture :

restreinte par permission/rôle national (ex. `has\_permission('justice.reference.write')`

ou `role IN ('ADMIN', 'JUSTICE\_ADMIN')` selon le modèle RBAC en place).



\### 2. Données métier



Exemples : `dossier\_judiciaire`, `magistrat`, `audience`, `jugement`,

`patient`, `certificat\_pki`.



Caractéristiques :

\- créées par une institution ;

\- doivent être isolées par périmètre institutionnel.



→ `institution\_id` obligatoire, RLS filtrée en lecture ET en écriture

(modèle déjà en place sur `certificat\_pki`, voir

`routes-generated/certificat\_pki.routes.js`).



\## Exception à documenter au cas par cas



Certaines tables au nom `ref\_\*` peuvent en réalité être des référentiels

\*\*locaux\*\*, propres à une institution — par exemple `ref\_salle\_audience`,

`ref\_bureau`, `ref\_cachet` (si ces tables existent). Dans ce cas,

`institution\_id` est justifié malgré le préfixe `ref\_`. Le préfixe seul ne

suffit pas à trancher : c'est la question ci-dessus qui fait foi, pas le nom.



\## Application immédiate



`ref\_tribunal\_paix` et l'ensemble de la famille `ref\_tribunal\_\*` /

`ref\_greffe` / `ref\_parquet` / `ref\_cour\_appel` / `ref\_juridiction\_militaire`

/ `ref\_casier\_judiciaire` / `ref\_condamnation` / `ref\_execution\_decision` /

`ref\_auditorat\_militaire` relèvent de la catégorie 1 (référentiel national).

`institution\_id`, bien que présent comme colonne nullable dans certaines de

ces tables, ne doit pas servir de filtre RLS obligatoire — il documente

probablement un rattachement administratif, pas une propriété exclusive des

données.



\## À faire avant mise en production



\- \[ ] Vérifier si une politique RLS existe déjà sur ces tables en base (elle

&#x20;     pourrait être plus restrictive que prévu ici — à confirmer avant de

&#x20;     considérer la lecture comme réellement ouverte).

\- \[ ] Définir précisément le(s) rôle(s)/permission(s) autorisé(s) à écrire

&#x20;     sur les référentiels Justice, avec le porteur métier concerné

&#x20;     (probablement le Ministère de la Justice).

\- \[ ] Appliquer la même grille de lecture aux futurs modules RNSO, RNSJ,

&#x20;     Santé, RH, Finances avant d'écrire leurs routes.

