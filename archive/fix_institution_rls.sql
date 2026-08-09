CREATE OR REPLACE FUNCTION fn_institutions_descendantes(p_institution_id UUID)
RETURNS TABLE(institution_id UUID)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH RECURSIVE descendants AS (
        SELECT institution_1.institution_id
        FROM institution institution_1
        WHERE institution_1.institution_id = p_institution_id
        UNION ALL
        SELECT i.institution_id
        FROM institution i
        JOIN descendants d ON i.institution_parent_id = d.institution_id
    )
    SELECT descendants.institution_id FROM descendants;
$$;

REVOKE ALL ON FUNCTION fn_institutions_descendantes(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fn_institutions_descendantes(UUID) TO pngie_app;

DROP POLICY IF EXISTS institution_scope ON institution;
CREATE POLICY institution_scope ON institution
USING (
    (COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true')
    OR (institution_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid)
    OR (institution_id IN (
        SELECT institution_id FROM fn_institutions_descendantes(
            (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
        )
    ))
);