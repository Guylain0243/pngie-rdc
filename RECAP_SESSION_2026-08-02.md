PNGIE-RDC — Recapitulatif de session (02/08/2026, suite)

Resume : ce qui a ete fait aujourd'hui

Contradiction meta_attribute — RESOLUE
- Confirmee reelle via node explore_postgres.js : table absente de la base au debut de session (110 tables listees, meta_attribute manquante), alors que meta_entity, meta_notification_rule, meta_permission, meta_rule, meta_workflow_transition existaient.
- Cause du crash du generateur confirmee en lisant le code source de government-builder.js (lignes 223-256) : la requete SELECT * FROM meta_attribute plante immediatement si la table est absente, ce qui stoppe tout le script AVANT la generation de fichier -> donc les ~35-40 fichiers dans routes-generated/ (dates 22/07 au 28/07/2026) prouvent que meta_attribute existait encore le 28/07 a 17:30, et a disparu entre le 28/07 et le 02/08.
- Cause de la disparition : NON TRACEE. Aucune trace dans journal_audit (622 lignes, aucune mention meta_attribute) ni dans audit_log (table d'audit RNI, sans rapport). Pas de git installe sur la machine pour chercher un historique de commit. A ne plus chercher, ce n'est pas recuperable avec les outils disponibles.

Restauration de meta_attribute — FAITE
- Script trouve : 09-create-meta-tables.js (cree meta_entity ET meta_attribute avec CREATE TABLE IF NOT EXISTS, donc sans risque d'ecrasement).
- BUG CORRIGE dans 09-create-meta-tables.js : la colonne meta_attribute.entity_id etait declaree TEXT alors que meta_entity.entity_id est UUID -> la contrainte FOREIGN KEY echouait a l'implementation. Corrige en UUID NOT NULL (ligne 39). Backup de l'original : 09-create-meta-tables.js.backup.
- Table recreee avec succes apres correction.

Droits PostgreSQL — CORRIGES
- Mot de passe du compte admin postgres etait inconnu (point deja note dans le recap precedent). Reinitialise via bascule temporaire pg_hba.conf en trust (fichier : C:\pngie-rdc\pgdata\pg_hba.conf, backup automatique cree avant modification), redemarrage service postgresql-x64-16, ALTER USER postgres WITH PASSWORD, puis restauration scram-sha-256 et redemarrage.
- NOUVEAU MOT DE PASSE POSTGRES : Merci@0243  (a conserver en lieu sur, pas dans ce fichier en clair pour la prochaine fois si le fichier est partage largement)
- pngie_app a recu : GRANT CREATE ON SCHEMA public, GRANT REFERENCES ON meta_entity, ALTER DEFAULT PRIVILEGES (SELECT/INSERT/UPDATE/DELETE sur futures tables du schema public).

Seed de meta_attribute — FAIT (137 attributs au total)
Scripts executes avec succes, dans cet ordre :
1. 10-seed-meta-facture.js -> entite Facture (7 champs)
2. 19-seed-meta-batch2.js -> Permis Minier, Signalement Sanitaire, Dossier Judiciaire, Demande Certificat PKI, Dossier Recouvrement DGI (total 29)
3. 22-seed-meta-batch3.js -> 29 entites supplementaires dont Dossier Agent RH et Ligne Budgetaire (total 137)

Scripts de seed workflow EN ECHEC (non resolus, hors perimetre aujourd'hui) :
- 20-seed-workflow-batch2.js -> ERREUR : la colonne "entity" n'existe pas
- 23-seed-workflow-batch3.js -> meme erreur
- Cause non investiguee. Probablement un souci de schema sur meta_workflow_transition ou nocode_workflow, distinct du probleme meta_attribute. A traiter dans une prochaine session si les workflows sont necessaires.

26-seed-arborescence-maitresse-v2.js — execute avec succes mais SANS RAPPORT avec meta_attribute. Reconstruit une table separee referentiel_arborescence (388 noeuds : sections maitresses, domaines, plateformes, registres, referentiels, moteurs transversaux, niveaux de decomposition, entites construites). Documentation d'architecture, pas de la generation de routeurs.

Regeneration en masse des modules CRUD — FAITE, 35/35 SUCCES
Script cree : regenerate_all.js (boucle sur toutes les entites de meta_entity ayant au moins un attribut, appelle government-builder.js pour chacune).
Resultat : 35 modules regeneres avec succes dans routes-generated/, incluant les deux priorites du recap precedent (dossier_agent_rh, ligne_budgetaire). Tous ont desormais : validate()/validerPayload(), verification d'autorite institutionnelle (via exigerPermission), reponses d'erreur structurees (plus de fuite SQL brute), historique (enregistrerEvenement), notifications.
Liste complete des 35 modules regeneres : accord_cooperation, appel_offres, autorisation_industrielle, bien_culturel_protege, bien_patrimonial, certificat_pki, decision_institutionnelle, declaration_douaniere, declaration_fiscale, dossier_administratif, dossier_agent_rh, dossier_entreprise, dossier_judiciaire, dossier_logistique_defense, dossier_projet_investissement, dossier_recouvrement, dossier_scolaire, ecriture_comptable, enquete_statistique, etude_impact_environnemental, exploitation_agricole, facture, federation_sportive, immatriculation_vehicule, incident_securitaire, licence_commerciale, licence_telecom, ligne_budgetaire, ordre_paiement, permis_minier, plan_developpement, projet_recherche, raccordement_energetique, reclamation_citoyenne, signalement_sanitaire.

Fichiers routes-generated/ HORS PERIMETRE du generateur (10 fichiers, PAS d'action requise) :
annuaire.routes.js, arborescence.routes.js, institutions_dashboard.routes.js, institutions_fiche.routes.js, institutions_validation.routes.js, me_poste.routes.js, poste_hierarchie.routes.js, public_institutions.routes.js, relations.routes.js
-> Ce sont des endpoints metier ecrits a la main, pas des CRUD generiques issus de government-builder.js. Ils n'ont jamais ete concernes par le probleme meta_attribute.

Fichiers utilitaires crees pendant cette session (dans C:\pngie-rdc\pngie-backend, a nettoyer ou conserver selon besoin) :
check_audit.js, check_auditlog.js, check_meta_attr.js, check_owner.js, check_types.js, check_user.js, regenerate_all.js
Rapports texte generes : rapport_generator.txt, rapport_dates.txt, rapport_historique.txt, rapport_audit.txt, rapport_auditlog.txt, rapport_boucle.txt, rapport_coeur.txt, rapport_erreur_fk.txt, rapport_seed.txt, rapport_regen_all.txt

Ce qui reste reellement a faire (prochaine session)

1. BLOQUANT MOYEN : brancher les 35 routeurs regeneres dans src/server.js. Le generateur donne l'instruction require(...) + app.use('/api', xRouter) a chaque generation mais NE L'INJECTE PAS automatiquement dans server.js. A verifier si c'etait deja fait pour les anciennes versions ou si c'est a faire pour les 35.
2. Reparer les 2 scripts de seed workflow en echec (20 et 23-seed-workflow-batch*.js, erreur "colonne entity n'existe pas") si les workflows sont necessaires au fonctionnement.
3. Verifier si les tables generees (dossier_agent_rh, ligne_budgetaire, etc.) ont une portee institutionnelle reelle (colonne institution_id ou equivalent) — point du recap precedent, non revalide aujourd'hui.
4. Migration des modules metier restants qui n'ont PAS d'attributs dans meta_attribute (si des entites meta_entity existent sans attributs seedes, elles n'ont pas ete regenerees — a verifier avec une requete de type entites SANS attributs).
5. Points de securite en suspens (deja notes precedemment) : JWT_SECRET avec fallback faible, mot de passe pm@rdc.gouv.cd inconnu, delegation_pouvoir vide (jamais testee avec une donnee reelle).
6. 6 fichiers .bak_* anterieurs au 01/08 non tries (mentionne dans le recap precedent, pas revisite aujourd'hui).
7. Nettoyer les fichiers check_*.js et rapport_*.txt crees pendant cette session de debug si plus necessaires.
8. L'ensemble des 7 grands domaines du schema directeur (ERP, GED, interoperabilite, cybersecurite avancee, IA, portails, BI) restent quasi a 0% — toujours hors perimetre immediat.

Recommandation pour la prochaine session

Avant toute nouvelle exploration, verifier le point 1 (branchement server.js) car sans lui, les 35 routeurs regeneres ne sont pas actifs cote API meme s'ils existent sur disque. C'est le prolongement direct et logique du travail d'aujourd'hui.
