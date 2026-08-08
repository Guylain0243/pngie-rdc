SELECT * FROM delegation_pouvoir;
SELECT code, nom, categorie FROM role ORDER BY code;
SELECT role_code, entity, action FROM meta_permission WHERE entity IN ('ligne_budgetaire') ORDER BY role_code;
