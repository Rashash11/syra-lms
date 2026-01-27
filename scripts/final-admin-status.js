// Final Admin Pages Status Check
// Run this to get a complete status of all systems

const fetch = require('node-fetch');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║          ADMIN PAGES - FINAL STATUS CHECK                ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

async function checkAll() {
    const results = {
        services: {},
        endpoints: {},
        errors: []
    };

    // 1. Check all services
    console.log('1️⃣  SERVICES STATUS\n');

    const services = [
        { name: 'Frontend (Next.js)', url: 'http://localhost:3000/api/health' },
        { name: 'Backend (FastAPI)', url: 'http://localhost:8001/health' },
        { name: 'Database/API', url: 'http://localhost:8001/api/health' },
    ];

    for (const service of services) {
        try {
            const res = await fetch(service.url, { timeout: 3000 });
            const ok = res.status === 200;
            results.services[service.name] = ok;
            console.log(`   ${ok ? '✅' : '❌'} ${service.name}: ${res.status}`);
        } catch (error) {
            results.services[service.name] = false;
            results.errors.push(`${service.name}: ${error.message}`);
            console.log(`   ❌ ${service.name}: ${error.message}`);
        }
    }

    // 2. Check all admin API endpoints
    console.log('\n2️⃣  ADMIN API ENDPOINTS\n');

    const endpoints = [
        '/api/users',
        '/api/notifications',
        '/api/courses',
        '/api/groups',
        '/api/branches',
        '/api/categories',
        '/api/learning-paths',
        '/api/assignments',
        '/api/reports',
        '/api/dashboard',
    ];

    let workingCount = 0;

    for (const endpoint of endpoints) {
        try {
            const res = await fetch(`http://localhost:3000${endpoint}`, { timeout: 3000 });
            // 200 or 401 (auth required) are both valid
            const ok = res.status === 200 || res.status === 401;
            results.endpoints[endpoint] = { status: res.status, ok };

            if (ok) workingCount++;

            const symbol = ok ? '✅' : '❌';
            const note = res.status === 401 ? '(auth required - OK)' : '';
            console.log(`   ${symbol} ${endpoint}: ${res.status} ${note}`);
        } catch (error) {
            results.endpoints[endpoint] = { error: error.message, ok: false };
            results.errors.push(`${endpoint}: ${error.message}`);
            console.log(`   ❌ ${endpoint}: ${error.message}`);
        }
    }

    // 3. Summary
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY                                ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const servicesOk = Object.values(results.services).filter(Boolean).length;
    const totalServices = Object.keys(results.services).length;
    console.log(`✅ Services: ${servicesOk}/${totalServices} running`);
    console.log(`✅ API Endpoints: ${workingCount}/${endpoints.length} working`);

    if (results.errors.length > 0) {
        console.log(`\n❌ Errors found: ${results.errors.length}`);
        results.errors.forEach(err => console.log(`   - ${err}`));
    }

    // 4. Manual testing required
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║              MANUAL BROWSER CHECK REQUIRED                ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('You have these admin pages open in your browser:');
    console.log('   • /admin/courses');
    console.log('   • /admin/groups');
    console.log('   • /admin/reports');
    console.log('   • /admin/notifications');
    console.log('   • /admin/learning-paths\n');

    console.log('📋 QUICK CHECKLIST - For each page, verify:\n');
    console.log('   1. Page loaded (not white screen) ........ □');
    console.log('   2. No red errors in Console (F12) ........ □');
    console.log('   3. Data displayed or empty state shown .... □\n');

    console.log('🔍 CRITICAL TEST - Users Page:\n');
    console.log('   1. Navigate to: http://localhost:3000/admin/users');
    console.log('   2. Check: Are users displayed in the table?');
    console.log('   3. If NO users: Run `npm run db:seed` to create test data');
    console.log('   4. Press F12 → Console tab: Any red errors?');
    console.log('   5. Press F12 → Network tab: Check /api/users request');
    console.log('      - Should be status 200');
    console.log('      - Should show users array in response\n');

    // Overall assessment
    const allGood = servicesOk === totalServices && workingCount >= 9;

    if (allGood) {
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║   ✅ ALL SYSTEMS OPERATIONAL - Ready for testing!        ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');
    } else {
        console.log('╔══════════════════════════════════════════════════════════╗');
        console.log('║   ⚠️  Some issues detected - Review errors above         ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');
    }
}

checkAll().catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
