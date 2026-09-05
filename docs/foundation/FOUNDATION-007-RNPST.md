## 1. Objectif du RNPST

Le RNPST complète le métamodèle national (FOUNDATION-002) sur un point
précis : il ne redéfinit ni Poste ni Affectation, dejà figés par
FOUNDATION-002, mais introduit les concepts nécessaires à leur usage
opérationnel — Fonction, Vacance, Occupation, Intérim, Historique —
qui n'avaient pas besoin d'exister au niveau du métamodèle minimal.

---

## 2. Définitions

### 2.1 Concepts hérités (aucune redéfinition)

| Concept | Référence |
|---|---|
| Poste | FOUNDATION-002 §4.4 |
| Affectation | FOUNDATION-002 §4.5 |

### 2.2 Fonction (nouveau concept RNPST)

| | |
|---|---|
| **Définition** | Métier ou responsabilité générique, réutilisable par plusieurs Postes (ex. Directeur, Chef de division, Magistrat, Médecin). |
| **Rôle** | Permet des questions nationales transversales aux Postes : combien de Magistrats, de Médecins, de Comptables publics existent dans l'État. |
| **Cycle de vie** | Création (catalogue national de fonctions) → Utilisation par un ou plusieurs Postes → Suppression seulement si aucun Poste actif ne la référence. |
| **Identifiant métier** | Code stable (ex. FONCTION_DIRECTEUR). |
| **Relations** | Un Poste référence exactement une Fonction. Une Fonction peut être référencée par zéro, un ou plusieurs Postes. Cette relation s'ajoute à celle déjà définie en FOUNDATION-002 §4.4 (Poste rattaché à une Structure) — elle ne la remplace pas. |
| **Contraintes** | Une Fonction ne peut pas être supprimée si un Poste actif la référence encore. |
| **Référentiel d'appartenance** | RNPST — Référentiel National des Postes et Affectations. |
| **Exemples** | Directeur, Chef de division, Secrétaire Général, Inspecteur, Médecin, Magistrat. |

**Observation (traçabilité) :** le concept Fonction n'est pas défini dans
FOUNDATION-002. Son introduction est motivée par les besoins du RNPST
et pourra conduire ultérieurement à une évolution du métamodèle
national (FOUNDATION-002 v2.0), sans que cela soit nécessaire ni
urgent pour stabiliser le RNPST aujourd'hui.

### 2.3 Occupation (nouveau concept RNPST)

| | |
|---|---|
| **Définition** | État d'un Poste pour lequel il existe une Affectation active à l'instant considéré. |
| **Rôle** | Permet de répondre simplement à `ce Poste est-il occupé ?` sans avoir à interroger directement la table Affectation. |
| **Cycle de vie** | Devient Occupation à l'ouverture d'une Affectation ; redevient Vacance à sa clôture. |
| **Relations** | État dérivé, pas une entité indépendante : calculé à partir de l'existence d'une Affectation active sur un Poste. |
| **Contraintes** | Un Poste ne peut être en Occupation via deux Affectations actives simultanées (contrainte déjà posée en FOUNDATION-002 §4.5, sauf Intérim). |

### 2.4 Vacance (nouveau concept RNPST)

| | |
|---|---|
| **Définition** | État d'un Poste pour lequel aucune Affectation active n'existe à l'instant considéré. |
| **Rôle** | Permet le suivi national des postes vacants, un indicateur de gestion RH stratégique. |
| **Cycle de vie** | État par défaut à la création d'un Poste ; peut réapparaître après clôture d'une Affectation, avant qu'une nouvelle ne s'ouvre. |
| **Relations** | État dérivé, symétrique de l'Occupation. |

### 2.5 Intérim (nouveau concept RNPST)

| | |
|---|---|
| **Définition** | Affectation temporaire d'une Personne à un Poste déjà pourvu ou vacant, en complément ou en substitution du titulaire, pour une durée déterminée. |
| **Rôle** | Couvre le cas explicitement exclu de la contrainte générale d'Affectation (FOUNDATION-002 §4.5 : `deux Affectations actives simultanées sur le même Poste sont interdites, sauf intérim explicitement modélisé`). |
| **Cycle de vie** | Ouverture (date de début, durée prévue) → Fin automatique ou anticipée → Retour à l'état antérieur du Poste (titulaire ou vacance). |
| **Identifiant métier** | Porté par l'Affectation elle-même via un indicateur de type (`type_affectation = INTERIM`). |
| **Relations** | Une Affectation d'intérim coexiste avec l'Affectation du titulaire, si celui-ci n'a pas été retiré du Poste. |
| **Contraintes** | Un seul intérim actif à la fois par Poste. Une durée maximale d'intérim peut être définie par la gouvernance (à trancher §8). |

### 2.6 Historique des affectations (nouveau concept RNPST)

| | |
|---|---|
| **Définition** | Ensemble ordonné de toutes les Affectations, actives et clôturées, associées à un Poste ou à une Personne donnée. |
| **Rôle** | Garantit la traçabilité complète des mouvements (nominations, mutations, fins de fonction, intérims) sans jamais perdre l'information passée. |
| **Cycle de vie** | S'enrichit à chaque ouverture ou clôture d'Affectation ; jamais purgé. |
| **Relations** | Vue consolidée sur les Affectations d'un Poste ou d'une Personne, pas une entité stockée séparément. |
| **Contraintes** | Aucune suppression physique d'Affectation, conformément à FOUNDATION-002 §4.5. |

---

## 3. Cycle de vie d'un Poste

`Création (organigramme approuvé) -> Vacance <-> Occupation (alternées) -> Suppression (réorganisation)`

Référence : FOUNDATION-002 §4.4. Le RNPST précise que l'alternance
Vacance/Occupation est pilotée par l'ouverture et la clôture des
Affectations (voir §2.3 et §2.4 ci-dessus).

---

## 4. Cycle de vie d'une Affectation

`Ouverture (date de début) -> [Intérim eventuel en parallèle] -> Clôture (date de fin, jamais de suppression physique)`

Référence : FOUNDATION-002 §4.5. Le RNPST ajoute le cas de l'Intérim
(§2.5), seule exception documentée à la règle d'unicité d'Affectation
active par Poste.

---

## 4bis. Résolution des décisions d'architecture (mise à jour)

**Statut de la mise à jour :** Proposé — en attente de validation.
**Date :** 2026-09-05


## A.1 Rappel des deux points en suspens

| # | Point | Constat |
|---|---|---|
| 1 | Colonne `categorie` sur `poste` | Texte libre, utilisé activement (annuaire, fiches institution, hiérarchie), joue informellement le rôle prévu pour Fonction (§2.2), sans catalogue national contrôlé. |
| 2 | Colonne `nombre_postes_autorises` | Utilisée activement (fiche institution), suggère qu'un Poste peut représenter un pool de positions identiques — ce que la définition actuelle de Poste (FOUNDATION-002 §4.4, position unique) ne permet pas. |

## A.2 Décision — Point 1 : `categorie` → `fonction_id`

**Décision retenue :** migrer vers une vraie relation, ne pas faire cohabiter les deux notions.

**Justification :** le concept Fonction est déjà spécifié en détail en RNPST §2.2 (code stable, catalogue national, cycle de vie propre). Laisser `categorie` en texte libre à côté d'un `fonction_id` structuré créerait deux sources de vérité concurrentes pour la même information — exactement le type d'ambiguïté que FOUNDATION-002 §Portée interdit sans révision explicite. La cohabitation n'est donc pas retenue comme option durable ; elle n'est tolérée que comme état transitoire de migration (voir A.4).

**Modèle cible :**
- `poste.fonction_id` — clé étrangère vers le catalogue national des Fonctions (RNPST §2.2), NOT NULL à terme.
- `poste.categorie` — conservée en lecture seule le temps de la migration, marquée `DEPRECATED`, supprimée en fin de campagne (voir A.4).

**Conséquence sur le RNPST :** aucune, cette décision confirme et opérationnalise ce qui était déjà prévu en §2.2 ; elle ne modifie pas la définition de Fonction elle-même.

## A.3 Décision — Point 2 : `nombre_postes_autorises` → notion distincte d'Effectif autorisé

**Décision retenue :** ne pas étendre la définition de Poste (l'invariant « position unique » de FOUNDATION-002 §4.4 est structurant pour Occupation, Vacance et Affectation — l'affaiblir casserait la cohérence du RNPST entier). Introduire à la place un concept distinct.

**Justification :** un Poste occupé/vacant répond à la question « qui occupe quoi, ici et maintenant ». Un effectif autorisé répond à une question différente : « combien de positions de ce type sont-elles budgétairement/légalement permises dans cette unité ». Ce sont deux couches d'information complémentaires, pas la même entité à des granularités différentes.

**Modèle cible :**

| | |
|---|---|
| **Nouveau concept** | Effectif autorisé |
| **Définition** | Nombre maximal de Postes d'une Fonction donnée pouvant exister simultanément dans une Unité organisationnelle donnée. |
| **Modélisation** | Table `effectif_autorise(fonction_id, unite_id, nombre_autorise, date_effet)`. |
| **Rôle** | Sert de référence de planification et de contrôle : la création d'un nouveau Poste (fonction_id, unite_id) devrait être bloquée ou signalée si elle dépasse `nombre_autorise` pour ce couple. |
| **Relation avec `nombre_postes_autorises` existant** | Le champ actuel sur la fiche institution devient un agrégat dérivé (somme des `nombre_autorise` sur les unités de l'institution), pas une donnée saisie indépendamment — évite la désynchronisation entre le total affiché et le détail par unité/fonction. |
| **Contrainte** | Le nombre de Postes actifs (non supprimés) pour un couple (fonction_id, unite_id) ne devrait pas dépasser `nombre_autorise` — alerte de gouvernance plutôt que contrainte bloquante en base, pour ne pas casser les données existantes hors norme (voir A.4). |

**Conséquence sur le RNPST :** ajout d'un concept complémentaire, aucune redéfinition de Poste, Occupation ou Vacance.

## A.4 Plan de migration (les deux points)

1. Créer le catalogue national des Fonctions (table dédiée) et la table `effectif_autorise`, si non déjà présentes.
2. Peupler `poste.fonction_id` par correspondance manuelle depuis les valeurs actuelles de `categorie` (script de mapping, validé métier — un même libellé de `categorie` peut recouvrir plusieurs Fonctions selon le contexte, à vérifier au cas par cas).
3. Peupler `effectif_autorise` à partir des valeurs actuelles de `nombre_postes_autorises`, réparties par unité et fonction (nécessite une reprise de données, pas un calcul automatique fiable).
4. Marquer `poste.categorie` et le `nombre_postes_autorises` brut de la fiche institution comme `DEPRECATED` (lecture seule, dérivés du nouveau modèle).
5. Suppression physique des colonnes dépréciées dans une version ultérieure, après une période de cohabitation dont la durée reste à fixer par la gouvernance (cf. Partie B, §8 gouvernance déjà ouverte sur les délais similaires — Intérim, Vacance prolongée).

## A.5 Validation (Partie A)

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente |
| Validation technique | *(à compléter)* | | En attente |

---

# FOUNDATION-007 — Référentiel National des Postes et Affectations (RNPST)

**Statut :** Proposé — en attente de validation.
**Date :** 2026-09-05
**Dépend de :** FOUNDATION-002 (Métamodèle, §4.4 Poste et §4.5 Affectation), FOUNDATION-006 (RNP)
**Prépare :** FOUNDATION-008 (RBAC National), FOUNDATION-009 (RLS National)

---

## 5. Relations avec le RNI (FOUNDATION-003)

Aucune relation directe. Le Poste ne référence jamais une Institution
directement — il passe toujours par une Structure organisationnelle
d'une Organisation (voir §6). Cohérent avec la chaîne complète
RNI -> RNSO -> RNPST -> RNP déjà posée en FOUNDATION-002 §7 et
FOUNDATION-004 §8.

---

## 6. Relations avec le RNSO (FOUNDATION-004)

Un Poste est rattaché à une Structure organisationnelle (ou, à défaut,
directement à une Organisation) — relation déjà définie en
FOUNDATION-002 §4.4 et détaillée en FOUNDATION-004 §8. Le RNPST ne
reformule pas cette relation, il la référence.

---

## 7. Relations avec le RNP (FOUNDATION-006)

Une Affectation relie exactement une Personne (RNP) et exactement un
Poste (RNPST) — relation déjà définie en FOUNDATION-002 §4.5. Une
Personne peut avoir zéro, une ou plusieurs Affectations, y compris
simultanées dans le cas exceptionnel de l'Intérim (§2.5), cohérent
avec FOUNDATION-002 §4.6.

---

## 8. Gouvernance

> **Statut des décisions**
> Les décisions ci-dessous constituent la position architecturale retenue pour le PNGIE. Leur mise en œuvre technique est normative. Les paramètres dépendant de la réglementation nationale (durées, autorités compétentes, procédures administratives) restent configurables afin de permettre leur adaptation sans remettre en cause le métamodèle.

### 8.1 Validation d'une nouvelle Fonction

**Décision retenue :** la création, la modification ou la suppression d'une Fonction relève de l'autorité nationale responsable du référentiel des fonctions publiques. Une institution peut créer des Postes, mais ne crée jamais de nouvelles Fonctions.

```
Fonction → Catalogue national
Poste    → Institution
```

Ce principe garantit que les statistiques nationales transverses permises par la Fonction (RNPST §2.2) restent cohérentes dans le temps, sans fragmentation en doublons locaux.

### 8.2 Validation d'un organigramme

**Décision retenue :** chaque Institution demeure propriétaire de son organigramme interne (création/suppression de Postes). En revanche :
- la structure doit respecter le métamodèle national (FOUNDATION-002) ;
- les types de structures sont nationaux (FOUNDATION-004, RNSO) ;
- la hiérarchie interne est validée par l'institution concernée.

```
État        → définit le modèle
Institution → définit son organigramme
```

### 8.3 Durée maximale d'un Intérim

**Décision retenue :** aucune durée réglementaire n'est figée dans ce document. Le RNPST expose un paramètre de configuration national pour cette durée, avec une **valeur par défaut de 12 mois**, ajustable par la réglementation en vigueur sans modification du métamodèle.

### 8.4 Vacance prolongée

**Décision retenue :** après une durée paramétrable, le système déclenche automatiquement, par paliers :
1. une alerte automatique ;
2. une notification RH ;
3. une remontée au tableau de bord national.

Aucune fermeture automatique du Poste n'est déclenchée par ce mécanisme — la Vacance reste un indicateur de pilotage, jamais une action correctrice automatique sur les données.

## 9. Historisation

Voir §2.6 (Historique des affectations). Principe : aucune suppression
physique d'une Affectation, seulement une clôture (date de fin
renseignée). Le même principe s'applique à la Fonction et au Poste :
toute suppression logique doit être tracée, jamais physique, pour
préserver l'historique d'audit (cohérent avec FOUNDATION-002 §4.9
Événement).

---

## 10. Exemples

`
Ministère de la Santé
    Poste P001 - Directeur des Ressources Humaines
        Fonction : Directeur
        Affectation active : Jean Kabila, du 2023-01-01 (en cours)
    Poste P002 - Directeur Financier
        Fonction : Directeur
        Affectation active : aucune -> statut Vacance
    Poste P003 - Chef Division RH
        Fonction : Chef de division
        Affectation active : Marie Tshisekedi, du 2024-03-01 (en cours)
        Affectation d'Intérim : Paul Mukendi, du 2026-08-01 au 2026-09-30
`

---

## 11. Validation

| Rôle | Nom | Date | Statut |
|---|---|---|---|
| Rédaction | — | 2026-09-05 | Proposé |
| Validation métier | *(à compléter)* | | En attente — actions §8 à lever |
| Validation technique | *(à compléter)* | | En attente |
