INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'ordre_paiement', 'UPDATE', 'ACTIF'
FROM role WHERE code = 'MI'
ON CONFLICT (role_id, entite, action) DO NOTHING;

INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'ordre_paiement', 'CREATE', 'ACTIF'
FROM role WHERE code = 'MI'
ON CONFLICT (role_id, entite, action) DO NOTHING;

INSERT INTO permission (role_id, entite, action, statut)
SELECT role_id, 'ordre_paiement', 'READ', 'ACTIF'
FROM role WHERE code = 'MI'
ON CONFLICT (role_id, entite, action) DO NOTHING;