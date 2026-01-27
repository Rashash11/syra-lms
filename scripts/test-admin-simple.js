const baseUrl = 'http://localhost:3000';

async function testAPI(name, url, options = {}) {
    console.log(`\n=== ${name} ===`);
    try {
        const res = await fetch(url, options);
        const data = await res.json();
        console.log(`Status: ${res.status} ${res.ok ? '✅' : '❌'}`);
        console.log(`Response:`, JSON.stringify(data, null, 2).substring(0, 300));
        return { ok: res.ok, data, headers: Object.fromEntries(res.headers.entries()) };
    } catch (err) {
        console.log(`❌ ERROR: ${err.message}`);
        return { ok: false, error: err.message };
    }
}

(async () => {
    // Test 1: Login
    const login = await testAPI(
        'Login',
        `${baseUrl}/api/auth/login`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin-a@test.local',
                password: 'TestPass123!'
            })
        }
    );

    if (!login.ok) {
        console.log('\n❌ Login failed. Stopping tests.');
        return;
    }

    // Extract cookies
    const cookie = login.headers['set-cookie']?.split(';')[0];
    const csrfMatch = login.headers['set-cookie']?.match(/csrf-token=([^;]+)/);
    const csrf = csrfMatch ? csrfMatch[1] : '';

    console.log(`\nCookies extracted: ${cookie ? '✅' : '❌'}`);
    console.log(`CSRF token extracted: ${csrf ? '✅' : '❌'}`);

    // Test 2: /api/me
    await testAPI(
        '/api/me',
        `${baseUrl}/api/me`,
        { headers: { 'Cookie': cookie, 'x-csrf-token': csrf } }
    );

    // Test 3: /api/users
    await testAPI(
        '/api/users (List)',
        `${baseUrl}/api/users`,
        { headers: { 'Cookie': cookie, 'x-csrf-token': csrf } }
    );

    // Test 4: /api/courses
    await testAPI(
        '/api/courses',
        `${baseUrl}/api/courses`,
        { headers: { 'Cookie': cookie, 'x-csrf-token': csrf } }
    );

    console.log('\n=== TESTS COMPLETE ===');
})();
