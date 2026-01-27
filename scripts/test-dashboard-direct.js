// Test the dashboard endpoint directly
const fetch = require('node-fetch');

async function test() {
    console.log('Testing backend dashboard endpoint directly...\n');

    try {
        const res = await fetch('http://localhost:8001/api/dashboard');
        const text = await res.text();

        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text.substring(0, 500)}`);

        if (res.status === 200) {
            const data = JSON.parse(text);
            console.log('\n✅ Success! Dashboard data:');
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

test();
