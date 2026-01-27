const fetch = require('node-fetch');

(async () => {
    console.log('=== Testing All Endpoints ===\n');

    // Test 1: FastAPI Health
    console.log('1. FastAPI Health Check...');
    try {
        const res = await fetch('http://localhost:8000/api/health');
        console.log(`   Status: ${res.status} ${res.ok ? '✅' : '❌'}`);
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }

    // Test 2: Login
    console.log('\n2. Login API...');
    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin-a@test.local',
                password: 'TestPass123!'
            })
        });
        const data = await res.json();
        console.log(`   Status: ${res.status} ${res.ok ? '✅' : '❌'}`);
        console.log(`   Response:`, data);

        if (res.ok) {
            const cookie = res.headers.get('set-cookie')?.match(/session=([^;]+)/)?.[0];
            const csrf = res.headers.get('set-cookie')?.match(/csrf-token=([^;]+)/)?.[1];

            // Test 3: Dashboard
            console.log('\n3. Dashboard (auth required)...');
            const dashRes = await fetch('http://localhost:3000/api/dashboard', {
                headers: { 'Cookie': cookie || '', 'x-csrf-token': csrf || '' }
            });
            console.log(`   Status: ${dashRes.status} ${dashRes.ok ? '✅' : '❌'}`);

            // Test 4: Users
            console.log('\n4. Users API...');
            const usersRes = await fetch('http://localhost:3000/api/users', {
                headers: { 'Cookie': cookie || '', 'x-csrf-token': csrf || '' }
            });
            console.log(`   Status: ${usersRes.status} ${usersRes.ok ? '✅' : '❌'}`);
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }

    console.log('\n=== Tests Complete ===');
})();
