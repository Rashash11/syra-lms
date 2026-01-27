// Comprehensive Admin API Diagnostic Tool
const fetch = require('node-fetch');

async function checkBackend() {
    console.log('\n══════════════════════════════════════');
    console.log('  ADMIN API DIAGNOSTIC TOOL');
    console.log('══════════════════════════════════════\n');

    // 1. Check backend directly
    console.log('1. Checking FastAPI Backend (Port 8001)...');
    try {
        const res = await fetch('http://localhost:8001/health', { timeout: 3000 });
        const data = await res.json();
        console.log(`   ✓ Backend is UP: ${JSON.stringify(data)}`);
    } catch (error) {
        console.log(`   ❌ Backend is DOWN: ${error.message}`);
        console.log(`   ⚠️  This means ALL admin pages will fail!`);
        return false;
    }

    return true;
}

async function testEndpoint(url, name, method = 'GET') {
    try {
        const options = { method, timeout: 5000 };
        const res = await fetch(url, options);
        const text = await res.text();

        let data;
        try {
            data = JSON.parse(text);
        } catch {
            data = text.substring(0, 100);
        }

        const symbol = res.ok ? '✓' : '❌';
        console.log(`   ${symbol} ${name}: ${res.status}`);
        if (!res.ok) {
            console.log(`      Error: ${JSON.stringify(data).substring(0, 150)}`);
        }
        return { name, status: res.status, ok: res.ok, data };
    } catch (error) {
        console.log(`   ❌ ${name}: ${error.message}`);
        return { name, error: error.message };
    }
}

async function main() {
    const backendUp = await checkBackend();

    if (!backendUp) {
        console.log('\n⚠️  CRITICAL: Backend is not running!');
        console.log('   Start the backend with: python -m uvicorn app.main:app --reload --port 8001');
        console.log('   Or from services/api: uvicorn app.main:app --reload --port 8001\n');
    }

    // 2. Test backend endpoints directly
    console.log('\n2. Testing Backend Endpoints Direct (port 8001)...');
    await testEndpoint('http://localhost:8001/api/users', 'GET /api/users');
    await testEndpoint('http://localhost:8001/api/me', 'GET /api/me');
    await testEndpoint('http://localhost:8001/api/admin/notifications', 'GET /api/admin/notifications');

    // 3. Test through Next.js proxy
    console.log('\n3. Testing Through Next.js Proxy (port 3000)...');
    await testEndpoint('http://localhost:3000/api/health', 'GET /api/health (proxy test)');
    await testEndpoint('http://localhost:3000/api/users', 'GET /api/users (proxy)');
    await testEndpoint('http://localhost:3000/api/me', 'GET /api/me (proxy)');
    await testEndpoint('http://localhost:3000/api/admin/notifications', 'GET /api/admin/notifications (proxy)');

    console.log('\n4. Summary of Issues:');
    console.log('   - Check if backend is running (port 8001)');
    console.log('   - Check if database is accessible');
    console.log('   - Check if authentication is required');
    console.log('   - Check browser console for detailed errors');

    console.log('\n══════════════════════════════════════\n');
}

main().catch(console.error);
