> Statut : HISTORIQUE
> Remplacé par : docs/architecture/ARCHITECTURE_V2.md
> Conserver pour référence uniquement.

# PNGIE-RDC â€” Baseline V1

## Objectif

Cette baseline reprÃ©sente le premier Ã©tat stable et sÃ©curisÃ© du backend PNGIE-RDC :
API Node.js + PostgreSQL, contrÃ´le d'accÃ¨s basÃ© sur le scope institutionnel
(`person_role.scope_org_id`), et suite de tests end-to-end validÃ©e.

Elle sert de socle de rÃ©fÃ©rence avant l'ouverture de tout nouveau module fonctionnel
(cockpit, budget, etc.).

## Architecture

- **Backend** : Node.js
- **Base de donnÃ©es** : PostgreSQL
- **ContrÃ´le d'accÃ¨s** : scope institutionnel par compte (`person_role.scope_org_id`),
  avec lecture nationale pour certains rÃ´les (ex. PrÃ©sidence)
- Voir `docs/architecture/ARCHITECTURE_V2.md` pour le dÃ©tail de l'architecture applicative
- Voir `docs/standard/PNGIE_Secure_API_v1.0.md` pour les conventions de sÃ©curitÃ© API

## PrÃ©requis

- Node.js (voir `package.json` pour la version exacte)
- PostgreSQL
- Variables d'environnement de connexion Ã  la base (voir `.env.*.local`, non versionnÃ©)

## Installation

```powershell
cd C:\pngie-rdc\pngie-backend
npm install
```

## Bootstrap / Seed

```powershell
node db/seed.js
```

## Lancement

```powershell
node src/server.js
```
ou via le script fourni :
```powershell
lancer-pngie.bat
```

## Tests

Suite de tests end-to-end (dossier `tests/e2e/`).

**Ã‰tat validÃ© Ã  la Baseline V1 : 106/106 tests E2E verts.**

## SÃ©curitÃ©

- ContrÃ´le d'accÃ¨s par institution vÃ©rifiÃ© sur `/institutions/:id/dashboard`
  (`verifierAccesInstitution()` dans `routes-generated/institutions_dashboard.routes.js`)
- Script de validation automatisÃ©e : voir `archive/sessions/2026-08-14/diagnostics/`
  pour les scripts d'investigation ayant permis de couvrir les 7 comptes testÃ©s
  (an@, sn@, gv@, pm@, pr@, mi@, ace@)
- Voir aussi `docs/audits/AUDIT_DASHBOARD_INSTITUTIONNEL.md` et
  `docs/audits/AUDIT_RLS_PRE_SWITCH.md` pour l'historique d'audit de ce pÃ©rimÃ¨tre

## Tags Git

| Tag | Description |
|---|---|
| `baseline-v1` | Baseline V1 stable â€” 106/106 tests E2E verts |
| `baseline-v1.1` | Correctif IDOR dashboard, correction des scopes institutionnels (AN/SN/PR/PM/GV/MI), nettoyage et archivage du dÃ©pÃ´t |

## TraÃ§abilitÃ© de session

L'historique dÃ©taillÃ© des investigations et correctifs ayant menÃ© Ã  `baseline-v1.1`
est conservÃ© dans `archive/sessions/2026-08-14/` (voir le `README.md` de ce dossier).

## RÃ¨gle de gouvernance

Cette baseline ne doit plus Ãªtre modifiÃ©e directement, sauf dÃ©couverte d'un bug
ou d'une faille de sÃ©curitÃ© avÃ©rÃ©e. Tout nouveau dÃ©veloppement se fait sur une
branche `feature/*` dÃ©diÃ©e, Ã  partir de cet Ã©tat.

