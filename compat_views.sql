-- Recreation de organization_type et pouvoir comme vraies tables de reference
-- (donnees identiques a la source SQLite, capturees plus tot)
CREATE TABLE IF NOT EXISTS pouvoir (
    pouvoir_id INTEGER PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    libelle VARCHAR(100) NOT NULL
);
INSERT INTO pouvoir (pouvoir_id, code, libelle) VALUES
    (1, 'EXECUTIF', 'Pouvoir executif'),
    (2, 'LEGISLATIF', 'Pouvoir legislatif'),
    (3, 'JUDICIAIRE', 'Pouvoir judiciaire')
ON CONFLICT (pouvoir_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS organization_type (
    id INTEGER PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    pouvoir_id INTEGER REFERENCES pouvoir(pouvoir_id)
);
INSERT INTO organization_type (id, code, libelle, pouvoir_id) VALUES
    (1, 'PRESIDENCE', 'Presidence', 1),
    (2, 'PRIMATURE', 'Primature', 1),
    (3, 'PARLEMENT', 'Chambre du Parlement', 2),
    (4, 'MINISTERE', 'Ministere', 1),
    (5, 'PROVINCE', 'Province', 1),
    (6, 'ETD', 'Entite Territoriale Decentralisee', 1),
    (7, 'AGENCE', 'Agence / Direction Generale', 1),
    (8, 'INSTITUTION_CONTROLE', 'Institution d''appui et de controle', NULL),
    (9, 'COUR_CONSTITUTIONNELLE', 'Cour Constitutionnelle', 3),
    (10, 'COUR_CASSATION', 'Cour de Cassation', 3),
    (11, 'CONSEIL_ETAT', 'Conseil d''Etat', 3),
    (12, 'ENTREPRISE_PUBLIQUE', 'Entreprise publique', 1)
ON CONFLICT (id) DO NOTHING;

-- Vue de compatibilite : organization (ancien nom SQLite) -> institution
CREATE OR REPLACE VIEW organization AS
SELECT
    institution_id AS organization_id,
    code,
    nom,
    (SELECT ot.id FROM organization_type ot WHERE ot.code = institution.type_institution) AS type_id,
    institution_parent_id AS parent_id,
    niveau_hierarchique AS niveau,
    description,
    statut,
    created_at
FROM institution;

-- Vue de compatibilite : person -> personne
CREATE OR REPLACE VIEW person AS
SELECT
    personne_id AS person_id,
    matricule,
    nom,
    prenom,
    email,
    password_hash,
    statut,
    created_at
FROM personne;

-- Vue de compatibilite : person_role -> personne_role
CREATE OR REPLACE VIEW person_role AS
SELECT
    personne_role_id AS person_role_id,
    personne_id AS person_id,
    role_id,
    scope_institution_id AS scope_org_id,
    date_attribution,
    date_expiration,
    statut
FROM personne_role;

-- Vue de compatibilite : permission.code reconstruit depuis entite+action
CREATE OR REPLACE VIEW permission_compat AS
SELECT
    permission_id,
    role_id,
    (entite || ':' || action) AS code,
    entite AS nom
FROM permission;

-- Vue de compatibilite : role_permission (jointure implicite dans le nouveau schema)
CREATE OR REPLACE VIEW role_permission AS
SELECT role_id, permission_id FROM permission;