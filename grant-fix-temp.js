const { Pool } = require("pg");
const pool = new Pool({ connectionString: "postgresql://postgres@localhost/pngie_rdc_rls_test" });
(async () => {
  // GRANTs sur les 7 vues bloquantes
  await pool.query(`
    GRANT SELECT ON person, person_role, organization, permission_compat,
      role_permission, meta_permission, rnso_hierarchie TO pngie_app;
  `);
  console.log("GRANT sur les 7 vues : OK");

  // GRANTs sur les 11 tables prioritaires
  await pool.query(`
    GRANT SELECT, INSERT, UPDATE, DELETE ON
      entity_relation, entity_scope, indicateur, manuel_architecture,
      meta_attribute, meta_entity, referentiel_national,
      referentiel_national_item, referentiel_national_section,
      relation_type, type_document
    TO pngie_app;
  `);
  console.log("GRANT sur les 11 tables prioritaires : OK");

  await pool.end();
})();
