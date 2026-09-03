-- ============================================================
-- 003_permissions_journal.sql (v4 - resolution par role.code)
-- Mapping : PM=central (dont publier/archiver/gerer_diffusion), PR=emetteur+signataire,
-- SN/AN/MI/GV=emetteur (creer/modifier/valider/consulter/consulter.restreint).
-- ============================================================

BEGIN;

INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'journal', a, 'actif'
FROM role, (VALUES
  ('creer'), ('modifier'), ('valider'), ('signer'), ('publier'),
  ('consulter'), ('consulter.restreint'), ('consulter.confidentiel'),
  ('archiver'), ('gerer_diffusion')
) AS v(a)
WHERE code = 'PM'
ON CONFLICT (role_id, entite, action) DO NOTHING;

INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'journal', a, 'actif'
FROM role, (VALUES
  ('creer'), ('modifier'), ('valider'),
  ('consulter'), ('consulter.restreint'), ('signer')
) AS v(a)
WHERE code = 'PR'
ON CONFLICT (role_id, entite, action) DO NOTHING;

INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'journal', a, 'actif'
FROM role, (VALUES
  ('creer'), ('modifier'), ('valider'),
  ('consulter'), ('consulter.restreint')
) AS v(a)
WHERE code IN ('SN', 'AN', 'MI', 'GV')
ON CONFLICT (role_id, entite, action) DO NOTHING;

COMMIT;