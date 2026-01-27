// Test dashboard endpoint
const fetch = require('node-fetch');

async function testDashboard() {
    console.log('Testing /api/dashboard endpoint...\n');

    try {
        const res = await fetch('http://localhost:3000/api/dashboard', {
            timeout: 5000
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);

        if (res.status === 500) {
            console.log('\n❌ 500 ERROR');
            console.log('Response:');
            console.log(text);

            try {
                const json = JSON.parse(text);
                console.log('\nParsed JSON:');
                console.log(JSON.stringify(json, null, 2));
            } catch { }
        } else if (res.status === 200) {
            const data = JSON.parse(text);
            console.log('\n✅ SUCCESS');
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.log(`\nResponse: ${text}`);
        }
    } catch (error) {
        console.log(`\n❌ Error: ${error.message}`);
    }
}

testDashboard();
