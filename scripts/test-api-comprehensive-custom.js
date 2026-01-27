
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8001';

let sessionCookie = '';
let csrfToken = '';

async function login() {
    console.log('\n🔐 Testing Login...');

    const credentials = {
        email: 'admin-a@test.local',
        password: 'TestPass123!'
    };

    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
    });

    const setCookieHeader = response.headers.raw()['set-cookie'];
    if (setCookieHeader) {
        sessionCookie = setCookieHeader.join('; ');
        console.log('  ✓ Login successful - got session cookie');
    }

    const data = await response.json();
    console.log(`  Status: ${response.status}`);
    
    return response.ok;
}

async function testEndpoint(name, url, expectedStatus = 200) {
    try {
        const response = await fetch(url, {
            headers: {
                'Cookie': sessionCookie,
                'x-csrf-token': csrfToken
            }
        });

        const status = response.status;
        const symbol = status === expectedStatus ? '✓' : '❌';

        console.log(`  ${symbol} ${name}: ${status}`);

        if (status !== expectedStatus) {
            const text = await response.text();
            console.log(`     Error: ${text.substring(0, 100)}`);
            return false;
        }
        return true;
    } catch (error) {
        console.log(`  ❌ ${name}: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  CUSTOM API COMPREHENSIVE TEST');
    console.log('═══════════════════════════════════════════════════\n');

    // Test 1: Login
    console.log('\n📊 Step 1: Authentication\n');
    const loggedIn = await login();

    if (!loggedIn) {
        console.log('\n⚠️  Login failed - cannot test authenticated endpoints');
        process.exit(1);
    }

    // Test 2: Core User Endpoints
    console.log('\n📊 Step 2: Core User Endpoints\n');
    await testEndpoint('GET /api/me', `${BASE_URL}/api/me`);
    await testEndpoint('GET /api/users', `${BASE_URL}/api/users`);
    
    // Test 4: Admin-specific endpoints
    const adminEndpoints = [
        '/api/admin/notifications',
        '/api/courses',
        '/api/groups',
        '/api/branches',
        '/api/categories',
        '/api/learning-paths',
        '/api/assignments',
        '/api/reports/overview', // Fixed from /api/reports
        '/api/skills',
        '/api/automations',
        '/api/catalog'
    ];

    for (const endpoint of adminEndpoints) {
        await testEndpoint(`GET ${endpoint}`, `${BASE_URL}${endpoint}`);
    }

    // Test 4: Dashboard
    console.log('\n📊 Step 4: Dashboard API\n');
    await testEndpoint('GET /api/dashboard', `${BASE_URL}/api/dashboard`);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════\n');
}

main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
