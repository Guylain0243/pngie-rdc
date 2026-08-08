CREATE OR REPLACE VIEW meta_permission AS
SELECT
    p.permission_id,
    r.code       AS role_code,
    p.entite     AS entity,
    p.action     AS action,
    p.statut     AS statut,
    p.condition_json,
    p.created_at
FROM permission p
JOIN role r ON r.role_id = p.role_id;