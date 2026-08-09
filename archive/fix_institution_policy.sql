DROP POLICY IF EXISTS institution_scope ON institution;
CREATE POLICY institution_scope ON institution
FOR ALL
USING (
  COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
  OR NULLIF(current_setting('app.current_institution_id', true), '') IS NULL
  OR institution_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
  OR institution_id IN (
    SELECT fn_institutions_descendantes.institution_id
    FROM fn_institutions_descendantes((NULLIF(current_setting('app.current_institution_id', true), ''))::uuid)
  )
)
WITH CHECK (
  COALESCE(current_setting('app.bypass_rls', true), 'false') = 'true'
  OR NULLIF(current_setting('app.current_institution_id', true), '') IS NULL
  OR institution_id = (NULLIF(current_setting('app.current_institution_id', true), ''))::uuid
  OR institution_id IN (
    SELECT fn_institutions_descendantes.institution_id
    FROM fn_institutions_descendantes((NULLIF(current_setting('app.current_institution_id', true), ''))::uuid)
  )
);