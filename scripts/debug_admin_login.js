
const fetch = require('node-fetch');

async function testAdminLoginAndFetchUsers() {
    const API_URL = 'http://localhost:8001';
    console.log('Logging in as Admin (admin-a@test.local)...');
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin-a@test.local', password: 'TestPass123!' })
        });
        
        console.log(`Login Status: ${res.status}`);
        if (!res.ok) {
            const text = await res.text();
            console.log('Error Body:', text);
            return;
        }

        const cookie = res.headers.get('set-cookie');
        
        console.log('Fetching /api/users...');
        const usersRes = await fetch(`${API_URL}/api/users?page=1&limit=10`, {
            headers: { 'Cookie': cookie }
        });
        
        console.log(`Users Status: ${usersRes.status}`);
        const usersData = await usersRes.json();
        console.log('Users Data Keys:', Object.keys(usersData));
        if (usersData.data && usersData.data.length > 0) {
            console.log('First User:', JSON.stringify(usersData.data[0], null, 2));
            // Check for missing first names
            const problematic = usersData.data.filter(u => !u.firstName && !u.first_name);
            if (problematic.length > 0) {
                console.log('⚠️ Found users without first name:', problematic.length);
                console.log(JSON.stringify(problematic[0], null, 2));
            } else {
                console.log('✅ All users have first name');
            }
        } else {
            console.log('No users found or different structure');
            console.log(JSON.stringify(usersData, null, 2));
        }

        console.log('Fetching /api/dashboard...');
        const dashRes = await fetch(`${API_URL}/api/dashboard`, {
            headers: { 'Cookie': cookie }
        });
        console.log(`Dashboard Status: ${dashRes.status}`);
        const dashData = await dashRes.json();
        console.log('Dashboard Data:', JSON.stringify(dashData, null, 2));

        console.log('Fetching /api/courses...');
        const coursesRes = await fetch(`${API_URL}/api/courses?limit=4`, {
            headers: { 'Cookie': cookie }
        });
        console.log(`Courses Status: ${coursesRes.status}`);
        const coursesData = await coursesRes.json();
        console.log('Courses Data:', JSON.stringify(coursesData, null, 2));

    } catch (e) {
        console.error('Request Failed:', e);
    }
}

testAdminLoginAndFetchUsers();
