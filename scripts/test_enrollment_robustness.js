
const fetch = require('node-fetch');

const API_URL = 'http://localhost:8001';
const TIMESTAMP = Date.now();

// Users
const USERS = {
    admin: { email: 'admin-journey@test.local', password: 'TestPass123!' },
    instructor: { email: `inst-enroll-${TIMESTAMP}@example.com`, password: 'TestPass123!', role: 'INSTRUCTOR' },
    learner: { email: `learn-enroll-${TIMESTAMP}@example.com`, password: 'TestPass123!', role: 'LEARNER' }
};

let cookies = {};
let data = {};

async function req(role, method, path, body = null) {
    const opts = {
        method,
        headers: { 'Cookie': cookies[role], 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${path}`, opts);
    const text = await res.text();
    // Debug output if auth fails
    if (res.status === 401) console.log(`[DEBUG] 401 for ${role} on ${path}. Cookie:`, cookies[role]);
    
    try { return { status: res.status, data: JSON.parse(text) }; } 
    catch { return { status: res.status, data: text }; }
}

async function login(role, user) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
    });
    cookies[role] = res.headers.get('set-cookie');
    console.log(`[DEBUG] Login ${role}: ${res.status}`);
    return res.ok;
}

async function runTest() {
    console.log('🧪 Starting Enrollment Robustness Test...\n');

    // 1. Setup Users
    await login('admin', USERS.admin);
    console.log('Creating users...');
    
    // Create instructor
    const iRes = await req('admin', 'POST', '/api/users', { ...USERS.instructor, firstName: 'Inst', lastName: 'Test', status: 'ACTIVE' });
    if (iRes.status !== 200) console.log('Create Inst failed:', iRes.data);
    
    // Create learner
    const lRes = await req('admin', 'POST', '/api/users', { ...USERS.learner, firstName: 'Learn', lastName: 'Test', status: 'ACTIVE' });
    if (lRes.status !== 200) console.log('Create Learn failed:', lRes.data);
    data.learnerId = lRes.data.id || lRes.data.userId;

    // Login with new credentials
    await login('instructor', USERS.instructor);
    await login('learner', USERS.learner);

    // 2. Create Courses
    console.log('Creating courses...');
    // Course A: Published
    const cA = await req('instructor', 'POST', '/api/courses', {
        title: "Published Course", code: `PUB-${TIMESTAMP}`, status: "published", isActive: true, price: 0
    });
    data.coursePublished = cA.data.id;

    // Course B: Draft
    const cB = await req('instructor', 'POST', '/api/courses', {
        title: "Draft Course", code: `DFT-${TIMESTAMP}`, status: "draft", isActive: true, price: 0
    });
    data.courseDraft = cB.data.id;

    console.log('\n--- EXECUTION ---');

    // TEST 1: Normal Enrollment
    process.stdout.write('1. Normal Enrollment: ');
    const t1 = await req('learner', 'POST', '/api/enrollments', { 
        courseId: data.coursePublished,
        userId: data.learnerId
    });
    if (t1.status === 200) console.log('✅ PASS');
    else console.log(`❌ FAIL (${t1.status})`, t1.data);

    // TEST 2: Duplicate Enrollment
    process.stdout.write('2. Duplicate Enrollment: ');
    const t2 = await req('learner', 'POST', '/api/enrollments', { 
        courseId: data.coursePublished,
        userId: data.learnerId
    });
    if (t2.status === 400 && t2.data.message.includes('Already enrolled')) console.log('✅ PASS (Blocked correctly)');
    else console.log(`❌ FAIL (Status: ${t2.status})`, t2.data);

    // TEST 3: Unpublished Course
    process.stdout.write('3. Unpublished Course: ');
    const t3 = await req('learner', 'POST', '/api/enrollments', { 
        courseId: data.courseDraft,
        userId: data.learnerId
    });
    if (t3.status === 400 && t3.data.message.includes('unpublished')) console.log('✅ PASS (Blocked correctly)');
    else console.log(`❌ FAIL (Status: ${t3.status})`, t3.data);

    // TEST 4: Non-existent Course
    process.stdout.write('4. Non-existent Course: ');
    const t4 = await req('learner', 'POST', '/api/enrollments', { 
        courseId: '00000000-0000-0000-0000-000000000000',
        userId: data.learnerId
    });
    if (t4.status === 404) console.log('✅ PASS (404 Not Found)');
    else console.log(`❌ FAIL (Status: ${t4.status})`, t4.data);

    // TEST 5: Verify Enrollment List
    process.stdout.write('5. Verify List: ');
    const t5 = await req('learner', 'GET', '/api/enrollments');
    const hasEnrollment = t5.data.data.some(e => e.courseId === data.coursePublished);
    if (hasEnrollment) console.log('✅ PASS (Found in list)');
    else console.log('❌ FAIL (Not found in list)');

    // Cleanup
    console.log('\n--- CLEANUP ---');
    await req('admin', 'DELETE', '/api/users', { ids: [data.learnerId] }); // clean learner
    // Courses deleted via bulk delete usually
    await fetch(`${API_URL}/api/courses`, {
        method: 'DELETE',
        headers: { 'Cookie': cookies.admin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [data.coursePublished, data.courseDraft] })
    });
    console.log('Cleanup done.');
}

runTest();
