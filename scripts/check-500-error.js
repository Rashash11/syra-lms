// Check what error the backend is actually returning
const fetch = require('node-fetch');

async function checkActualError() {
    console.log('\nChecking actual backend response...\n');

    try {
        const res = await fetch('http://localhost:8001/api/users', {
            headers: {
                // Try without auth to see if it's an auth issue
            }
        });

        const text = await res.text();
        console.log(`Status: ${res.status}`);
        console.log(`Response: ${text}`);

        if (res.status === 500) {
            console.log('\n❌ 500 ERROR DETAILS:');
            try {
                const json = JSON.parse(text);
                console.log(JSON.stringify(json, null, 2));
            } catch {
                console.log(text);
            }
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
}

checkActualError();
