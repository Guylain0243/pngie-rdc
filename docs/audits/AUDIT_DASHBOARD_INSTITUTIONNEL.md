# AUDIT DASHBOARD INSTITUTIONNEL

**Statut :** OUVERT
**Date d ouverture :** 06/08/2026
**Chantier :** independant de la suite E2E Securite (001-006, cloturee, 77/77)

## Observation SEC-001

### Route concernee

GET /api/institutions/:id/dashboard

Fichier : routes-generated/institutions_dashboard.routes.js
Montage : src/server.js ligne 458 -> app.use('/api', requireAuth, institutionsDashboardRouter)

### Protection actuelle confirmee par lecture du code

- requireAuth : OUI (JWT obligatoire)
- exigerPermission() : ABSENT
- exigerPortee() : ABSENT

Meme constat sur la route soeur GET /institutions/liste du meme fichier.

### Preuve empirique (test E2E manuel, non integre a la suite automatisee)

- Compte utilise : test-an@pngie.local (role AN, aucun acces agent/affectation par ailleurs)
- Institution testee : MIN_2 - Affaires Etrangeres, Cooperation internationale et
  Francophonie (institution_id: 061cbc50-a582-44d9-8c9c-31b25debe98d), hors du
  perimetre AN (Assemblee Nationale)
- Resultat obtenu : HTTP 200

### Donnees exposees dans la reponse

- Fiche institution (nom, type, description)
- Organigramme complet : 25 unites organisationnelles avec hierarchie
- 25 postes avec intitule, categorie, niveau hierarchique
- Nom et prenom reels du titulaire du poste "Ministre"
- Liste des 20 derniers documents de l institution (titre, reference, statut,
  confidentialite, date) - AUCUN filtre sur le champ confidentialite dans la
  requete SQL (verifie par lecture du code, lignes 100-102 du fichier de routes)

### Constat

Le comportement est confirme empiriquement et par lecture du code source.

Il n est PAS etabli si ce comportement est :
- volontaire (dashboard "vitrine" national accessible a tout utilisateur
  authentifie, quel que soit son role), ou
- un oubli de controle RBAC/Scope lors du developpement de ce module.

Le seul document present en base pour l institution testee a une confidentialite
PUBLIC, ce qui limite l impact observe dans ce cas precis. Mais l absence de
filtre dans la requete SQL signifie qu un document de confidentialite plus
elevee serait expose de la meme maniere s il existait.

## Decision

Aucune modification du code tant que les deux points suivants n ont pas ete
clarifies :

1. Recensement des usages frontend de cette route (qui l appelle, dans quel
   contexte : cockpit national, dashboard institution propre, autre)
2. Decision metier sur la politique d acces voulue pour ce dashboard

## Prochaines etapes

- [ ] Recensement frontend des appels a /institutions/:id/dashboard et
      /institutions/liste
- [ ] Decision metier documentee (acces ouvert voulu vs correction requise)
- [ ] Si correction requise : ajout de exigerPermission()/exigerPortee()
      plus tests E2E dedies avant deploiement
- [ ] Mise a jour de ce document avec le statut final (CLOS / CORRIGE / ACCEPTE)

## Recensement frontend

Non realise : aucun depot frontend present sur cette machine (verifie le 06/08/2026,
seul C:\pngie-rdc\pngie-backend existe localement). A effectuer des que le depot
frontend sera accessible, avant toute modification de la route.

