# ARCHITECTURE_V2 — PNGIE-RDC

Document de référence architecture. Créé le 07/08/2026, reconstruit le
07/08/2026 (le fichier original n'avait jamais été effectivement committé
dans le dépôt malgré une mention en ce sens dans un résumé de session
antérieur — voir docs/sessions/).

## 1. Vision globale

*(à compléter)*

## 2. Cartographie fonctionnelle

*(à compléter)*

## 3. Cartographie technique

*(à compléter)*

## 4. Cartographie PostgreSQL / Sécurité

### 4.1 à 4.6

*(à compléter — contenu original perdu, à reconstituer à partir des audits
RLS existants dans docs/audits/, notamment AUDIT_RLS_PRE_SWITCH.md et
BUG_G_RLS_SCOPE_NATIONAL.md)*

### 4.7 — Leçon d'architecture RLS (07/08/2026)

Les rôles nationaux doivent conserver leur visibilité sur leurs propres
affectations. Une policy RLS ne doit jamais rendre un utilisateur invisible
pour lui-même. Cas concret rencontré : comparaison par `=` sur une colonne
nullable (`scope_institution_id`) contre un `current_setting` potentiellement
NULL, masquant silencieusement les rôles à portée nationale (voir Bug G,
docs/audits/BUG_G_RLS_SCOPE_NATIONAL.md).

Règle retenue : toute nouvelle policy RLS impliquant une colonne nullable
comparée à un contexte de session doit utiliser `IS NOT DISTINCT FROM`
plutôt que `=`, sauf besoin explicite contraire documenté.

Toute nouvelle policy devra être validée par une suite E2E complète avant
déploiement — cette session a démontré qu'un run E2E systématique après
changement RLS permet d'isoler et de confirmer une cause racine avec
certitude (77/77 après correctif, contre 9/77 avant).

## 5. Dépendances

*(à compléter)*

## 6. Modularisation cible

*(à compléter)*

## 7. Feuille de route

1. Clôture documentaire du chantier RLS — FAIT (07/08/2026)
2. Architecture v2 (ce document) — reconstruction en cours
3. Modularisation du backend par domaines
4. Journal National
5. Cockpit gouvernemental
6. IA juridique
7. Recherche avancée
8. Modules métier (Finances, Marchés, RH, Patrimoine, etc.)

## 2. Cartographie fonctionnelle (mise à jour 08/08/2026)

Établie par inventaire automatique du code + de la base (148 tables/7 vues),
croisée avec le contenu réel des routes. Trois états distingués : implémenté,
partiellement exposé, modélisé sans API.

| Domaine | Tables (échantillon) | API | Services dédiés | État |
|---|---|---|---|---|
| Auth | personne, personne_role, role, permission, session_utilisateur | ✔ (server.js) | middleware/requireAuth, resoudreRoleDepuisJWT | Mature |
| RBAC / Scope | role_permission, meta_rule, meta_entity | ✔ (transverse) | security/scope-engine, scope-resolver, resource-resolver, hierarchy-service | Mature |
| RNI (Commandement) | institution, rni_lien_hierarchique, instruction, execution_rapport, verification, instruction_historique | ✔ (rni-commandement-routes.js, module dédié écrit à la main) | security-engine, institution-authority, audit | Mature — module de référence |
| Documents | document, document_version, type_document, signature_electronique | ✔ | RLS actif | Mature |
| Recherche | index_recherche_global, referentiel_national* | ✔ (partiel) | RLS actif | Mature |
| No-Code / Workflow | nocode_formulaire, nocode_workflow*, processus* | ✔ (/api/nocode/*) | workflow-engine | Implémenté |
| IA | agent, agent_ia, agent_ia_interaction | ✔ (/api/agents/*) | aiAgent.js | Implémentation partielle |
| Institutions / Gouvernance | institution, decision_gouvernementale, decision_institutionnelle | ✔ (routes-generated + server.js) | — | Implémenté (généré) |
| Finances | facture, ligne_budgetaire, ordre_paiement, ecriture_comptable, declaration_fiscale, declaration_douaniere | ✔ (routes-generated, CRUD généré) | rule-engine, event-engine | Implémenté (généré) — pas de vérification d'autorité institutionnelle explicite |
| Patrimoine | bien_patrimonial, bien_culturel_protege | ✔ (routes-generated) | idem | Implémenté (généré) |
| Marchés publics | appel_offres | ✔ (routes-generated) | idem | Implémenté (généré) |
| RH générique | dossier_agent_rh, corps, grade, fonction | ✔ (routes-generated) | idem | Implémenté (généré) |
| Régulation/Licences | licence_commerciale, licence_telecom, autorisation_industrielle, permis_minier, immatriculation_vehicule | ✔ (routes-generated) | idem | Implémenté (généré) |
| Divers sectoriel | dossier_scolaire, exploitation_agricole, federation_sportive, signalement_sanitaire, etc. | ✔ (routes-generated) | idem | Implémenté (généré) |
| **RNSO (RH/Organigramme national)** | rnso_poste, rnso_structure, rnso_affectation, rnso_hierarchie, rnso_modele*, poste, grade, competence | ✖ quasi-totale (seulement me_poste, poste_hierarchie, marginaux) | rnso_hierarchie (vue) existe | **À développer** |
| **RNSJ (Référentiel Justice)** | rnsj_texte, rnsj_relation, rnsj_modification, ref_tribunal*, ref_greffe*, ref_parquet*, ref_cour_appel* (+ historiques) | ✖ totale | RLS actif sur rnsj_texte/relation/modification (protection posée, jamais exploitée par une route) | **À développer** |

## 3. Cartographie technique (mise à jour 08/08/2026)

### 3.1 Deux patrons de développement coexistent

**Patron A — Module écrit à la main (RNI)** : `src/rni-commandement-routes.js`.
Chaîne complète par route : `requireAuth → validate() → permission RNI (meta_permission)
→ autorité institutionnelle (verifierAutoriteInstitution/estAutoriseSurInstitution)
→ transaction db.js → audit() → réponse JSON normalisée`. Revérifie explicitement
que l'appelant représente l'institution qu'il prétend représenter, indépendamment
du contexte de session. Le seul module RLS-conscient au sens strict (audit trail
détaillé par action : PERMISSION_DENIED, INSTITUTION_MISMATCH, ACTION_SUCCESS).

**Patron B — Généré automatiquement** : `routes-generated/*.routes.js`, produit par
`regenerate_all.js` / `government-builder.js` à partir de métadonnées (probablement
`meta_entity`/`meta_attribute`/`meta_rule` en base — à confirmer). Chaîne par route :
`requireAuth (au montage dans server.js) → exigerPermission → institutionCourante()
(résolution automatique via request-context) → verifierRegles (meta_rule, avant
modification) → db → enregistrerEvenement/historique (event-engine) → réponse`.
Fichiers marqués `NE PAS MODIFIER À LA MAIN`. ~40 domaines couverts par ce patron.

Différence de posture notable : le patron B fait confiance au contexte institution
résolu automatiquement (403 si non résolu), sans revérification explicite d'autorité
comme le fait RNI. À évaluer si cet écart est acceptable ou doit être comblé
(cf. section 9, dette technique).

### 3.2 Middlewares
- `middleware/requireAuth.js` — authentification JWT unique, partagée
- `middleware/resoudreRoleDepuisJWT.js`
- `middleware/validation.js` + `middleware/validerCorps.js` — validation déclarative
- `security/scope-engine.js` (exigerPortee), `security/scope-resolver.js`,
  `security/resource-resolver.js`, `security/hierarchy-service.js`

### 3.3 Moteurs applicatifs (mono-fichier, non regroupés en modules)
`event-engine.js`, `notification-engine.js`, `rule-engine.js`,
`workflow-engine.js`, `aiAgent.js`

### 3.4 Générateur de routes
`regenerate_all.js` — produit l'intégralité de `routes-generated/`. À documenter
en détail avant toute modularisation touchant ces domaines : modifier un fichier
généré à la main serait écrasé à la prochaine régénération.

## 4bis. Sécurité — état RLS (mesure du 08/08/2026)

8 tables sur 148 ont RLS activé : `document, institution, personne_role,
rnsj_texte_historique, rnsj_texte, index_recherche_global, rnsj_modification,
rnsj_relation`.

Point notable : RLS est actif sur les tables RNSJ alors qu'aucune route n'existe
pour les exploiter — protection posée par anticipation, non encore utile
fonctionnellement. Cohérent avec R1 (GRANT sur tables restantes, en attente
d'arbitrage métier, cf. AUDIT_RLS_PRE_SWITCH.md).

## 4.8 Modèle de gouvernance institutionnelle — deux graphes distincts (09/08/2026)

Découverte lors de la clôture du chantier RLS (consolidation de la policy
`institution_scope`) : le PNGIE-RDC manipule **deux graphes institutionnels
différents**, répondant à deux questions différentes. Ce n'est pas une
incohérence de données — c'est un choix de modélisation correct, mais qui
n'était documenté nulle part avant ce jour, uniquement dans un commentaire de
`hierarchy-service.js`.

### Graphe 1 — Organigramme administratif (`institution.institution_parent_id`)

Répond à : **qui dépend administrativement de qui ?**

Colonne simple sur la table `institution`. Utilisé par :
- la fonction SQL `fn_institutions_descendantes()`, elle-même utilisée
  directement par la policy RLS `institution_scope` qui protège la table
  `institution` — **ce mécanisme ne suit QUE `institution_parent_id`, jamais
  `institution_relation`** ;
- l'organigramme, les workflows hiérarchiques, la subordination
  administrative en général.

Exemple : `Primature → Ministère de l'Intérieur → ...`

### Graphe 2 — Relations fonctionnelles (table `institution_relation`)

Répond à : **qui peut consulter/superviser quoi, sans lien de subordination ?**

Table à part, avec un `type_relation` :
- `TUTELLE` — se propage récursivement (un enfant de mon enfant est visible) ;
- `RATTACHEMENT_CONSTITUTIONNEL` — **ne se propage pas** ; seule l'institution
  directement source voit la cible rattachée, sans hériter de subordination
  (préserve l'indépendance fonctionnelle de l'institution rattachée).

Utilisé par `hierarchy-service.js` → `getInstitutionsDescendantes()` →
`scope-resolver.js` → `req.scope.institutionsVisibles`, qui alimente le
filtrage applicatif des listes (agents, affectations, etc.) dans les routes
générées. **Ce mécanisme combine les deux graphes** (`institution_parent_id`
via TUTELLE + `institution_relation` via RATTACHEMENT_CONSTITUTIONNEL).

### Institutions constitutionnellement indépendantes (rattachées, non subordonnées)

Rattachées à la Présidence via `RATTACHEMENT_CONSTITUTIONNEL` uniquement
(`institution_parent_id IS NULL` pour chacune — aucune subordination
administrative) :

- CENI (Commission Électorale Nationale Indépendante)
- CNDH (Commission Nationale des Droits de l'Homme)
- CSM (Conseil Supérieur de la Magistrature)
- CSAC (Conseil Supérieur de l'Audiovisuel et de la Communication)
- Médiateur de la République
- Conseil Économique et Social
- ARMP (Autorité de Régulation des Marchés Publics)

Elles restent indépendantes administrativement (absentes du Graphe 1) mais
sont visibles fonctionnellement par la Présidence (présentes dans le Graphe 2).

### Règle à respecter pour tout nouveau développement (Cockpit inclus)

- Toute nouvelle route qui interroge la table `institution` **directement**
  (hors `resoudrePorteeInstitution`/`req.scope`) sera soumise à la policy RLS
  `institution_scope`, donc au **Graphe 1 seul**. Les 7 institutions
  indépendantes ci-dessus seront invisibles dans ce cas précis pour la
  Présidence, même si elles apparaissent normalement dans ses listes
  filtrées côté applicatif.
- Pour toute fonctionnalité (Cockpit Gouvernemental notamment) qui doit
  respecter le périmètre fonctionnel complet (Graphe 2), passer par
  `resoudrePorteeInstitution`/`scope-engine.js`, pas par une requête directe
  sur `institution`.
- Ne jamais faire l'hypothèse que les deux graphes coïncident pour une
  institution donnée sans vérifier explicitement (cf. script
  `scripts/diff-hierarchie-pr.js`, produit lors de cette session, qui compare
  les deux calculs pour une institution donnée).

## 4.9 Règle : domaine métier vs Cockpit/tableau de bord (09/08/2026)

Validée lors du chantier Cockpit Gouvernemental V1 :

**Un domaine métier possède ses données** (ex. `decision.*` possède
`decision_gouvernementale`/`decision_action`). **Un Cockpit ou tableau de bord ne possède
aucune donnée métier** ; il les agrège uniquement via les services et repositories des
domaines existants (ex. `cockpit.*` appelle `decision.repository.js`, jamais l'inverse).

Corollaire pour tout futur module (RNSO, RNSJ, Finances, Marchés, Patrimoine...) : le
Cockpit reste un consommateur, jamais un propriétaire. Évite qu'un fichier d'agrégation
grossisse indéfiniment en mélangeant les responsabilités de plusieurs domaines (le
symptôme qu'avait `server.js` avant sa refonte).

## 9. Dette technique identifiée (08/08/2026)

- 17 fichiers `.backup` trouvés dans `src/` — déplacés vers `archive/backups-src/`
  (hors src/, hors dépôt) lors de cette session. Non versionnés désormais.
- Double driver DB (`pg` et `better-sqlite3` en dépendances) — mode de bascule
  à documenter clairement (probablement dev sans Postgres).
- `ioredis` déclaré en dépendance, aucun usage observé dans le code — code mort
  probable, à confirmer avant suppression.
- RNSO et RNSJ : bases de données riches et modélisées, aucune (RNSJ) ou quasi
  aucune (RNSO) route d'exposition. Écart majeur entre modèle de données et
  surface API — prochain développement fonctionnel naturel après Journal National
  selon la feuille de route, ou à réordonner si ces référentiels sont des
  prérequis d'autres modules.
- Écart de posture de sécurité entre le patron RNI (vérification d'autorité
  institutionnelle explicite à chaque action) et le patron généré (confiance au
  contexte résolu automatiquement) — à trancher : normaliser vers RNI, ou
  documenter comme choix assumé selon la sensibilité du domaine.

## 10. Découverte — système d'audit trigger généralisé (08/08/2026)

Un mécanisme d'audit au niveau base de données existe déjà et est actif,
indépendant de `lib/audit.js` (utilisé par le module RNI et les routes
générées) :

- Fonction `fn_audit_generique()` + trigger `trg_audit_<table>` posés sur
  5 tables : `document, institution, personne, personne_role, role`.
- Écrit dans `journal_audit` (680 lignes au 08/08/2026) — table à laquelle
  `pngie_app` n'a qu'un droit INSERT (cohérent : seul le trigger, exécuté
  avec les droits du propriétaire de la fonction, doit pouvoir lire/chaîner).
- Chaînage d'intégrité par hash (`fn_hash_chaine_journal_audit`,
  colonnes `hash_prec`/`hash_actuel`) — garantit qu'une ligne d'audit ne
  peut être falsifiée rétroactivement sans casser la chaîne.
- Expurge automatiquement `password_hash`/`mfa_secret` avant stockage.
- Table jumelle `journal_audit_default` (même structure, même trigger,
  0 ligne observée) — rôle exact à clarifier (peut-être un gabarit ou une
  table de fallback).
- `journal_connexion` (7 colonnes, 0 ligne) — table prête pour
  journaliser les tentatives de connexion, non encore alimentée.

**Important — nommage** : `journal_audit` n'a aucun rapport fonctionnel
avec le futur module "Journal National" (publication d'actes officiels,
cf. docs/specs/Journal_National_Spec_v1.md). Coïncidence de nom source de
confusion. Le schéma du Journal National utilise volontairement le préfixe
`acte_*` pour éviter toute ambiguïté.

**Dette technique** : deux mécanismes d'audit coexistent sans registre unique
documenté (`lib/audit.js` orienté application/API, `fn_audit_generique`
orienté base de données/triggers). Ni redondants ni contradictoires dans
leur usage actuel observé, mais à clarifier : lequel est la source de vérité
en cas de divergence ? Ce trigger devrait-il être étendu à d'autres tables
sensibles (ex. les tables RNI, actuellement couvertes seulement par
`lib/audit.js` applicatif) ? Décision à prendre ultérieurement, hors
périmètre du chantier Journal National.
