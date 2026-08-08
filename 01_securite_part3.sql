ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE document FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_scope_institution ON document;
CREATE POLICY document_scope_institution ON document
    FOR ALL
    USING (
        coalesce(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
    )
    WITH CHECK (
        coalesce(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
    );

ALTER TABLE index_recherche_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_recherche_global FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS index_recherche_scope_institution ON index_recherche_global;
CREATE POLICY index_recherche_scope_institution ON index_recherche_global
    FOR ALL
    USING (
        coalesce(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR institution_id IS NULL
        OR institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
    )
    WITH CHECK (
        coalesce(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR institution_id IS NULL
        OR institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
    );

ALTER TABLE personne_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE personne_role FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS personne_role_scope_institution ON personne_role;
CREATE POLICY personne_role_scope_institution ON personne_role
    FOR ALL
    USING (
        coalesce(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR scope_institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
    )
    WITH CHECK (
        coalesce(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR scope_institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
    );

ALTER TABLE institution ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS institution_scope ON institution;
CREATE POLICY institution_scope ON institution
    FOR ALL
    USING (
        coalesce(current_setting('app.bypass_rls', true), 'false') = 'true'
        OR institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
        OR institution_id IN (
            WITH RECURSIVE descendants AS (
                SELECT institution_id FROM institution
                WHERE institution_id = nullif(current_setting('app.current_institution_id', true), '')::UUID
                UNION ALL
                SELECT i.institution_id FROM institution i
                JOIN descendants d ON i.institution_parent_id = d.institution_id
            )
            SELECT institution_id FROM descendants
        )
    );