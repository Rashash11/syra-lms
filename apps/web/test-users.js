async function testUsers() {
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

        // 2. Fetch Users
        const usersRes = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Cookie': setCookie
            }
        });

        console.log('Users Status:', usersRes.status);
        const data = await usersRes.json();
        console.log('Response Keys:', Object.keys(data));
        
        const users = data.data || data.users;
        console.log('Users Count:', users ? users.length : 0);
        
        if (users && users.length > 0) {
            console.log('First User:', users[0].email, users[0].activeRole);
        }

    } catch (e) {
        console.error(e);
    }
}

testUsers();
