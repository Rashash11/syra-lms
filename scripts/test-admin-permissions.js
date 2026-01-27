// Test if the logged-in user has the user:read permission
const fetch = require('node-fetch');

async function testPermissions() {
    console.log('\nTesting admin permissions...\n');

    // First, try to login
    console.log('1. Attempting login...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin@portal.com',
            password: 'Admin123!'
        })
    });

    const loginData = await loginRes.json();
    console.log(`   Login status: ${loginRes.status}`);

    if (!loginRes.ok) {
        console.log(`   Login failed: ${JSON.stringify(loginData)}`);
        return;
    }

    // Extract cookies
    const cookies = loginRes.headers.raw()['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    console.log(`   ✓ Login successful`);
    console.log(`   User: ${loginData.user?.email}`);
    console.log(`   Role: ${loginData.user?.activeRole}`);

    // Now try to get users with the session
    console.log('\n2. Testing /api/users with authenticated session...');
    const usersRes = await fetch('http://localhost:3000/api/users', {
        headers: {
            'Cookie': cookieHeader
        }
    });

    console.log(`   Status: ${usersRes.status}`);

    if (usersRes.status === 200) {
        const data = await usersRes.json();
        const count = data.users?.length || data.data?.length || 0;
        console.log(`   ✅ SUCCESS! Got ${count} users`);
        console.log(`   Total: ${data.total}`);
        if (count > 0) {
            console.log(`\n   Sample users:`);
            (data.users || data.data).slice(0, 3).forEach(u => {
                console.log(`   - ${u.firstName} ${u.lastName} (${u.email})`);
            });
        }
    } else {
        const error = await usersRes.text();
        console.log(`   ❌ FAILED: ${error.substring(0, 300)}`);
    }
}

testPermissions().catch(console.error);
