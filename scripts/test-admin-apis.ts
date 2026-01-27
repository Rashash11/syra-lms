const baseUrl = 'http://localhost:3000';
const results: string[] = [];

async function testAdminAPIs() {
    try {
        // Test 1: Login
        results.push('=== Test 1: Login ===');
        const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin-a@test.local',
                password: 'TestPass123!'
            })
        });

        const cookies = loginRes.headers.get('set-cookie');
        const loginData = await loginRes.json();

        results.push(`Status: ${loginRes.status}`);
        results.push(`Response: ${JSON.stringify(loginData, null, 2)}`);
        results.push(`Cookies: ${cookies ? 'Set' : 'Not Set'}`);

        if (!loginRes.ok) {
            results.push('❌ Login FAILED');
            console.log(results.join('\n'));
            return;
        }
        results.push('✅ Login SUCCESS\n');

        // Extract session cookie
        const sessionCookie = cookies?.split(';')[0] || '';
        const csrfMatch = cookies?.match(/csrf-token=([^;]+)/);
        const csrfToken = csrfMatch ? csrfMatch[1] : '';

        // Test 2: /api/me
        results.push('=== Test 2: /api/me ===');
        const meRes = await fetch(`${baseUrl}/api/me`, {
            headers: {
                'Cookie': sessionCookie,
                'x-csrf-token': csrfToken
            }
        });

        const meData = await meRes.json();
        results.push(`Status: ${meRes.status}`);
        results.push(`Response: ${JSON.stringify(meData, null, 2)}`);
        results.push(meRes.ok ? '✅ /api/me SUCCESS\n' : '❌ /api/me FAILED\n');

        // Test 3: /api/users (GET)
        results.push('=== Test 3: GET /api/users ===');
        const usersRes = await fetch(`${baseUrl}/api/users`, {
            headers: {
                'Cookie': sessionCookie,
                'x-csrf-token': csrfToken
            }
        });

        results.push(`Status: ${usersRes.status}`);
        const usersData = await usersRes.json();
        results.push(`Response: ${JSON.stringify(usersData, null, 2).substring(0, 500)}...`);
        results.push(usersRes.ok ? '✅ GET /api/users SUCCESS\n' : '❌ GET /api/users FAILED\n');

        // Test 4: /api/courses (GET)
        results.push('=== Test 4: GET /api/courses ===');
        const coursesRes = await fetch(`${baseUrl}/api/courses`, {
            headers: {
                'Cookie': sessionCookie,
                'x-csrf-token': csrfToken
            }
        });

        results.push(`Status: ${coursesRes.status}`);
        const coursesData = await coursesRes.json();
        results.push(`Response: ${JSON.stringify(coursesData, null, 2).substring(0, 500)}...`);
        results.push(coursesRes.ok ? '✅ GET /api/courses SUCCESS\n' : '❌ GET /api/courses FAILED\n');

        // Test 5: /api/groups (GET)
        results.push('=== Test 5: GET /api/groups ===');
        const groupsRes = await fetch(`${baseUrl}/api/groups`, {
            headers: {
                'Cookie': sessionCookie,
                'x-csrf-token': csrfToken
            }
        });

        results.push(`Status: ${groupsRes.status}`);
        const groupsData = await groupsRes.json();
        results.push(`Response: ${JSON.stringify(groupsData, null, 2).substring(0, 500)}...`);
        results.push(groupsRes.ok ? '✅ GET /api/groups SUCCESS\n' : '❌ GET /api/groups FAILED\n');

        // Test 6: Create a test user
        results.push('=== Test 6: POST /api/users (Create User) ===');
        const timestamp = Date.now();
        const createUserRes = await fetch(`${baseUrl}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie,
                'x-csrf-token': csrfToken
            },
            body: JSON.stringify({
                email: `test-${timestamp}@example.com`,
                username: `test_${timestamp}`,
                firstName: 'Test',
                lastName: 'User',
                password: 'TestPass123!',
                role: 'LEARNER',
                ...(meData?.claims?.nodeId ? { nodeId: meData.claims.nodeId } : {})
            })
        });

        results.push(`Status: ${createUserRes.status}`);
        const createdUser = await createUserRes.json();
        results.push(`Response: ${JSON.stringify(createdUser, null, 2)}`);
        results.push(createUserRes.ok ? '✅ POST /api/users SUCCESS\n' : '❌ POST /api/users FAILED\n');

        // Test 7: Delete the test user (if created successfully)
        if (createUserRes.ok && createdUser.id) {
            results.push('=== Test 7: DELETE /api/users/:id (Delete User) ===');
            const deleteUserRes = await fetch(`${baseUrl}/api/users`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': sessionCookie,
                    'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ ids: [createdUser.id] })
            });

            results.push(`Status: ${deleteUserRes.status}`);
            results.push(deleteUserRes.ok ? '✅ DELETE /api/users SUCCESS\n' : '❌ DELETE /api/users FAILED\n');
        }

        // Summary
        results.push('\n=== SUMMARY ===');
        const successCount = results.filter(r => r.includes('✅')).length;
        const totalTests = results.filter(r => r.includes('=== Test')).length;
        results.push(`Passed: ${successCount}/${totalTests}`);
        results.push(`\nAll critical admin APIs are ${successCount === totalTests ? '✅ WORKING' : '⚠️ PARTIALLY WORKING'}`);

    } catch (error) {
        results.push(`\n❌ ERROR: ${error}`);
    }

    console.log(results.join('\n'));
}

testAdminAPIs().catch(console.error);
