const baseUrl = 'http://localhost:3000';

(async () => {
    // Test 1: Login and inspect cookies
    console.log('=== Testing Login ===');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin-a@test.local',
            password: 'TestPass123!'
        })
    });

    console.log(`Login Status: ${loginRes.status}`);
    const loginData = await loginRes.json();
    console.log(`Login Response:`, loginData);

    // Get all cookies from response
    const setCookieHeaders = loginRes.headers.raw()['set-cookie'];
    console.log('\nSet-Cookie headers:');
    setCookieHeaders?.forEach((cookie, i) => {
        console.log(`  ${i + 1}: ${cookie}`);
    });

    // Extract session and CSRF  
    const sessionCookie = setCookieHeaders?.find(c => c.startsWith('session='));
    const csrfCookie = setCookieHeaders?.find(c => c.startsWith('csrf-token='));

    console.log('\nExtracted cookies:');
    console.log(`  Session: ${sessionCookie ? sessionCookie.split(';')[0] : 'NOT FOUND'}`);
    console.log(`  CSRF: ${csrfCookie ? csrfCookie.split(';')[0] : 'NOT FOUND'}`);

    if (!sessionCookie) {
        console.log('\n❌ No session cookie found! This is the problem.');
        return;
    }

    const cookie = sessionCookie.split(';')[0];
    const csrfMatch = csrfCookie?.match(/csrf-token=([^;]+)/);
    const csrf = csrfMatch ? csrfMatch[1] : '';

    // Test 2: Call /api/me with cookies
    console.log('\n\n=== Testing /api/me with cookies ===');
    console.log(`Sending Cookie header: ${cookie}`);
    console.log(`Sending x-csrf-token header: ${csrf || '(empty)'}`);

    const meRes = await fetch(`${baseUrl}/api/me`, {
        headers: {
            'Cookie': cookie,
            'x-csrf-token': csrf
        }
    });

    console.log(`/api/me Status: ${meRes.status}`);
    const meData = await meRes.json();
    console.log('/api/me Response:', JSON.stringify(meData, null, 2));

})();
