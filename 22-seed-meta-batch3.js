// ==============================================================
// COUVERTURE COMPLETE DES 32 DOMAINES DU LIVRE 2 - Batch 3
// Ajoute une entite pilote fonctionnelle pour chacun des 27
// domaines non encore couverts (5 deja couverts par le batch 2 :
// Mines, Sante, Justice, Cybersecurite, Finances/DGI).
//
// Usage : node 22-seed-meta-batch3.js
// A executer depuis C:\pngie-rdc\pngie-backend, APRES le batch 2
// ==============================================================

const crypto = require('crypto');
const db = require('./src/db');
const uuid = () => crypto.randomUUID();

async function creerEntite(nom, nomTable, categorie, description, module) {
    const existant = await db.get('SELECT entity_id FROM meta_entity WHERE nom_table = ?', [nomTable]);
    if (existant) {
        console.log(`(i) Entite "${nom}" existe deja - ignoree`);
        return existant.entity_id;
    }
    const id = uuid();
    await db.run(
        `INSERT INTO meta_entity (entity_id, nom, nom_table, categorie, description, module, pk_column, origine)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'GENERE')`,
        [id, nom, nomTable, categorie, description, module, `${nomTable}_id`]
    );
    console.log(`+-- Entite "${nom}" creee (table cible: ${nomTable}) [domaine: ${categorie}]`);
    return id;
}

async function creerAttribut(entityId, nom, nomColonne, type, longueur, obligatoire, unique_, defaut, ordre) {
    const existant = await db.get(
        'SELECT attribute_id FROM meta_attribute WHERE entity_id = ? AND nom_colonne = ?',
        [entityId, nomColonne]
    );
    if (existant) return;
    await db.run(
        `INSERT INTO meta_attribute (attribute_id, entity_id, nom, nom_colonne, type, longueur, obligatoire, unique_flag, valeur_defaut, ordre)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuid(), entityId, nom, nomColonne, type, longueur || null, obligatoire ? 1 : 0, unique_ ? 1 : 0, defaut || null, ordre]
    );
    console.log(`    +-- champ "${nom}" (${nomColonne} : ${type}) ajoute`);
}

// Definition compacte des 27 domaines restants :
// [ nom entite, nom_table, categorie/domaine, description, champs[] ]
// champs = [ nom, colonne, type, longueur, obligatoire, unique, defaut ]
const DOMAINES = [
  ['Décision Institutionnelle', 'decision_institutionnelle', 'Gouvernance',
    "Decision formelle prise par une institution", [
      ['Institution émettrice', 'institution', 'TEXT', 200, true, false, null],
      ['Objet de la décision', 'objet', 'TEXT', null, true, false, null],
      ['Type de décision', 'type', 'TEXT', 50, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'PROJET'],
    ]],
  ['Dossier Administratif', 'dossier_administratif', 'Administration',
    "Demande ou dossier administratif generique d'un usager", [
      ['Nature du dossier', 'nature', 'TEXT', 100, true, false, null],
      ['Service instructeur', 'service_instructeur', 'TEXT', 150, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEPOSE'],
    ]],
  ['Réclamation Citoyenne', 'reclamation_citoyenne', 'Citoyens',
    "Reclamation ou signalement depose par un citoyen", [
      ['Nom du plaignant', 'nom_plaignant', 'TEXT', 150, true, false, null],
      ['Objet de la réclamation', 'objet', 'TEXT', null, true, false, null],
      ['Institution visée', 'institution_visee', 'TEXT', 200, false, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'RECUE'],
    ]],
  ['Dossier Entreprise', 'dossier_entreprise', 'Entreprises',
    "Dossier d'enregistrement ou de suivi d'une entreprise (type RCCM)", [
      ['Raison sociale', 'raison_sociale', 'TEXT', 200, true, false, null],
      ['Secteur d\'activité', 'secteur', 'TEXT', 100, true, false, null],
      ['Numéro RCCM', 'rccm', 'TEXT', 50, false, true, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'EN_COURS'],
    ]],
  ['Dossier Agent', 'dossier_agent_rh', 'Ressources Humaines',
    "Dossier de carriere d'un agent public (nomination, mutation, promotion)", [
      ['Agent concerné', 'agent_concerne', 'TEXT', 200, true, false, null],
      ['Type de mouvement', 'type_mouvement', 'TEXT', 50, true, false, null],
      ['Poste visé', 'poste_vise', 'TEXT', 150, false, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'SOUMIS'],
    ]],
  ['Ligne Budgétaire', 'ligne_budgetaire', 'Budget',
    "Ligne de credit budgetaire d'une institution pour un exercice", [
      ['Institution', 'institution', 'TEXT', 200, true, false, null],
      ['Exercice', 'exercice', 'TEXT', 10, true, false, null],
      ['Programme', 'programme', 'TEXT', 150, false, false, null],
      ['Montant alloué', 'montant_alloue', 'DECIMAL', null, true, false, '0'],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'PROJET'],
    ]],
  ['Ordre de Paiement', 'ordre_paiement', 'Trésor',
    "Ordre de paiement emis par le Tresor public", [
      ['Bénéficiaire', 'beneficiaire', 'TEXT', 200, true, false, null],
      ['Montant', 'montant', 'DECIMAL', null, true, false, '0'],
      ['Institution émettrice', 'institution', 'TEXT', 200, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'EMIS'],
    ]],
  ['Écriture Comptable', 'ecriture_comptable', 'Comptabilité',
    "Ecriture comptable dans le plan comptable de l'Etat", [
      ['Compte', 'compte', 'TEXT', 50, true, false, null],
      ['Libellé', 'libelle', 'TEXT', 200, true, false, null],
      ['Montant débit', 'montant_debit', 'DECIMAL', null, false, false, '0'],
      ['Montant crédit', 'montant_credit', 'DECIMAL', null, false, false, '0'],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'BROUILLON'],
    ]],
  ['Déclaration Fiscale', 'declaration_fiscale', 'Fiscalité',
    "Declaration fiscale deposee par un contribuable", [
      ['Contribuable', 'contribuable', 'TEXT', 200, true, false, null],
      ['Type d\'impôt', 'type_impot', 'TEXT', 50, true, false, null],
      ['Montant déclaré', 'montant_declare', 'DECIMAL', null, true, false, '0'],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEPOSEE'],
    ]],
  ['Déclaration Douanière', 'declaration_douaniere', 'Douanes',
    "Declaration en douane d'une marchandise a l'import/export", [
      ['Déclarant', 'declarant', 'TEXT', 200, true, false, null],
      ['Nature de la marchandise', 'nature_marchandise', 'TEXT', 150, true, false, null],
      ['Régime douanier', 'regime', 'TEXT', 50, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEPOSEE'],
    ]],
  ['Bien Patrimonial', 'bien_patrimonial', 'Patrimoine',
    "Bien immobilier ou mobilier appartenant a l'Etat", [
      ['Désignation', 'designation', 'TEXT', 200, true, false, null],
      ['Type de bien', 'type_bien', 'TEXT', 50, true, false, null],
      ['Institution affectataire', 'institution_affectataire', 'TEXT', 200, false, false, null],
      ['Valeur estimée', 'valeur_estimee', 'DECIMAL', null, false, false, '0'],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'ACTIF'],
    ]],
  ['Appel d\'Offres', 'appel_offres', 'Marchés Publics',
    "Appel d'offres public pour un marche", [
      ['Institution émettrice', 'institution', 'TEXT', 200, true, false, null],
      ['Objet du marché', 'objet', 'TEXT', null, true, false, null],
      ['Montant estimé', 'montant_estime', 'DECIMAL', null, false, false, '0'],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'PUBLIE'],
    ]],
  ['Dossier Projet', 'dossier_projet_investissement', 'Investissements',
    "Projet d'investissement public suivi de l'etude a la reception", [
      ['Intitulé du projet', 'intitule', 'TEXT', 200, true, false, null],
      ['Institution porteuse', 'institution_porteuse', 'TEXT', 200, true, false, null],
      ['Budget prévisionnel', 'budget_previsionnel', 'DECIMAL', null, false, false, '0'],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'ETUDE'],
    ]],
  ['Incident Sécuritaire', 'incident_securitaire', 'Sécurité',
    "Incident releve par les services de securite", [
      ['Nature de l\'incident', 'nature', 'TEXT', 150, true, false, null],
      ['Localisation', 'localisation', 'TEXT', 200, true, false, null],
      ['Niveau de gravité', 'gravite', 'TEXT', 20, true, false, 'FAIBLE'],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'SIGNALE'],
    ]],
  ['Dossier Logistique Défense', 'dossier_logistique_defense', 'Défense',
    "Dossier administratif logistique (non operationnel) des forces armees", [
      ['Unité concernée', 'unite_concernee', 'TEXT', 200, true, false, null],
      ['Nature du besoin', 'nature_besoin', 'TEXT', 150, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEMANDE'],
    ]],
  ['Dossier Scolaire', 'dossier_scolaire', 'Éducation',
    "Dossier d'un etablissement ou d'un eleve dans le systeme educatif", [
      ['Établissement', 'etablissement', 'TEXT', 200, true, false, null],
      ['Type de dossier', 'type_dossier', 'TEXT', 50, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'OUVERT'],
    ]],
  ['Exploitation Agricole', 'exploitation_agricole', 'Agriculture',
    "Exploitation agricole enregistree aupres du ministere", [
      ['Exploitant', 'exploitant', 'TEXT', 200, true, false, null],
      ['Culture principale', 'culture_principale', 'TEXT', 100, true, false, null],
      ['Superficie (ha)', 'superficie_ha', 'DECIMAL', null, false, false, '0'],
      ['Province', 'province', 'TEXT', 100, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'ACTIVE'],
    ]],
  ['Raccordement Énergétique', 'raccordement_energetique', 'Énergie',
    "Demande de raccordement au reseau electrique national", [
      ['Demandeur', 'demandeur', 'TEXT', 200, true, false, null],
      ['Localisation', 'localisation', 'TEXT', 200, true, false, null],
      ['Type de raccordement', 'type_raccordement', 'TEXT', 50, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEMANDE'],
    ]],
  ['Licence Commerciale', 'licence_commerciale', 'Commerce',
    "Licence d'exercice d'une activite commerciale", [
      ['Titulaire', 'titulaire', 'TEXT', 200, true, false, null],
      ['Activité commerciale', 'activite', 'TEXT', 150, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEMANDE'],
    ]],
  ['Autorisation Industrielle', 'autorisation_industrielle', 'Industrie',
    "Autorisation d'exploitation d'une unite industrielle", [
      ['Entreprise', 'entreprise', 'TEXT', 200, true, false, null],
      ['Type d\'installation', 'type_installation', 'TEXT', 150, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEMANDE'],
    ]],
  ['Immatriculation Véhicule', 'immatriculation_vehicule', 'Transport',
    "Immatriculation d'un vehicule aupres de l'administration des transports", [
      ['Propriétaire', 'proprietaire', 'TEXT', 200, true, false, null],
      ['Type de véhicule', 'type_vehicule', 'TEXT', 50, true, false, null],
      ['Numéro de châssis', 'numero_chassis', 'TEXT', 50, false, true, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'EN_COURS'],
    ]],
  ['Licence Télécom', 'licence_telecom', 'Télécommunications',
    "Licence d'exploitation d'un service de telecommunications", [
      ['Opérateur', 'operateur', 'TEXT', 200, true, false, null],
      ['Type de service', 'type_service', 'TEXT', 100, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEMANDE'],
    ]],
  ['Étude d\'Impact Environnemental', 'etude_impact_environnemental', 'Environnement',
    "Etude d'impact environnemental d'un projet", [
      ['Porteur du projet', 'porteur_projet', 'TEXT', 200, true, false, null],
      ['Localisation', 'localisation', 'TEXT', 200, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'DEPOSEE'],
    ]],
  ['Bien Culturel Protégé', 'bien_culturel_protege', 'Culture',
    "Bien culturel ou site classe et protege", [
      ['Désignation', 'designation', 'TEXT', 200, true, false, null],
      ['Type de bien', 'type_bien', 'TEXT', 100, true, false, null],
      ['Localisation', 'localisation', 'TEXT', 200, false, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'CLASSE'],
    ]],
  ['Fédération Sportive', 'federation_sportive', 'Sports',
    "Federation sportive reconnue par l'Etat", [
      ['Dénomination', 'denomination', 'TEXT', 200, true, false, null],
      ['Discipline', 'discipline', 'TEXT', 100, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'RECONNUE'],
    ]],
  ['Projet de Recherche', 'projet_recherche', 'Recherche',
    "Projet de recherche scientifique finance ou suivi par l'Etat", [
      ['Institution porteuse', 'institution_porteuse', 'TEXT', 200, true, false, null],
      ['Domaine de recherche', 'domaine', 'TEXT', 100, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'EN_COURS'],
    ]],
  ['Accord de Coopération', 'accord_cooperation', 'Coopération',
    "Accord de cooperation bilaterale ou multilaterale", [
      ['Partenaire', 'partenaire', 'TEXT', 200, true, false, null],
      ['Objet de l\'accord', 'objet', 'TEXT', null, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'NEGOCIATION'],
    ]],
  ['Plan de Développement', 'plan_developpement', 'Planification',
    "Plan de developpement national ou provincial", [
      ['Intitulé', 'intitule', 'TEXT', 200, true, false, null],
      ['Portée', 'portee', 'TEXT', 50, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'ELABORATION'],
    ]],
  ['Enquête Statistique', 'enquete_statistique', 'Statistiques',
    "Enquete statistique officielle menee par l'Etat", [
      ['Intitulé', 'intitule', 'TEXT', 200, true, false, null],
      ['Institution responsable', 'institution_responsable', 'TEXT', 200, true, false, null],
      ['Statut', 'statut', 'TEXT', 20, true, false, 'PLANIFIEE'],
    ]],
];

async function main() {
    let count = 0;
    for (const [nom, nomTable, categorie, description, champs] of DOMAINES) {
        const entityId = await creerEntite(nom, nomTable, categorie, description, categorie);
        let ordre = 1;
        for (const [nomChamp, colonne, type, longueur, obligatoire, unique_, defaut] of champs) {
            await creerAttribut(entityId, nomChamp, colonne, type, longueur, obligatoire, unique_, defaut, ordre++);
        }
        count++;
    }
    console.log(`\nOK - ${count} entites metier decrites en metadonnees (couverture des domaines restants du Livre 2).`);
    console.log('Prochaine etape : node 23-seed-workflow-batch3.js');
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
