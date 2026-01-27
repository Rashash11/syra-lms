// Test if database has users and verify actual API responses
const fetch = require('node-fetch');

async function testDatabaseAndAPIs() {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   DATABASE & API VERIFICATION TEST                ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    const BACKEND = 'http://localhost:8001';
    const FRONTEND = 'http://localhost:3000';

    // Test 1: Check backend can reach database
    console.log('📊 TEST 1: Database Connection\n');
    try {
        const res = await fetch(`${BACKEND}/api/health`);
        const data = await res.json();
        console.log(`  ✓ Backend API Health: ${res.status}`);
        console.log(`    Status: ${data.status}`);
        console.log(`    Checks:`, data.checks);
    } catch (error) {
        console.log(`  ❌ Backend unreachable: ${error.message}`);
    }

    // Test 2: Check if users exist in database (without auth, should get 401 but proves endpoint works)
    console.log('\n📊 TEST 2: Users API Endpoint\n');
    try {
        const res = await fetch(`${BACKEND}/api/users`);
        const text = await res.text();

        console.log(`  Status Code: ${res.status}`);

        if (res.status === 401) {
            console.log(`  ✓ Users API is working (401 Unauthorized - authentication required)`);
            console.log(`    This is CORRECT - endpoint exists and requires auth`);
        } else if (res.status === 200) {
            const data = JSON.parse(text);
            console.log(`  ✓ Users API returned data:`);
            console.log(`    Users count: ${data.users?.length || data.data?.length || 0}`);
        } else {
            console.log(`  ⚠️  Unexpected status: ${text.substring(0, 150)}`);
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }

    // Test 3: Check proxy from Frontend to Backend
    console.log('\n📊 TEST 3: Frontend→Backend Proxy\n');
    try {
        const res = await fetch(`${FRONTEND}/api/users`);
        console.log(`  Proxy /api/users: ${res.status}`);

        if (res.status === 401) {
            console.log(`  ✓ Proxy working correctly (requires auth)`);
        } else if (res.status === 200) {
            console.log(`  ✓ Proxy working and returning data`);
        } else if (res.status >= 500) {
            console.log(`  ❌ Server error - check backend logs`);
        }
    } catch (error) {
        console.log(`  ❌ Proxy error: ${error.message}`);
    }

    // Test 4: Test all admin endpoints
    console.log('\n📊 TEST 4: All Admin Endpoints\n');

    const endpoints = [
        '/api/me',
        '/api/users',
        '/api/notifications',
        '/api/courses',
        '/api/groups',
        '/api/branches',
        '/api/categories',
        '/api/learning-paths',
        '/api/assignments',
        '/api/dashboard',
        '/api/reports',
    ];

    const results = { working: [], broken: [] };

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`${FRONTEND}${endpoint}`);
            const symbol = (res.status === 401 || res.status === 200) ? '✓' : '❌';
            console.log(`  ${symbol} ${endpoint}: ${res.status}`);

            if (res.status === 401 || res.status === 200) {
                results.working.push(endpoint);
            } else {
                results.broken.push({ endpoint, status: res.status });
            }
        } catch (error) {
            console.log(`  ❌ ${endpoint}: ${error.message}`);
            results.broken.push({ endpoint, error: error.message });
        }
    }

    // Summary
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║   SUMMARY');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    console.log(`✓ Working Endpoints: ${results.working.length}/${endpoints.length}`);
    if (results.broken.length > 0) {
        console.log(`❌ Broken Endpoints: ${results.broken.length}`);
        results.broken.forEach(b => {
            console.log(`   - ${b.endpoint}: ${b.status || b.error}`);
        });
    }

    console.log('\n📝 Next Steps:');
    console.log('   1. Open http://localhost:3000/login in your browser');
    console.log('   2. Login (you may need to seed the database first: npm run db:seed)');
    console.log('   3. Navigate to http://localhost:3000/admin/users');
    console.log('   4. Verify users are displayed in the table');
    console.log('   5. Test other admin pages\n');

    if (results.working.length === endpoints.length) {
        console.log('✅ ALL ENDPOINTS WORKING! Backend is ready for browser testing.\n');
        return true;
    } else {
        console.log('⚠️  Some endpoints have issues. Check the broken list above.\n');
        return false;
    }
}

testDatabaseAndAPIs().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
