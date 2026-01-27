
const fetch = require('node-fetch');

const API_URL = 'http://localhost:8001';
const USERS = {
    admin: { email: 'admin-journey@test.local', password: 'TestPass123!' }
};

async function login(role, user) {
    console.log(`\n🔑 Logging in as ${role}...`);
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        
        const cookie = res.headers.get('set-cookie');
        if (!cookie) throw new Error('No cookie received');
        
        console.log(`✅ Login successful. Role: ${data.role}`);
        return cookie;
    } catch (e) {
        console.error(`❌ Login failed: ${e.message}`);
        return null;
    }
}

async function request(cookie, method, path, body = null) {
    try {
        const options = {
            method,
            headers: { 
                'Cookie': cookie,
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${API_URL}${path}`, options);
        const text = await res.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = text;
        }

        console.log(`[${method}] ${path} -> ${res.status}`);
        
        if (!res.ok) {
            console.error(`❌ Request failed (${res.status}):`, JSON.stringify(data, null, 2));
            return { ok: false, status: res.status, data };
        }
        
        return { ok: true, status: res.status, data };
    } catch (e) {
        console.error(`❌ Network error: ${e.message}`);
        return { ok: false, error: e };
    }
}

async function runAdminJourney() {
    console.log('🚀 Starting Admin Journey Test...');
    
    const cookie = await login('Admin', USERS.admin);
    if (!cookie) process.exit(1);

    let courseId, assignmentId, pathId, userId;

    // ==========================================
    // 1. COURSE MANAGEMENT
    // ==========================================
    console.log('\n📚 Testing Course Management...');
    const courseRes = await request(cookie, 'POST', '/api/courses', {
        title: "Admin Test Course",
        code: `ADM-TEST-${Date.now()}`,
        description: "Created by Admin Journey Test",
        status: "draft",
        price: 0
    });
    
    if (courseRes.ok) {
        courseId = courseRes.data.id;
        console.log(`✅ Course Created: ${courseId}`);
        
        // Verify
        const getCourse = await request(cookie, 'GET', `/api/courses/${courseId}`);
        if (getCourse.ok && getCourse.data.title === "Admin Test Course") {
            console.log('✅ Course Retrieval Verified');
        } else {
            console.error('❌ Course Verification Failed');
        }

        // Update
        const updateCourse = await request(cookie, 'PUT', `/api/courses/${courseId}`, {
            title: "Admin Test Course (Updated)"
        });
        if (updateCourse.ok) console.log('✅ Course Updated');
    } else {
        console.error('❌ Failed to create course');
    }

    // ==========================================
    // 2. ASSIGNMENT MANAGEMENT
    // ==========================================
    if (courseId) {
        console.log('\n📝 Testing Assignment Management...');
        const assignRes = await request(cookie, 'POST', '/api/assignments', {
            title: "Admin Test Assignment",
            description: "Test Description",
            courseId: courseId,
            dueAt: new Date(Date.now() + 86400000).toISOString() // +1 day
        });

        if (assignRes.ok) {
            assignmentId = assignRes.data.id;
            console.log(`✅ Assignment Created: ${assignmentId}`);
            
            // List
            const listAssign = await request(cookie, 'GET', `/api/assignments?courseId=${courseId}`);
            if (listAssign.ok && (listAssign.data.data || listAssign.data.items).length > 0) {
                console.log('✅ Assignment Listing Verified');
            } else {
                 console.error('❌ Assignment Listing Failed');
            }
            
            // Delete Assignment
            const delAssign = await request(cookie, 'DELETE', `/api/assignments/${assignmentId}`);
            if (delAssign.ok) console.log('✅ Assignment Deleted');
        } else {
            console.error('❌ Failed to create assignment');
        }
    }

    // ==========================================
    // 3. LEARNING PATH MANAGEMENT
    // ==========================================
    console.log('\n🛤️ Testing Learning Path Management...');
    const pathRes = await request(cookie, 'POST', '/api/learning-paths', {
        name: "Admin Test Path",
        code: `PATH-${Date.now()}`,
        description: "Testing Path Creation",
        isSequential: true,
        isActive: false
    });

    if (pathRes.ok) {
        pathId = pathRes.data.id;
        console.log(`✅ Learning Path Created: ${pathId}`);
        
        const getPath = await request(cookie, 'GET', `/api/learning-paths/${pathId}`);
        if (getPath.ok) console.log('✅ Learning Path Verified');

        // Delete Path
        const delPath = await request(cookie, 'DELETE', `/api/learning-paths/${pathId}`);
        if (delPath.ok) console.log('✅ Learning Path Deleted');
    } else {
        console.error('❌ Failed to create learning path');
    }

    // ==========================================
    // 4. USER MANAGEMENT
    // ==========================================
    console.log('\n👤 Testing User Management...');
    const userEmail = `temp-user-${Date.now()}@example.com`;
    const userRes = await request(cookie, 'POST', '/api/users', {
        email: userEmail,
        firstName: "Temp",
        lastName: "User",
        role: "LEARNER",
        password: "TempPass123!",
        status: "ACTIVE"
    });

    if (userRes.ok) {
        userId = userRes.data.id || userRes.data.userId; // Check response structure
        console.log(`✅ User Created: ${userId} (${userEmail})`);
        
        // Verify
        const getUser = await request(cookie, 'GET', `/api/users/${userId}`);
        if (getUser.ok) console.log('✅ User Retrieval Verified');

        // Delete User
        const delUser = await request(cookie, 'DELETE', `/api/users/${userId}`);
        if (delUser.ok) console.log('✅ User Deleted');
    } else {
        console.error('❌ Failed to create user');
    }

    // ==========================================
    // CLEANUP
    // ==========================================
    if (courseId) {
        console.log('\n🧹 Cleaning up Course...');
        // Need to delete course. The route might be DELETE /api/courses with body or single ID?
        // Let's check definition: DELETE /api/courses takes list of IDs usually or single?
        // Based on search, it was bulk delete. Let's try DELETE /api/courses with body { ids: [id] }
        // Or if there is a single delete endpoint.
        
        // Let's try sending body
        const delCourse = await fetch(`${API_URL}/api/courses`, {
            method: 'DELETE',
            headers: { 
                'Cookie': cookie,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: [courseId] })
        });
        
        if (delCourse.ok) {
             console.log('✅ Course Deleted');
        } else {
             console.log(`⚠️ Course Delete Failed: ${delCourse.status}`);
             // Try single ID endpoint just in case
             const delSingle = await request(cookie, 'DELETE', `/api/courses/${courseId}`);
             if (delSingle.ok) console.log('✅ Course Deleted (Single Endpoint)');
        }
    }

    console.log('\n🏁 Admin Journey Test Completed');
}

runAdminJourney();
