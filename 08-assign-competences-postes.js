const db = require('./src/db');

function detecterDomaine(nomOrg) {
    const n = nomOrg || '';
    if (/finance|imp[oô]t|douane|tr[eé]sor|dette|recouvrement|dgrad|cenaref|budget/i.test(n)) return 'Gestion budgétaire';
    if (/audit|igf|inspection|contr[oô]le/i.test(n)) return 'Audit financier';
    if (/num[eé]rique|cyber|cert|donn[eé]es|informatique/i.test(n)) return 'Analyse de données';
    if (/justice|cour|tribunal|parquet/i.test(n)) return 'Droit administratif';
    return null;
}

async function lierCompetence(positionId, competenceId, niveauRequis) {
    const existant = await db.get(
        `SELECT position_id FROM position_competence WHERE position_id = ? AND competence_id = ?`,
        [positionId, competenceId]
    );
    if (existant) return false;
    await db.run(
        `INSERT INTO position_competence (position_id, competence_id, niveau_requis) VALUES (?, ?, ?)`,
        [positionId, competenceId, niveauRequis]
    );
    return true;
}

async function main() {
    const competences = await db.all('SELECT competence_id, nom FROM competence');
    const compIds = {};
    competences.forEach(c => { compIds[c.nom] = c.competence_id; });

    const requis = ['Gestion budgétaire', 'Audit financier', 'Analyse de données', 'Droit administratif', 'Rédaction administrative', 'Management d\'équipe'];
    const manquantes = requis.filter(r => !compIds[r]);
    if (manquantes.length > 0) {
        console.warn(`ATTENTION : competences introuvables en base : ${manquantes.join(', ')}`);
    }

    const positions = await db.all(`
        SELECT p.position_id, p.titre, p.niveau, o.nom as org_nom
        FROM position p
        JOIN unit u ON p.unit_id = u.unit_id
        JOIN organization o ON u.organization_id = o.organization_id
    `);

    console.log(`--- ${positions.length} poste(s) a traiter ---\n`);

    let crees = 0, ignores = 0;

    for (const pos of positions) {
        const domaineComp = detecterDomaine(pos.org_nom);
        const niveauLeadership = pos.niveau <= 3;

        if (domaineComp && compIds[domaineComp]) {
            const niveauRequis = niveauLeadership ? 'Expert' : 'Maîtrise';
            const ok = await lierCompetence(pos.position_id, compIds[domaineComp], niveauRequis);
            ok ? crees++ : ignores++;
        }

        if (compIds['Rédaction administrative']) {
            const ok = await lierCompetence(pos.position_id, compIds['Rédaction administrative'], 'Maîtrise');
            ok ? crees++ : ignores++;
        }

        if (pos.niveau <= 2 && compIds['Management d\'équipe']) {
            const ok = await lierCompetence(pos.position_id, compIds['Management d\'équipe'], 'Expert');
            ok ? crees++ : ignores++;
        }
    }

    console.log(`OK - ${crees} lien(s) position_competence cree(s).`);
    console.log(`(i) ${ignores} lien(s) deja existant(s) - ignore(s).`);
}

main()
    .then(() => { process.exitCode = 0; })
    .catch(err => {
        console.error('ERREUR :', err.message);
        process.exitCode = 1;
    });
