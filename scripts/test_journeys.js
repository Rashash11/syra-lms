
const fetch = require('node-fetch');

const API_URL = 'http://localhost:8001';
const TENANT_ID = '62143487-327a-4280-96a4-f21911acae95';

const users = {
    learner: { email: 'learner-journey@test.local', password: 'TestPass123!' },
    instructor: { email: 'instructor-journey@test.local', password: 'TestPass123!' },
    superInstructor: { email: 'super-instructor-journey@test.local', password: 'TestPass123!' },
    admin: { email: 'admin-journey@test.local', password: 'TestPass123!' }
};

async function login(role, user) {
    console.log(`\n🔑 Logging in as ${role} (${user.email})...`);
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

async function checkEndpoint(role, cookie, method, path, expectedStatus = 200, checkFn = null) {
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers: { 
                'Cookie': cookie,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`[${role}] ${method} ${path} -> ${res.status}`);
        
        if (res.status !== expectedStatus) {
            console.error(`❌ Expected ${expectedStatus}, got ${res.status}`);
            const text = await res.text();
            console.error('Response:', text);
            return false;
        }

        if (checkFn) {
            const data = await res.json();
            const result = checkFn(data);
            if (result) console.log(`✅ Check passed: ${result}`);
            else console.error(`❌ Check failed for ${path}`);
            return result;
        }
        
        return true;
    } catch (e) {
        console.error(`❌ Request failed: ${e.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Journey Tests...');

    // 1. Learner Journey
    const learnerCookie = await login('Learner', users.learner);
    if (learnerCookie) {
        await checkEndpoint('Learner', learnerCookie, 'GET', '/api/enrollments', 200, (data) => {
            const count = data.data ? data.data.length : (data.items ? data.items.length : data.length);
            if (count > 0) return `Found ${count} enrollments`;
            return false;
        });
        await checkEndpoint('Learner', learnerCookie, 'GET', '/api/courses/catalog', 200, (data) => {
             const count = data.data ? data.data.length : (data.items ? data.items.length : data.length);
             return `Catalog has ${count} courses`;
        });
    }

    // 2. Instructor Journey
    const instructorCookie = await login('Instructor', users.instructor);
    if (instructorCookie) {
        await checkEndpoint('Instructor', instructorCookie, 'GET', '/api/instructor/courses', 200, (data) => {
            // Should see 2 courses (Draft + Published)
            const count = data.data ? data.data.length : (data.items ? data.items.length : data.length);
            if (count >= 2) return `Found ${count} instructor courses`;
            console.log('Data:', JSON.stringify(data, null, 2));
            return false;
        });
        
        // Check if instructor can see learning paths
        await checkEndpoint('Instructor', instructorCookie, 'GET', '/api/learning-paths', 200);
    }

    // 3. Admin Journey
    const adminCookie = await login('Admin', users.admin);
    if (adminCookie) {
        await checkEndpoint('Admin', adminCookie, 'GET', '/api/users', 200, (data) => {
            const count = data.data ? data.data.length : (data.items ? data.items.length : data.length);
            return `Admin sees ${count} users`;
        });
        await checkEndpoint('Admin', adminCookie, 'GET', '/api/admin/settings', 200);
    }
    
    // 4. Super Instructor Journey
    const superCookie = await login('SuperInstructor', users.superInstructor);
    if (superCookie) {
         await checkEndpoint('SuperInstructor', superCookie, 'GET', '/api/instructor/courses', 200);
    }

    console.log('\n🏁 Journey Tests Completed');
}

runTests();
