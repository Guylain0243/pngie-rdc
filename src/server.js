// PNGIE-RDC — Backend fonctionnel
// Authentification réelle (bcrypt async + JWT), RBAC vérifié côté serveur,
// journal d'audit chaîné par hash, moteur de base de données double
// (SQLite pour le dev/tests, PostgreSQL pour la production — voir src/db.js),
// rate limiting distribué (Redis en production, mémoire locale en dev — voir src/rateLimiter.js).
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const audit = require('./lib/audit');
const requestContext = require('./request-context');
const db = require('./db');
const { checkLimit } = require('./rateLimiter');
const { askAgent } = require('./aiAgent');

const app = express();
app.use(cors());
app.use(express.json());

// ── Barrière d'accès supplémentaire, avant même l'écran de connexion ──
// Activée uniquement si GATE_USER et GATE_PASS sont définis (utile surtout
// quand le serveur est exposé publiquement, via un tunnel par exemple).
// Comparaison en temps constant pour éviter les attaques par mesure de timing.
const GATE_USER = process.env.GATE_USER;
const GATE_PASS = process.env.GATE_PASS;
if (GATE_USER && GATE_PASS) {
  app.use((req, res, next) => {
    if (req.path === '/api/auth/login') return next();

    // Bypass GATE si un Bearer JWT valide est present (client normal deja authentifie)
    const authHeader = req.headers['authorization'] || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
        return next();
      } catch (e) {
        // JWT absent/invalide/expire : on retombe sur la verification GATE ci-dessous
      }
    }

    const header = req.headers['x-gate-auth'] || req.headers['authorization'] || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
      const userBuf = Buffer.from(String(user)); const gateUserBuf = Buffer.from(GATE_USER);
      const passBuf = Buffer.from(String(pass)); const gatePassBuf = Buffer.from(GATE_PASS);
      const userOk = userBuf.length === gateUserBuf.length && crypto.timingSafeEqual(userBuf, gateUserBuf);
      const passOk = passBuf.length === gatePassBuf.length && crypto.timingSafeEqual(passBuf, gatePassBuf);
      if (userOk && passOk) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="PNGIE-RDC - Acces restreint"');
    res.status(401).send('Accès refusé.');
  });
  console.log('✓ Barrière d\'accès HTTP activée (GATE_USER/GATE_PASS définis)');
} else {
  console.log('⚠ Barrière d\'accès HTTP NON activée — GATE_USER/GATE_PASS non définis (recommandé si exposé publiquement)');
}

app.use(express.static(require('path').join(__dirname, '..', 'public')));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error("ERREUR FATALE : JWT_SECRET absent ou trop faible (minimum 32 caracteres). Definir une variable d'environnement JWT_SECRET valide avant de demarrer le serveur.");
  process.exit(1);
}
const TOKEN_TTL = '8h';

// Enveloppe les handlers async pour que toute erreur (y compris une panne DB)
// retourne un 500 propre au lieu de faire planter le processus entier —
// jamais testé explicitement avant cette migration, corrigé ici.
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// audit() deplacee vers src/lib/audit.js (module partage) le 2026-08-01

async function hasPermission(roles, permCode) {
  if (!permCode) return true;
  for (const roleCode of roles) {
    const row = await db.get(`
      SELECT 1 FROM role_permission rp JOIN role r ON r.role_id=rp.role_id
      JOIN permission p ON p.permission_id=rp.permission_id
      WHERE r.code=? AND p.code=?`, [roleCode, permCode]);
    if (row) return true;
  }
  return false;
}

// ─── POST /api/auth/login — authentification réelle ───
app.use('/api', require('../routes-generated/public_institutions.routes'));

app.post('/api/auth/login', wrap(async (req, res) => {
  const rateLimitEnabled = process.env.RATE_LIMIT_DISABLED !== "true"; const blocked = rateLimitEnabled ? await checkLimit(req.ip, 10, 900) : false;
  if (blocked) return res.status(429).json({ error: 'Trop de tentatives. Réessayez plus tard.' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });

  const person = await db.get('SELECT * FROM person WHERE email = ? AND statut = ?', [email, 'ACTIF']);
  const passwordOk = person ? await bcrypt.compare(password, person.password_hash) : false;
  if (!person || !passwordOk) {
    await audit(person ? person.person_id : null, 'LOGIN_FAILED', 'person', person ? person.person_id : null, { email });
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const roles = await requestContext.run({ bypassRls: true }, async () => db.all(`
    SELECT r.code, r.nom, r.categorie FROM person_role pr
    JOIN role r ON r.role_id = pr.role_id WHERE pr.person_id = ?`, [person.person_id]));

  const token = jwt.sign(
    { sub: person.person_id, email: person.email, roles: roles.map(r => r.code) },
    JWT_SECRET, { expiresIn: TOKEN_TTL }
  );

  const sessionId = crypto.randomUUID();
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.run(
    `INSERT INTO session_utilisateur (session_id, personne_id, token_hash, adresse_ip, user_agent, date_debut, date_expiration, statut)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW() + INTERVAL '8 hours', 'ACTIF')`,
    [sessionId, person.person_id, tokenHash, req.ip, req.headers['user-agent'] || null]
  );

  await audit(person.person_id, 'LOGIN_SUCCESS', 'person', person.person_id, {});
  res.json({ token, person: { nom: person.nom, prenom: person.prenom, email: person.email }, roles });
}));

app.post('/api/auth/logout', wrap(async (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token manquant.' });
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expire.' });
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  await db.run(
    `UPDATE session_utilisateur SET statut = 'REVOQUEE', date_revocation = NOW() WHERE token_hash = ? AND statut = 'ACTIF'`,
    [tokenHash]
  );
  await audit(decoded.sub, 'LOGOUT', 'person', decoded.sub, {});
  res.json({ message: 'Deconnexion reussie.' });
}));

// ─── Middleware d'authentification ───
// --- Middleware d'authentification (implementation unique, partagee) ---
const requireAuth = require('./middleware/requireAuth');
app.use('/api', requireAuth);
const resoudreRoleDepuisJWT = require('./middleware/resoudreRoleDepuisJWT');

// ─── Middleware RBAC ───
function requirePermission(permCode) {
  return wrap(async (req, res, next) => {
    const allowed = await hasPermission(req.user.roles, permCode);
    if (!allowed) {
      await audit(req.user.sub, 'ACCESS_DENIED', 'permission', null, { permCode });
      return res.status(403).json({ error: 'Accès refusé pour votre rôle.' });
    }
    next();
  });
}

app.get('/api/me', requireAuth, wrap(async (req, res) => {
  const person = await db.get('SELECT person_id,nom,prenom,email FROM person WHERE person_id=?', [req.user.sub]);
  const placeholders = req.user.roles.map(() => '?').join(',');
  const rows = await db.all(`
    SELECT DISTINCT p.code FROM role_permission rp
    JOIN role r ON r.role_id = rp.role_id
    JOIN permission p ON p.permission_id = rp.permission_id
    WHERE r.code IN (${placeholders})`, req.user.roles);
  const pages = rows.map(r => r.code.replace('page:', '').replace(':read', ''));
  res.json({ person, roles: req.user.roles, pages });
}));

app.get('/api/ministeres', requireAuth, requirePermission('page:ministeres:read'), wrap(async (req, res) => {
  const rows = await db.all(`
    SELECT o.nom, ot.libelle AS type, o.description
    FROM organization o JOIN organization_type ot ON ot.id = o.type_id
    WHERE ot.code = 'MINISTERE' ORDER BY o.nom`);
  await audit(req.user.sub, 'READ', 'ministeres', null, { count: rows.length });
  res.json(rows);
}));

app.get('/api/provinces', requireAuth, requirePermission('page:provinces:read'), wrap(async (req, res) => {
  const rows = await db.all(`
    SELECT o.nom, o.code FROM organization o JOIN organization_type ot ON ot.id = o.type_id
    WHERE ot.code = 'PROVINCE' ORDER BY o.nom`);
  res.json(rows);
}));

app.get('/api/organigramme', requireAuth, wrap(async (req, res) => {
  const rows = await db.all(`
    SELECT o.organization_id, o.nom, ot.libelle AS type, o.niveau, o.parent_id, o.description
    FROM organization o JOIN organization_type ot ON ot.id = o.type_id
    WHERE o.niveau <= 1 ORDER BY o.niveau`);
  res.json(rows);
}));

app.get('/api/audit', requireAuth, wrap(async (req, res) => {
  if (!req.user.roles.includes('PR') && !req.user.roles.includes('PM')) return res.status(403).json({ error: 'Réservé à la Présidence.' });
  const rows = await db.all('SELECT log_id,action,entite,created_at FROM audit_log ORDER BY log_id DESC LIMIT 50');
  res.json(rows);
}));

app.get('/api/gouvernance/cycle', requireAuth, requirePermission('page:institutions:read'), wrap(async (req, res) => {
  const [instructions, rapports, controles, recommandations, decisions, suivis] = await Promise.all([
    db.all(`SELECT i.instruction_id,i.titre,i.type,i.statut,i.echeance, eo.nom AS emetteur, dest.nom AS destinataire
            FROM instruction i
            JOIN organization eo ON eo.organization_id = i.emetteur_org_id
            JOIN organization dest ON dest.organization_id = i.destinataire_org_id`),
    db.all(`SELECT r.rapport_id,r.titre,r.synthese,r.periode,r.instruction_id, o.nom AS organisation, d.nom AS destinataire
            FROM rapport r
            JOIN organization o ON o.organization_id = r.organization_id
            LEFT JOIN organization d ON d.organization_id = r.destinataire_org_id`),
    db.all(`SELECT c.controle_id,c.type,c.objet,c.statut, oc.nom AS organe_controle, ocl.nom AS organisation_controlee,
            am.conclusion, am.rapport_final
            FROM controle c
            JOIN organization oc ON oc.organization_id = c.organe_controle_id
            JOIN organization ocl ON ocl.organization_id = c.organisation_controlee_id
            LEFT JOIN audit_mission am ON am.controle_id = c.controle_id`),
    db.all(`SELECT rec.recommandation_id,rec.libelle,rec.priorite, o.nom AS organisation_responsable
            FROM recommandation rec
            LEFT JOIN organization o ON o.organization_id = rec.organisation_responsable_id`),
    db.all(`SELECT dec.decision_id,dec.titre,dec.type, o.nom AS organisation
            FROM decision dec JOIN organization o ON o.organization_id = dec.organization_id`),
    db.all(`SELECT suivi_id,statut,commentaire,updated_at FROM suivi`),
  ]);
  res.json({ instructions, rapports, controles, recommandations, decisions, suivis });
}));

app.get('/api/integrations', requireAuth, wrap(async (req, res) => {
  const [systemes, flux] = await Promise.all([
    db.all(`SELECT s.systeme_id,s.nom,s.categorie,s.fournisseur,s.protocole,s.statut_connexion, o.nom AS organisation
            FROM systeme_externe s LEFT JOIN organization o ON o.organization_id = s.organization_id
            ORDER BY s.categorie, s.nom`),
    db.all(`SELECT f.flux_id,f.sens,f.objet,f.frequence, s.nom AS systeme
            FROM integration_flux f JOIN systeme_externe s ON s.systeme_id = f.systeme_id`),
  ]);
  res.json({ systemes, flux });
}));

app.get('/api/db-summary', requireAuth, wrap(async (req, res) => {
  const tables = [
    'pouvoir','organization_type','organization','unit','position','person','assignment',
    'responsabilite','organization_responsabilite','mission','organization_mission',
    'gov_relation','process','process_step','activite','programme','projet',
    'role','permission','role_permission','person_role',
    'portal','dashboard','module','menu','page','widget','kpi','kpi_valeur',
    'ai_agent','ai_conversation','ai_message','nocode_app','nocode_submission',
    'audit_log','instruction','plan_action','rapport','controle','audit_mission',
    'recommandation','decision','suivi','systeme_externe','integration_flux',
    'lieu','emploi_type','competence','document_type','document','service_numerique',
    // Socle institutionnel reel (RNI / RNSO)
    'institution','unite_organisationnelle','poste','affectation',
    // Referentiels juridiques et judiciaires (session du 30/07/2026)
    'rnsj_texte','rnsj_relation','rnsj_modification','ref_tribunal_grande_instance',
    // Les 35 modules metier actives le 30/07/2026 (4 deja existants + 31 en lot)
    'dossier_agent_rh','ligne_budgetaire','ordre_paiement','ecriture_comptable',
    'accord_cooperation','appel_offres','autorisation_industrielle','bien_culturel_protege',
    'bien_patrimonial','certificat_pki','decision_institutionnelle','declaration_douaniere',
    'declaration_fiscale','dossier_administratif','dossier_entreprise','dossier_judiciaire',
    'dossier_logistique_defense','dossier_projet_investissement','dossier_recouvrement',
    'dossier_scolaire','enquete_statistique','etude_impact_environnemental',
    'exploitation_agricole','facture','federation_sportive','immatriculation_vehicule',
    'incident_securitaire','licence_commerciale','licence_telecom','permis_minier',
    'plan_developpement','projet_recherche','raccordement_energetique',
    'reclamation_citoyenne','signalement_sanitaire',
  ];
  const counts = {};
  for (const t of tables) {
    try { counts[t] = (await db.get(`SELECT COUNT(*) c FROM ${t}`)).c; }
    catch { counts[t] = null; }
  }
  res.json({ total_tables: tables.length, counts, driver: db.driver });
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'pngie-rdc-backend', db_driver: db.driver }));

// ═══════════════════════════════════════════════════════════
// AGENTS IA
// ═══════════════════════════════════════════════════════════

app.get('/api/agents', requireAuth, wrap(async (req, res) => {
  const agents = await db.all(`SELECT agent_id, code, nom, type_agent AS role_ia, statut FROM agent_ia WHERE statut='ACTIF'`);
  const filtered = [];
  for (const a of agents) if (await hasPermission(req.user.roles, a.permission_code)) filtered.push(a);
  res.json(filtered);
}));

app.post('/api/agents/:id/chat', requireAuth, wrap(async (req, res) => {
  const agent = await db.get('SELECT agent_id, code, nom, type_agent AS role_ia, NULL AS permission_code, NULL AS system_prompt FROM agent_ia WHERE agent_id=?', [req.params.id]);
  if (!agent) return res.status(404).json({ error: 'Agent introuvable.' });

  if (agent.permission_code && !(await hasPermission(req.user.roles, agent.permission_code))) {
    await audit(req.user.sub, 'ACCESS_DENIED', 'ai_agent', agent.agent_id, {});
    return res.status(403).json({ error: 'Votre rôle n\'a pas accès à cet agent.' });
  }

  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message requis.' });

  const result = await askAgent(db, agent, message);

  const interactionId = crypto.randomUUID();
  await db.run(`INSERT INTO agent_ia_interaction (interaction_id, agent_id, personne_id, requete, reponse) VALUES (?,?,?,?,?)`,
    [interactionId, agent.agent_id, req.user.sub, message, result.ok ? result.reply : null]);

  await audit(req.user.sub, result.ok ? 'AI_CHAT' : 'AI_CHAT_FAILED', 'agent_ia', agent.agent_id, { interactionId });
  res.status(result.ok ? 200 : 502).json(result);
}));

// ═══════════════════════════════════════════════════════════
// NO-CODE
// ═══════════════════════════════════════════════════════════

function parseDefinition(raw) {
  // PostgreSQL (JSONB) renvoie déjà un objet ; SQLite (TEXT) renvoie une chaîne à parser.
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

app.get('/api/nocode/apps', requireAuth, wrap(async (req, res) => {
  const apps = await db.all(`SELECT workflow_id AS app_id, code, nom, statut, description FROM nocode_workflow WHERE statut='ACTIF'`);
  res.json(apps);
}));

app.get('/api/nocode/apps/:id', requireAuth, wrap(async (req, res) => {
  const appRow = await db.get(`SELECT workflow_id AS app_id, code, nom, statut, description FROM nocode_workflow WHERE workflow_id=?`, [req.params.id]);
  if (!appRow) return res.status(404).json({ error: 'Application introuvable.' });
  const etapes = await db.all(`SELECT etape_id, code, nom, ordre, type_etape, role_metier_id FROM nocode_workflow_etape WHERE workflow_id=? ORDER BY ordre`, [appRow.app_id]);
  const formulaire = await db.get(`SELECT formulaire_id, code, nom, schema_champs FROM nocode_formulaire WHERE workflow_id=?`, [appRow.app_id]);
  res.json({ ...appRow, etapes, formulaire: formulaire || null });
}));

app.post('/api/nocode/apps/:id/submit', requireAuth, wrap(async (req, res) => {
  const appRow = await db.get(`SELECT workflow_id AS app_id FROM nocode_workflow WHERE workflow_id=?`, [req.params.id]);
  if (!appRow) return res.status(404).json({ error: 'Application introuvable.' });

  const formulaire = await db.get(`SELECT schema_champs FROM nocode_formulaire WHERE workflow_id=?`, [appRow.app_id]);
  const data = req.body?.data || {};
  const champs = formulaire ? parseDefinition(formulaire.schema_champs) : [];
  for (const champ of (champs.champs || champs || [])) {
    if (champ.required && !data[champ.id]) {
      return res.status(400).json({ error: `Champ requis manquant : ${champ.label}` });
    }
  }

  const premiereEtape = await db.get(`SELECT etape_id FROM nocode_workflow_etape WHERE workflow_id=? ORDER BY ordre LIMIT 1`, [appRow.app_id]);
  const instanceId = crypto.randomUUID();
  await db.run(`INSERT INTO nocode_workflow_instance (instance_id, workflow_id, etape_courante_id, donnees, statut) VALUES (?,?,?,?,?)`,
    [instanceId, appRow.app_id, premiereEtape ? premiereEtape.etape_id : null, JSON.stringify(data), 'EN_COURS']);
  await audit(req.user.sub, 'NOCODE_SUBMIT', 'nocode_workflow', appRow.app_id, { instanceId });
  res.json({ ok: true, submission_id: instanceId });
}));

// ─── Gestionnaire d'erreurs global : jamais de plantage silencieux du process ───
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`✓ PNGIE-RDC backend démarré sur http://localhost:${PORT} (BDD: ${db.driver})`));
}
module.exports = app;// ── Gestionnaire d'erreurs global : jamais de plantage silencieux du process ── // ── Government Meta Platform : branchement du routeur genere (Facture) ──
// Resolution du role depuis le JWT, montee UNE SEULE FOIS pour toutes les routes /api protegees.
// Remplace progressivement les blocs inline dupliques ci-dessous (en cours de nettoyage).
app.use('/api', resoudreRoleDepuisJWT);

app.use('/api', require('../routes-generated/facture.routes')); 

app.use('/api', require('../routes-generated/permis_minier.routes'));

app.use('/api', require('../routes-generated/signalement_sanitaire.routes'));

app.use('/api', require('../routes-generated/dossier_judiciaire.routes'));

app.use('/api', require('../routes-generated/certificat_pki.routes'));

app.use('/api', require('../routes-generated/ref_tribunal_paix.routes'));

app.use('/api', require('../routes-generated/dossier_recouvrement.routes'));


app.use('/api', require('../routes-generated/arborescence.routes'));
app.use('/api', require('./domains/journal/journal.routes'));

// === BATCH3 ROUTES ===
const decisionInstitutionnelleRouter = require('../routes-generated/decision_institutionnelle.routes');
const dossierAdministratifRouter = require('../routes-generated/dossier_administratif.routes');
const reclamationCitoyenneRouter = require('../routes-generated/reclamation_citoyenne.routes');
const dossierEntrepriseRouter = require('../routes-generated/dossier_entreprise.routes');
const dossierAgentRhRouter = require('../routes-generated/dossier_agent_rh.routes');
const ligneBudgetaireRouter = require('../routes-generated/ligne_budgetaire.routes');
const ordrePaiementRouter = require('../routes-generated/ordre_paiement.routes');
const ecritureComptableRouter = require('../routes-generated/ecriture_comptable.routes');
const declarationFiscaleRouter = require('../routes-generated/declaration_fiscale.routes');
const declarationDouaniereRouter = require('../routes-generated/declaration_douaniere.routes');
const bienPatrimonialRouter = require('../routes-generated/bien_patrimonial.routes');
const appelOffresRouter = require('../routes-generated/appel_offres.routes');
const dossierProjetInvestissementRouter = require('../routes-generated/dossier_projet_investissement.routes');
const incidentSecuritaireRouter = require('../routes-generated/incident_securitaire.routes');
const dossierLogistiqueDefenseRouter = require('../routes-generated/dossier_logistique_defense.routes');
const dossierScolaireRouter = require('../routes-generated/dossier_scolaire.routes');
const exploitationAgricoleRouter = require('../routes-generated/exploitation_agricole.routes');
const raccordementEnergetiqueRouter = require('../routes-generated/raccordement_energetique.routes');
const licenceCommercialeRouter = require('../routes-generated/licence_commerciale.routes');
const autorisationIndustrielleRouter = require('../routes-generated/autorisation_industrielle.routes');
const immatriculationVehiculeRouter = require('../routes-generated/immatriculation_vehicule.routes');
const licenceTelecomRouter = require('../routes-generated/licence_telecom.routes');
const etudeImpactEnvironnementalRouter = require('../routes-generated/etude_impact_environnemental.routes');
const bienCulturelProtegeRouter = require('../routes-generated/bien_culturel_protege.routes');
const federationSportiveRouter = require('../routes-generated/federation_sportive.routes');
const projetRechercheRouter = require('../routes-generated/projet_recherche.routes');
const accordCooperationRouter = require('../routes-generated/accord_cooperation.routes');
const planDeveloppementRouter = require('../routes-generated/plan_developpement.routes');
const enqueteStatistiqueRouter = require('../routes-generated/enquete_statistique.routes');
const relationsRouter = require('../routes-generated/relations.routes');
const posteHierarchieRouter = require('../routes-generated/poste_hierarchie.routes');
const institutionsDashboardRouter = require('../routes-generated/institutions_dashboard.routes');
const mePosteRouter = require('../routes-generated/me_poste.routes');
const institutionsFicheRouter = require('../routes-generated/institutions_fiche.routes');
const institutionsValidationRouter = require('../routes-generated/institutions_validation.routes');
const annuaireRouter = require('../routes-generated/annuaire.routes');

app.use('/api', institutionsValidationRouter);
app.use('/api', annuaireRouter);

app.use('/api', decisionInstitutionnelleRouter);
app.use('/api', dossierAdministratifRouter);
app.use('/api', reclamationCitoyenneRouter);
app.use('/api', dossierEntrepriseRouter);
app.use('/api', dossierAgentRhRouter);
app.use('/api', ligneBudgetaireRouter);
app.use('/api', ordrePaiementRouter);
app.use('/api', ecritureComptableRouter);
app.use('/api', declarationFiscaleRouter);
app.use('/api', declarationDouaniereRouter);
app.use('/api', bienPatrimonialRouter);
app.use('/api', appelOffresRouter);
app.use('/api', dossierProjetInvestissementRouter);
app.use('/api', incidentSecuritaireRouter);
app.use('/api', dossierLogistiqueDefenseRouter);
app.use('/api', dossierScolaireRouter);
app.use('/api', exploitationAgricoleRouter);
app.use('/api', raccordementEnergetiqueRouter);
app.use('/api', licenceCommercialeRouter);
app.use('/api', autorisationIndustrielleRouter);
app.use('/api', immatriculationVehiculeRouter);
app.use('/api', licenceTelecomRouter);
app.use('/api', etudeImpactEnvironnementalRouter);
app.use('/api', bienCulturelProtegeRouter);
app.use('/api', federationSportiveRouter);
app.use('/api', projetRechercheRouter);
app.use('/api', accordCooperationRouter);
app.use('/api', planDeveloppementRouter);
app.use('/api', enqueteStatistiqueRouter);
app.use('/api', relationsRouter);
app.use('/api', posteHierarchieRouter);
app.use('/api', institutionsDashboardRouter);
app.use('/api', mePosteRouter);
app.use('/api', institutionsFicheRouter);
app.use('/api', require('../routes-generated/agent.routes'));
app.use('/api', require('../routes-generated/decision_gouvernementale.routes'));
app.use('/api', require('../routes-generated/grade.routes'));
app.use('/api', require('../routes-generated/corps.routes'));
app.use('/api', require('../routes-generated/affectation.routes'));
const rniCommandementRouter = require('./rni-commandement-routes');
app.use('/api', rniCommandementRouter);

// Cockpit Gouvernemental V1 (09/08/2026) -- src/domains/governance/.
// Migration PROGRESSIVE de decision_gouvernementale/decision_action hors de
// routes-generated (meta_permission) vers le patron Journal National
// (permission/personne_role). L'ancienne route (../routes-generated/
// decision_gouvernementale.routes, prefixe /decisions) reste montee
// volontairement le temps de valider le nouveau chemin (prefixe
// /governance/decisions) par les tests E2E -- a retirer une fois
// confirme, PAS avant (cf. decision d'architecture du 09/08/2026).
app.use('/api', require('./domains/governance/decision.routes'));
app.use('/api', require('./domains/governance/cockpit.routes'));