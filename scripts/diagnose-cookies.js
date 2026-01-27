// Diagnose cookie authentication flow
const fetch = require('node-fetch');

console.log('=== Test: Direct FastAPI (Port 8000) ===\n');

(async () => {
    try {
        // Test Direct FastAPI
        const loginRes = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin-a@test.local',
                password: 'TestPass123!'
            })
        });

        console.log(`Login Status: ${loginRes.status}`);
        const cookie = loginRes.headers.get('set-cookie');
        console.log(`Set-Cookie header:`, cookie ? 'Present' : 'Missing');

        if (!cookie) {
            console.log('❌ NO COOKIES - FastAPI not setting cookies!\n');
            return;
        }

        const sessionMatch = cookie.match(/session=([^;]+)/);
        if (!sessionMatch) {
            console.log('❌ No session cookie found!\n');
            return;
        }

        const sessionCookie = `session=${sessionMatch[1]}`;
        console.log(`✅ Session: ${sessionCookie.substring(0, 40)}...\n`);

        // Test /api/me directl with FastAPI
        console.log('Testing /api/me directly against FastAPI...');
        const meRes = await fetch('http://localhost:8000/api/me', {
            headers: { 'Cookie': sessionCookie }
        });

        console.log(`Status: ${meRes.status}`);
        const meData = await meRes.json();
        console.log(`Response:`, JSON.stringify(meData, null, 2));

        if (meRes.status === 200) {
            console.log('\n✅ DIRECT FASTAPI: Authentication Works!\n');
        } else {
            console.log('\n❌ DIRECT FASTAPI: Authentication Broken!\n');
        }

        // Now test through Next.js proxy
        console.log('\n=== Test: Through Next.js Proxy (Port 3000) ===\n');

        const proxyLoginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin-a@test.local',
                password: 'TestPass123!'
            })
        });

        console.log(`Proxy Login Status: ${proxyLoginRes.status}`);
        const proxyCookie = proxyLoginRes.headers.get('set-cookie');

        if (!proxyCookie) {
            console.log('❌ Proxy not returning cookies!');
            return;
        }

        const proxySessionMatch = proxyCookie.match(/session=([^;]+)/);
        const proxySessionCookie = `session=${proxySessionMatch[1]}`;
        console.log(`✅ Proxy Session: ${proxySessionCookie.substring(0, 40)}...\n`);

        // Test /api/me through proxy
        console.log('Testing /api/me through Next.js proxy...');
        const proxyMeRes = await fetch('http://localhost:3000/api/me', {
            headers: { 'Cookie': proxySessionCookie }
        });

        console.log(`Status: ${proxyMeRes.status}`);
        const proxyMeData = await proxyMeRes.json();
        console.log(`Response:`, JSON.stringify(proxyMeData, null, 2));

        if (proxyMeRes.status === 200) {
            console.log('\n✅ PROXY: Authentication Works!');
        } else {
            console.log('\n❌ PROXY: Authentication Fails - Next.js not forwarding cookies!');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
})();
