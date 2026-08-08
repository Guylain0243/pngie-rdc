# AUDIT RLS - Preparation du basculement vers pngie_app



**Statut : OUVERT**

**Objectif** : verifier que le backend peut etre execute avec le role `pngie_app` sans regression fonctionnelle, avant toute modification de `DATABASE_URL`.



## 1. Constat



L application est actuellement connectee avec le role `postgres` (confirme par `SELECT current_user, session_user` -> `postgres`/`postgres`).



Le role `postgres` etant SUPERUSER, les politiques RLS ne sont jamais evaluees pendant l execution normale, meme avec `FORCE ROW LEVEL SECURITY` sur les tables concernees. Ce point avait deja ete identifie lors de la migration RLS Phase 1 et reste valable aujourd hui.



**Consequence directe** : les 77/77 tests E2E actuels valident le RBAC et la logique metier applicative, mais ne valident pas le comportement reel sous RLS.



## 2. Verifications realisees



### 2.1 Role applicatif



\- `pngie_app` existe.

\- `rolsuper = false`.

\- `rolbypassrls = false`.

\- `rolconfig` est `NULL` (aucun defaut `app.bypass_rls` positionne sur le role).



**Statut : Valide.**



### 2.2 Politiques RLS



8 policies actives sur le schema public, dont 4 dependent reellement d un scope d institution :



| Table | Policy | Fallback si current_institution_id NULL |

|---|---|---|

| institution | institution_scope | Oui - acces large si NULL |

| index_recherche_global | index_recherche_scope_institution | Oui - institution_id IS NULL accepte |

| document | document_scope_institution | Non - egalite stricte uniquement |

| personne_role | personne_role_scope_institution | Non - egalite stricte uniquement |



Les 4 autres policies (rnsj_modification, rnsj_relation, rnsj_texte, rnsj_texte_historique) sont triviales (SELECT ouvert a true), sans dependance au scope.



**Statut : Valide.**



### 2.3 Middleware global



src/middleware/requireAuth.js resout, pour chaque requete authentifiee :



SELECT scope_institution_id

FROM personne_role

WHERE personne_id = ?::uuid

&#x20; AND scope_institution_id IS NOT NULL

LIMIT 1



Si aucune ligne n est trouvee : institutionId = null. Le contexte applicatif (requestContext.run) est alors initialise avec une institution vide, et db.js positionne app.current_institution_id a NULL cote PostgreSQL pour toute la duree de la requete.



**Statut : Confirme par lecture de code.**



### 2.4 Donnees de test



Les six comptes de test possedent actuellement scope_institution_id = NULL en base, sans exception.



Consequences observees/deduites :

\- Les modules utilisant institutionCourante() (ex. projet_recherche) ne disposent d aucun contexte d institution -> 403 systematique, confirme empiriquement.

\- Empiriquement (test manuel SET ROLE pngie_app + requete directe), personne_role renvoie 0 ligne pour les comptes de test lorsque app.current_institution_id est vide - coherent avec la policy sans fallback.



**Hypothese forte, non encore confirmee par un test de bout en bout** : des utilisateurs sans scope_institution_id risquent de ne plus pouvoir recuperer leurs roles (donc echec du flux de login complet, JWT compris) une fois RLS effectivement applique sous pngie_app. Le code montre que institutionId sera null dans ce cas, mais l ensemble du flux d authentification (lecture utilisateur, lecture des roles, generation JWT, ecriture de session) n a pas encore ete rejoue integralement sous pngie_app. Cette hypothese doit etre confirmee par un test de connexion execute avec ce role avant toute conclusion definitive.



**Statut : Partiellement confirme - hypothese forte a valider (voir section 5).**



## 3. Risques identifies



**R1 - GRANT manquants**

62 tables sur 149 (schema public) n ont aucun privilege accorde a pngie_app (verifie via information_schema.role_table_grants). Parmi elles : toute la famille rnso_*, journal_audit_default, journal_connexion, plusieurs referentiels judiciaires (ref_tribunal_*, ref_cour_appel*, ref_parquet*...), meta_attribute, meta_entity, role_metier, type_document, signature_electronique, entre autres.

Action : audit exhaustif du perimetre fonctionnel reellement utilise par l application avant bascule, puis GRANT cibles.



**R2 - Policies dependantes du scope, sans fallback**

document et personne_role n ont pas de clause de repli si app.current_institution_id est NULL, contrairement a institution et index_recherche_global. Une lecture sur ces deux tables renvoie silencieusement 0 ligne plutot qu une erreur, ce qui peut masquer le probleme en test superficiel.

Action : decision metier a prendre - ajouter un fallback explicite (ex. IS NULL accepte comme pour institution) ou accepter ce comportement comme un deni d acces volontaire pour les comptes sans institution.



**R3 - Donnees**

scope_institution_id n est renseigne pour aucun des 6 comptes de test.

Action : determiner (1) quels utilisateurs reels doivent posseder cette valeur et selon quelle regle metier, (2) comment cette colonne est maintenue dans le temps (a la creation du compte ? a l affectation ?), avant de simplement la renseigner a la main pour debloquer les tests.



## 4. Decision



**Aucune modification de DATABASE_URL tant que :**

\- l audit des GRANT (R1) n est pas termine ;

\- une decision est prise sur le fallback des policies document/personne_role (R2) ;

\- la strategie de peuplement de scope_institution_id (R3) n est pas definie ;

\- l hypothese forte de la section 2.4 n est pas confirmee par un test de connexion complet sous pngie_app.



## 5. Protocole de test propose pour la prochaine session



Pour lever l hypothese forte de la section 2.4 sans encore basculer DATABASE_URL :



1. Se connecter en tant que postgres (comme aujourd hui), executer SET ROLE pngie_app.

2. Rejouer manuellement, dans l ordre exact du flux server.js (route de login) :

&#x20;  - SELECT * FROM person WHERE email = ? AND statut = ? (lecture utilisateur)

&#x20;  - SELECT r.code, r.nom, r.categorie FROM person_role pr JOIN role r ON r.role_id = pr.role_id WHERE pr.person_id = ? (lecture des roles)

&#x20;  - INSERT INTO session_utilisateur (...) (ecriture de session)

3. Observer si chaque etape renvoie les donnees attendues ou 0 ligne/erreur, pour un compte de test avec scope_institution_id = NULL.

4. Documenter le resultat ici, dans une section 6 a ajouter.



## 6. Resultat du protocole de test



(a completer apres execution),--- MISE A JOUR - Resultats du protocole de test (partiel) ---

Test execute : rejouer le flux de login sous SET ROLE pngie_app, via les vues reelles person et person_role.

Resultat : ECHEC des deux etapes, mais pour une cause plus basique que prevu.
- Etape 1 (lecture vue person) : ERREUR - droit refuse pour la vue person
- Etape 2 (lecture vue person_role) : ERREUR - droit refuse pour la vue person_role

Cause identifiee : aucun GRANT n existe pour pngie_app sur les 7 vues de compatibilite
(person, person_role, organization, permission_compat, role_permission, meta_permission,
rnso_hierarchie). Le blocage se produit avant meme de pouvoir observer un comportement RLS :
c est un probleme de privilege sur objet, pas encore un probleme de policy.

Consequence sur l hypothese forte de la section 2.4 : NON TRANCHEE. Le test doit etre
rejoue apres ajout des GRANTs manquants pour observer le comportement RLS reel.

--- Mise a jour R1 (GRANT manquants) ---

Audit complet effectue sur 239 fichiers .js du backend (hors archives, migrations_rls,
node_modules) :

Tables de base sans GRANT ET referencees dans le code (PRIORITAIRES, 11) :
entity_relation, entity_scope, indicateur, manuel_architecture, meta_attribute,
meta_entity, referentiel_national, referentiel_national_item,
referentiel_national_section, relation_type, type_document.

Vues de compatibilite sans GRANT (CRITIQUES, 7 sur 7 - bloquent le login) :
person, person_role, organization, permission_compat, role_permission,
meta_permission, rnso_hierarchie.

Tables sans GRANT et non referencees dans le code (51) : essentiellement la famille
ref_* (referentiels judiciaires) et rnso_* (structure organisationnelle). A verifier
avant de les considerer comme non prioritaires : rnso_* n apparait dans aucun fichier
.js alors qu elle semble porter l organigramme, ce qui est surprenant et merite
verification (acces peut-etre indirect via une autre vue, ou fonctionnalite non
encore branchee).

Action suivante : ajouter les GRANTs sur les 18 objets prioritaires (11 tables + 7 vues)
dans un environnement de test isole, puis rejouer le protocole de test du login pour
enfin observer le comportement RLS reel et trancher R2.## 7. Plan de bascule - Phase 2 (session suivante)

Decision : ne pas continuer l audit par grep/lecture de code. Utiliser un environnement
isole pour laisser les erreurs reelles guider les corrections restantes.

### 7.1 Precision importante sur les GRANTs de vues

Un GRANT SELECT ON ALL TABLES IN SCHEMA public ne couvre PAS automatiquement les vues
creees separement. Les 7 vues de compatibilite bloquantes identifiees en section 6
(person, person_role, organization, permission_compat, role_permission,
meta_permission, rnso_hierarchie) necessitent un GRANT explicite distinct :

GRANT SELECT ON person, person_role, organization, permission_compat,
  role_permission, meta_permission, rnso_hierarchie TO pngie_app;

### 7.2 Environnement de test isole

Nom de la base : pngie_rdc_rls_test

Exigence : copie reelle des donnees de pngie_rdc (pg_dump/pg_restore), pas seulement
le schema. Les comptes de test avec scope_institution_id = NULL doivent etre presents
pour que les erreurs observees soient representatives de l etat actuel.

### 7.3 Sequence prevue

1. pg_dump de pngie_rdc, restauration dans pngie_rdc_rls_test.
2. Verification prealable (role postgres) : donnees identiques a pngie_rdc, notamment
   scope_institution_id NULL sur les 6 comptes de test.
3. Bascule de DATABASE_URL vers pngie_app, uniquement sur pngie_rdc_rls_test.
4. Execution de node --test tests/e2e/*.test.js, sans corriger a chaud.
5. Pour chaque echec : diagnostiquer precisement la cause (GRANT table, GRANT vue,
   ou policy RLS sans fallback) avant de corriger, et documenter chaque correction
   dans ce fichier au fur et a mesure.
6. Objectif : 77/77 tests verts sur pngie_rdc_rls_test avec pngie_app.

### 7.4 Point de securite - ne pas sauter cette etape

Une fois pngie_rdc_rls_test validee a 77/77, NE PAS basculer directement DATABASE_URL
de l environnement de developpement principal (pngie_rdc). Il faudra reproduire
methodiquement les memes GRANTs et corrections de policies sur pngie_rdc, avec la
meme prudence que pour l environnement de test - la validation sur la copie ne
dispense pas de revalider la bascule sur la base reelle.

Seulement apres cette derniere etape : envisager de debloquer 008_projet_recherche.test.js
et reprendre le chantier A.
## 8. Decouverte majeure - security_invoker manquant sur les vues (confirme empiriquement)

Cause racine identifiee et confirmee par test A/B direct sur la base pngie_rdc_rls_test.

### 8.1 Le probleme

Les 7 vues de compatibilite (person, person_role, organization, permission_compat,
role_permission, meta_permission, rnso_hierarchie) etaient creees SANS l option
security_invoker = true (disponible depuis PostgreSQL 15, serveur en 16.14).

Consequence : ces vues s executaient avec les privileges du PROPRIETAIRE de la vue
(postgres, superuser), pas de l utilisateur appelant (pngie_app). Un superuser
contourne RLS structurellement, meme avec FORCE ROW LEVEL SECURITY sur la table
sous-jacente.

Resultat : RLS sur personne_role (et potentiellement les autres tables avec policy)
etait INVISIBLE pour toute requete de l application passant par ces vues - c est a
dire la quasi-totalite du trafic applicatif reel, puisque server.js interroge
systematiquement person et person_role, jamais personne/personne_role directement.

### 8.2 Test A/B realise (sur pngie_rdc_rls_test, role pngie_app, compte test-mi
avec scope_institution_id = NULL)

AVANT correction (vues sans security_invoker) :
SELECT r.code FROM person_role pr JOIN role r ... WHERE p.email = 'test-mi@pngie.local'
-> 1 ligne (role MI trouve, alors que la policy RLS aurait du bloquer)

Correction appliquee :
ALTER VIEW person_role SET (security_invoker = true);
(et les 6 autres vues de la meme facon)

APRES correction :
Meme requete -> 0 ligne (comportement RLS correct, coherent avec le test empirique
deja fait directement sur la table personne_role)

### 8.3 Conclusion sur l hypothese forte de la section 2.4

CONFIRMEE. Un utilisateur reel sans scope_institution_id ne pourra pas recuperer ses
roles via la vue person_role une fois RLS effectivement applique (security_invoker
actif + connexion sous pngie_app). Le login casserait pour ce cas, comme anticipe.

### 8.4 Nouvelle action requise, distincte du chantier initial

Avant toute bascule vers pngie_app, meme partielle ou en test :

ALTER VIEW person SET (security_invoker = true);
ALTER VIEW person_role SET (security_invoker = true);
ALTER VIEW organization SET (security_invoker = true);
ALTER VIEW permission_compat SET (security_invoker = true);
ALTER VIEW role_permission SET (security_invoker = true);
ALTER VIEW meta_permission SET (security_invoker = true);
ALTER VIEW rnso_hierarchie SET (security_invoker = true);

Cette correction doit etre appliquee ET sur pngie_rdc_rls_test ET, apres validation
complete, sur pngie_rdc. Sans elle, la migration RLS Phase 1 est incomplete de facon
non detectable par les tests existants tant que l application se connecte en
superuser (postgres).

Point d attention supplementaire : verifier si d autres vues du schema (au-dela des
7 identifiees ici) souffrent du meme defaut, notamment celles qui pourraient wrapper
document ou index_recherche_global (tables avec policy RLS egalement).

### 8.5 Decision R2 (document/personne_role sans fallback)

Report de la decision R2 tant que la question du login casse (section 8.3) n est
pas resolue. Deux options desormais clarifiees :
- Option 1 : peupler scope_institution_id pour tous les comptes reels (test et
  production) selon une regle metier a definir (R3).
- Option 2 : ajouter un fallback explicite sur la policy personne_role_scope_institution
  (comme deja present sur institution et index_recherche_global), pour eviter un
  deni de service total pour tout compte sans institution de portee.
La decision finale doit etre prise avec les proprietaires metier du projet, pas
unilateralement en session technique.




## Décision — Session du 07/08/2026 (suite)

Le chantier RLS est validé sur l'environnement isolé `pngie_rdc_rls_test`.

- security_invoker=true confirmé sur les 7 vues de compatibilité (session matin).
- Bug G (visibilité des rôles à portée nationale sous RLS) identifié, patché
  et validé — voir BUG_G_RLS_SCOPE_NATIONAL.md.
- Toutes les suites E2E sont vertes : 77 tests, 77 pass, 0 fail.

Le report sur la base principale (`pngie_rdc`) reste une décision distincte
et devra être exécuté selon la procédure de migration définie dans ce
document, après validation indépendante.

Points en attente d'arbitrage métier, non résolus par cette session :
R1 (GRANT sur tables restantes), R3 (stratégie scope_institution_id au sens
large). Voir sections 8.4-8.5.
