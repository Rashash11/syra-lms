const API_URL = 'http://localhost:8001/api';
const LOGIN_EMAIL = 'admin@portal.com';
const LOGIN_PASSWORD = 'Admin123!';

async function testCRUD() {
    console.log('--- STARTING ADMIN CRUD SCAN ---');
    let sessionCookie = '';

    // 1. LOGIN
    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: LOGIN_EMAIL,
                password: LOGIN_PASSWORD
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed with status ${loginRes.status}`);

        const setCookie = loginRes.headers.get('set-cookie');
        if (setCookie) {
            sessionCookie = setCookie.split(';')[0];
        }
        console.log('✅ Login successful');
    } catch (e) {
        console.error('❌ Login failed:', e.message);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
    };

    // 2. USERS CRUD
    console.log('\n--- Testing Users CRUD ---');
    let userId = '';
    try {
        // List
        const listRes = await fetch(`${API_URL}/users`, { headers });
        const listData = await listRes.json();
        console.log(`✅ List Users: Found ${listData.total} users`);

        // Create
        const createRes = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                username: `testuser_${Date.now()}`,
                email: `test_${Date.now()}@example.com`,
                firstName: 'Test',
                lastName: 'User',
                role: 'LEARNER'
            })
        });
        const createData = await createRes.json();
        userId = createData.id;
        if (!userId) throw new Error('Failed to create user: ' + JSON.stringify(createData));
        console.log(`✅ Create User: ID ${userId}`);

        // Update
        const updateRes = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ firstName: 'Updated' })
        });
        console.log(`✅ Update User: ${updateRes.ok ? 'OK' : 'Failed'}`);

        // Delete
        const deleteRes = await fetch(`${API_URL}/users`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ ids: [userId] })
        });
        console.log(`✅ Delete User: ${deleteRes.ok ? 'OK' : 'Failed'}`);
    } catch (e) {
        console.error('❌ Users CRUD Error:', e.message);
    }

    // 3. COURSES CRUD
    console.log('\n--- Testing Courses CRUD ---');
    let courseId = '';
    try {
        // List
        const listRes = await fetch(`${API_URL}/courses`, { headers });
        const listData = await listRes.json();
        console.log(`✅ List Courses: Found ${listData.total} courses`);

        // Create
        const createRes = await fetch(`${API_URL}/courses`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                title: `Test Course ${Date.now()}`,
                code: `TC-${Date.now()}`,
                description: 'Test description'
            })
        });
        const createData = await createRes.json();
        courseId = createData.id;
        if (!courseId) throw new Error('Failed to create course: ' + JSON.stringify(createData));
        console.log(`✅ Create Course: ID ${courseId}`);

        // Update
        const updateRes = await fetch(`${API_URL}/courses/${courseId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ title: 'Updated Course Title' })
        });
        console.log(`✅ Update Course: ${updateRes.ok ? 'OK' : 'Failed'}`);

        // Delete
        const deleteRes = await fetch(`${API_URL}/courses`, {
            method: 'DELETE',
            headers,
            body: JSON.stringify({ ids: [courseId] })
        });
        console.log(`✅ Delete Course: ${deleteRes.ok ? 'OK' : 'Failed'}`);
    } catch (e) {
        console.error('❌ Courses CRUD Error:', e.message);
    }

    console.log('\n--- SCAN COMPLETE ---');
}

testCRUD();
