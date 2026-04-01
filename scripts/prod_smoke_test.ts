
const BASE_URL = 'https://dropservice-platform-nkxnfw6lz-estebans-projects-a6b64263.vercel.app';

async function verifyEndpoint(path: string, method: string = 'GET', body?: unknown) {
    const url = `${BASE_URL}${path}`;
    console.log(`Checking ${method} ${url}...`);
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        if (res.status >= 200 && res.status < 400) {
            console.log('✅ PASS');
            return true;
        } else {
            console.log('⚠️ CHECK (Non-200 might be expected for some auth/protected routes)');
            return false;
        }
    } catch (err) {
        console.error('❌ FAIL (Network/Connection Error)', err);
        return false;
    }
}

async function run() {
    console.log('🚀 Starting Smoke Test for: ' + BASE_URL);

    // 1. Home Page (Public)
    await verifyEndpoint('/');

    // 2. Auth Pages
    await verifyEndpoint('/login');
    await verifyEndpoint('/register');

    // 3. AI Agent (Expect 401 or 400 without auth, but NOT 500)
    // If it returns 500, Genkit or server is crashed.
    // If it returns 200/400/401/405, it means the endpoint exists and logic is running.
    // A GET request usually fails with 404 or 405 for POST-only route, which is fine, proves app handles it.
    await verifyEndpoint('/api/ai/agent', 'GET');

    // 4. Client Dashboard (Should likely redirect or 404 if not authed, but checking it exists)
    await verifyEndpoint('/client');

    console.log('🏁 Smoke Test Complete');
}

run();
