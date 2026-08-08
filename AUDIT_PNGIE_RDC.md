# AUDIT COMPLET — PNGIE-RDC
Généré le 2026-08-08T06:30:57.043Z


## 1. Arborescence du projet (2 niveaux, hors node_modules)

.env.admin.local
.env.test
[DIR] .github
  [DIR] workflows
    ci.yml
.gitignore
01-migration-institutions.sql
01_securite_part1.sql
01_securite_part2.sql
01_securite_part3.sql
01_securite_part4.sql
02-apply-migration.js
03-seed-institutions.js
04-routes-institutions.js
06-add-organismes-sous-tutelle.js
07-cleanup-tables-institutions.js
08-assign-competences-postes.js
09-create-meta-tables.js
09-create-meta-tables.js.backup
10-seed-meta-facture.js
11-create-relation-engine.js
12-demo-relation-facture-organisation.js
13-create-rule-engine.js
14-demo-regle-facture-payee.js
15-create-event-engine.js
16-create-security-engine.js
17-create-workflow-engine.js
18-create-notification-engine.js
19-seed-meta-batch2.js
20-seed-workflow-batch2.js
20-seed-workflow-batch2.js.backup
21-seed-permissions-batch2.js
22-seed-meta-batch3.js
23-seed-workflow-batch3.js
23-seed-workflow-batch3.js.backup
24-seed-meta-relations.js
24-seed-permissions-batch3.js
26-seed-arborescence-maitresse-v2.js
27-create-referentiels-nationaux-schema.js
28-seed-rnsem.js
29-seed-rndg.js
30-seed-rndec.js
31-seed-rnapi.js
32-create-rnpt-schema.js
33-seed-rnpt-dircab.js
34-seed-rnpt-conseiller.js
35-seed-rnpt-dirmm.js
36-seed-rnpt-batch2.js
37-seed-rnpt-primature.js
38-seed-rnpt-an.js
39-seed-rnpt-senat.js
40-seed-rnpt-congres.js
41-seed-rnpt-judiciaire.js
42-seed-rnpt-judiciaire-batch2.js
43-seed-rnpt-min-finances.js
44-seed-rnpt-ministere.js
45-seed-rnpt-regie.js
46-create-ceni.js
47-seed-rnpt-province.js
48-seed-rnpt-etd.js
49-seed-rnpt-entreprise.js
50-create-etablissement.js
51-seed-rnfi.js
52-seed-rniai.js
53-seed-rnagi.js
54-seed-rnbcm.js
55-seed-rnbom.js
56-seed-rncim.js
57-seed-rnmdm.js
58-seed-rnrs.js
59-seed-rncc.js
60-seed-rnip.js
61-seed-rnpol.js
62-seed-rndoc.js
63-seed-rnex.js
65-alter-ordre-paiement.js
66-seed-regles-seuil-paiement.js
67-test-creer-ordre.js
68-test-workflow-seuil.js
69-check-permissions.js
70-check-permission-schema.js
71-check-meta-permission.js
72-find-role-mi.js
73-check-role-schema.js
74-find-role-mi.js
77-test-complet-seuil.js
78-insert-transition.js
78-test-relations.js
79-clean-test.js
79-test-postes.js
80-patch-test.js
80-test-sso.js
81-fix-role.js
82-seed-manuel-ch663-671.js
activer_dossier_agent_rh.sql
activer_finances.sql
activer_modules_batch.js
add-fk-temp.js
add-permission-affectation-temp.js
add-permission-agent-temp.js
add-permissions-organigramme-temp.js
add-permissions-organigramme-v2-temp.js
add-relation-type-temp.js
all-tables.txt
[DIR] archive
  [DIR] backups-src
    db.js.backup_20260803_111718
    errors.js.backup_20260803_112013
    server.js.backup_20260803_101223
    server.js.backup_20260803_115511
    server.js.backup_20260803_223442
    server.js.backup_20260803_232832
    server.js.backup_20260803_234316
[DIR] archives
  affectation.routes.js.bak_avant_scope
  agent.routes.js.bak_avant_scope
  [DIR] bak_2026-08-01_session
    rni-commandement-routes.js.bak_2026-08-01_avant_bloc_F
    rni-commandement-routes.js.bak_2026-08-01_avant_bloc_F_v2
    server.js.bak_2026-08-01_avant_fix_audit_partage
    server.js.bak_2026-08-01_avant_fix_auth
    server.js.bak_2026-08-01_avant_fix_doublon_arborescence
    server.js.bak_2026-08-01_avant_requireAuth_centralise
  [DIR] bak_2026-08-02_soir
    government-builder.js.bak_2026-08-02_avant_fix_cosmetique
    government-builder.js.bak_2026-08-02_avant_gardefou_scope
    government-builder.js.bak_2026-08-02_avant_institution_filter
    requireAuth.js.bak_2026-08-02_avant_jwt_fix
    server.js.bak_2026-08-02_avant_jwt_fix
  [DIR] bak_avant_2026-08-01_epars
    event-engine.js.bak_2026-07-30
    index.html.bak_2026-07-27_2144
    index.html.bak_2026-07-27_2237
    index.html.bak_2026-07-27_fix
    index.html.bak_2026-07-31_avant_rni
    index.html.bak_before_1468fix
    index.html.bak_encoding_20260727_235014
    index.html.bak_mojibake_20260728_011355
    index.html.bak_mojibake_20260728_011634
    rule-engine.js.bak_2026-07-30
    server.js.bak_2026-07-27_2144
    server.js.bak_2026-07-30_avant_patch
    server.js.bak_2026-07-31_avant_rni
    server.js.bak_avant_rni_2026-07-31_041210
  hierarchy-service.js.bak_avant_rattachement
  poste_hierarchie.routes.js.bak_avant_rbac
  poste_hierarchie.routes.js.bak_avant_scope
  resource-resolver.js.bak_avant_institution
  routes-generated_backup_20260803_114225.zip
  [DIR] scripts-diagnostic-2026-08-03
    check-account.js
    check-person-schema.js
    check_audit.js
    check_auditlog.js
    check_meta_attr.js
    check_mwt.js
    check_owner.js
    check_types.js
    check_user.js
    check_views.js
    diag_affectation_schema.txt
    diag_audit_impact_unites.txt
    diag_colonnes_unite_id.txt
    diag_dossier_agent_rh_contenu.txt
    diag_fk_vers_unite.txt
    diag_government_builder_full.txt
    diag_institution_scope.txt
    diag_institution_scope_full.txt
    diag_ligne_budgetaire_full.txt
    diag_postes_affectations.txt
    diag_postes_detail.txt
    diag_poste_schema.txt
    diag_registre_complet.txt
    diag_registre_final.txt
    diag_requireAuth_full.txt
    diag_rnso_modele_poste_schema.txt
    diag_routes_generated_list.txt
    diag_schema_workflow_transition.txt
    diag_seed20.txt
    diag_seed23.txt
    diag_server_js.txt
    diag_server_requires.txt
    diag_tables_sans_institution.txt
    diag_toutes_colonnes_institution_id.txt
    diag_unites_min5_full.txt
    diag_unites_orphelines.txt
    diag_verif_29_tables.txt
    diag_volumes_33_tables.txt
    explore_postgres.js
    explore_real_tables.js
    explore_schema.js
    fix_document.js
    fix_mwt.js
    fix_remaining.js
    fix_requireauth.js
    fix_verifierexistence.js
    government-builder.js.bak_2026-08-02_avant_multi_institution_complet
    government-builder.js.bak_2026-08-02_avant_multi_institution_filter
    government-builder.js.bak_2026-08-02_soir2_avant_fix_header
    rapport_audit.txt
    rapport_auditlog.txt
    rapport_boucle.txt
    rapport_coeur.txt
    rapport_dates.txt
    rapport_generator.txt
    rapport_historique.txt
    rapport_modules_reels.txt
    rapport_regen_all.txt
    rapport_seed.txt
audit-4points-temp.js
audit-4points-v2-temp.js
audit-batch3-diff.js
audit-grants-pngie_app.txt
audit-meta-entity.js
audit-new-relations.js
audit-old-relations.js
audit-pm-account.js
audit-r1-v3-temp.js
audit-relation-tables.js
audit-rls-complet-temp.js
audit-sous-systemes-temp.js
audit_global_pngie.sql
audit_global_pngie_corrige.sql
audit_resultat.txt
audit_socle_2026-08-01_0711.csv
bloc_A_rni_securite_v1.sql
bloc_A_rni_securite_v1_TEST.sql
bloc_g_resultats_2026-08-01_0802.csv
build-url-temp.js
check-agent-id.js
check-agents-institutions.js
check-rbac-matrix.js
check_affectation.sql
check_ampleur.sql
check_bypass.sql
check_categorie.sql
check_chainage.sql
check_contenu_postes.sql
check_dates.sql
check_division.sql
check_doublons.sql
check_effectif.sql
check_existing_audit.sql
check_grants.sql
check_hierarchie.sql
check_liaisons.sql
check_password.sql
check_postes_structure.sql
check_president.sql
check_refs.sql
check_usage.sql
compat_views.sql
complement_conseil_etat.sql
complement_cour_cassation.sql
complement_cour_constitutionnelle.sql
convention_routes.txt
count-relations.js
count_tables.js
create_app_role.sql
create_audit_log.sql
create_entity_event.sql
create_meta_entity.sql
create_meta_permission_view.sql
create_notification_tables.sql
create_ordre_paiement.sql
creer-comptes-test-rbac-temp.js
creer-comptes-test-rbac-v2-temp.js
creer-comptes-test-rbac-v3-temp.js
creer_referentiel_greffes.sql
creer_referentiel_juridictions_militaires.sql
creer_referentiel_parquets.sql
creer_referentiel_tgi.sql
creer_referentiel_tribunaux_commerce.sql
creer_referentiel_tribunaux_enfants.sql
creer_referentiel_tribunaux_paix.sql
creer_referentiel_tribunaux_travail.sql
creer_rncj_rned.sql
creer_rnsj_v1.sql
creer_rnso_mngi.sql
creer_rnso_v2_generique.sql
[DIR] db
  [DIR] migrations
    [DIR] journal
  pngie.db
  pngie.db-shm
  pngie.db-wal
  pngie_avant_gmp.db
  pngie_avant_migration_institutions.db
  pngie_avant_migration_institutions.db-shm
  pngie_avant_migration_institutions.db-wal
  pngie_avant_organismes.db
  pngie_avant_test_batch3.db
  schema.sql
  schema.sqlite.sql
  seed-extension.js
  seed.js
db_js.txt
db_url.txt
detect-triggers.js
[DIR] docs
  [DIR] architecture
    ANALYSE_RNI_ET_DOMAINES_20260807.txt
    ANALYSE_ROUTES_GENEREES_20260808.txt
    ARCHITECTURE_V2.md
    INVENTAIRE_BRUT_20260807.txt
    VERIF_DEPENDANCE_JOURNAL_RNSJ_20260808.txt
  [DIR] audits
    AUDIT_DASHBOARD_INSTITUTIONNEL.md
    AUDIT_RLS_PRE_SWITCH.md
    BUG_G_POLICY_BACKUP_AVANT_PATCH.json
    BUG_G_RLS_SCOPE_NATIONAL.md
  E2E_SECURITE_VALIDATION.md
  PNGIE-Secure-API-v1.0.md
  RLS_MIGRATION_PLAN_v1.md
  [DIR] specs
    Journal_National_Spec_v1.md
  [DIR] standard
    PNGIE_Secure_API_v1.0.md
    PNGIE_SIRH_Schemas_v1.0.md
  [DIR] vision
    PNGIE_Roadmap_v1.0.md
ecriture_comptable.txt
enrichir_cours_appel_j5.sql
enrichir_cours_militaires.sql
enrichir_haute_cour_militaire.sql
event_engine.txt
extract_schema.js
find-an-gv-temp.js
find-institutions-test-temp.js
fix-congres-temp.js
fix-type-ministere-temp.js
fix_avocat_general.sql
fix_doublon_min_finances.sql
fix_institution_policy.sql
fix_institution_rls.sql
fix_nb_juges_cour_constitutionnelle.sql
fix_password.sql
fix_permission_code.sql
fn_entite_existe.sql
gouv_domaine01_ddl.sql
government-builder.js
government-builder.js.bak-20260802-230303
government_builder.txt
grant-fix-temp.js
grant_mi_ordre_paiement.sql
hash_chaine_journal_audit.sql
insert_test_notif_rule.sql
inspect_audit.sql
inspect_dir_cassation.sql
integrer_rntgi_serie1a5.sql
inventaire-tables-utilisees-temp.js
ligne_budgetaire.txt
list-accounts.js
list-all-tables-temp.js
list-comptes.js
list-ministeres.js
liste_fichiers_js.txt
liste_tables.txt
list_tables.js
list_tables_v2.js
login-payload.json
login_test.json
migrate_data.js
migration-institution-relation-temp.js
[DIR] migrations_rls
  000_precheck.sql
  001_create_pngie_app.sql
  002_grants_pngie_app.sql
  003_validation.sql
  004_test_transactionnel.sql
  005_revoke_and_regrant.sql
  006_postcheck.sql
  resultat_003.txt
  resultat_004.txt
  resultat_005.txt
migration_report.txt
min8_orga.json
ministeres.txt
nocode-runtime.html
nomdufichier.txt
package-lock.json
package.json
patch-agent-personneid-temp.js
patch-db-transaction-temp.js
patch-sendsuccess-temp.js
permis.json
pg_schema_output.txt
phase1_schemas.txt
pngie_app_grants_backup.txt
pngie_rdc_backup.dump
pngie_snapshot.dump
populate_aff_etrangeres_et_min0_dg.sql
populate_auditorats_cours_militaires.sql
populate_auditorats_cours_militaires_v2.sql
populate_auditorat_general_fardc.sql
populate_cours_appel.sql
populate_dgda.sql
populate_dgi.sql
populate_dgrad.sql
populate_direction_budget.sql
populate_juridictions_militaires.sql
populate_lot_complet_corrige.sql
populate_min_affaires_coutumieres.sql
populate_min_finances.sql
populate_tmg_et_auditorats.sql
populate_tresor_comptabilite.sql
[DIR] public
  index.html
  index_ancien_backup_20260728_224717.html
  [DIR] _archive_20260728_233559
    index.html.bak
    index_avant_reconnexion.html
    index_corrige_temp.html
r0.txt
rapport_e2e_securite_2026-08-06.txt
rattacher-institutions-constit-temp.js
RECAP_SESSION_2026-08-02.md
RECAP_SESSION_2026-08-02_PM.md
regenerate_all.js
relations_output.txt
remove_bypass.sql
reset-test-password.js
restore_bypass.sql
resultat.txt
resultat_apres_patch_bug_g.txt
resultat_final.txt
resultat_tap.txt
resultat_tap2.txt
resultat_tap4.txt
RESUME_SESSION_03-08-2026_suite.md
rh_existant.txt
rh_resultat.txt
rh_route.txt
rnsj_resultat.txt
rntgi_resultat.txt
rotate-pg-password.ps1
[DIR] routes-generated
  accord_cooperation.routes.js
  affectation.routes.js
  agent.routes.js
  agent.routes.js.backup_20260803_225430
  annuaire.routes.js
  appel_offres.routes.js
  arborescence.routes.js
  autorisation_industrielle.routes.js
  bien_culturel_protege.routes.js
  bien_patrimonial.routes.js
  certificat_pki.routes.js
  corps.routes.js
  decision_gouvernementale.routes.js
  decision_institutionnelle.routes.js
  declaration_douaniere.routes.js
  declaration_fiscale.routes.js
  dossier_administratif.routes.js
  dossier_agent_rh.routes.js
  dossier_entreprise.routes.js
  dossier_judiciaire.routes.js
  dossier_logistique_defense.routes.js
  dossier_projet_investissement.routes.js
  dossier_recouvrement.routes.js
  dossier_scolaire.routes.js
  ecriture_comptable.routes.js
  enquete_statistique.routes.js
  etude_impact_environnemental.routes.js
  exploitation_agricole.routes.js
  facture.routes.js
  federation_sportive.routes.js
  grade.routes.js
  immatriculation_vehicule.routes.js
  incident_securitaire.routes.js
  institutions_dashboard.routes.js
  institutions_fiche.routes.js
  institutions_validation.routes.js
  licence_commerciale.routes.js
  licence_telecom.routes.js
  ligne_budgetaire.routes.js
  me_poste.routes.js
  ordre_paiement.routes.js
  permis_minier.routes.js
  plan_developpement.routes.js
  poste_hierarchie.routes.js
  projet_recherche.routes.js
  public_institutions.routes.js
  raccordement_energetique.routes.js
  reclamation_citoyenne.routes.js
  relations.routes.js
  signalement_sanitaire.routes.js
rule_engine.txt
sample_data.js
schema_cible.js
schema_migration_cible.txt
schema_output.txt
schema_part1.sql
schema_part2.sql
schema_part3.sql
schema_part4.sql
schema_part5.sql
schema_sqlite.txt
[DIR] scripts
  apply-patch-bug-g.js
  assign-test-roles.js
  audit-complet-pngie.js
  backup-policy-personne-role.js
  check-journal-tables.js
  check-owner.js
  decode-token.js
  diag-person-role-table.js
  diag-person-table.js
  diag-rls-personne-role.js
  diag-rls-visibility.js
  diag-roles.js
  diag-roles2.js
  fix-003-and-continue.js
  fix-003-v2-and-continue.js
  fix-003-v3-and-continue.js
  fix-and-rerun-journal-migrations.js
  inspect-fix-004-and-continue.js
  inspect-rls-fonctions-reelles.js
  inspect-tables-referencees.js
  inventaire-schema-db.js
  investigate-audit-triggers.js
  investigate-journal-audit.js
  loadtest.js
  reset-postgres-password.js
  reset-test-users.js
  run-journal-migrations.js
  verif-dependance-journal.js
  verif-dependance-journal2.js
  verif-journal-tables-superuser.js
  verify-test-users.js
security_engine.txt
server_err.log
server_js.txt
server_js_contenu.txt
server_log.txt
server_out.log
service-err.log
service-out.log
set_app_bypass_rls.sql
show_policies.sql
[DIR] src
  aiAgent.js
  db.js
  [DIR] domains
    [DIR] auth
    [DIR] common
    [DIR] documents
    [DIR] finances
    [DIR] governance
    [DIR] ia
    [DIR] institutions
    [DIR] interoperability
    [DIR] journal
    [DIR] marches
    [DIR] patrimoine
    [DIR] recherche
    [DIR] rnsj
    [DIR] rnso
    [DIR] workflow
  event-engine.js
  [DIR] lib
    audit.js
    errors.js
  [DIR] middleware
    requireAuth.js
    resoudreRoleDepuisJWT.js
    validation.js
    validerCorps.js
  notification-engine.js
  rateLimiter.js
  request-context.js
  rni-commandement-routes.js
  rule-engine.js
  [DIR] security
    hierarchy-service.js
    resource-resolver.js
    scope-engine.js
    scope-resolver.js
  security-engine.js
  server.js
  [DIR] services
    institution-authority.js
  workflow-engine.js
structure_backend.txt
suppression_doublons.sql
tables-utilisees.txt
tables_avec_donnees.txt
test-8restants-temp.js
test-affectation-scope-temp.js
test-affectation-scope-v2-temp.js
test-agent-scope-temp.js
test-agent-scope-v2-temp.js
test-agentsrh-crud-temp.js
test-connexion-pngie-app-temp.js
test-decision-temp.js
test-e2e-multi-institution.js
test-forme-reponse-temp.js
test-payload.json
test-rattachement-constit-temp.js
test-rls-reel-temp.js
test-scope-approfondi-temp.js
test-scope-compact-temp.js
test-scope-e2e-temp.js
test-toutes-institutions-temp.js
[DIR] tests
  auth.test.js
  [DIR] e2e
    .token-cache.json
    001_login.test.js
    002_rbac.test.js
    003_scoperesolver.test.js
    004_postes.test.js
    005_affectations.test.js
    006_agents.test.js
    helpers.js
  extension.test.js
  governance.test.js
  helpers.js
  nocode.test.js
  rbac.test.js
test_fn_existe.sql
test_hierarchie.sql
test_protection.sql
UserspcDesktopcolonnes_31_modules.txtSELECT
verifier-organismes.js
verifier-seed.js
verify-copy-temp.js
verify-functions.js
verify-permissions-organigramme-temp.js
verif_audit_apres.sql
verif_audit_avant.sql
verif_chef.sql
verif_droits.sql
verif_droits2.sql
verif_final_blocA.sql
verif_finances.sql
verif_global.sql
verif_hash.sql
verif_hierarchie.sql
verif_rls.sql
verif_rollback.sql
verif_schema_rni.sql
verif_schema_rni2.sql
verif_schema_rni3.sql
verif_schema_rniA.sql
verif_schema_rniA2.sql
verif_vue_meta_permission.sql
views_output.txt
_all_ministeres.txt
_check_batch.txt
_check_type_unite.js
_diag_chantiers.js
_schema_output.txt
[DIR] _scratch
  diagnostic.js


## 2. Toutes les tables + colonnes + PK


### accord_cooperation
- accord_cooperation_id (uuid, NOT NULL)
- partenaire (text, NOT NULL)
- objet (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : accord_cooperation_id

### acte_historique
- id (bigint, NOT NULL)
- acte_id (uuid, NOT NULL)
- type_evenement (character varying, NOT NULL)
- valeur_avant (jsonb)
- valeur_apres (jsonb)
- modifie_par (uuid)
- created_at (timestamp with time zone, NOT NULL)
  PK : id

### acte_numerotation
- annee (smallint, NOT NULL)
- dernier_numero (integer, NOT NULL)
  PK : annee

### acte_officiel
- id (uuid, NOT NULL)
- numero_officiel (character varying)
- type_acte_id (integer, NOT NULL)
- institution_emettrice_id (uuid, NOT NULL)
- titre (character varying, NOT NULL)
- resume (text)
- contenu_texte (text)
- document_pdf_id (uuid)
- statut (character varying, NOT NULL)
- diffusion (character varying, NOT NULL)
- acte_reference_id (uuid)
- date_signature (timestamp with time zone)
- date_publication (timestamp with time zone)
- date_entree_vigueur (timestamp with time zone)
- cree_par (uuid, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- recherche_tsv (tsvector)
  PK : id

### acte_piece_jointe
- id (uuid, NOT NULL)
- acte_id (uuid, NOT NULL)
- document_id (uuid, NOT NULL)
- libelle (character varying)
- ordre (smallint, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : id

### acte_signature
- id (uuid, NOT NULL)
- acte_id (uuid, NOT NULL)
- signataire_id (uuid, NOT NULL)
- role_signataire (character varying)
- date_signature (timestamp with time zone, NOT NULL)
- hash_document (character varying, NOT NULL)
- certificat_ref (character varying)
- created_at (timestamp with time zone, NOT NULL)
  PK : id

### acte_workflow_transition
- id (integer, NOT NULL)
- type_acte_id (integer, NOT NULL)
- statut_origine (character varying, NOT NULL)
- statut_cible (character varying, NOT NULL)
- permission_requise (character varying, NOT NULL)
  PK : id

### affectation
- affectation_id (uuid, NOT NULL)
- personne_id (uuid, NOT NULL)
- poste_id (uuid, NOT NULL)
- type_affectation (character varying, NOT NULL)
- date_debut (date, NOT NULL)
- date_fin (date)
- texte_nomination (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : affectation_id

### agent
- agent_id (uuid, NOT NULL)
- nom (character varying, NOT NULL)
- prenom (character varying, NOT NULL)
- date_naissance (date, NOT NULL)
- matricule (character varying, NOT NULL)
- numero_identite_nationale (character varying)
- sexe (character varying, NOT NULL)
- email (character varying)
- telephone (character varying)
- institution_id (uuid, NOT NULL)
- grade_id (uuid)
- corps_id (uuid)
- personne_id (uuid)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : agent_id

### agent_ia
- agent_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- type_agent (character varying, NOT NULL)
- institution_id (uuid)
- modele_reference (character varying)
- perimetre_donnees (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : agent_id

### agent_ia_interaction
- interaction_id (uuid, NOT NULL)
- agent_id (uuid, NOT NULL)
- personne_id (uuid)
- requete (text, NOT NULL)
- reponse (text)
- entite_liee (character varying)
- entite_liee_ref_id (uuid)
- created_at (timestamp with time zone, NOT NULL)
  PK : interaction_id

### appel_offres
- appel_offres_id (uuid, NOT NULL)
- institution (text, NOT NULL)
- objet (text, NOT NULL)
- montant_estime (numeric)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : appel_offres_id

### audit_log
- log_id (bigint, NOT NULL)
- person_id (uuid)
- action (character varying, NOT NULL)
- entite (character varying, NOT NULL)
- entite_id (text)
- detail (jsonb)
- hash_prec (character, NOT NULL)
- hash_actuel (character, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : log_id

### autorisation_industrielle
- autorisation_industrielle_id (uuid, NOT NULL)
- entreprise (text, NOT NULL)
- type_installation (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : autorisation_industrielle_id

### bien_culturel_protege
- bien_culturel_protege_id (uuid, NOT NULL)
- designation (text, NOT NULL)
- type_bien (text, NOT NULL)
- localisation (text)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : bien_culturel_protege_id

### bien_patrimonial
- bien_patrimonial_id (uuid, NOT NULL)
- designation (text, NOT NULL)
- type_bien (text, NOT NULL)
- institution_affectataire (text)
- valeur_estimee (numeric)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : bien_patrimonial_id

### certificat_pki
- certificat_pki_id (uuid, NOT NULL)
- agent_concerne (text, NOT NULL)
- usage (text, NOT NULL)
- duree (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : certificat_pki_id

### competence
- competence_id (uuid, NOT NULL)
- institution_id (uuid)
- libelle (character varying, NOT NULL)
- description (text)
- niveau_confiance (character varying, NOT NULL)
- pourcentage_confiance (integer)
- participe_calculs (boolean)
- source_document (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : competence_id

### corps
- corps_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- intitule (character varying, NOT NULL)
- description (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : corps_id

### decision_action
- action_id (uuid, NOT NULL)
- decision_id (uuid, NOT NULL)
- institution_id (uuid, NOT NULL)
- statut (character varying, NOT NULL)
- taux_execution (integer, NOT NULL)
- commentaire (text)
- date_echeance (date)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : action_id

### decision_gouvernementale
- decision_id (uuid, NOT NULL)
- emetteur_institution_id (uuid, NOT NULL)
- titre (character varying, NOT NULL)
- description (text)
- date_emission (date, NOT NULL)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : decision_id

### decision_institutionnelle
- decision_institutionnelle_id (uuid, NOT NULL)
- objet (text, NOT NULL)
- type (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : decision_institutionnelle_id

### declaration_douaniere
- declaration_douaniere_id (uuid, NOT NULL)
- declarant (text, NOT NULL)
- nature_marchandise (text, NOT NULL)
- regime (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : declaration_douaniere_id

### declaration_fiscale
- declaration_fiscale_id (uuid, NOT NULL)
- contribuable (text, NOT NULL)
- type_impot (text, NOT NULL)
- montant_declare (numeric)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : declaration_fiscale_id

### delegation_perimetre
- delegation_perimetre_id (uuid, NOT NULL)
- delegation_id (uuid, NOT NULL)
- institution_id (uuid, NOT NULL)
- entity (character varying, NOT NULL)
- action (character varying, NOT NULL)
- actif (boolean, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : delegation_perimetre_id

### delegation_pouvoir
- delegation_id (uuid, NOT NULL)
- delegant_id (uuid, NOT NULL)
- delegataire_id (uuid, NOT NULL)
- perimetre (text, NOT NULL)
- date_debut (timestamp with time zone, NOT NULL)
- date_fin (timestamp with time zone, NOT NULL)
- texte_reference (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : delegation_id

### document
- document_id (uuid, NOT NULL)
- type_document_id (uuid, NOT NULL)
- institution_id (uuid)
- titre (character varying, NOT NULL)
- reference (character varying)
- resume (text)
- contenu_texte (text)
- fichier_url (text)
- fichier_hash (text)
- langue (character varying)
- statut (character varying, NOT NULL)
- confidentialite (character varying, NOT NULL)
- auteur_id (uuid)
- date_publication (date)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- recherche_vecteur (tsvector)
  PK : document_id

### document_version
- version_id (uuid, NOT NULL)
- document_id (uuid, NOT NULL)
- numero_version (integer, NOT NULL)
- fichier_url (text, NOT NULL)
- fichier_hash (text, NOT NULL)
- modifie_par_id (uuid)
- commentaire_version (text)
- created_at (timestamp with time zone, NOT NULL)
  PK : version_id

### dossier_administratif
- dossier_administratif_id (uuid, NOT NULL)
- nature (text, NOT NULL)
- service_instructeur (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : dossier_administratif_id

### dossier_agent_rh
- dossier_agent_rh_id (uuid, NOT NULL)
- agent_concerne (text, NOT NULL)
- type_mouvement (character varying, NOT NULL)
- poste_vise (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : dossier_agent_rh_id

### dossier_entreprise
- dossier_entreprise_id (uuid, NOT NULL)
- raison_sociale (text, NOT NULL)
- secteur (text, NOT NULL)
- rccm (text)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : dossier_entreprise_id

### dossier_judiciaire
- dossier_judiciaire_id (uuid, NOT NULL)
- numero_dossier (text, NOT NULL)
- tribunal_id (text, NOT NULL)
- nature (text, NOT NULL)
- statut (text)
- date_ouverture (date, NOT NULL)
- ref_police_rdc (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : dossier_judiciaire_id

### dossier_logistique_defense
- dossier_logistique_defense_id (uuid, NOT NULL)
- unite_concernee (text, NOT NULL)
- nature_besoin (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : dossier_logistique_defense_id

### dossier_projet_investissement
- dossier_projet_investissement_id (uuid, NOT NULL)
- intitule (text, NOT NULL)
- institution_porteuse (text, NOT NULL)
- budget_previsionnel (numeric)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : dossier_projet_investissement_id

### dossier_recouvrement
- dossier_recouvrement_id (uuid, NOT NULL)
- contribuable (text, NOT NULL)
- montant_du (numeric)
- province (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : dossier_recouvrement_id

### dossier_scolaire
- dossier_scolaire_id (uuid, NOT NULL)
- etablissement (text, NOT NULL)
- type_dossier (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : dossier_scolaire_id

### ecriture_comptable
- ecriture_comptable_id (uuid, NOT NULL)
- compte (character varying, NOT NULL)
- libelle (text, NOT NULL)
- montant_debit (numeric)
- montant_credit (numeric)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : ecriture_comptable_id

### enquete_statistique
- enquete_statistique_id (uuid, NOT NULL)
- intitule (text, NOT NULL)
- institution_responsable (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : enquete_statistique_id

### entity_event
- event_id (uuid, NOT NULL)
- entity (character varying, NOT NULL)
- entity_id (text, NOT NULL)
- evenement (character varying, NOT NULL)
- donnees_avant (jsonb)
- donnees_apres (jsonb)
- utilisateur_id (uuid)
- created_at (timestamp with time zone, NOT NULL)
  PK : event_id

### entity_relation
- relation_id (uuid, NOT NULL)
- source_entity (character varying, NOT NULL)
- source_id (text, NOT NULL)
- relation (character varying, NOT NULL)
- target_entity (character varying, NOT NULL)
- target_id (text, NOT NULL)
- date_fin (timestamp with time zone)
- created_at (timestamp with time zone, NOT NULL)
  PK : relation_id

### entity_scope
- entity (character varying, NOT NULL)
- scope_type (character varying, NOT NULL)
- notes (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : entity

### etude_impact_environnemental
- etude_impact_environnemental_id (uuid, NOT NULL)
- porteur_projet (text, NOT NULL)
- localisation (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : etude_impact_environnemental_id

### execution_rapport
- rapport_id (uuid, NOT NULL)
- instruction_id (uuid, NOT NULL)
- institution_id (uuid, NOT NULL)
- redacteur_person_id (uuid)
- contenu (text, NOT NULL)
- taux_avancement (integer, NOT NULL)
- statut (text, NOT NULL)
- date_rapport (timestamp with time zone, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : rapport_id

### exploitation_agricole
- exploitation_agricole_id (uuid, NOT NULL)
- exploitant (text, NOT NULL)
- culture_principale (text, NOT NULL)
- superficie_ha (numeric)
- province (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : exploitation_agricole_id

### facture
- facture_id (uuid, NOT NULL)
- numero (text, NOT NULL)
- fournisseur (text, NOT NULL)
- montant (numeric)
- devise (text)
- date_emission (date, NOT NULL)
- date_echeance (date)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : facture_id

### federation_sportive
- federation_sportive_id (uuid, NOT NULL)
- denomination (text, NOT NULL)
- discipline (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : federation_sportive_id

### fiche_tome
- fiche_id (uuid, NOT NULL)
- institution_id (uuid, NOT NULL)
- identification (text)
- base_juridique (text)
- mission (text)
- attributions (text)
- organisation_officielle (text)
- postes_officiels (text)
- roles_responsabilites (text)
- processus_metier (text)
- objets_metier (text)
- documents (text)
- relations_interinstitutionnelles (text)
- indicateurs (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : fiche_id

### fonction
- fonction_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
- categorie (character varying, NOT NULL)
- niveau_hierarchique (integer, NOT NULL)
- description (text)
- types_institution_applicables (ARRAY)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : fonction_id

### grade
- grade_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- intitule (character varying, NOT NULL)
- niveau_hierarchique (integer)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : grade_id

### immatriculation_vehicule
- immatriculation_vehicule_id (uuid, NOT NULL)
- proprietaire (text, NOT NULL)
- type_vehicule (text, NOT NULL)
- numero_chassis (text)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : immatriculation_vehicule_id

### incident_securitaire
- incident_securitaire_id (uuid, NOT NULL)
- nature (text, NOT NULL)
- localisation (text, NOT NULL)
- gravite (text)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : incident_securitaire_id

### index_recherche_global
- index_id (uuid, NOT NULL)
- type_entite (character varying, NOT NULL)
- entite_ref_id (uuid, NOT NULL)
- titre (character varying, NOT NULL)
- extrait (text)
- institution_id (uuid)
- recherche_vecteur (tsvector, NOT NULL)
- date_reference (timestamp with time zone)
- updated_at (timestamp with time zone, NOT NULL)
  PK : index_id

### indicateur
- indicateur_id (uuid, NOT NULL)
- institution_id (uuid)
- libelle (character varying, NOT NULL)
- unite_mesure (character varying)
- valeur (numeric)
- periode (character varying)
- niveau_confiance (character varying, NOT NULL)
- pourcentage_confiance (integer)
- participe_calculs (boolean)
- source_document (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : indicateur_id

### institution
- institution_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- sigle (character varying)
- type_institution (character varying, NOT NULL)
- institution_parent_id (uuid)
- niveau_hierarchique (integer, NOT NULL)
- description (text)
- adresse (text)
- latitude (numeric)
- longitude (numeric)
- telephone (character varying)
- email (character varying)
- site_web (character varying)
- statut (character varying, NOT NULL)
- date_creation_legale (date)
- texte_creation (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : institution_id

### institution_relation
- institution_relation_id (uuid, NOT NULL)
- institution_source_id (uuid, NOT NULL)
- institution_cible_id (uuid, NOT NULL)
- type_relation (character varying, NOT NULL)
- priorite (integer)
- date_debut (date)
- date_fin (date)
- actif (boolean)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : institution_relation_id

### instruction
- instruction_id (uuid, NOT NULL)
- emetteur_institution_id (uuid, NOT NULL)
- emetteur_person_id (uuid)
- destinataire_institution_id (uuid, NOT NULL)
- objet (text, NOT NULL)
- description (text)
- priorite (text, NOT NULL)
- reference_juridique (text)
- date_emission (timestamp with time zone, NOT NULL)
- date_echeance (date)
- statut (text, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : instruction_id

### instruction_historique
- historique_id (uuid, NOT NULL)
- instruction_id (uuid, NOT NULL)
- ancien_statut (text)
- nouveau_statut (text, NOT NULL)
- person_id (uuid)
- commentaire (text)
- date_changement (timestamp with time zone, NOT NULL)
  PK : historique_id

### journal_audit
- audit_id (uuid, NOT NULL)
- personne_id (uuid)
- entite (character varying, NOT NULL)
- entite_ref_id (uuid)
- action (character varying, NOT NULL)
- valeurs_avant (jsonb)
- valeurs_apres (jsonb)
- adresse_ip (inet)
- user_agent (text)
- created_at (timestamp with time zone, NOT NULL)
- hash_prec (character)
- hash_actuel (character)
  PK : audit_id, created_at

### journal_audit_default
- audit_id (uuid, NOT NULL)
- personne_id (uuid)
- entite (character varying, NOT NULL)
- entite_ref_id (uuid)
- action (character varying, NOT NULL)
- valeurs_avant (jsonb)
- valeurs_apres (jsonb)
- adresse_ip (inet)
- user_agent (text)
- created_at (timestamp with time zone, NOT NULL)
- hash_prec (character)
- hash_actuel (character)
  PK : audit_id, created_at

### journal_connexion
- connexion_id (uuid, NOT NULL)
- personne_id (uuid)
- email_tente (character varying)
- adresse_ip (inet)
- resultat (character varying, NOT NULL)
- user_agent (text)
- created_at (timestamp with time zone, NOT NULL)
  PK : connexion_id

### licence_commerciale
- licence_commerciale_id (uuid, NOT NULL)
- titulaire (text, NOT NULL)
- activite (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : licence_commerciale_id

### licence_telecom
- licence_telecom_id (uuid, NOT NULL)
- operateur (text, NOT NULL)
- type_service (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : licence_telecom_id

### ligne_budgetaire
- ligne_budgetaire_id (uuid, NOT NULL)
- exercice (character varying, NOT NULL)
- programme (text)
- montant_alloue (numeric)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : ligne_budgetaire_id

### manuel_architecture
- chapitre_id (character varying, NOT NULL)
- numero_chapitre (integer, NOT NULL)
- institution (character varying, NOT NULL)
- titre_chapitre (character varying, NOT NULL)
- contenu_narratif (text, NOT NULL)
- recherche_vecteur (tsvector)
- created_at (timestamp with time zone, NOT NULL)
  PK : chapitre_id

### meta_attribute
- attribute_id (text, NOT NULL)
- entity_id (uuid, NOT NULL)
- nom (text, NOT NULL)
- nom_colonne (text, NOT NULL)
- type (text, NOT NULL)
- longueur (integer)
- obligatoire (integer)
- unique_flag (integer)
- valeur_defaut (text)
- ordre (integer)
  PK : attribute_id

### meta_entity
- entity_id (uuid, NOT NULL)
- nom_table (character varying, NOT NULL)
- pk_column (character varying, NOT NULL)
- libelle (character varying)
- created_at (timestamp with time zone, NOT NULL)
  PK : entity_id

### meta_notification_rule
- rule_id (uuid, NOT NULL)
- entite (character varying, NOT NULL)
- evenement (character varying, NOT NULL)
- condition_json (jsonb, NOT NULL)
- message_template (text, NOT NULL)
- canal (character varying, NOT NULL)
- destinataire_role_code (character varying, NOT NULL)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : rule_id

### meta_rule
- rule_id (uuid, NOT NULL)
- entite (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- description (text)
- evenement (character varying, NOT NULL)
- condition_json (jsonb, NOT NULL)
- message_erreur (text, NOT NULL)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : rule_id

### meta_workflow_transition
- transition_id (uuid, NOT NULL)
- entite (character varying, NOT NULL)
- from_statut (character varying, NOT NULL)
- to_statut (character varying, NOT NULL)
- role_code_requis (character varying)
- condition_json (jsonb)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : transition_id

### multi_institution_participant
- participant_id (uuid, NOT NULL)
- entity_type (character varying, NOT NULL)
- entity_id (uuid, NOT NULL)
- institution_id (uuid, NOT NULL)
- role_participant (character varying, NOT NULL)
- date_ajout (timestamp with time zone, NOT NULL)
  PK : participant_id

### nocode_formulaire
- formulaire_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- workflow_id (uuid)
- schema_champs (jsonb, NOT NULL)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : formulaire_id

### nocode_workflow
- workflow_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- institution_id (uuid)
- description (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : workflow_id

### nocode_workflow_etape
- etape_id (uuid, NOT NULL)
- workflow_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- ordre (integer, NOT NULL)
- role_metier_id (uuid)
- type_etape (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : etape_id

### nocode_workflow_instance
- instance_id (uuid, NOT NULL)
- workflow_id (uuid, NOT NULL)
- etape_courante_id (uuid)
- donnees (jsonb, NOT NULL)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : instance_id

### notification
- notification_id (uuid, NOT NULL)
- destinataire_id (uuid, NOT NULL)
- type_notification (character varying, NOT NULL)
- canal (character varying, NOT NULL)
- titre (character varying, NOT NULL)
- contenu (text)
- entite_liee (character varying)
- entite_liee_ref_id (uuid)
- lu (boolean, NOT NULL)
- date_envoi (timestamp with time zone)
- date_lecture (timestamp with time zone)
- created_at (timestamp with time zone, NOT NULL)
  PK : notification_id

### ordre_paiement
- ordre_paiement_id (uuid, NOT NULL)
- beneficiaire (character varying, NOT NULL)
- montant (numeric, NOT NULL)
- statut (character varying, NOT NULL)
- valide_par_budget (character varying)
- valide_par_finances (character varying)
- valide_par_primature (character varying)
- valide_par_presidence (character varying)
- valide_par_igf (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone)
- institution_id (uuid, NOT NULL)
  PK : ordre_paiement_id

### organization_type
- id (integer, NOT NULL)
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
- pouvoir_id (integer)
  PK : id

### permis_minier
- permis_minier_id (uuid, NOT NULL)
- entreprise (text, NOT NULL)
- substance (text, NOT NULL)
- localisation (text, NOT NULL)
- justification (text)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : permis_minier_id

### permission
- permission_id (uuid, NOT NULL)
- role_id (uuid, NOT NULL)
- entite (character varying, NOT NULL)
- action (character varying, NOT NULL)
- condition_json (jsonb)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- code (text)
  PK : permission_id

### personne
- personne_id (uuid, NOT NULL)
- matricule (character varying)
- nom (character varying, NOT NULL)
- prenom (character varying, NOT NULL)
- date_naissance (date)
- lieu_naissance (character varying)
- sexe (character)
- numero_identite_nationale (character varying)
- email (character varying)
- telephone (character varying)
- photo_url (text)
- password_hash (text, NOT NULL)
- mfa_active (boolean, NOT NULL)
- mfa_secret (text)
- langue_preferee (character varying, NOT NULL)
- fuseau_horaire (character varying, NOT NULL)
- statut (character varying, NOT NULL)
- date_derniere_connexion (timestamp with time zone)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- tentatives_echouees (integer, NOT NULL)
- verrouille_jusqu_a (timestamp with time zone)
  PK : personne_id

### personne_role
- personne_role_id (uuid, NOT NULL)
- personne_id (uuid, NOT NULL)
- role_id (uuid, NOT NULL)
- scope_institution_id (uuid)
- date_attribution (timestamp with time zone, NOT NULL)
- date_expiration (timestamp with time zone)
- statut (character varying, NOT NULL)
  PK : personne_role_id

### plan_developpement
- plan_developpement_id (uuid, NOT NULL)
- intitule (text, NOT NULL)
- portee (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : plan_developpement_id

### poste
- poste_id (uuid, NOT NULL)
- unite_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- intitule (character varying, NOT NULL)
- poste_hierarchique_id (uuid)
- niveau_hierarchique (integer, NOT NULL)
- categorie (character varying)
- missions (text)
- attributions (text)
- responsabilites (text)
- competences_requises (text)
- nombre_postes_autorises (integer, NOT NULL)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- niveau_confiance (character varying, NOT NULL)
- pourcentage_confiance (integer)
- participe_calculs (boolean)
  PK : poste_id

### poste_role_metier
- poste_id (uuid, NOT NULL)
- role_metier_id (uuid, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : poste_id, role_metier_id

### pouvoir
- pouvoir_id (integer, NOT NULL)
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
  PK : pouvoir_id

### processus
- processus_id (uuid, NOT NULL)
- institution_id (uuid)
- libelle (character varying, NOT NULL)
- description (text)
- niveau_confiance (character varying, NOT NULL)
- pourcentage_confiance (integer)
- participe_calculs (boolean)
- source_document (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : processus_id

### processus_etape
- etape_id (uuid, NOT NULL)
- processus_id (uuid, NOT NULL)
- ordre (integer, NOT NULL)
- libelle (character varying, NOT NULL)
- description (text)
- created_at (timestamp with time zone, NOT NULL)
  PK : etape_id

### projet_recherche
- projet_recherche_id (uuid, NOT NULL)
- institution_porteuse (text, NOT NULL)
- domaine (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : projet_recherche_id

### raccordement_energetique
- raccordement_energetique_id (uuid, NOT NULL)
- demandeur (text, NOT NULL)
- localisation (text, NOT NULL)
- type_raccordement (text, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : raccordement_energetique_id

### reclamation_citoyenne
- reclamation_citoyenne_id (uuid, NOT NULL)
- nom_plaignant (text, NOT NULL)
- objet (text, NOT NULL)
- institution_visee (text)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : reclamation_citoyenne_id

### ref_auditorat_militaire
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- type_auditorat (character varying, NOT NULL)
- juridiction_rattachement_ini (character varying)
- autorite_tutelle_ini (character varying)
- province (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_auditorat_militaire_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_casier_historique
- id (integer, NOT NULL)
- casier_ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_casier_judiciaire
- ini (character varying, NOT NULL)
- personne_id (uuid)
- identifiant_national (character varying)
- statut (character varying, NOT NULL)
- date_creation (date)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_condamnation
- id (integer, NOT NULL)
- casier_ini (character varying, NOT NULL)
- juridiction_code (character varying)
- reference_decision (character varying)
- date_decision (date)
- caractere_definitif (boolean, NOT NULL)
- nature (text)
- etat_execution (character varying, NOT NULL)
- date_execution (date)
- reference_acte (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : id

### ref_cour_appel
- ca_id (uuid, NOT NULL)
- institution_id (uuid)
- denomination_officielle (text, NOT NULL)
- acte_juridique_creation (text)
- date_acte (date)
- ressort_territorial (text)
- province (text)
- statut (text, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ca_id

### ref_cour_appel_historique
- historique_id (uuid, NOT NULL)
- ca_id (uuid, NOT NULL)
- champ_modifie (text, NOT NULL)
- ancienne_valeur (text)
- nouvelle_valeur (text)
- date_modification (timestamp with time zone, NOT NULL)
  PK : historique_id

### ref_execution_decision
- ini (character varying, NOT NULL)
- juridiction_code (character varying)
- reference_decision (character varying, NOT NULL)
- date_decision (date)
- caractere_definitif (boolean, NOT NULL)
- autorite_execution (text)
- type_execution (character varying)
- etat_execution (character varying, NOT NULL)
- reference_acte (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_execution_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_gouvernorat
- ini (character varying, NOT NULL)
- institution_id (uuid)
- province (character varying, NOT NULL)
- chef_lieu (character varying, NOT NULL)
- gouverneur_nom (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : ini

### ref_greffe
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- unite_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- juridiction_rattachement (character varying)
- ressort_territorial (text)
- greffier_chef_nom (text)
- effectifs_greffiers (integer)
- organisation_interne (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_greffe_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_juridiction_militaire
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- type_juridiction (character varying, NOT NULL)
- province (character varying)
- ville_siege (character varying)
- ressort_territorial (text)
- date_creation (date)
- reference_juridique (character varying)
- statut (character varying, NOT NULL)
- autorite_tutelle_ini (character varying)
- adresse (text)
- telephone (character varying)
- email (character varying)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_juridiction_militaire_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_parquet
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- unite_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- type_parquet (character varying, NOT NULL)
- juridiction_rattachement (character varying)
- ressort_territorial (text)
- procureur_responsable_nom (text)
- greffe_nom (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_parquet_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_tgi_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_tribunal_commerce
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- ressort_territorial (text)
- province (character varying)
- ville_siege (character varying)
- cour_appel_rattachement (character varying)
- chambres_specialisees (text)
- president_nom (text)
- greffier_chef_nom (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_tribunal_commerce_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_tribunal_enfants
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- ressort_territorial (text)
- province (character varying)
- ville_siege (character varying)
- cour_appel_rattachement (character varying)
- tgi_rattachement (character varying)
- president_nom (text)
- ministere_public_nom (text)
- greffier_chef_nom (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_tribunal_enfants_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_tribunal_grande_instance
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- ressort_territorial (text)
- province (character varying)
- ville_siege (character varying)
- cour_appel_rattachement (character varying)
- chambres_instituees (text)
- effectif_siege (integer)
- effectif_parquet (integer)
- effectif_greffe (integer)
- president_nom (text)
- procureur_republique_nom (text)
- greffier_chef_nom (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- niveau_preuve (character)
- province_administrative_actuelle (character varying)
- date_validation (date)
- valide_par (character varying)
  PK : ini

### ref_tribunal_militaire_garnison
- tmg_id (uuid, NOT NULL)
- institution_id (uuid)
- denomination_officielle (text, NOT NULL)
- acte_juridique_creation (text)
- date_acte (date)
- ressort_territorial (text)
- cour_militaire_rattachement_id (uuid)
- province (text)
- statut (text, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : tmg_id

### ref_tribunal_militaire_garnison_historique
- historique_id (uuid, NOT NULL)
- tmg_id (uuid, NOT NULL)
- champ_modifie (text, NOT NULL)
- ancienne_valeur (text)
- nouvelle_valeur (text)
- date_modification (timestamp with time zone, NOT NULL)
  PK : historique_id

### ref_tribunal_paix
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- ressort_territorial (text)
- province (character varying)
- ville_siege (character varying)
- tgi_rattachement (character varying)
- cour_appel_rattachement (character varying)
- president_nom (text)
- procureur_republique_nom (text)
- greffier_chef_nom (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_tribunal_paix_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### ref_tribunal_travail
- ini (character varying, NOT NULL)
- code_institution (character varying)
- institution_id (uuid)
- denomination_officielle (character varying, NOT NULL)
- ressort_territorial (text)
- province (character varying)
- ville_siege (character varying)
- cour_appel_rattachement (character varying)
- liste_assesseurs (text)
- president_nom (text)
- greffier_chef_nom (text)
- date_creation (date)
- reference_acte_juridique (character varying)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : ini

### ref_tribunal_travail_historique
- id (integer, NOT NULL)
- ini (character varying, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- reference_acte (character varying)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### referentiel_arborescence
- noeud_id (text, NOT NULL)
- code (text, NOT NULL)
- nom (text, NOT NULL)
- type (text, NOT NULL)
- parent_code (text)
- niveau (integer, NOT NULL)
- description (text)
- statut (text)
- created_at (text)
- updated_at (text)
  PK : noeud_id

### referentiel_national
- referentiel_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- institution_id (uuid)
- description (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : referentiel_id

### referentiel_national_item
- item_id (uuid, NOT NULL)
- section_id (uuid, NOT NULL)
- code_item (character varying)
- libelle (text, NOT NULL)
- metadata_json (jsonb)
- created_at (timestamp with time zone, NOT NULL)
  PK : item_id

### referentiel_national_section
- section_id (uuid, NOT NULL)
- referentiel_id (uuid, NOT NULL)
- numero_section (integer, NOT NULL)
- titre (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- code_officiel (character varying)
- contenu_texte (text)
  PK : section_id

### referentiel_niveau_national
- rang (integer)
- libelle_canonique (character varying, NOT NULL)
- source_document (character varying)
- hors_chaine_autorite (boolean)
- niveau_confiance (character varying, NOT NULL)
- pourcentage_confiance (integer)

### referentiel_poste_type
- type_poste_id (uuid, NOT NULL)
- code_rnp (character varying, NOT NULL)
- intitule (character varying, NOT NULL)
- categorie (character varying)
- niveau_hierarchique (integer)
- type_poste_parent_id (uuid)
- famille (character varying)
- statut (character varying)
- created_at (timestamp with time zone)
  PK : type_poste_id

### relation_interinstitutionnelle
- relation_id (uuid, NOT NULL)
- mode (character varying, NOT NULL)
- institution_source_id (uuid)
- institution_cible_id (uuid)
- type_source (character varying)
- type_cible (character varying)
- nature_relation (character varying, NOT NULL)
- echange_principal (text, NOT NULL)
- niveau_confiance (character varying, NOT NULL)
- pourcentage_confiance (integer)
- participe_calculs (boolean)
- source_document (character varying)
- created_at (timestamp with time zone, NOT NULL)
  PK : relation_id

### relation_type
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
- description (text)
- statut (character varying)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : code

### relations
- relations_id (text, NOT NULL)
- type_relation (text, NOT NULL)
- objet (text, NOT NULL)
- date_debut (text)
- date_fin (text)
- statut (text, NOT NULL)
- created_at (text)
- updated_at (text)
  PK : relations_id

### reorganisation_organisationnelle
- operation_id (uuid, NOT NULL)
- type_operation (character varying, NOT NULL)
- type_entite (character varying, NOT NULL)
- ancienne_entite_id (uuid)
- nouvelle_entite_id (uuid)
- motif (text, NOT NULL)
- texte_juridique (text)
- effectue_par (character varying, NOT NULL)
- date_operation (timestamp with time zone, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : operation_id

### rni_lien_hierarchique
- lien_id (uuid, NOT NULL)
- institution_id (uuid, NOT NULL)
- institution_parent_id (uuid, NOT NULL)
- type_lien (text, NOT NULL)
- reference_juridique (text)
- date_debut (date, NOT NULL)
- date_fin (date)
- statut (text, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : lien_id

### rnsj_modification
- id_modification (bigint, NOT NULL)
- id_rnsj_origine (bigint, NOT NULL)
- id_rnsj_modificateur (bigint, NOT NULL)
- type_relation (character varying, NOT NULL)
- date_effet (date)
- observations (text)
- created_at (timestamp with time zone, NOT NULL)
  PK : id_modification

### rnsj_relation
- id_relation (bigint, NOT NULL)
- id_rnsj (bigint, NOT NULL)
- table_cible (character varying, NOT NULL)
- id_cible (text, NOT NULL)
- code_cible (character varying)
- role (character varying, NOT NULL)
- date_effet (date)
- created_at (timestamp with time zone, NOT NULL)
  PK : id_relation

### rnsj_texte
- id_rnsj (bigint, NOT NULL)
- code_rnsj (character varying)
- nature (character varying, NOT NULL)
- reference_officielle (character varying, NOT NULL)
- titre (text)
- date_signature (date)
- date_publication (date)
- etat_juridique (character varying, NOT NULL)
- domaine (character varying, NOT NULL)
- objet (text)
- resume (text)
- texte_source_url (text)
- localisation_jo (character varying)
- niveau_preuve (character, NOT NULL)
- hash_document (character varying)
- date_validation (date)
- valide_par (character varying)
- observations (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : id_rnsj

### rnsj_texte_historique
- id_historique (bigint, NOT NULL)
- id_rnsj (bigint, NOT NULL)
- evenement (character varying, NOT NULL)
- valeurs_avant (jsonb)
- valeurs_apres (jsonb)
- modifie_par (character varying, NOT NULL)
- modifie_at (timestamp with time zone, NOT NULL)
  PK : id_historique

### rnso_affectation
- affectation_id (bigint, NOT NULL)
- poste_id (bigint, NOT NULL)
- personne_id (uuid)
- date_debut (date, NOT NULL)
- date_fin (date)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : affectation_id

### rnso_fonction
- fonction_id (bigint, NOT NULL)
- affectation_id (bigint)
- poste_id (bigint)
- libelle (character varying, NOT NULL)
- date_debut (date, NOT NULL)
- date_fin (date)
- created_at (timestamp with time zone, NOT NULL)
  PK : fonction_id

### rnso_historique
- id (bigint, NOT NULL)
- objet_type (character varying, NOT NULL)
- objet_id (bigint, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### rnso_modele
- modele_id (integer, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- domaine (character varying)
- type_institution_cible (character varying)
- description (text)
- version (integer, NOT NULL)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : modele_id

### rnso_modele_historique
- id (integer, NOT NULL)
- modele_id (integer, NOT NULL)
- type_evenement (character varying, NOT NULL)
- ancienne_valeur (jsonb)
- nouvelle_valeur (jsonb)
- commentaire (text)
- date_evenement (timestamp with time zone, NOT NULL)
  PK : id

### rnso_modele_poste
- id (integer, NOT NULL)
- modele_unite_id (integer, NOT NULL)
- code_poste (character varying, NOT NULL)
- intitule_poste (character varying, NOT NULL)
- nombre_postes_defaut (integer, NOT NULL)
  PK : id

### rnso_modele_unite
- id (integer, NOT NULL)
- modele_id (integer, NOT NULL)
- code_unite (character varying, NOT NULL)
- nom_unite (character varying, NOT NULL)
- type_unite (character varying, NOT NULL)
- ordre (integer)
  PK : id

### rnso_poste
- poste_id (bigint, NOT NULL)
- code_national (character varying)
- structure_id (bigint, NOT NULL)
- type_poste_id (integer, NOT NULL)
- intitule (character varying, NOT NULL)
- nombre_autorise (integer, NOT NULL)
- version (integer, NOT NULL)
- date_effet (date, NOT NULL)
- date_fin (date)
- etat (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : poste_id

### rnso_regle
- regle_id (integer, NOT NULL)
- type_structure_parent_id (integer, NOT NULL)
- type_structure_enfant_id (integer, NOT NULL)
- cardinalite_min (integer, NOT NULL)
- cardinalite_max (integer)
- commentaire (text)
  PK : regle_id

### rnso_structure
- structure_id (bigint, NOT NULL)
- code_national (character varying)
- institution_id (uuid, NOT NULL)
- parent_id (bigint)
- type_structure_id (integer, NOT NULL)
- nom (character varying, NOT NULL)
- modele_id (integer)
- version (integer, NOT NULL)
- date_creation (date, NOT NULL)
- date_effet (date, NOT NULL)
- date_fin (date)
- etat (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
  PK : structure_id

### rnso_type_poste
- id (integer, NOT NULL)
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
  PK : id

### rnso_type_structure
- id (integer, NOT NULL)
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
  PK : id

### role
- role_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- categorie (character varying)
- description (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : role_id

### role_metier
- role_metier_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
- categorie (character varying, NOT NULL)
- description (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : role_metier_id

### service_public
- service_id (uuid, NOT NULL)
- code_rnsp (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- categorie (character varying)
- description (text)
- institution_id (uuid)
- public_cible (character varying)
- delai_reglementaire (character varying)
- cout_eventuel (character varying)
- canal_prestation (character varying)
- niveau_confidentialite (character varying)
- signature_electronique_requise (boolean)
- paiement_electronique (boolean)
- statut (character varying)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)
  PK : service_id

### session_utilisateur
- session_id (uuid, NOT NULL)
- personne_id (uuid, NOT NULL)
- token_hash (text, NOT NULL)
- adresse_ip (inet)
- user_agent (text)
- date_debut (timestamp with time zone, NOT NULL)
- date_expiration (timestamp with time zone, NOT NULL)
- date_revocation (timestamp with time zone)
- statut (character varying, NOT NULL)
  PK : session_id

### signalement_sanitaire
- signalement_sanitaire_id (uuid, NOT NULL)
- etablissement (text, NOT NULL)
- type_alerte (text, NOT NULL)
- description (text, NOT NULL)
- date_constat (date, NOT NULL)
- statut (text)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- institution_id (uuid, NOT NULL)
  PK : signalement_sanitaire_id

### signature_electronique
- signature_id (uuid, NOT NULL)
- personne_id (uuid, NOT NULL)
- entite (character varying, NOT NULL)
- entite_ref_id (uuid, NOT NULL)
- type_signature (character varying, NOT NULL)
- empreinte_document (text, NOT NULL)
- certificat_reference (text)
- horodatage (timestamp with time zone, NOT NULL)
- adresse_ip (inet)
- statut (character varying, NOT NULL)
  PK : signature_id

### type_acte_ref
- id (integer, NOT NULL)
- code (character varying, NOT NULL)
- libelle (character varying, NOT NULL)
- ordre_affichage (smallint, NOT NULL)
- actif (boolean, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : id

### type_document
- type_document_id (uuid, NOT NULL)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- modele_url (text)
- duree_conservation_ans (integer)
- regle_archivage (text)
  PK : type_document_id

### unite_organisationnelle
- unite_id (uuid, NOT NULL)
- institution_id (uuid, NOT NULL)
- unite_parent_id (uuid)
- code (character varying, NOT NULL)
- nom (character varying, NOT NULL)
- type_unite (character varying, NOT NULL)
- niveau_hierarchique (integer, NOT NULL)
- mission (text)
- statut (character varying, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
- updated_at (timestamp with time zone, NOT NULL)
- niveau_confiance (character varying, NOT NULL)
- pourcentage_confiance (integer)
- participe_calculs (boolean)
  PK : unite_id

### validation
- validation_id (uuid, NOT NULL)
- entite (character varying, NOT NULL)
- entite_ref_id (uuid, NOT NULL)
- etape (character varying, NOT NULL)
- valideur_id (uuid)
- role_valideur_code (character varying)
- decision (character varying)
- commentaire (text)
- signature_electronique_id (uuid)
- date_echeance (timestamp with time zone)
- date_decision (timestamp with time zone)
- created_at (timestamp with time zone, NOT NULL)
  PK : validation_id

### verification
- verification_id (uuid, NOT NULL)
- rapport_id (uuid, NOT NULL)
- verificateur_person_id (uuid)
- verificateur_institution_id (uuid, NOT NULL)
- decision (text, NOT NULL)
- commentaire (text)
- date_verification (timestamp with time zone, NOT NULL)
- created_at (timestamp with time zone, NOT NULL)
  PK : verification_id


## 3. Toutes les clés étrangères

- acte_historique.modifie_par -> personne.personne_id
- acte_historique.acte_id -> acte_officiel.id
- acte_officiel.acte_reference_id -> acte_officiel.id
- acte_officiel.institution_emettrice_id -> institution.institution_id
- acte_officiel.type_acte_id -> type_acte_ref.id
- acte_officiel.document_pdf_id -> document.document_id
- acte_officiel.cree_par -> personne.personne_id
- acte_piece_jointe.document_id -> document.document_id
- acte_piece_jointe.acte_id -> acte_officiel.id
- acte_signature.acte_id -> acte_officiel.id
- acte_signature.signataire_id -> personne.personne_id
- acte_workflow_transition.type_acte_id -> type_acte_ref.id
- affectation.personne_id -> personne.personne_id
- affectation.poste_id -> poste.poste_id
- agent.personne_id -> personne.personne_id
- agent.institution_id -> institution.institution_id
- agent_ia.institution_id -> institution.institution_id
- agent_ia_interaction.personne_id -> personne.personne_id
- agent_ia_interaction.agent_id -> agent_ia.agent_id
- appel_offres.institution_id -> institution.institution_id
- autorisation_industrielle.institution_id -> institution.institution_id
- bien_culturel_protege.institution_id -> institution.institution_id
- bien_patrimonial.institution_id -> institution.institution_id
- certificat_pki.institution_id -> institution.institution_id
- competence.institution_id -> institution.institution_id
- decision_action.decision_id -> decision_gouvernementale.decision_id
- decision_action.institution_id -> institution.institution_id
- decision_gouvernementale.emetteur_institution_id -> institution.institution_id
- decision_institutionnelle.institution_id -> institution.institution_id
- declaration_douaniere.institution_id -> institution.institution_id
- declaration_fiscale.institution_id -> institution.institution_id
- delegation_perimetre.delegation_id -> delegation_pouvoir.delegation_id
- delegation_perimetre.institution_id -> institution.institution_id
- delegation_pouvoir.delegataire_id -> personne.personne_id
- delegation_pouvoir.delegant_id -> personne.personne_id
- document.type_document_id -> type_document.type_document_id
- document.institution_id -> institution.institution_id
- document.auteur_id -> personne.personne_id
- document_version.modifie_par_id -> personne.personne_id
- document_version.document_id -> document.document_id
- dossier_administratif.institution_id -> institution.institution_id
- dossier_agent_rh.institution_id -> institution.institution_id
- dossier_entreprise.institution_id -> institution.institution_id
- dossier_judiciaire.institution_id -> institution.institution_id
- dossier_logistique_defense.institution_id -> institution.institution_id
- dossier_recouvrement.institution_id -> institution.institution_id
- dossier_scolaire.institution_id -> institution.institution_id
- ecriture_comptable.institution_id -> institution.institution_id
- enquete_statistique.institution_id -> institution.institution_id
- etude_impact_environnemental.institution_id -> institution.institution_id
- execution_rapport.institution_id -> institution.institution_id
- execution_rapport.instruction_id -> instruction.instruction_id
- exploitation_agricole.institution_id -> institution.institution_id
- facture.institution_id -> institution.institution_id
- federation_sportive.institution_id -> institution.institution_id
- fiche_tome.institution_id -> institution.institution_id
- gouv_audit.responsable_id -> personne.personne_id
- gouv_audit_log.acteur_id -> personne.personne_id
- gouv_comite.secretaire_id -> personne.personne_id
- gouv_comite.president_id -> personne.personne_id
- gouv_commentaire.auteur_id -> personne.personne_id
- gouv_controle.responsable_id -> personne.personne_id
- gouv_controle.risque_id -> gouv_risque.risque_id
- gouv_decision.comite_id -> gouv_comite.comite_id
- gouv_directive.politique_id -> gouv_politique.politique_id
- gouv_historique_etat.acteur_id -> personne.personne_id
- gouv_kpi.objectif_id -> gouv_objectif.objectif_id
- gouv_mesure.kpi_id -> gouv_kpi.kpi_id
- gouv_mission.vision_id -> gouv_vision.vision_id
- gouv_mission.responsable_id -> personne.personne_id
- gouv_objectif.mission_id -> gouv_mission.mission_id
- gouv_objectif.responsable_id -> personne.personne_id
- gouv_piece_jointe.depose_par -> personne.personne_id
- gouv_politique.responsable_id -> personne.personne_id
- gouv_programme.responsable_id -> personne.personne_id
- gouv_programme.objectif_id -> gouv_objectif.objectif_id
- gouv_projet.chef_projet_id -> personne.personne_id
- gouv_projet.programme_id -> gouv_programme.programme_id
- gouv_recommandation.responsable_id -> personne.personne_id
- gouv_recommandation.audit_id -> gouv_audit.audit_id
- gouv_regle.politique_id -> gouv_politique.politique_id
- gouv_version.cree_par -> personne.personne_id
- gouv_vision.modifie_par -> personne.personne_id
- gouv_vision.cree_par -> personne.personne_id
- immatriculation_vehicule.institution_id -> institution.institution_id
- incident_securitaire.institution_id -> institution.institution_id
- index_recherche_global.institution_id -> institution.institution_id
- indicateur.institution_id -> institution.institution_id
- institution.institution_parent_id -> institution.institution_id
- institution_relation.institution_source_id -> institution.institution_id
- institution_relation.institution_cible_id -> institution.institution_id
- institution_relation.type_relation -> relation_type.code
- instruction.destinataire_institution_id -> institution.institution_id
- instruction.emetteur_institution_id -> institution.institution_id
- instruction_historique.instruction_id -> instruction.instruction_id
- journal_audit.personne_id -> personne.personne_id
- journal_audit.personne_id -> personne.personne_id
- journal_audit.personne_id -> personne.personne_id
- journal_audit.personne_id -> personne.personne_id
- journal_audit_default.personne_id -> personne.personne_id
- journal_audit_default.personne_id -> personne.personne_id
- journal_audit_default.personne_id -> personne.personne_id
- journal_audit_default.personne_id -> personne.personne_id
- journal_connexion.personne_id -> personne.personne_id
- licence_commerciale.institution_id -> institution.institution_id
- licence_telecom.institution_id -> institution.institution_id
- ligne_budgetaire.institution_id -> institution.institution_id
- meta_attribute.entity_id -> meta_entity.entity_id
- meta_workflow_transition.role_code_requis -> role.code
- multi_institution_participant.institution_id -> institution.institution_id
- nocode_formulaire.workflow_id -> nocode_workflow.workflow_id
- nocode_workflow.institution_id -> institution.institution_id
- nocode_workflow_etape.role_metier_id -> role_metier.role_metier_id
- nocode_workflow_etape.workflow_id -> nocode_workflow.workflow_id
- nocode_workflow_instance.etape_courante_id -> nocode_workflow_etape.etape_id
- nocode_workflow_instance.workflow_id -> nocode_workflow.workflow_id
- notification.destinataire_id -> personne.personne_id
- ordre_paiement.institution_id -> institution.institution_id
- organization_type.pouvoir_id -> pouvoir.pouvoir_id
- permis_minier.institution_id -> institution.institution_id
- permission.role_id -> role.role_id
- personne_role.scope_institution_id -> institution.institution_id
- personne_role.role_id -> role.role_id
- personne_role.personne_id -> personne.personne_id
- poste.unite_id -> unite_organisationnelle.unite_id
- poste.poste_hierarchique_id -> poste.poste_id
- poste_role_metier.role_metier_id -> role_metier.role_metier_id
- poste_role_metier.poste_id -> poste.poste_id
- processus.institution_id -> institution.institution_id
- processus_etape.processus_id -> processus.processus_id
- raccordement_energetique.institution_id -> institution.institution_id
- reclamation_citoyenne.institution_id -> institution.institution_id
- ref_auditorat_militaire.autorite_tutelle_ini -> ref_auditorat_militaire.ini
- ref_auditorat_militaire.juridiction_rattachement_ini -> ref_juridiction_militaire.ini
- ref_auditorat_militaire.institution_id -> institution.institution_id
- ref_condamnation.casier_ini -> ref_casier_judiciaire.ini
- ref_cour_appel.institution_id -> institution.institution_id
- ref_cour_appel_historique.ca_id -> ref_cour_appel.ca_id
- ref_gouvernorat.institution_id -> institution.institution_id
- ref_greffe.institution_id -> institution.institution_id
- ref_greffe.unite_id -> unite_organisationnelle.unite_id
- ref_juridiction_militaire.autorite_tutelle_ini -> ref_juridiction_militaire.ini
- ref_juridiction_militaire.institution_id -> institution.institution_id
- ref_parquet.unite_id -> unite_organisationnelle.unite_id
- ref_parquet.institution_id -> institution.institution_id
- ref_tribunal_commerce.institution_id -> institution.institution_id
- ref_tribunal_enfants.institution_id -> institution.institution_id
- ref_tribunal_grande_instance.institution_id -> institution.institution_id
- ref_tribunal_militaire_garnison.cour_militaire_rattachement_id -> institution.institution_id
- ref_tribunal_militaire_garnison.institution_id -> institution.institution_id
- ref_tribunal_militaire_garnison_historique.tmg_id -> ref_tribunal_militaire_garnison.tmg_id
- ref_tribunal_paix.institution_id -> institution.institution_id
- ref_tribunal_travail.institution_id -> institution.institution_id
- referentiel_national.institution_id -> institution.institution_id
- referentiel_national_item.section_id -> referentiel_national_section.section_id
- referentiel_national_section.referentiel_id -> referentiel_national.referentiel_id
- referentiel_poste_type.type_poste_parent_id -> referentiel_poste_type.type_poste_id
- relation_interinstitutionnelle.institution_cible_id -> institution.institution_id
- relation_interinstitutionnelle.institution_source_id -> institution.institution_id
- rni_lien_hierarchique.institution_id -> institution.institution_id
- rni_lien_hierarchique.institution_parent_id -> institution.institution_id
- rnsj_modification.id_rnsj_origine -> rnsj_texte.id_rnsj
- rnsj_modification.id_rnsj_modificateur -> rnsj_texte.id_rnsj
- rnsj_relation.id_rnsj -> rnsj_texte.id_rnsj
- rnsj_texte_historique.id_rnsj -> rnsj_texte.id_rnsj
- rnso_affectation.poste_id -> rnso_poste.poste_id
- rnso_fonction.affectation_id -> rnso_affectation.affectation_id
- rnso_fonction.poste_id -> rnso_poste.poste_id
- rnso_modele_poste.modele_unite_id -> rnso_modele_unite.id
- rnso_modele_unite.modele_id -> rnso_modele.modele_id
- rnso_poste.type_poste_id -> rnso_type_poste.id
- rnso_poste.structure_id -> rnso_structure.structure_id
- rnso_regle.type_structure_enfant_id -> rnso_type_structure.id
- rnso_regle.type_structure_parent_id -> rnso_type_structure.id
- rnso_structure.modele_id -> rnso_modele.modele_id
- rnso_structure.parent_id -> rnso_structure.structure_id
- rnso_structure.type_structure_id -> rnso_type_structure.id
- rnso_structure.institution_id -> institution.institution_id
- service_public.institution_id -> institution.institution_id
- session_utilisateur.personne_id -> personne.personne_id
- signalement_sanitaire.institution_id -> institution.institution_id
- signature_electronique.personne_id -> personne.personne_id
- unite_organisationnelle.unite_parent_id -> unite_organisationnelle.unite_id
- unite_organisationnelle.institution_id -> institution.institution_id
- validation.role_valideur_code -> role.code
- validation.valideur_id -> personne.personne_id
- verification.verificateur_institution_id -> institution.institution_id
- verification.rapport_id -> execution_rapport.rapport_id


## 4. Toutes les fonctions PL/pgSQL

- public.armor(bytea, text[], text[]) [c]
- public.armor(bytea) [c]
- public.crypt(text, text) [c]
- public.dearmor(text) [c]
- public.decrypt(bytea, bytea, text) [c]
- public.decrypt_iv(bytea, bytea, bytea, text) [c]
- public.digest(text, text) [c]
- public.digest(bytea, text) [c]
- public.encrypt(bytea, bytea, text) [c]
- public.encrypt_iv(bytea, bytea, bytea, text) [c]
- public.fn_accord_cooperation_set_updated_at() [plpgsql]
- public.fn_appel_offres_set_updated_at() [plpgsql]
- public.fn_audit_generique() [plpgsql]
- public.fn_autorisation_industrielle_set_updated_at() [plpgsql]
- public.fn_bien_culturel_protege_set_updated_at() [plpgsql]
- public.fn_bien_patrimonial_set_updated_at() [plpgsql]
- public.fn_certificat_pki_set_updated_at() [plpgsql]
- public.fn_chiffrer(valeur text) [plpgsql]
- public.fn_compte_verrouille(p_personne_id uuid) [plpgsql]
- public.fn_dechiffrer(valeur text) [plpgsql]
- public.fn_decision_institutionnelle_set_updated_at() [plpgsql]
- public.fn_declaration_douaniere_set_updated_at() [plpgsql]
- public.fn_declaration_fiscale_set_updated_at() [plpgsql]
- public.fn_detecter_anomalie_connexion() [plpgsql]
- public.fn_dossier_administratif_set_updated_at() [plpgsql]
- public.fn_dossier_agent_rh_set_updated_at() [plpgsql]
- public.fn_dossier_entreprise_set_updated_at() [plpgsql]
- public.fn_dossier_judiciaire_set_updated_at() [plpgsql]
- public.fn_dossier_logistique_defense_set_updated_at() [plpgsql]
- public.fn_dossier_projet_investissement_set_updated_at() [plpgsql]
- public.fn_dossier_recouvrement_set_updated_at() [plpgsql]
- public.fn_dossier_scolaire_set_updated_at() [plpgsql]
- public.fn_ecriture_comptable_set_updated_at() [plpgsql]
- public.fn_enquete_statistique_set_updated_at() [plpgsql]
- public.fn_enregistrer_echec_connexion(p_personne_id uuid) [plpgsql]
- public.fn_entite_existe(p_table text, p_id uuid) [plpgsql]
- public.fn_etude_impact_environnemental_set_updated_at() [plpgsql]
- public.fn_exploitation_agricole_set_updated_at() [plpgsql]
- public.fn_facture_set_updated_at() [plpgsql]
- public.fn_federation_sportive_set_updated_at() [plpgsql]
- public.fn_generer_numero_acte(p_annee smallint) [plpgsql]
- public.fn_hash_chaine_journal_audit() [plpgsql]
- public.fn_immatriculation_vehicule_set_updated_at() [plpgsql]
- public.fn_incident_securitaire_set_updated_at() [plpgsql]
- public.fn_indexer_document() [plpgsql]
- public.fn_institutions_descendantes(p_institution_id uuid) [sql]
- public.fn_licence_commerciale_set_updated_at() [plpgsql]
- public.fn_licence_telecom_set_updated_at() [plpgsql]
- public.fn_ligne_budgetaire_set_updated_at() [plpgsql]
- public.fn_permis_minier_set_updated_at() [plpgsql]
- public.fn_plan_developpement_set_updated_at() [plpgsql]
- public.fn_projet_recherche_set_updated_at() [plpgsql]
- public.fn_raccordement_energetique_set_updated_at() [plpgsql]
- public.fn_reclamation_citoyenne_set_updated_at() [plpgsql]
- public.fn_reinitialiser_echecs_connexion(p_personne_id uuid) [plpgsql]
- public.fn_rnsj_set_updated_at() [plpgsql]
- public.fn_rnsj_texte_historiser() [plpgsql]
- public.fn_signalement_sanitaire_set_updated_at() [plpgsql]
- public.gen_random_bytes(integer) [c]
- public.gen_random_uuid() [c]
- public.gen_salt(text, integer) [c]
- public.gen_salt(text) [c]
- public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) [c]
- public.gin_extract_value_trgm(text, internal) [c]
- public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) [c]
- public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) [c]
- public.gtrgm_compress(internal) [c]
- public.gtrgm_consistent(internal, text, smallint, oid, internal) [c]
- public.gtrgm_decompress(internal) [c]
- public.gtrgm_distance(internal, text, smallint, oid, internal) [c]
- public.gtrgm_in(cstring) [c]
- public.gtrgm_options(internal) [c]
- public.gtrgm_out(gtrgm) [c]
- public.gtrgm_penalty(internal, internal, internal) [c]
- public.gtrgm_picksplit(internal, internal) [c]
- public.gtrgm_same(gtrgm, gtrgm, internal) [c]
- public.gtrgm_union(internal, internal) [c]
- public.hmac(text, text, text) [c]
- public.hmac(bytea, bytea, text) [c]
- public.mngi_generer_institution(p_institution_id uuid, p_code_modele character varying) [plpgsql]
- public.pgp_armor_headers(text, OUT key text, OUT value text) [c]
- public.pgp_key_id(bytea) [c]
- public.pgp_pub_decrypt(bytea, bytea, text) [c]
- public.pgp_pub_decrypt(bytea, bytea) [c]
- public.pgp_pub_decrypt(bytea, bytea, text, text) [c]
- public.pgp_pub_decrypt_bytea(bytea, bytea, text, text) [c]
- public.pgp_pub_decrypt_bytea(bytea, bytea, text) [c]
- public.pgp_pub_decrypt_bytea(bytea, bytea) [c]
- public.pgp_pub_encrypt(text, bytea) [c]
- public.pgp_pub_encrypt(text, bytea, text) [c]
- public.pgp_pub_encrypt_bytea(bytea, bytea, text) [c]
- public.pgp_pub_encrypt_bytea(bytea, bytea) [c]
- public.pgp_sym_decrypt(bytea, text) [c]
- public.pgp_sym_decrypt(bytea, text, text) [c]
- public.pgp_sym_decrypt_bytea(bytea, text, text) [c]
- public.pgp_sym_decrypt_bytea(bytea, text) [c]
- public.pgp_sym_encrypt(text, text, text) [c]
- public.pgp_sym_encrypt(text, text) [c]
- public.pgp_sym_encrypt_bytea(bytea, text) [c]
- public.pgp_sym_encrypt_bytea(bytea, text, text) [c]
- public.rnso_check_no_cycle() [plpgsql]
- public.set_limit(real) [c]
- public.show_limit() [c]
- public.show_trgm(text) [c]
- public.similarity(text, text) [c]
- public.similarity_dist(text, text) [c]
- public.similarity_op(text, text) [c]
- public.strict_word_similarity(text, text) [c]
- public.strict_word_similarity_commutator_op(text, text) [c]
- public.strict_word_similarity_dist_commutator_op(text, text) [c]
- public.strict_word_similarity_dist_op(text, text) [c]
- public.strict_word_similarity_op(text, text) [c]
- public.unaccent(regdictionary, text) [c]
- public.unaccent(text) [c]
- public.unaccent_init(internal) [c]
- public.unaccent_lexize(internal, internal, internal, internal) [c]
- public.uuid_generate_v1() [c]
- public.uuid_generate_v1mc() [c]
- public.uuid_generate_v3(namespace uuid, name text) [c]
- public.uuid_generate_v4() [c]
- public.uuid_generate_v5(namespace uuid, name text) [c]
- public.uuid_nil() [c]
- public.uuid_ns_dns() [c]
- public.uuid_ns_oid() [c]
- public.uuid_ns_url() [c]
- public.uuid_ns_x500() [c]
- public.word_similarity(text, text) [c]
- public.word_similarity_commutator_op(text, text) [c]
- public.word_similarity_dist_commutator_op(text, text) [c]
- public.word_similarity_dist_op(text, text) [c]
- public.word_similarity_op(text, text) [c]


## 5. Tous les triggers

- [accord_cooperation] trg_accord_cooperation_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_accord_cooperation_set_updated_at()
- [appel_offres] trg_appel_offres_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_appel_offres_set_updated_at()
- [autorisation_industrielle] trg_autorisation_industrielle_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_autorisation_industrielle_set_updated_at()
- [bien_culturel_protege] trg_bien_culturel_protege_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_bien_culturel_protege_set_updated_at()
- [bien_patrimonial] trg_bien_patrimonial_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_bien_patrimonial_set_updated_at()
- [certificat_pki] trg_certificat_pki_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_certificat_pki_set_updated_at()
- [decision_institutionnelle] trg_decision_institutionnelle_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_decision_institutionnelle_set_updated_at()
- [declaration_douaniere] trg_declaration_douaniere_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_declaration_douaniere_set_updated_at()
- [declaration_fiscale] trg_declaration_fiscale_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_declaration_fiscale_set_updated_at()
- [document] trg_audit_document — AFTER INSERT -> EXECUTE FUNCTION fn_audit_generique('document_id')
- [document] trg_audit_document — AFTER DELETE -> EXECUTE FUNCTION fn_audit_generique('document_id')
- [document] trg_audit_document — AFTER UPDATE -> EXECUTE FUNCTION fn_audit_generique('document_id')
- [document] trg_document_recherche_vecteur — BEFORE INSERT -> EXECUTE FUNCTION tsvector_update_trigger('recherche_vecteur', 'pg_catalog.french', 'titre', 'resume', 'contenu_texte')
- [document] trg_document_recherche_vecteur — BEFORE UPDATE -> EXECUTE FUNCTION tsvector_update_trigger('recherche_vecteur', 'pg_catalog.french', 'titre', 'resume', 'contenu_texte')
- [document] trg_indexer_document — AFTER INSERT -> EXECUTE FUNCTION fn_indexer_document()
- [document] trg_indexer_document — AFTER UPDATE -> EXECUTE FUNCTION fn_indexer_document()
- [dossier_administratif] trg_dossier_administratif_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_administratif_set_updated_at()
- [dossier_agent_rh] trg_dossier_agent_rh_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_agent_rh_set_updated_at()
- [dossier_entreprise] trg_dossier_entreprise_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_entreprise_set_updated_at()
- [dossier_judiciaire] trg_dossier_judiciaire_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_judiciaire_set_updated_at()
- [dossier_logistique_defense] trg_dossier_logistique_defense_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_logistique_defense_set_updated_at()
- [dossier_projet_investissement] trg_dossier_projet_investissement_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_projet_investissement_set_updated_at()
- [dossier_recouvrement] trg_dossier_recouvrement_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_recouvrement_set_updated_at()
- [dossier_scolaire] trg_dossier_scolaire_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_dossier_scolaire_set_updated_at()
- [ecriture_comptable] trg_ecriture_comptable_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_ecriture_comptable_set_updated_at()
- [enquete_statistique] trg_enquete_statistique_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_enquete_statistique_set_updated_at()
- [etude_impact_environnemental] trg_etude_impact_environnemental_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_etude_impact_environnemental_set_updated_at()
- [exploitation_agricole] trg_exploitation_agricole_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_exploitation_agricole_set_updated_at()
- [facture] trg_facture_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_facture_set_updated_at()
- [federation_sportive] trg_federation_sportive_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_federation_sportive_set_updated_at()
- [immatriculation_vehicule] trg_immatriculation_vehicule_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_immatriculation_vehicule_set_updated_at()
- [incident_securitaire] trg_incident_securitaire_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_incident_securitaire_set_updated_at()
- [institution] trg_audit_institution — AFTER UPDATE -> EXECUTE FUNCTION fn_audit_generique('institution_id')
- [institution] trg_audit_institution — AFTER INSERT -> EXECUTE FUNCTION fn_audit_generique('institution_id')
- [institution] trg_audit_institution — AFTER DELETE -> EXECUTE FUNCTION fn_audit_generique('institution_id')
- [journal_audit] trg_hash_chaine_journal_audit — BEFORE INSERT -> EXECUTE FUNCTION fn_hash_chaine_journal_audit()
- [journal_audit_default] trg_hash_chaine_journal_audit — BEFORE INSERT -> EXECUTE FUNCTION fn_hash_chaine_journal_audit()
- [journal_connexion] trg_detecter_anomalie_connexion — AFTER INSERT -> EXECUTE FUNCTION fn_detecter_anomalie_connexion()
- [licence_commerciale] trg_licence_commerciale_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_licence_commerciale_set_updated_at()
- [licence_telecom] trg_licence_telecom_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_licence_telecom_set_updated_at()
- [ligne_budgetaire] trg_ligne_budgetaire_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_ligne_budgetaire_set_updated_at()
- [permis_minier] trg_permis_minier_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_permis_minier_set_updated_at()
- [personne] trg_audit_personne — AFTER DELETE -> EXECUTE FUNCTION fn_audit_generique('personne_id')
- [personne] trg_audit_personne — AFTER INSERT -> EXECUTE FUNCTION fn_audit_generique('personne_id')
- [personne] trg_audit_personne — AFTER UPDATE -> EXECUTE FUNCTION fn_audit_generique('personne_id')
- [personne_role] trg_audit_personne_role — AFTER UPDATE -> EXECUTE FUNCTION fn_audit_generique('personne_role_id')
- [personne_role] trg_audit_personne_role — AFTER DELETE -> EXECUTE FUNCTION fn_audit_generique('personne_role_id')
- [personne_role] trg_audit_personne_role — AFTER INSERT -> EXECUTE FUNCTION fn_audit_generique('personne_role_id')
- [plan_developpement] trg_plan_developpement_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_plan_developpement_set_updated_at()
- [projet_recherche] trg_projet_recherche_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_projet_recherche_set_updated_at()
- [raccordement_energetique] trg_raccordement_energetique_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_raccordement_energetique_set_updated_at()
- [reclamation_citoyenne] trg_reclamation_citoyenne_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_reclamation_citoyenne_set_updated_at()
- [rnsj_texte] trg_rnsj_texte_historique — AFTER UPDATE -> EXECUTE FUNCTION fn_rnsj_texte_historiser()
- [rnsj_texte] trg_rnsj_texte_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_rnsj_set_updated_at()
- [rnso_structure] trg_rnso_no_cycle — BEFORE UPDATE -> EXECUTE FUNCTION rnso_check_no_cycle()
- [rnso_structure] trg_rnso_no_cycle — BEFORE INSERT -> EXECUTE FUNCTION rnso_check_no_cycle()
- [role] trg_audit_role — AFTER UPDATE -> EXECUTE FUNCTION fn_audit_generique('role_id')
- [role] trg_audit_role — AFTER DELETE -> EXECUTE FUNCTION fn_audit_generique('role_id')
- [role] trg_audit_role — AFTER INSERT -> EXECUTE FUNCTION fn_audit_generique('role_id')
- [signalement_sanitaire] trg_signalement_sanitaire_updated_at — BEFORE UPDATE -> EXECUTE FUNCTION fn_signalement_sanitaire_set_updated_at()


## 6. Toutes les politiques RLS


[document] document_scope_institution (ALL)
  USING: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (institution_id = (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid))
  WITH CHECK: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (institution_id = (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid))

[index_recherche_global] index_recherche_scope_institution (ALL)
  USING: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (institution_id IS NULL) OR (institution_id = (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid))
  WITH CHECK: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (institution_id IS NULL) OR (institution_id = (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid))

[institution] institution_scope (ALL)
  USING: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text) IS NULL) OR (institution_id = (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid) OR (institution_id IN ( SELECT fn_institutions_descendantes.institution_id
   FROM fn_institutions_descendantes((NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid) fn_institutions_descendantes(institution_id))))
  WITH CHECK: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text) IS NULL) OR (institution_id = (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid) OR (institution_id IN ( SELECT fn_institutions_descendantes.institution_id
   FROM fn_institutions_descendantes((NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid) fn_institutions_descendantes(institution_id))))

[personne_role] personne_role_scope_institution (ALL)
  USING: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (NOT (scope_institution_id IS DISTINCT FROM (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid)))
  WITH CHECK: ((COALESCE(current_setting('app.bypass_rls'::text, true), 'false'::text) = 'true'::text) OR (NOT (scope_institution_id IS DISTINCT FROM (NULLIF(current_setting('app.current_institution_id'::text, true), ''::text))::uuid)))

[rnsj_modification] rnsj_modification_lecture (SELECT)
  USING: true

[rnsj_relation] rnsj_relation_ecriture (INSERT)
  WITH CHECK: true

[rnsj_relation] rnsj_relation_lecture (SELECT)
  USING: true

[rnsj_texte] rnsj_texte_ecriture (INSERT)
  WITH CHECK: true

[rnsj_texte] rnsj_texte_lecture (SELECT)
  USING: true

[rnsj_texte_historique] rnsj_historique_lecture (SELECT)
  USING: true


## 7. Tables avec RLS activé mais sans politique (risque)

Aucune — toutes les tables RLS ont au moins une politique.


## 8. Extensions PostgreSQL installées

- pg_trgm (1.6)
- pgcrypto (1.3)
- plpgsql (1.0)
- unaccent (1.1)
- uuid-ossp (1.1)


## 9. Comptage de lignes par table (santé des données)

- accord_cooperation : 1 lignes
- acte_historique : 0 lignes
- acte_numerotation : 0 lignes
- acte_officiel : 0 lignes
- acte_piece_jointe : 0 lignes
- acte_signature : 0 lignes
- acte_workflow_transition : 88 lignes
- affectation : 62 lignes
- agent : 1 lignes
- agent_ia : 127 lignes
- agent_ia_interaction : 0 lignes
- appel_offres : 0 lignes
- audit_log : 471 lignes
- autorisation_industrielle : 0 lignes
- bien_culturel_protege : 0 lignes
- bien_patrimonial : 0 lignes
- certificat_pki : 0 lignes
- competence : 7 lignes
- corps : 1 lignes
- decision_action : 2 lignes
- decision_gouvernementale : 1 lignes
- decision_institutionnelle : 0 lignes
- declaration_douaniere : 0 lignes
- declaration_fiscale : 0 lignes
- delegation_perimetre : 0 lignes
- delegation_pouvoir : 0 lignes
- document : 1 lignes
- document_version : 0 lignes
- dossier_administratif : 0 lignes
- dossier_agent_rh : 1 lignes
- dossier_entreprise : 0 lignes
- dossier_judiciaire : 0 lignes
- dossier_logistique_defense : 0 lignes
- dossier_projet_investissement : 0 lignes
- dossier_recouvrement : 0 lignes
- dossier_scolaire : 0 lignes
- ecriture_comptable : 0 lignes
- enquete_statistique : 0 lignes
- entity_event : 118 lignes
- entity_relation : 7 lignes
- entity_scope : 44 lignes
- etude_impact_environnemental : 0 lignes
- execution_rapport : 1 lignes
- exploitation_agricole : 0 lignes
- facture : 0 lignes
- federation_sportive : 0 lignes
- fiche_tome : 127 lignes
- fonction : 149 lignes
- grade : 1 lignes
- immatriculation_vehicule : 0 lignes
- incident_securitaire : 0 lignes
- index_recherche_global : 1 lignes
- indicateur : 8 lignes
- institution : 245 lignes
- institution_relation : 118 lignes
- instruction : 3 lignes
- instruction_historique : 2 lignes
- journal_audit : 680 lignes
- journal_audit_default : 680 lignes
- journal_connexion : 0 lignes
- licence_commerciale : 0 lignes
- licence_telecom : 0 lignes
- ligne_budgetaire : 1 lignes
- manuel_architecture : 0 lignes
- meta_attribute : 142 lignes
- meta_entity : 45 lignes
- meta_notification_rule : 1 lignes
- meta_rule : 6 lignes
- meta_workflow_transition : 65 lignes
- multi_institution_participant : 8 lignes
- nocode_formulaire : 0 lignes
- nocode_workflow : 3 lignes
- nocode_workflow_etape : 12 lignes
- nocode_workflow_instance : 0 lignes
- notification : 3560 lignes
- ordre_paiement : 18 lignes
- organization_type : 12 lignes
- permis_minier : 0 lignes
- permission : 277 lignes
- personne : 129 lignes
- personne_role : 129 lignes
- plan_developpement : 0 lignes
- poste : 2124 lignes
- poste_role_metier : 638 lignes
- pouvoir : 3 lignes
- processus : 1 lignes
- processus_etape : 8 lignes
- projet_recherche : 0 lignes
- raccordement_energetique : 0 lignes
- reclamation_citoyenne : 0 lignes
- ref_auditorat_militaire : 26 lignes
- ref_auditorat_militaire_historique : 26 lignes
- ref_casier_historique : 0 lignes
- ref_casier_judiciaire : 0 lignes
- ref_condamnation : 0 lignes
- ref_cour_appel : 27 lignes
- ref_cour_appel_historique : 0 lignes
- ref_execution_decision : 0 lignes
- ref_execution_historique : 0 lignes
- ref_gouvernorat : 26 lignes
- ref_greffe : 39 lignes
- ref_greffe_historique : 0 lignes
- ref_juridiction_militaire : 39 lignes
- ref_juridiction_militaire_historique : 44 lignes
- ref_parquet : 39 lignes
- ref_parquet_historique : 0 lignes
- ref_tgi_historique : 0 lignes
- ref_tribunal_commerce : 0 lignes
- ref_tribunal_commerce_historique : 0 lignes
- ref_tribunal_enfants : 0 lignes
- ref_tribunal_enfants_historique : 0 lignes
- ref_tribunal_grande_instance : 39 lignes
- ref_tribunal_militaire_garnison : 26 lignes
- ref_tribunal_militaire_garnison_historique : 0 lignes
- ref_tribunal_paix : 0 lignes
- ref_tribunal_paix_historique : 0 lignes
- ref_tribunal_travail : 0 lignes
- ref_tribunal_travail_historique : 0 lignes
- referentiel_arborescence : 388 lignes
- referentiel_national : 17 lignes
- referentiel_national_item : 3816 lignes
- referentiel_national_section : 255 lignes
- referentiel_niveau_national : 59 lignes
- referentiel_poste_type : 28 lignes
- relation_interinstitutionnelle : 6 lignes
- relation_type : 3 lignes
- relations : 7 lignes
- reorganisation_organisationnelle : 14 lignes
- rni_lien_hierarchique : 74 lignes
- rnsj_modification : 0 lignes
- rnsj_relation : 17 lignes
- rnsj_texte : 3 lignes
- rnsj_texte_historique : 0 lignes
- rnso_affectation : 0 lignes
- rnso_fonction : 0 lignes
- rnso_historique : 0 lignes
- rnso_modele : 2 lignes
- rnso_modele_historique : 0 lignes
- rnso_modele_poste : 26 lignes
- rnso_modele_unite : 23 lignes
- rnso_poste : 0 lignes
- rnso_regle : 2 lignes
- rnso_structure : 0 lignes
- rnso_type_poste : 7 lignes
- rnso_type_structure : 12 lignes
- role : 6 lignes
- role_metier : 23 lignes
- service_public : 34 lignes
- session_utilisateur : 259 lignes
- signalement_sanitaire : 0 lignes
- signature_electronique : 0 lignes
- type_acte_ref : 12 lignes
- type_document : 5 lignes
- unite_organisationnelle : 2159 lignes
- validation : 2 lignes
- verification : 1 lignes


## 10. package.json — dépendances

> ERREUR lors de "package.json" : Unexpected token '﻿', "﻿{
    "n"... is not valid JSON


## 11. Fichiers de migrations présents (db/, migrations_rls/)


db/ :
  migrations/journal/001_create_journal_schema.sql
  migrations/journal/001_create_journal_schema.sql.bak
  migrations/journal/002_seed_type_acte.sql
  migrations/journal/003_permissions_journal.sql
  migrations/journal/003_permissions_journal.sql.bak2
  migrations/journal/003_permissions_journal.sql.bak3
  migrations/journal/004_rls_journal.sql
  migrations/journal/004_rls_journal.sql.bak
  migrations/journal/005_triggers_journal.sql
  migrations/journal/005_triggers_journal.sql.bak
  pngie.db
  pngie.db-shm
  pngie.db-wal
  pngie_avant_gmp.db
  pngie_avant_migration_institutions.db
  pngie_avant_migration_institutions.db-shm
  pngie_avant_migration_institutions.db-wal
  pngie_avant_organismes.db
  pngie_avant_test_batch3.db
  schema.sql
  schema.sqlite.sql
  seed-extension.js
  seed.js

migrations_rls/ :
  000_precheck.sql
  001_create_pngie_app.sql
  002_grants_pngie_app.sql
  003_validation.sql
  004_test_transactionnel.sql
  005_revoke_and_regrant.sql
  006_postcheck.sql
  resultat_003.txt
  resultat_004.txt
  resultat_005.txt


## 12. Domaines backend existants (src/domains)


- auth/
    README.md

- common/
    README.md

- documents/
    README.md

- finances/
    README.md

- governance/
    README.md

- ia/
    README.md

- institutions/
    README.md

- interoperability/
    README.md

- journal/
    README.md

- marches/
    README.md

- patrimoine/
    README.md

- recherche/
    README.md

- rnsj/
    README.md

- rnso/
    README.md

- workflow/
    README.md


## 13. Routes générées (routes-generated)

- accord_cooperation.routes.js
- affectation.routes.js
- agent.routes.js
- agent.routes.js.backup_20260803_225430
- annuaire.routes.js
- appel_offres.routes.js
- arborescence.routes.js
- autorisation_industrielle.routes.js
- bien_culturel_protege.routes.js
- bien_patrimonial.routes.js
- certificat_pki.routes.js
- corps.routes.js
- decision_gouvernementale.routes.js
- decision_institutionnelle.routes.js
- declaration_douaniere.routes.js
- declaration_fiscale.routes.js
- dossier_administratif.routes.js
- dossier_agent_rh.routes.js
- dossier_entreprise.routes.js
- dossier_judiciaire.routes.js
- dossier_logistique_defense.routes.js
- dossier_projet_investissement.routes.js
- dossier_recouvrement.routes.js
- dossier_scolaire.routes.js
- ecriture_comptable.routes.js
- enquete_statistique.routes.js
- etude_impact_environnemental.routes.js
- exploitation_agricole.routes.js
- facture.routes.js
- federation_sportive.routes.js
- grade.routes.js
- immatriculation_vehicule.routes.js
- incident_securitaire.routes.js
- institutions_dashboard.routes.js
- institutions_fiche.routes.js
- institutions_validation.routes.js
- licence_commerciale.routes.js
- licence_telecom.routes.js
- ligne_budgetaire.routes.js
- me_poste.routes.js
- ordre_paiement.routes.js
- permis_minier.routes.js
- plan_developpement.routes.js
- poste_hierarchie.routes.js
- projet_recherche.routes.js
- public_institutions.routes.js
- raccordement_energetique.routes.js
- reclamation_citoyenne.routes.js
- relations.routes.js
- signalement_sanitaire.routes.js


## 14. Documentation existante (docs/)

  architecture/ANALYSE_RNI_ET_DOMAINES_20260807.txt
  architecture/ANALYSE_ROUTES_GENEREES_20260808.txt
  architecture/ARCHITECTURE_V2.md
  architecture/INVENTAIRE_BRUT_20260807.txt
  architecture/VERIF_DEPENDANCE_JOURNAL_RNSJ_20260808.txt
  audits/AUDIT_DASHBOARD_INSTITUTIONNEL.md
  audits/AUDIT_RLS_PRE_SWITCH.md
  audits/BUG_G_POLICY_BACKUP_AVANT_PATCH.json
  audits/BUG_G_RLS_SCOPE_NATIONAL.md
  E2E_SECURITE_VALIDATION.md
  PNGIE-Secure-API-v1.0.md
  RLS_MIGRATION_PLAN_v1.md
  specs/Journal_National_Spec_v1.md
  standard/PNGIE_Secure_API_v1.0.md
  standard/PNGIE_SIRH_Schemas_v1.0.md
  vision/PNGIE_Roadmap_v1.0.md


## 15. Tests existants (tests/)

  auth.test.js
  e2e/.token-cache.json
  e2e/001_login.test.js
  e2e/002_rbac.test.js
  e2e/003_scoperesolver.test.js
  e2e/004_postes.test.js
  e2e/005_affectations.test.js
  e2e/006_agents.test.js
  e2e/helpers.js
  extension.test.js
  governance.test.js
  helpers.js
  nocode.test.js
  rbac.test.js


## 16. Dernier état Git (si dépôt initialisé)

> ERREUR lors de "git" : Command failed: git rev-parse --abbrev-ref HEAD
'git' n'est pas reconnu en tant que commande interne
ou externe, un programme ex�cutable ou un fichier de commandes.
