PNGIE-RDC — Recap de session (02/08/2026, apres-midi) pour reprise

Contexte : suite directe de la session du matin (RECAP_SESSION_2026-08-02.md).

CE QUI A ETE FAIT AUJOURD'HUI (session apres-midi) :

1. Points bloquants du recap precedent : CONFIRMES RESOLUS
   - Les 35+ routeurs generes sont bien branches dans src/server.js (verifie via node -c, aucune action necessaire).
   - Scripts 20-seed-workflow-batch2.js et 23-seed-workflow-batch3.js repares : bug entity -> entite (colonne SQL en francais).
     Scripts 21 et 24 (permissions) executes en suivant, aucune erreur.

2. Architecture entity_scope creee et peuplee (44 entites) :
   - GLOBAL (7), INSTITUTION (31), MULTI_INSTITUTION (5), PERSON (1).
   - Table entity_scope en base, verifiee complete (aucune entite generee manquante).

3. Decouverte majeure : doublon d'institution MIN_5 vs MIN_FINANCES
   - MIN_FINANCES (code non conforme, cree 29/07) etait un doublon de MIN_5 (code officiel MIN_5, actif, rattache Primature).
   - Audit d'impact complet realise avant toute suppression (postes, affectations, unites enfants, ref_parquet, ref_greffe).
   - Aucune perte de donnee reelle : seule 1 affectation active existait (Directeur du Budget, deja sous MIN_5).
   - Table reorganisation_organisationnelle creee (embryon du futur MNGO) : 14 operations tracees (1 institution + 13 unites).
   - Structure organisationnelle finale du Ministere des Finances : 11 unites ACTIF, 13 ARCHIVE, coherentes.
   - Plusieurs corrections en cascade necessaires (collisions de code, chaines de reference non resolues) : le registre
     d'audit lui-meme a du etre verifie et corrige a 2 reprises avant d'etre fiable.

4. Migration institution_id sur les 31 tables classees INSTITUTION dans entity_scope :
   - ordre_paiement (18 lignes) et ligne_budgetaire (1 ligne, donnee corrompue en encodage) : migrees avec verification
     manuelle (donnees reelles a traiter).
   - decision_institutionnelle : migree (table vide, verification faite avant simplification).
   - dossier_agent_rh : 1 ligne de test ("Test Agent RH"), rattachee a MIN_5 par defaut.
   - 27 autres tables (vides) : institution_id UUID NOT NULL + FK ajoutee directement, sans risque.
   - RESULTAT : 31/31 tables INSTITUTION ont desormais institution_id UUID NOT NULL REFERENCES institution(institution_id).
   - Anciennes colonnes texte (institution TEXT) supprimees partout ou elles existaient.

CE QUI RESTE A FAIRE, DANS L'ORDRE DECIDE :

1. Creer les tables de liaison N-N pour les 5 entites MULTI_INSTITUTION
   (accord_cooperation, relations, dossier_projet_investissement, plan_developpement, projet_recherche).
   Ces entites doivent utiliser institution_source_id / institution_cible_id (ou une table de liaison dediee),
   PAS un simple institution_id, car elles concernent plusieurs institutions a la fois.

2. Modifier government-builder.js pour qu'il applique automatiquement institution_id (ou le bon modele multi-institution)
   a toute nouvelle table generee, selon son scope declare dans entity_scope. Sans cela, le meme trou qu'on vient de
   combler se reproduira au prochain module genere.

3. Mettre a jour le moteur de securite (middleware requireAuth / requirePermission dans src/server.js et
   src/middleware/requireAuth.js) pour qu'il filtre reellement les donnees par institution de l'utilisateur connecte.
   Actuellement la colonne institution_id existe sur toutes les tables mais rien ne l'exploite cote API :
   un utilisateur autorise sur un module peut en theorie voir les donnees de toutes les institutions.

4. Verifier le statut INACTIF de 2 unites organisationnelles (D_TRESOR et D_COMPTA sous MIN_5), remarque en cours
   d'audit mais jamais tranchee : est-ce voulu, ou une anomalie a corriger separement ?

5. Dette technique en suspens (heritee du recap du matin, non retraitee aujourd'hui) :
   - JWT_SECRET avec fallback faible en dur, pas de garde-fou production.
   - Mot de passe pm@rdc.gouv.cd inconnu.
   - delegation_pouvoir vide, jamais testee avec une donnee reelle.
   - 6 fichiers .bak_* anterieurs au 01/08 non tries.
   - GATE_USER/GATE_PASS non definis (barriere d'acces HTTP non activee, warning vu au demarrage de server.js).

HORS PERIMETRE IMMEDIAT : les 7 grands chantiers fonctionnels (ERP, GED, interoperabilite, cybersecurite avancee,
IA, portails, BI) restent quasi a 0%. Le Bus National d'Interoperabilite (BNI) et le Moteur National de Gestion
Organisationnelle (MNGO complet, au-dela de la table minimale creee aujourd'hui) restent des chantiers a part entiere,
a ne pas commencer avant d'avoir fige le socle (PNGIE Secure API v1.0).

LEÇON DE LA SESSION : toute operation touchant a des donnees organisationnelles reelles (institutions, unites, postes)
doit systematiquement passer par un audit d'impact prealable (dependances, volumes, origine) avant toute modification,
meme quand la modification semble triviale au depart. Le registre de tracabilite doit lui-meme etre verifie apres
ecriture, pas seulement lors de sa creation.
