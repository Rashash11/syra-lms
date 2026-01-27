const fetch = require('node-fetch');

(async () => {
    console.log('=== Detailed Dashboard/Catalog Test ===\n');

    // Test 1: Direct FastAPI
    console.log('1. Testing DIRECT FastAPI (port 8000)...');
    try {
        const res = await fetch('http://localhost:8000/api/dashboard');
        console.log(`   Status: ${res.status}`);
        const data = await res.json();
        console.log(`   Response:`, JSON.stringify(data, null, 2));
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }

    // Test 2: Through Next.js proxy
    console.log('\n2. Testing through Next.js PROXY (port 3000)...');
    try {
        const res = await fetch('http://localhost:3000/api/dashboard');
        console.log(`   Status: ${res.status}`);
        const text = await res.text();
        console.log(`   Raw Response:`, text.substring(0, 500));

        try {
            const data = JSON.parse(text);
            console.log(`   Parsed:`, JSON.stringify(data, null, 2));
        } catch (e) {
            console.log(`   (Not JSON)`);
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }

    // Test 3: Catalog direct
    console.log('\n3. Testing CATALOG direct FastAPI...');
    try {
        const res = await fetch('http://localhost:8000/api/catalog');
        console.log(`   Status: ${res.status}`);
        const data = await res.json();
        console.log(`   Response: ${data.courses?.length || 0} courses`);
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }

    // Test 4: Catalog through proxy
    console.log('\n4. Testing CATALOG through proxy...');
    try {
        const res = await fetch('http://localhost:3000/api/catalog');
        console.log(`   Status: ${res.status}`);
        const text = await res.text();
        console.log(`   Raw Response:`, text.substring(0, 500));
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
    }
})();
