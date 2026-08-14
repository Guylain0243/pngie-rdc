# PNGIE-RDC — Baseline V1

## Objectif

Cette baseline représente le premier état stable et sécurisé du backend PNGIE-RDC :
API Node.js + PostgreSQL, contrôle d'accès basé sur le scope institutionnel
(`person_role.scope_org_id`), et suite de tests end-to-end validée.

Elle sert de socle de référence avant l'ouverture de tout nouveau module fonctionnel
(cockpit, budget, etc.).

## Architecture

- **Backend** : Node.js
- **Base de données** : PostgreSQL
- **Contrôle d'accès** : scope institutionnel par compte (`person_role.scope_org_id`),
  avec lecture nationale pour certains rôles (ex. Présidence)
- Voir `docs/architecture/ARCHITECTURE_V2.md` pour le détail de l'architecture applicative
- Voir `docs/standard/PNGIE_Secure_API_v1.0.md` pour les conventions de sécurité API

## Prérequis

- Node.js (voir `package.json` pour la version exacte)
- PostgreSQL
- Variables d'environnement de connexion à la base (voir `.env.*.local`, non versionné)

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

**État validé à la Baseline V1 : 106/106 tests E2E verts.**

## Sécurité

- Contrôle d'accès par institution vérifié sur `/institutions/:id/dashboard`
  (`verifierAccesInstitution()` dans `routes-generated/institutions_dashboard.routes.js`)
- Script de validation automatisée : voir `archive/sessions/2026-08-14/diagnostics/`
  pour les scripts d'investigation ayant permis de couvrir les 7 comptes testés
  (an@, sn@, gv@, pm@, pr@, mi@, ace@)
- Voir aussi `docs/audits/AUDIT_DASHBOARD_INSTITUTIONNEL.md` et
  `docs/audits/AUDIT_RLS_PRE_SWITCH.md` pour l'historique d'audit de ce périmètre

## Tags Git

| Tag | Description |
|---|---|
| `baseline-v1` | Baseline V1 stable — 106/106 tests E2E verts |
| `baseline-v1.1` | Correctif IDOR dashboard, correction des scopes institutionnels (AN/SN/PR/PM/GV/MI), nettoyage et archivage du dépôt |

## Traçabilité de session

L'historique détaillé des investigations et correctifs ayant mené à `baseline-v1.1`
est conservé dans `archive/sessions/2026-08-14/` (voir le `README.md` de ce dossier).

## Règle de gouvernance

Cette baseline ne doit plus être modifiée directement, sauf découverte d'un bug
ou d'une faille de sécurité avérée. Tout nouveau développement se fait sur une
branche `feature/*` dédiée, à partir de cet état.
