
const fetch = require('node-fetch');

async function testFrontend() {
    console.log('Fetching http://localhost:3000/admin/learning-paths');
    try {
        const res = await fetch('http://localhost:3000/admin/learning-paths');
        console.log(`Status: ${res.status}`);
        if (res.status === 200) {
            console.log('Page loaded OK');
        } else if (res.status === 307) {
            console.log('Redirected (likely to login) - OK');
        } else {
            console.log('Unexpected status:', res.status);
        }
    } catch (e) {
        console.error('Frontend Fetch Failed:', e.message);
    }
}

testFrontend();
