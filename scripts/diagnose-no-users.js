// Diagnose why users aren't showing on the users page
const fetch = require('node-fetch');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║     DIAGNOSING: No Users Shown on Users Page             ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

async function diagnose() {
    // Test 1: Check if backend is running and accessible
    console.log('1️⃣  Checking Backend Status...\n');
    try {
        const res = await fetch('http://localhost:8001/api/health', { timeout: 3000 });
        const data = await res.json();
        console.log(`   ✅ Backend is UP: ${data.status}`);
    } catch (error) {
        console.log(`   ❌ Backend is DOWN: ${error.message}`);
        console.log('   → Run: cd services/api && python -m uvicorn app.main:app --reload --port 8001\n');
        return;
    }

    // Test 2: Check /api/users endpoint directly on backend
    console.log('\n2️⃣  Testing Backend /api/users Endpoint...\n');
    try {
        const res = await fetch('http://localhost:8001/api/users', { timeout: 5000 });
        const text = await res.text();

        console.log(`   Status: ${res.status}`);

        if (res.status === 401) {
            console.log('   ℹ️  Returns 401 (authentication required)');
            console.log('   ✓ Endpoint exists and is protected');
        } else if (res.status === 200) {
            const data = JSON.parse(text);
            const userCount = data.users?.length || data.data?.length || 0;
            console.log(`   ✅ Endpoint returns data`);
            console.log(`   Users in database: ${userCount}`);
            console.log(`   Total: ${data.total || 'N/A'}`);

            if (userCount === 0) {
                console.log('\n   ⚠️  DATABASE IS EMPTY!');
                console.log('   → Solution: Run `npm run db:seed` to create test users');
            } else {
                console.log(`\n   Sample users:`);
                (data.users || data.data || []).slice(0, 3).forEach(u => {
                    console.log(`   - ${u.firstName} ${u.lastName} (${u.email}) - Role: ${u.role || u.activeRole}`);
                });
            }
        } else {
            console.log(`   ❌ Unexpected response: ${text.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 3: Check frontend proxy
    console.log('\n3️⃣  Testing Frontend Proxy /api/users...\n');
    try {
        const res = await fetch('http://localhost:3000/api/users', { timeout: 5000 });
        const text = await res.text();

        console.log(`   Status: ${res.status}`);

        if (res.status === 401) {
            console.log('   ⚠️  Frontend returns 401 (not authenticated)');
            console.log('   → You need to be logged in to see users');
            console.log('   → Check browser: Are you logged in?');
        } else if (res.status === 200) {
            const data = JSON.parse(text);
            const userCount = data.users?.length || data.data?.length || 0;
            console.log(`   ✅ Proxy working, returns ${userCount} users`);

            if (userCount === 0) {
                console.log('   ⚠️  No users in response');
            }
        } else if (res.status === 500) {
            console.log('   ❌ Server error (500)');
            console.log(`   Error: ${text.substring(0, 200)}`);
            console.log('   → Check backend terminal for error details');
        } else {
            console.log(`   Response: ${text.substring(0, 200)}`);
        }
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Summary and recommendations
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                  DIAGNOSIS COMPLETE                       ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    console.log('🔍 NEXT STEPS:\n');
    console.log('1. Check if you\'re LOGGED IN:');
    console.log('   - In browser, check if you see your name/profile in header');
    console.log('   - If not logged in, go to http://localhost:3000/login\n');

    console.log('2. Check BROWSER CONSOLE:');
    console.log('   - Press F12 → Console tab');
    console.log('   - Look for RED error messages');
    console.log('   - Share any errors you see\n');

    console.log('3. Check NETWORK TAB:');
    console.log('   - Press F12 → Network tab');
    console.log('   - Refresh the /admin/users page');
    console.log('   - Look for /api/users request');
    console.log('   - What is the status code? (should be 200, not 401/500)');
    console.log('   - Click on the request → Preview tab → Does it show users?\n');

    console.log('4. If database is empty:');
    console.log('   Run: npm run db:seed\n');

    console.log('5. Share with me:');
    console.log('   - Are you logged in? (Yes/No)');
    console.log('   - Console errors? (If any)');
    console.log('   - /api/users status code from Network tab');
    console.log('   - What does the page say? ("No users found" or loading spinner?)\n');
}

diagnose().catch(error => {
    console.error('Diagnosis failed:', error);
    process.exit(1);
});
