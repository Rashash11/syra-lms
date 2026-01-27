// Detailed error checking
const fetch = require('node-fetch');

(async () => {
    const baseUrl = 'http://localhost:3000';

    // Login
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin-a@test.local',
            password: 'TestPass123!'
        })
    });

    const cookie = loginRes.headers.get('set-cookie')?.match(/session=([^;]+)/)?.[0] || '';
    const csrf = loginRes.headers.get('set-cookie')?.match(/csrf-token=([^;]+)/)?.[1] || '';

    // Test dashboard with full error
    console.log('Testing /api/dashboard...\n');
    const dashRes = await fetch(`${baseUrl}/api/dashboard`, {
        headers: { 'Cookie': cookie, 'x-csrf-token': csrf }
    });

    console.log(`Status: ${dashRes.status}`);
    const dashBody = await dashRes.text();
    console.log(`Response:\n${dashBody}\n`);

    // Test calendar events
    console.log('\nTesting /api/calendar-events...\n');
    const calRes = await fetch(`${baseUrl}/api/calendar-events`, {
        headers: { 'Cookie': cookie, 'x-csrf-token': csrf }
    });

    console.log(`Status: ${calRes.status}`);
    const calBody = await calRes.text();
    console.log(`Response:\n${calBody}`);
})();
