\# Décision de gouvernance — Statut du "Programme PNGIE V3"



\*\*Date : voir historique git\*\*

\*\*Statut du présent document : décision actée\*\*



\## Contexte



Un document de réflexion ("Programme PNGIE V3", 18 phases, de l'urbanisation

à la plateforme nationale et au portail citoyen) a été proposé comme suite

du Sprint 3. Il contient :



\- des éléments directement fondés sur l'audit (Phase A — Urbanisation,

&#x20; Phase B — brancher RNSO/RNSJ/Justice) ;

\- des éléments non fondés sur un audit, une spécification ou une décision

&#x20; institutionnelle (Phases III et XI à XVIII : Cockpit V2, plateforme

&#x20; nationale, portail citoyen, PKI nationale, intelligence artificielle

&#x20; décisionnelle, gouvernance des données à 5 ans).



\## Risque identifié



Le Sprint 3 a démontré qu'une documentation extensive et non vérifiée

(`schema.sql`, `seed-extension.js`, `AUDIT\_PNGIE\_RDC.md`, etc.) avait dérivé

du code réel sans que personne ne le détecte, créant une confusion durable

entre "ce qui est documenté" et "ce qui existe". Adopter un document de 18

phases sans distinction claire entre "vérifié" et "aspirationnel"

reproduirait ce même risque, à l'échelle du programme plutôt que du schéma.



\## Décision



1\. Le document "Programme PNGIE V3" est conservé tel quel, \*\*hors du dossier

&#x20;  `docs/` d'exécution\*\*, dans un emplacement distinct (par exemple

&#x20;  `docs/vision/PROGRAMME\_V3\_NON\_ENGAGE.md`), avec ce bandeau en tête :



&#x20;  > ⚠️ Ce document est une note de réflexion, non engagée, non budgétée,

&#x20;  > non validée. Aucune phase au-delà de "Urbanisation" et "Brancher

&#x20;  > RNSO/RNSJ/Justice" ne doit être traitée comme un plan de travail actif

&#x20;  > sans passer par une spécification et une décision explicite séparée.



2\. Seuls les éléments suivants, directement issus de l'audit Sprint 3, sont

&#x20;  retenus comme travail engagé :

&#x20;  - `PNGIE\_MASTER\_MAP.md` (déjà produit et commité)

&#x20;  - Sprint 4 : branchement des référentiels Justice/RNSO/RNSJ déjà réels

&#x20;    en base



3\. Toute extension au-delà de ce périmètre (nouveaux modules métier, PKI

&#x20;  nationale, portail citoyen, intelligence artificielle décisionnelle,

&#x20;  gouvernance de données à 5 ans) nécessite, avant d'être engagée :

&#x20;  - une spécification fonctionnelle propre,

&#x20;  - une validation explicite (technique et, le cas échéant,

&#x20;    institutionnelle/politique pour les sujets touchant à la souveraineté

&#x20;    des données ou au cadre légal),

&#x20;  - sa propre trace d'audit, suivant la même discipline que les Sprints 1-3.



\## Ce que cette décision n'est pas



Elle ne rejette pas la vision à long terme — elle la met en attente

explicite, documentée, pour éviter qu'elle ne soit confondue avec du travail

déjà validé.

