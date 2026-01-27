// Test the users endpoint with authentication simulation
const fetch = require('node-fetch');

async function testUsersEndpoint() {
    console.log('\n Testing /api/users endpoint...\n');

    // Test backend directly
    console.log('1. Testing Backend (port 8001) directly:\n');
    try {
        const res = await fetch('http://localhost:8001/api/users?page=1&limit=10', {
            timeout: 5000
        });
        const text = await res.text();

        console.log(`   Status: ${res.status}`);

        if (res.status === 500) {
            console.log('\n   ❌ 500 INTERNAL SERVER ERROR');
            console.log(`   Error response: ${text.substring(0, 500)}`);

            try {
                const json = JSON.parse(text);
                console.log('\n   Error details:');
                console.log(JSON.stringify(json, null, 2));
            } catch { }
        } else if (res.status === 401) {
            console.log('   ℹ️  401 - Auth required (expected)');
        } else if (res.status === 200) {
            const data = JSON.parse(text);
            console.log(`   ✅ Success - got ${data.users?.length || 0} users`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test frontend proxy
    console.log('\n2. Testing Frontend Proxy (port 3000):\n');
    try {
        const res = await fetch('http://localhost:3000/api/users?page=1&limit=10', {
            timeout: 5000
        });
        const text = await res.text();

        console.log(`   Status: ${res.status}`);

        if (res.status === 500) {
            console.log('\n   ❌ 500 INTERNAL SERVER ERROR from proxy');
            console.log(`   Error: ${text.substring(0, 300)}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }
}

testUsersEndpoint().catch(console.error);
