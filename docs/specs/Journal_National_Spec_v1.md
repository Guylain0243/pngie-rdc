# Journal National — Spécification fonctionnelle v1

Statut : BROUILLON — à valider point par point avant toute conception technique.
Auteur : proposition initiale à corriger par le métier.

## 1. Mission

Le Journal National est le canal officiel de publication des actes de l'État
qui produit :
- la preuve d'entrée en vigueur d'un acte (date de publication = date opposable) ;
- la traçabilité juridique complète (qui a signé, quand, sous quelle forme) ;
- l'accès public ou restreint selon la nature de l'acte ;
- la source de vérité unique, consultable et vérifiable dans le temps.

**Décision à valider** : le Journal a-t-il valeur légale d'entrée en vigueur
(comme un Journal Officiel classique), ou est-ce un registre de traçabilité
sans portée juridique propre (les actes entrant en vigueur par un autre canal) ?
Cette réponse conditionne tout le reste (workflow, signature, opposabilité).

## 2. Actes publiés

Proposition de typologie (`type_document` existe déjà en base — à réutiliser
ou étendre) :

| Type | Portée | Signataire type |
|---|---|---|
| Loi | Nationale | Président (promulgation) |
| Ordonnance | Nationale | Président |
| Décret | Nationale | Président / Premier Ministre |
| Arrêté ministériel | Sectorielle | Ministre |
| Arrêté interministériel | Sectorielle | Plusieurs Ministres |
| Circulaire | Administrative | Ministre / SG |
| Décision institutionnelle | Institutionnelle | Institution émettrice |
| Nomination | Administrative | Autorité de nomination |
| Sanction | Administrative | Autorité disciplinaire |
| Convention / Accord international | Nationale | Président / Ministre des Affaires étrangères |
| Avis | Consultative | Institution émettrice |
| Communiqué | Information | Institution émettrice |

**Décision à valider** : cette liste est-elle complète et correcte pour le
contexte RDC ? Faut-il distinguer des sous-catégories (ex. décret réglementaire
vs décret individuel) ayant des workflows différents ?

## 3. Cycle de vie proposé

\\\
Brouillon
  ↓
Validation juridique (contrôle de conformité/forme)
  ↓
Visa (contrôle hiérarchique, ex. SG, Cour des comptes selon nature)
  ↓
Signature électronique
  ↓
Programmation (date de publication différée possible)
  ↓
Publication (entrée en vigueur si applicable — cf. section 1)
  ↓
Archivage (immuable)

États transverses possibles à tout moment après publication :
  → Correctif (erratum, sans changer le texte publié original)
  → Abrogation (l'acte cesse de produire effet, référence l'acte abrogeant)
  → Consolidation (version à jour tenant compte des modifications successives)
\\\

**Décision à valider** : le circuit de validation est-il identique pour tous
les types d'actes, ou certains (ex. Communiqué) sautent-ils Validation
juridique / Visa ? Qui a le pouvoir de rejeter à chaque étape et de renvoyer
en brouillon ?

## 4. Acteurs et rôles

Réutilisation des rôles RBAC existants (`MI`, `PM`, `PR`, `AN`, `GV`, `SN`)
complétée par des rôles fonctionnels propres au Journal :

| Rôle | Responsabilité |
|---|---|
| Rédacteur | Crée le brouillon |
| Juriste / Service juridique | Validation juridique (forme, base légale) |
| Secrétaire Général (ou équivalent institution) | Visa |
| Signataire (Ministre / PM / Président selon type) | Signature électronique |
| Administrateur du Journal | Programmation, publication technique |
| Archiviste | Gestion de l'archivage, correctifs/abrogations |
| Public / Citoyen | Consultation (selon actes publics) |

**Décision à valider** : ces rôles sont-ils des rôles RBAC distincts à créer,
ou des permissions supplémentaires sur les rôles institutionnels existants
(un Ministre agit à la fois comme "MI" et comme "Signataire") ?

## 5. Relations avec les autres modules

| Module | Nature de la relation |
|---|---|
| Documents | Le Journal s'appuie sur `document`/`document_version` pour le PDF/texte officiel |
| Workflow | Le cycle de vie (section 3) est un workflow — réutilise `nocode_workflow*` ou moteur dédié |
| Recherche | Indexation dans `index_recherche_global` (déjà RLS-actif) |
| Audit | Chaque transition d'état auditée (`lib/audit.js`, pattern RNI) |
| Notification | Alerte aux acteurs concernés à chaque étape, notification publique à la publication |
| Signature électronique | Réutilise `signature_electronique` (déjà en base) |
| IA | Hors périmètre v1, envisageable ensuite (résumé automatique, alerte de conflit avec texte existant) |

**Décision à valider** : confirmer ce périmètre de relations pour la v1
(IA explicitement exclue au départ ?).

## 6. Recherche — critères proposés

Numéro d'acte, année, type d'acte, institution émettrice, mots-clés,
signataire, statut (brouillon/publié/abrogé...), date de publication,
recherche plein texte sur le contenu.

**Décision à valider** : recherche plein texte nécessaire dès la v1, ou
recherche par métadonnées suffisante au départ ?

## 7. Sécurité — matrice droits proposée (RBAC)

| Action | Qui |
|---|---|
| Créer un brouillon | Rédacteur habilité par institution |
| Modifier un brouillon | Rédacteur, tant que non visé |
| Valider juridiquement | Juriste habilité |
| Viser | SG ou équivalent |
| Signer | Signataire habilité selon type d'acte |
| Programmer/Publier | Administrateur du Journal |
| Consulter (actes publics) | Tout utilisateur authentifié, voire public non authentifié |
| Consulter (actes restreints) | Selon scope institution (RLS) |
| Télécharger | Selon statut de l'acte (public vs restreint) |

**Décision à valider** : y a-t-il des actes à diffusion restreinte (non
publics), ou le Journal National est-il par nature intégralement public une
fois publié ?

## 8. Versioning et cycle de vie post-publication

Proposition : un acte publié est immuable (jamais modifié en place). Toute
correction se fait par un nouvel acte (correctif/abrogation/consolidation)
qui référence l'acte d'origine — jamais d'UPDATE destructif sur un acte publié.

**Décision à valider** : confirmer cette règle d'immuabilité — elle a un
impact direct sur le schéma (pas de DELETE, historique complet obligatoire).

## 9. Format de publication

Proposition v1 : PDF officiel (généré) + HTML consultable + métadonnées
structurées exposées via API JSON. XML et Open Data hors périmètre v1.

**Décision à valider** : confirmer ce périmètre technique de publication
pour la v1 (pas de XML/Open Data au départ).

---

## Décisions en attente (récapitulatif)

1. Le Journal a-t-il valeur légale d'entrée en vigueur ? (section 1)
2. La liste des types d'actes est-elle correcte/complète ? (section 2)
3. Circuit de validation identique pour tous les types d'actes ? (section 3)
4. Rôles fonctionnels distincts ou permissions sur rôles existants ? (section 4)
5. IA exclue de la v1 ? (section 5)
6. Recherche plein texte dès la v1 ? (section 6)
7. Existe-t-il des actes à diffusion restreinte ? (section 7)
8. Confirmer l'immuabilité des actes publiés ? (section 8)
9. Confirmer le périmètre PDF/HTML/API, sans XML/Open Data en v1 ? (section 9)

---

## DÉCISIONS VALIDÉES (08/08/2026) — SPEC V1 FINALE

| # | Décision | Détail |
|---|---|---|
| 1 | Valeur légale | OUI. Le Journal National est l'acte officiel de publication et déclenche l'entrée en vigueur lorsque le texte le prévoit. |
| 2 | Types d'actes | Liste initiale + Instruction, Directive, Note de service, Décision judiciaire publiée, Traité/Accord international, Rectificatif, Abrogation. |
| 3 | Circuit de validation | Variable selon le type d'acte. Moteur de workflow configurable (réutilise `nocode_workflow*`/`meta_workflow_transition`), pas un circuit unique figé. |
| 4 | Rôles | Permissions attribuées aux rôles institutionnels existants (MI, PM, PR, AN, GV, SN...). Aucun nouveau rôle RBAC global créé. |
| 5 | IA | Hors périmètre V1. Points d'extension prévus dans le schéma (ex. champ résumé optionnel), non exploités en V1. |
| 6 | Recherche | Plein texte dès la V1, via `index_recherche_global` (RLS déjà actif). |
| 7 | Diffusion | Trois niveaux : Public, Restreint, Confidentiel. Seuls les actes publiables passent automatiquement en Public. |
| 8 | Immuabilité | OUI. Un acte publié est immuable. Toute correction = nouvel acte (rectificatif/abrogation/consolidation) référençant l'original. Aucun UPDATE destructif après publication. |
| 9 | Formats | PDF + HTML + API JSON en V1. XML/Open Data en V2, sans bloquer la conception actuelle (prévoir un point d'extension format). |
| 10 | Numérotation officielle | Nationale unique, année incluse : `JN-AAAA-NNNNNN` (ex. JN-2026-000001). Séquence globale, pas par type ni par institution. Devient la clé de référence officielle de publication. |
| 11 | Signature électronique | OBLIGATOIRE avant publication. Le Journal ne publie jamais un acte non signé. Intégration directe avec `signature_electronique` (déjà en base). |

**Statut : SPEC V1 GELÉE.** Plus de retour sur les choix fonctionnels sauf
nécessité métier avérée en cours de développement. Passage à la conception
technique.
