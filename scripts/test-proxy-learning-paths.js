
const fetch = require('node-fetch');

async function testProxy() {
    console.log('Testing Proxy: http://localhost:3000/api/learning-paths');
    try {
        const res = await fetch('http://localhost:3000/api/learning-paths', {
            headers: {
                // We need a cookie if the endpoint requires auth.
                // However, getting a cookie for localhost:3000 requires logging in via frontend or manually constructing one.
                // But wait, the backend `test_master_suite` used direct backend access.
                // Let's try to hit the backend directly first to make sure it's up.
            }
        });
        console.log(`Status: ${res.status}`);
        if (res.status === 401) {
            console.log('Got 401 - Proxy is likely working (forwarding auth request)');
        } else if (res.ok) {
            console.log('Got 200 OK');
        } else {
            console.log('Got other status:', res.status);
            console.log(await res.text());
        }
    } catch (e) {
        console.error('Proxy Request Failed:', e.message);
    }
}

testProxy();
