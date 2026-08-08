-- ============================================================
-- 003_permissions_journal.sql (v3 — 'code' est une colonne générée, exclue de l'INSERT)
-- Mapping : PM=central (dont publier/archiver/gerer_diffusion), PR=émetteur+signataire,
-- SN/AN/MI/GV=émetteur (creer/modifier/valider/consulter/consulter.restreint).
-- Décision à confirmer institutionnellement — cf. message d'accompagnement.
-- ============================================================

BEGIN;

INSERT INTO permission (role_id, entite, action, statut) VALUES
  ('2ee6f93e-ae0e-4db2-a535-eaf73e03ce2c', 'journal', 'creer', 'actif'),
  ('2ee6f93e-ae0e-4db2-a535-eaf73e03ce2c', 'journal', 'modifier', 'actif'),
  ('2ee6f93e-ae0e-4db2-a535-eaf73e03ce2c', 'journal', 'valider', 'actif'),
  ('2ee6f93e-ae0e-4db2-a535-eaf73e03ce2c', 'journal', 'consulter', 'actif'),
  ('2ee6f93e-ae0e-4db2-a535-eaf73e03ce2c', 'journal', 'consulter.restreint', 'actif'),
  ('2ee6f93e-ae0e-4db2-a535-eaf73e03ce2c', 'journal', 'signer', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'creer', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'modifier', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'valider', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'signer', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'publier', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'consulter', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'consulter.restreint', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'consulter.confidentiel', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'archiver', 'actif'),
  ('bd010f9b-ee33-484d-ae11-41f5d61dc1fb', 'journal', 'gerer_diffusion', 'actif'),
  ('c44708d9-2ec0-4697-9791-975e7175900c', 'journal', 'creer', 'actif'),
  ('c44708d9-2ec0-4697-9791-975e7175900c', 'journal', 'modifier', 'actif'),
  ('c44708d9-2ec0-4697-9791-975e7175900c', 'journal', 'valider', 'actif'),
  ('c44708d9-2ec0-4697-9791-975e7175900c', 'journal', 'consulter', 'actif'),
  ('c44708d9-2ec0-4697-9791-975e7175900c', 'journal', 'consulter.restreint', 'actif'),
  ('148f9a29-373f-4976-93a0-095804e84868', 'journal', 'creer', 'actif'),
  ('148f9a29-373f-4976-93a0-095804e84868', 'journal', 'modifier', 'actif'),
  ('148f9a29-373f-4976-93a0-095804e84868', 'journal', 'valider', 'actif'),
  ('148f9a29-373f-4976-93a0-095804e84868', 'journal', 'consulter', 'actif'),
  ('148f9a29-373f-4976-93a0-095804e84868', 'journal', 'consulter.restreint', 'actif'),
  ('65562588-afcc-4309-a9f8-e595dadaa63f', 'journal', 'creer', 'actif'),
  ('65562588-afcc-4309-a9f8-e595dadaa63f', 'journal', 'modifier', 'actif'),
  ('65562588-afcc-4309-a9f8-e595dadaa63f', 'journal', 'valider', 'actif'),
  ('65562588-afcc-4309-a9f8-e595dadaa63f', 'journal', 'consulter', 'actif'),
  ('65562588-afcc-4309-a9f8-e595dadaa63f', 'journal', 'consulter.restreint', 'actif'),
  ('095b6c5f-fa21-433c-ad66-92aa818a5ef0', 'journal', 'creer', 'actif'),
  ('095b6c5f-fa21-433c-ad66-92aa818a5ef0', 'journal', 'modifier', 'actif'),
  ('095b6c5f-fa21-433c-ad66-92aa818a5ef0', 'journal', 'valider', 'actif'),
  ('095b6c5f-fa21-433c-ad66-92aa818a5ef0', 'journal', 'consulter', 'actif'),
  ('095b6c5f-fa21-433c-ad66-92aa818a5ef0', 'journal', 'consulter.restreint', 'actif')
ON CONFLICT (role_id, entite, action) DO NOTHING;

COMMIT;
