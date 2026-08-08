const BASE = 'http://localhost:4000';
const GATE_USER = 'pngie_admin';
const GATE_PASS = 'NouveauMotDePasseFort_ChangeMoi123!';
const gateHeader = 'Basic ' + Buffer.from(`${GATE_USER}:${GATE_PASS}`).toString('base64');

async function login(email, password) {
    const res = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': gateHeader
        },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`Login echoue pour ${email}: ${JSON.stringify(data)}`);
    return data.token || data.accessToken || data.jwt;
}

function authHeaders(jwt) {
    // Le gate Basic protege tout le serveur ; le JWT applicatif doit passer autrement.
    // On suppose ici que le serveur attend le JWT dans Authorization: Bearer, mais
    // la barriere Basic intercepte AVANT. A verifier : le gate accepte-t-il aussi Bearer ?
    return {
        'Authorization': `Bearer ${jwt}`,
        'X-Gate-Auth': gateHeader
    };
}

async function main() {
    console.log('--- Login institution A (cnc) ---');
    const tokenA = await login('cnc@rdc.gouv.cd', 'G4OsreCsNheq');
    console.log('Token A obtenu.');

    console.log('\n--- Creation d\'une relation par institution A ---');
    const createRes = await fetch(`${BASE}/api/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
        body: JSON.stringify({
            type_relation: 'TEST_E2E',
            objet: 'Test de bout en bout MULTI_INSTITUTION',
            statut: 'ACTIVE'
        })
    });
    const created = await createRes.json();
    console.log('Statut creation:', createRes.status);
    console.log(created);
    const newId = created.relations_id || created.id;

    console.log('\n--- Login institution B (cnd) ---');
    const tokenB = await login('cnd@rdc.gouv.cd', 'f9aHRyrksEO');
    console.log('Token B obtenu.');

    console.log('\n--- LISTE avec token B ---');
    const listRes = await fetch(`${BASE}/api/relations`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const list = await listRes.json();
    console.log('Statut liste:', listRes.status);
    console.log('Nombre visibles par B:', Array.isArray(list) ? list.length : 'N/A');
    console.log(list);

    console.log('\n--- DETAIL cree par A, avec token B (doit etre 404) ---');
    const detailRes = await fetch(`${BASE}/api/relations/${newId}`, {
        headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    console.log('Statut detail:', detailRes.status);
    console.log(await detailRes.json());

    console.log('\n--- DETAIL avec token A (doit fonctionner) ---');
    const detailAres = await fetch(`${BASE}/api/relations/${newId}`, {
        headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    console.log('Statut detail (A):', detailAres.status);
}

main().catch(e => console.error('ERREUR:', e.message));
