// Test admin pages for API errors
const fetch = require('node-fetch');

async function testEndpoint(url, name) {
    try {
        console.log(`\n=== Testing ${name} ===`);
        console.log(`URL: ${url}`);

        const response = await fetch(url, {
            headers: {
                'Cookie': 'session=test' // We'll need proper auth,but let's see what happens
            }
        });

        const text = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${text.substring(0, 200)}`);

        return { name, url, status: response.status, ok: response.ok };
    } catch (error) {
        console.error(`Error testing ${name}:`, error.message);
        return { name, url, error: error.message };
    }
}

async function main() {
    console.log('Testing Admin Page API Endpoints\n');

    const endpoints = [
        { url: 'http://localhost:8001/health', name: 'Backend Health' },
        { url: 'http://localhost:8001/api/health', name: 'Backend API Health' },
        { url: 'http://localhost:3000/api/users', name: 'Frontend /api/users' },
        { url: 'http://localhost:3000/api/me', name: 'Frontend /api/me' },
        { url: 'http://localhost:3000/api/admin/notifications', name: 'Frontend /api/admin/notifications' },
        { url: 'http://localhost:8001/api/users', name: 'Backend /api/users' },
        { url: 'http://localhost:8001/api/me', name: 'Backend /api/me' },
    ];

    const results = [];
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint.url, endpoint.name);
        results.push(result);
    }

    console.log('\n\n=== SUMMARY ===');
    results.forEach(r => {
        if (r.error) {
            console.log(`❌ ${r.name}: ${r.error}`);
        } else {
            const symbol = r.ok ? '✓' : '❌';
            console.log(`${symbol} ${r.name}: ${r.status}`);
        }
    });
}

main();
