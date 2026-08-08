-- ============================================================
-- 004_rls_journal.sql
-- Politiques RLS — Journal National
--
-- Règle ferme : AUCUNE politique DELETE, sur aucune table du module,
-- y compris pour les rôles administrateurs. Un acte n'est jamais
-- supprimé — seulement annulé / abrogé / remplacé / archivé.
-- Avec RLS activé et sans politique DELETE, PostgreSQL refuse toute
-- suppression pour les rôles non-superuser : c'est le comportement
-- recherché, sans avoir besoin d'une politique "deny" explicite.
--
-- À ADAPTER : `has_permission()` et `current_setting('app.current_institution_id'::text, true)` sont
-- supposées exister déjà (fonctions RBAC / ScopeResolver du projet).
-- Vérifier leur nom exact avant exécution (point ouvert #1 du document
-- de conception).
-- ============================================================

BEGIN;

ALTER TABLE acte_officiel ENABLE ROW LEVEL SECURITY;
ALTER TABLE acte_signature ENABLE ROW LEVEL SECURITY;
ALTER TABLE acte_piece_jointe ENABLE ROW LEVEL SECURITY;
ALTER TABLE acte_historique ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- acte_officiel — lecture
-- ------------------------------------------------------------
CREATE POLICY pol_acte_lecture_publique ON acte_officiel
    FOR SELECT
    USING (statut = 'publie' AND diffusion = 'public');

CREATE POLICY pol_acte_lecture_restreint ON acte_officiel
    FOR SELECT
    USING (
        diffusion = 'restreint'
        AND has_permission(current_setting(), 'journal.consulter.restreint')
    );

CREATE POLICY pol_acte_lecture_confidentiel ON acte_officiel
    FOR SELECT
    USING (
        diffusion = 'confidentiel'
        AND has_permission(current_setting(), 'journal.consulter.confidentiel')
        AND institution_emettrice_id = ANY (current_setting('app.current_institution_id'::text, true)))
    );

-- Un créateur/valideur doit aussi pouvoir voir ses propres actes
-- avant publication, quel que soit le niveau de diffusion :
CREATE POLICY pol_acte_lecture_propre_perimetre ON acte_officiel
    FOR SELECT
    USING (
        statut <> 'publie'
        AND institution_emettrice_id = ANY (current_setting('app.current_institution_id'::text, true)))
        AND has_permission(current_setting(), 'journal.modifier')
    );

-- ------------------------------------------------------------
-- acte_officiel — écriture
-- ------------------------------------------------------------
CREATE POLICY pol_acte_insertion ON acte_officiel
    FOR INSERT
    WITH CHECK (
        institution_emettrice_id = ANY (current_setting('app.current_institution_id'::text, true)))
        AND has_permission(current_setting(), 'journal.creer')
    );

CREATE POLICY pol_acte_modification ON acte_officiel
    FOR UPDATE
    USING (
        statut <> 'publie'
        AND institution_emettrice_id = ANY (current_setting('app.current_institution_id'::text, true)))
        AND has_permission(current_setting(), 'journal.modifier')
    );

-- Changement de diffusion, y compris après publication (métadonnée mutable) :
CREATE POLICY pol_acte_gerer_diffusion ON acte_officiel
    FOR UPDATE
    USING (
        has_permission(current_setting(), 'journal.gerer_diffusion')
    );

-- Pas de politique FOR DELETE : suppression bloquée par défaut.

-- ------------------------------------------------------------
-- acte_signature — lecture alignée sur l'acte parent, écriture via journal.signer
-- ------------------------------------------------------------
CREATE POLICY pol_signature_lecture ON acte_signature
    FOR SELECT
    USING (
        acte_id IN (SELECT id FROM acte_officiel)  -- hérite du filtrage RLS de acte_officiel
    );

CREATE POLICY pol_signature_insertion ON acte_signature
    FOR INSERT
    WITH CHECK (
        has_permission(current_setting(), 'journal.signer')
    );

-- Pas de politique UPDATE ni DELETE : une signature, une fois posée, est figée.

-- ------------------------------------------------------------
-- acte_piece_jointe — même logique que acte_officiel
-- ------------------------------------------------------------
CREATE POLICY pol_piece_jointe_lecture ON acte_piece_jointe
    FOR SELECT
    USING (acte_id IN (SELECT id FROM acte_officiel));

CREATE POLICY pol_piece_jointe_insertion ON acte_piece_jointe
    FOR INSERT
    WITH CHECK (
        has_permission(current_setting(), 'journal.modifier')
    );

-- Pas de politique DELETE.

-- ------------------------------------------------------------
-- acte_historique — lecture seule côté applicatif (écrit uniquement par trigger/service)
-- ------------------------------------------------------------
CREATE POLICY pol_historique_lecture ON acte_historique
    FOR SELECT
    USING (acte_id IN (SELECT id FROM acte_officiel));

-- Pas de politique INSERT ouverte aux utilisateurs : alimentation uniquement
-- via le service applicatif (rôle applicatif dédié) ou trigger, pas par
-- l'utilisateur final directement.

COMMIT;
