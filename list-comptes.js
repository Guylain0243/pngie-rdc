const db = require('./src/db');

async function main() {
    const comptes = await db.all(
        "SELECT email, institution_id, matricule FROM personne WHERE email IS NOT NULL LIMIT 10"
    );
    console.log(comptes);
}

main().catch(e => console.error('ERREUR:', e.message));
