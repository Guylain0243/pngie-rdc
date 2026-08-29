module.exports = {
  // Seule base confirmee par DATABASE_INVENTORY.md (Sprint 1, §1) comme cible
  // legitime des operations destructives, conformement a la note de gouvernance
  // du 08/08/2026. Ajouter d'autres bases ici seulement apres verification
  // qu'elles existent reellement sur l'instance (SELECT datname FROM pg_database;),
  // avec commit dedie et mise a jour de DATABASE_INVENTORY.md.
  ALLOWED_DATABASES: [
    "pngie_rdc_rls_test"
  ]
};