// Comprehensive Admin Pages Test
// Tests all admin pages with real authentication

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8001';

let sessionCookie = '';
let csrfToken = '';

async function login() {
    console.log('\n🔐 Testing Login...');

    // Try to login with default admin credentials
    const credentials = {
        username: 'admin',
        password: 'admin123' // Common default, may need adjustment
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
    console.log(`  Response:`, JSON.stringify(data).substring(0, 150));

    return response.ok;
}

async function testEndpoint(name, url, expectData = false) {
    try {
        const response = await fetch(url, {
            headers: {
                'Cookie': sessionCookie,
                'x-csrf-token': csrfToken
            }
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }

        const status = response.status;
        const symbol = response.ok ? '✓' : '❌';

        console.log(`  ${symbol} ${name}: ${status}`);

        if (expectData && response.ok) {
            if (data.data && Array.isArray(data.data)) {
                console.log(`     Found ${data.data.length} items`);
            } else if (data.users && Array.isArray(data.users)) {
                console.log(`     Found ${data.users.length} users`);
            }
        }

        if (!response.ok) {
            console.log(`     Error: ${JSON.stringify(data).substring(0, 100)}`);
        }

        return { name, status, ok: response.ok, data };
    } catch (error) {
        console.log(`  ❌ ${name}: ${error.message}`);
        return { name, error: error.message };
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('  COMPREHENSIVE ADMIN PAGES TEST');
    console.log('═══════════════════════════════════════════════════\n');

    // Test 1: Services Health
    console.log('📊 Step 1: Service Health Checks\n');
    await testEndpoint('Frontend Health', `${BASE_URL}/api/health`);
    await testEndpoint('Backend Health', `${API_URL}/health`);
    await testEndpoint('Backend API Health', `${API_URL}/api/health`);

    // Test 2: Login
    console.log('\n📊 Step 2: Authentication\n');
    const loggedIn = await login();

    if (!loggedIn) {
        console.log('\n⚠️  Login failed - cannot test authenticated endpoints');
        console.log('   Please ensure database has seeded users');
        console.log('   Try: npm run db:seed\n');
    }

    // Test 3: Core API Endpoints (even without login to see auth is working)
    console.log('\n📊 Step 3: Core API Endpoints\n');
    await testEndpoint('GET /api/me', `${BASE_URL}/api/me`, false);
    await testEndpoint('GET /api/users', `${BASE_URL}/api/users`, true);

    // Test 4: Admin-specific endpoints
    console.log('\n📊 Step 4: Admin Page APIs\n');
    await testEndpoint('GET /api/admin/notifications', `${BASE_URL}/api/admin/notifications`, true);
    await testEndpoint('GET /api/courses', `${BASE_URL}/api/courses`, true);
    await testEndpoint('GET /api/groups', `${BASE_URL}/api/groups`, true);
    await testEndpoint('GET /api/branches', `${BASE_URL}/api/branches`, true);
    await testEndpoint('GET /api/categories', `${BASE_URL}/api/categories`, true);
    await testEndpoint('GET /api/learning-paths', `${BASE_URL}/api/learning-paths`, true);
    await testEndpoint('GET /api/assignments', `${BASE_URL}/api/assignments`, true);
    await testEndpoint('GET /api/reports', `${BASE_URL}/api/reports`, false);

    // Test 5: Dashboard
    console.log('\n📊 Step 5: Dashboard API\n');
    await testEndpoint('GET /api/dashboard', `${BASE_URL}/api/dashboard`, false);

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  TEST COMPLETE');
    console.log('═══════════════════════════════════════════════════\n');

    console.log('Next: Open browser to http://localhost:3000/admin/users');
    console.log('      Login and verify users are displayed correctly\n');
}

main().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
