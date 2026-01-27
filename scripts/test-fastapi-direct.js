// Test dashboard directly against FastAPI (port 8000)
const fetch = require('node-fetch');

(async () => {
    // Login to FastAPI directly 
    console.log('Testing DIRECT FastAPI (port 8000)...\n');

    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin-a@test.local',
            password: 'TestPass123!'
        })
    });

    const cookie = loginRes.headers.get('set-cookie')?.match(/session=([^;]+)/)?.[0] || '';

    // Test dashboard on FastAPI directly
    const dashRes = await fetch('http://localhost:8000/api/dashboard', {
        headers: { 'Cookie': cookie }
    });

    console.log(`Dashboard Status: ${dashRes.status}`);
    const dashBody = await dashRes.text();
    console.log(`Response:\n${dashBody}`);
})();
