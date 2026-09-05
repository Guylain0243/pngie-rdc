# FOUNDATION-007 — Référentiel National des Postes et Affectations (RNPST)
| Validation technique | *(à compléter)* | | En attente |
| Validation métier | *(à compléter)* | | En attente — actions §8 à lever |

---

## 4bis. Validation du modèle existant

Confrontation entre les définitions conceptuelles ci-dessus et le
schéma réel (table poste, ffectation, code applicatif).

### ✅ Conforme au métamodèle

- Poste rattaché à une unité organisationnelle (unite_id REFERENCES unite_organisationnelle), cohérent avec FOUNDATION-002 §4.4.
- Affectation relie exactement une Personne et un Poste (personne_id, poste_id), cohérent avec FOUNDATION-002 §4.5.
- Champ 	ype_affectation (défaut TITULAIRE) déjà prêt pour porter la valeur INTERIM définie en §2.5.
- Unicité d'affectation active par Poste garantie par un index unique partiel en base (uq_affectation_poste_active, voir src/services/institution-authority.js), pas seulement par la couche applicative.
- La chaîne Personne -> Affectation active -> Poste -> Unité -> Institution est déjà documentée dans le code (scope-resolver.js, institution-authority.js), cohérente avec FOUNDATION-002 §3 et §7.

### ⚠️ Points nécessitant une décision d'architecture

- **Colonne categorie sur poste** : utilisée activement (annuaire, fiches institution, hiérarchie des postes) mais comme simple texte libre, sans catalogue national contrôlé. Joue informellement une partie du rôle prévu pour Fonction (§2.2). Décision à prendre : migrer vers une vraie relation onction_id, ou faire cohabiter les deux notions avec des périmètres distincts.
- **Colonne 
ombre_postes_autorises** : utilisée activement (fiche institution). Suggère qu'un enregistrement poste peut représenter un pool de positions identiques (effectif autorisé), ce qui n'est pas prévu par la définition actuelle de Poste (FOUNDATION-002 §4.4 : `position unique`). Décision à prendre : étendre la définition de Poste pour couvrir cet usage, ou introduire une notion distincte d'effectif autorisé.

### 📝 Dette technique identifiée

- Tables position, position_competence (0 ligne) et position_responsabilite, position_droit_acces, position_menu, position_document, position_interaction, position_kpi (tables absentes de la base malgré un script de création les visant) : vestige probable d'un chantier antérieur, sans lien avéré avec le RNPST. Une seule référence active trouvée dans le code (src/server.js:269), à documenter séparément dans docs/debt/.
| Validation technique | *(à compléter)* | | En attente |
# FOUNDATION-007 — Référentiel National des Postes et Affectations (RNPST)

**Statut :** Proposé — en attente de validation.
**Date :** 2026-09-05
**Dépend de :** FOUNDATION-002 (Métamodèle, §4.4 Poste et §4.5 Affectation), FOUNDATION-006 (RNP)
**Prépare :** FOUNDATION-008 (RBAC National), FOUNDATION-009 (RLS National)

---

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

- [ ] Qui valide la création d'une nouvelle Fonction au catalogue national ?
- [ ] Qui approuve un organigramme (création/suppression de Poste) ?
- [ ] Durée maximale d'un Intérim avant obligation de nomination définitive : à définir.
- [ ] Gouvernance de la Vacance prolongée (alerte, escalade) : à définir.

---

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
