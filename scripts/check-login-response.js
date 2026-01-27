const fetch = require('node-fetch');

(async () => {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin-a@test.local',
            password: 'TestPass123!'
        })
    });

    console.log('Status:', loginRes.status);
    const data = await loginRes.json();
    console.log('\nLogin Response:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n=== Checking Required Fields ===');
    console.log('data.ok:', data.ok);
    console.log('data.activeRole:', data.activeRole);
    console.log('data.userId:', data.userId);

    if (data.ok && data.activeRole) {
        console.log('\n✅ Response format is CORRECT');
        console.log(`Should redirect to: /admin`);
    } else {
        console.log('\n❌ Response format is WRONG');
        console.log('Missing fields:', {
            ok: !data.ok,
            activeRole: !data.activeRole
        });
    }
})();
