
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8001';

async function testLogin() {
    console.log('\n🔐 Testing Login Response Structure...');

    const credentials = {
        email: 'admin-a@test.local',
        password: 'TestPass123!'
    };

    try {
        // We hit the Next.js proxy at port 3000 which forwards to 8001
        // But to be sure about the backend response, we can also hit 8001 directly.
        // Let's hit 8001 directly to test the backend behavior first.
        
        console.log('Target: ' + API_URL + '/api/auth/login');
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response Keys:', Object.keys(data));
        console.log('Response:', JSON.stringify(data, null, 2));

        if (data.activeRole) {
            console.log('✅ activeRole is present:', data.activeRole);
        } else {
            console.log('❌ activeRole is MISSING');
            process.exit(1);
        }
        
        if (data.role) {
            console.log('✅ role is present:', data.role);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testLogin();
