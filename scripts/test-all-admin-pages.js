// Comprehensive test of all admin pages and their API endpoints
const fetch = require('node-fetch');

const ADMIN_PAGES = [
    { name: 'Users', path: '/admin/users', api: '/api/users' },
    { name: 'Courses', path: '/admin/courses', api: '/api/courses' },
    { name: 'Groups', path: '/admin/groups', api: '/api/groups' },
    { name: 'Branches', path: '/admin/branches', api: '/api/branches' },
    { name: 'Categories', path: '/admin/categories', api: '/api/categories' },
    { name: 'Learning Paths', path: '/admin/learning-paths', api: '/api/learning-paths' },
    { name: 'Assignments', path: '/admin/assignments', api: '/api/assignments' },
    { name: 'Notifications', path: '/admin/notifications', api: '/api/notifications' },
    { name: 'Reports', path: '/admin/reports', api: '/api/reports' },
    { name: 'Skills', path: '/admin/skills', api: '/api/skills' },
    { name: 'Automations', path: '/admin/automations', api: '/api/automations' },
];

async function testAllAdminPages() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║     TESTING ALL ADMIN PAGES AND API ENDPOINTS            ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    const results = {
        working: [],
        needsAuth: [],
        errors: []
    };

    for (const page of ADMIN_PAGES) {
        console.log(`Testing: ${page.name}`);
        console.log(`  API: ${page.api}`);

        try {
            const res = await fetch(`http://localhost:3000${page.api}`, {
                timeout: 5000
            });

            const status = res.status;
            console.log(`  Status: ${status}`);

            if (status === 200) {
                const data = await res.json();
                const count = data.data?.length || data.users?.length || data.courses?.length || 0;
                console.log(`  ✅ Working - Got ${count} items`);
                results.working.push({ ...page, status, count });
            } else if (status === 401) {
                console.log(`  🔒 Requires authentication (normal)`);
                results.needsAuth.push({ ...page, status });
            } else if (status === 500) {
                const error = await res.text();
                console.log(`  ❌ 500 Error`);
                console.log(`  Error: ${error.substring(0, 150)}`);
                results.errors.push({ ...page, status, error: error.substring(0, 200) });
            } else {
                console.log(`  ⚠️  Status: ${status}`);
                results.needsAuth.push({ ...page, status });
            }
        } catch (error) {
            console.log(`  ❌ Request failed: ${error.message}`);
            results.errors.push({ ...page, error: error.message });
        }

        console.log('');
    }

    // Summary
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    SUMMARY                                ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Working (200): ${results.working.length}`);
    results.working.forEach(p => {
        console.log(`   - ${p.name}: ${p.count} items`);
    });

    console.log(`\n🔒 Auth Required (401): ${results.needsAuth.length}`);
    results.needsAuth.forEach(p => {
        console.log(`   - ${p.name}`);
    });

    if (results.errors.length > 0) {
        console.log(`\n❌ Errors (500): ${results.errors.length}`);
        results.errors.forEach(p => {
            console.log(`   - ${p.name}`);
            if (p.error) {
                console.log(`     Error: ${p.error.substring(0, 100)}`);
            }
        });
    }

    console.log('\n' + '='.repeat(64));

    if (results.errors.length === 0) {
        console.log('✅ ALL ENDPOINTS HEALTHY!');
        console.log('All pages either work or correctly require authentication.');
    } else {
        console.log('⚠️  SOME PAGES HAVE ERRORS');
        console.log('Pages with 500 errors need to be fixed.');
    }

    console.log('='.repeat(64) + '\n');

    console.log('📋 NEXT STEPS FOR BROWSER TESTING:\n');
    console.log('1. Make sure you\'re logged in as admin');
    console.log('2. Navigate to each admin page:');
    ADMIN_PAGES.forEach(p => {
        const status = results.working.find(r => r.name === p.name) ? '✅' :
            results.needsAuth.find(r => r.name === p.name) ? '🔒' : '❌';
        console.log(`   ${status} http://localhost:3000${p.path}`);
    });
    console.log('\n3. Check if data loads correctly on each page');
    console.log('4. Look for any console errors (F12)\n');
}

testAllAdminPages().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
