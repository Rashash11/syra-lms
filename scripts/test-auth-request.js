// Simulate an authenticated request to see the actual error
const fetch = require('node-fetch');

async function testAuthenticatedRequest() {
    console.log('\nTrying to simulate authenticated request...\n');

    // Try with a fake session cookie to trigger the authenticated code path
    const res = await fetch('http://localhost:8001/api/users', {
        headers: {
            'Cookie': 'session=test',
            'Authorization': 'Bearer test'
        }
    });

    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Response:\n${text.substring(0, 1000)}`);
}

testAuthenticatedRequest();
