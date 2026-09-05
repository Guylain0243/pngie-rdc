> Statut : CANONIQUE
> Remplace : vision/archive/PNGIE_Roadmap_v1.0.md
> Dernière révision : 2026-09-05
# PNGIE-RDC â€” Feuille de route

Ce document donne une vue d'ensemble des grandes Ã©tapes du projet, du
dÃ©veloppement logiciel jusqu'Ã  l'exploitation nationale. Il est mis Ã 
jour au fil de l'avancement ; il ne remplace pas le suivi dÃ©taillÃ© des
sprints (voir `docs/PHASE_*.md` et l'historique Git pour le dÃ©tail du
travail en cours).

## Programmes stratégiques

*Intégré depuis vision/archive/PNGIE_Roadmap_v1.0.md (2026-09-05)*

**Programme 1 - Sécurité** *(en cours)* : PNGIE, RBAC, ScopeResolver, RNG Phase 1, Organigrammes, Affectations FAITS. Migration RLS Production = priorité immédiate.

**Programme 2 - Gouvernance** *(après RLS)* : Journal National, Cockpit National, Décisions gouvernementales.

**Programme 3 - Gestion** *(long terme)* : ERP, GED, Interopérabilité, BI, IA, Plateforme Citoyenne, PNGIE v2.

Principe directeur : chaque phase validée E2E avant la suivante.

## Les 10 Ã©tapes

| # | Ã‰tape | PÃ©rimÃ¨tre | Ã‰tat |
|---|---|---|---|
| 1 | DÃ©veloppement du logiciel | Backend, base de donnÃ©es, API, RBAC, RLS, tests | ðŸŸ¡ En cours |
| 2 | Stabilisation | 100 % des tests verts, schÃ©ma stabilisÃ©, CI/CD | ðŸŸ¡ En cours |
| 3 | Infrastructure de rÃ©fÃ©rence | Documentation d'architecture, exigences techniques | â³ Ã€ prÃ©parer |
| 4 | DÃ©ploiement pilote | Quelques institutions volontaires | â³ |
| 5 | DÃ©ploiement ministÃ©riel | MinistÃ¨res | â³ |
| 6 | DÃ©ploiement provincial | Les provinces | â³ |
| 7 | DÃ©ploiement territorial | Divisions, districts, territoires | â³ |
| 8 | Formation des utilisateurs | Ã‰quipes locales et nationales | â³ |
| 9 | Mise en service nationale | GÃ©nÃ©ralisation | â³ |
| 10 | Exploitation permanente | Support, Ã©volutions, nouveaux modules | â³ |

## Ã‰tat dÃ©taillÃ© â€” Ã‰tape 1 (DÃ©veloppement)

Le dÃ©veloppement suit une logique de sprints, documentÃ©e
individuellement dans `docs/`. Ã‰tat au dernier point de synchronisation :

- **Sprint 1** â€” Suite de tests e2e : 106/106 tests verts. âœ…
- **Sprint 2A** â€” Isolation SQLite / DATABASE_URL. âœ…
- **Sprint 2B** â€” Alignement du schÃ©ma SQLite sur PostgreSQL.
  - Phase 0-4A : diagnostic et corrections de trajectoire successives. âœ…
  - Phase 5 : pÃ©rimÃ¨tre stabilisÃ© Ã  33 tables prioritaires, classÃ©es en
    5 motifs structurels. DÃ©cision : automatisation justifiÃ©e pour
    31/33 tables (94 %). âœ…
- **Sprint 2C** â€” GÃ©nÃ©rateur SQLite paramÃ©trable. â³ Ã€ dÃ©marrer
  (voir plan dÃ©taillÃ© en fin de session la plus rÃ©cente).
- **Sprint 2D** â€” `npm test` entiÃ¨rement vert en SQLite. â³
- **Sprints 3 Ã  6** â€” Nettoyage architecture, qualitÃ©/CI, documentation,
  performance. â³
- **Sprints 7-8** â€” SÃ©curitÃ© applicative, release logicielle. â³

## SÃ©quencement gÃ©nÃ©ral

Le travail suit un ordre volontairement strict : chaque Ã©tape s'appuie
sur la prÃ©cÃ©dente, sans anticiper prÃ©maturÃ©ment sur les suivantes.

```
1. Terminer le logiciel
   (Sprint 2C, 2D, stabilisation, qualitÃ©)
        |
        v
2. PrÃ©parer l'architecture de rÃ©fÃ©rence
   (documentation, exigences, sÃ©curitÃ©, rÃ©seau, haute disponibilitÃ©)
        |
        v
3. PrÃ©parer le programme de dÃ©ploiement
   (pilote, formation, exploitation, gouvernance)
        |
        v
4. Mise en service opÃ©rationnelle
   (dÃ©ploiement progressif, accompagnement, exploitation continue)
```

Les Ã©tapes 3 (infrastructure de rÃ©fÃ©rence, niveau documentation
d'exigences) et suivantes ne seront dÃ©taillÃ©es qu'une fois le logiciel
stabilisÃ© (fin de l'Ã©tape 1-2). Documenter une infrastructure nationale
avant que le schÃ©ma de donnÃ©es et l'architecture applicative soient
stables produirait une documentation qui devrait Ãªtre rÃ©Ã©crite Ã  chaque
Ã©volution des fondations.

## Note sur le pÃ©rimÃ¨tre

Les Ã©tapes 3 Ã  10 concernent un dÃ©ploiement d'ampleur nationale
(infrastructure rÃ©seau gouvernementale, VPN, haute disponibilitÃ©,
formation, gouvernance institutionnelle). Ce sont des dÃ©cisions et des
travaux qui dÃ©passent le dÃ©veloppement logiciel et impliquent des choix
de gouvernance, de budget et d'organisation qui ne relÃ¨vent pas d'une
seule Ã©quipe de dÃ©veloppement. Ce document sert de boussole d'ensemble ;
il ne prÃ©juge pas des dÃ©cisions institutionnelles Ã  venir.
