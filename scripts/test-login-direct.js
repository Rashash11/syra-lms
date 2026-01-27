const fetch = require('node-fetch');

async function testLogin() {
    console.log('Testing login direct to backend...');
    try {
        const res = await fetch('http://localhost:8001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@portal.com',
                password: 'Admin123!'
            })
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Body: ${text}`);

        const cookies = res.headers.get('set-cookie');
        console.log(`Cookies: ${cookies}`);

    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

testLogin();
