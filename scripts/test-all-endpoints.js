// Test all endpoints on port 3000 (fresh Next.js instance)

(async () => {
    const baseUrl = 'http://localhost:3000';

    console.log('=== Testing Fixed Endpoints (Port 3000) ===\n');

    // Login first
    console.log('1. Login...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin-a@test.local',
            password: 'TestPass123!'
        })
    });

    const cookie = loginRes.headers.get('set-cookie')?.match(/session=([^;]+)/)?.[0] || '';
    const csrf = loginRes.headers.get('set-cookie')?.match(/csrf-token=([^;]+)/)?.[1] || '';

    if (loginRes.status !== 200) {
        console.log('❌ Login failed!');
        return;
    }
    console.log('✅ Login OK\n');

    // Test each endpoint
    const tests = [
        { name: 'Dashboard', url: `${baseUrl}/api/dashboard` },
        { name: 'Calendar Events', url: `${baseUrl}/api/calendar-events` },
        { name: 'Catalog', url: `${baseUrl}/api/catalog` },
        { name: 'Conferences', url: `${baseUrl}/api/conferences` },
        { name: 'Users', url: `${baseUrl}/api/users` },
        { name: 'Courses', url: `${baseUrl}/api/courses` },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const res = await fetch(test.url, {
            headers: { 'Cookie': cookie, 'x-csrf-token': csrf }
        });

        if (res.ok) {
            console.log(`✅ ${test.name}: ${res.status}`);
            passed++;
        } else {
            console.log(`❌ ${test.name}: ${res.status}`);
            failed++;
        }
    }

    console.log(`\n=== Results ===`);
    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);

    if (failed === 0) {
        console.log('\n🎉 ALL ENDPOINTS WORKING!');
    } else {
        console.log('\n⚠️  Some endpoints still failing');
    }
})();
