async function testRoutes() {
    try {
        // 1. Login
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin-a@test.local',
                password: 'TestPass123!'
            })
        });
        
        if (!loginRes.ok) {
            console.error('Login failed:', loginRes.status);
            return;
        }

        const setCookie = loginRes.headers.get('set-cookie');
        console.log('Login successful');
        const headers = { 'Cookie': setCookie };

        // 2. Test Groups
        console.log('\n--- Testing Groups ---');
        try {
            const res = await fetch('http://localhost:3000/api/groups', { headers });
            console.log('Groups Status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('Groups Data:', data.data ? data.data.length : data);
            } else {
                console.log('Groups Error:', await res.text());
            }
        } catch (e) {
            console.error('Groups Exception:', e.message);
        }

        // 3. Test Branches
        console.log('\n--- Testing Branches ---');
        try {
            const res = await fetch('http://localhost:3000/api/branches', { headers });
            console.log('Branches Status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('Branches Data:', data.data ? data.data.length : data);
            } else {
                console.log('Branches Error:', await res.text());
            }
        } catch (e) {
            console.error('Branches Exception:', e.message);
        }

        // 4. Test Learning Paths
        console.log('\n--- Testing Learning Paths ---');
        try {
            const res = await fetch('http://localhost:3000/api/learning-paths', { headers });
            console.log('Learning Paths Status:', res.status);
            if (res.ok) {
                const data = await res.json();
                console.log('Learning Paths Data:', data.data ? data.data.length : data);
            } else {
                console.log('Learning Paths Error:', await res.text());
            }
        } catch (e) {
            console.error('Learning Paths Exception:', e.message);
        }

    } catch (e) {
        console.error(e);
    }
}

testRoutes();
