> Statut : CANONIQUE
> Derni�re r�vision : 2026-09-05
# PNGIE-RDC — Vision du projet

## Objectif

PNGIE-RDC est un système d'information destiné aux institutions
publiques de la République Démocratique du Congo. Il vise à fournir une
plateforme commune permettant à différentes institutions — ministères,
provinces, services territoriaux — de gérer leurs données, leurs
processus et leurs décisions de manière sécurisée, traçable et
interopérable.

## Problèmes que le projet cherche à résoudre

- Dispersion des données entre institutions, sans référentiel commun.
- Absence de traçabilité fiable des décisions et actions administratives.
- Difficulté à faire collaborer plusieurs institutions sur un même
  dossier ou processus.
- Manque d'outils numériques modernes, sécurisés et adaptés au contexte
  institutionnel congolais.

## Grands principes

- **Sécurité** — authentification forte, contrôle d'accès par rôle
  (RBAC), cloisonnement des données par institution (RLS).
- **Traçabilité** — toute action significative est journalisée
  (journal d'audit), aucune donnée n'est modifiée silencieusement.
- **Modularité** — le système est conçu pour accueillir de nouveaux
  domaines métier (finances publiques, cadastre, marchés publics, etc.)
  sans reconstruction complète.
- **Interopérabilité** — le système doit pouvoir s'intégrer avec
  d'autres systèmes existants ou futurs, plutôt que fonctionner en
  silo.
- **Sobriété technique** — préférer des choix éprouvés et documentés à
  des solutions complexes non justifiées par un besoin réel.

## Structure du projet

Le projet se décompose en trois niveaux distincts, à ne pas confondre :

1. **Le logiciel** (`docs/software/`) — ce qui est développé et testé
   au quotidien : backend, base de données, API, RBAC, RLS, tests.
   C'est le travail en cours (voir `01_FEUILLE_DE_ROUTE.md`).
2. **L'architecture de référence** (`docs/architecture/`) — les
   exigences techniques que toute infrastructure de déploiement devra
   satisfaire (sécurité, réseau, haute disponibilité, sauvegardes,
   supervision), sans imposer un fournisseur ou une solution
   particulière.
3. **Le programme de déploiement national** (`docs/deployment/`) — les
   décisions de gouvernance, la stratégie de déploiement pilote, la
   formation, l'exploitation. Ce niveau dépend de décisions
   institutionnelles qui ne relèvent pas du développement logiciel
   (budget, opérateurs, institutions pilotes, politiques de sécurité).

Les décisions techniques structurantes sont consignées au fil de
l'eau dans `docs/DECISIONS_ARCHITECTURALES/` (Architecture Decision
Records), pour que le raisonnement derrière chaque choix important reste
accessible aux personnes qui rejoindront le projet plus tard.

## Priorité actuelle

Le projet est aujourd'hui concentré sur le **Niveau 1 (le logiciel)**.
Les Niveaux 2 et 3 ne seront développés en détail qu'une fois le
logiciel stabilisé — documenter une infrastructure nationale avant que
les fondations logicielles soient stables reviendrait à écrire une
documentation qui devrait être reprise dès le premier changement de
schéma ou d'architecture.

Voir `01_FEUILLE_DE_ROUTE.md` pour l'état d'avancement détaillé.
