
const fetch = require('node-fetch');

const API_URL = 'http://localhost:8001';
const TIMESTAMP = Date.now();

// Users
const USERS = {
    admin: { email: 'admin-journey@test.local', password: 'TestPass123!' },
    instructor: { email: `inst-e2e-${TIMESTAMP}@example.com`, password: 'TestPass123!', role: 'INSTRUCTOR', firstName: 'E2E', lastName: 'Instructor' },
    learner: { email: `learn-e2e-${TIMESTAMP}@example.com`, password: 'TestPass123!', role: 'LEARNER', firstName: 'E2E', lastName: 'Learner' }
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
    
    let json;
    try { json = JSON.parse(text); } catch { json = text; }

    return { status: res.status, data: json, ok: res.ok };
}

async function login(role, user) {
    console.log(`🔑 Logging in ${role} (${user.email})...`);
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: user.password })
    });
    
    if (!res.ok) {
        const text = await res.text();
        console.error(`❌ Login failed for ${role}: ${res.status} ${res.statusText}`);
        console.error(`Response: ${text}`);
        return false;
    }

    cookies[role] = res.headers.get('set-cookie');
    return true;
}

async function runFullE2E() {
    console.log('🚀 STARTING FULL E2E TEST SUITE');
    console.log('==================================================');

    // --- PHASE 1: SETUP & AUTH ---
    console.log('\n👤 PHASE 1: User Provisioning & Auth');
    
    // Admin Login
    if (!await login('admin', USERS.admin)) {
        console.error('❌ Admin login failed');
        process.exit(1);
    }

    // Create Instructor
    const iRes = await req('admin', 'POST', '/api/users', { ...USERS.instructor, status: 'ACTIVE' });
    if (!iRes.ok) { console.error('❌ Create Instructor failed', iRes.data); process.exit(1); }
    data.instructorId = iRes.data.id || iRes.data.userId;
    console.log(`✅ Instructor Created: ${data.instructorId}`);

    // Create Learner
    const lRes = await req('admin', 'POST', '/api/users', { ...USERS.learner, status: 'ACTIVE' });
    if (!lRes.ok) { console.error('❌ Create Learner failed', lRes.data); process.exit(1); }
    data.learnerId = lRes.data.id || lRes.data.userId;
    console.log(`✅ Learner Created: ${data.learnerId}`);

    // Login New Users
    await login('instructor', USERS.instructor);
    await login('learner', USERS.learner);


    // --- PHASE 2: COURSE MANAGEMENT (Instructor) ---
    console.log('\n📚 PHASE 2: Course Management');

    // Create Course
    const cRes = await req('instructor', 'POST', '/api/courses', {
        title: "E2E Master Course",
        code: `E2E-C-${TIMESTAMP}`,
        description: "Full system test course",
        status: "published",
        isActive: true,
        price: 0
    });
    if (!cRes.ok) { console.error('❌ Create Course failed', cRes.data); } 
    else {
        data.courseId = cRes.data.id;
        console.log(`✅ Course Created: ${data.courseId}`);
    }

    // Create Assignment
    const aRes = await req('instructor', 'POST', '/api/assignments', {
        title: "E2E Assignment",
        description: "Test assignment",
        courseId: data.courseId,
        dueAt: new Date(Date.now() + 86400000).toISOString()
    });
    if (aRes.ok) {
        data.assignmentId = aRes.data.id;
        console.log(`✅ Assignment Created: ${data.assignmentId}`);
    } else {
        console.error('❌ Create Assignment failed', aRes.data);
    }


    // --- PHASE 3: LEARNING PATHS (Admin) ---
    console.log('\nPathway PHASE 3: Learning Paths');

    // Create Learning Path
    const lpRes = await req('admin', 'POST', '/api/learning-paths', {
        name: "E2E Full Stack Path",
        description: "Master the system",
        status: "active",
        isActive: true
    });
    
    if (lpRes.ok) {
        data.pathId = lpRes.data.id;
        console.log(`✅ Learning Path Created: ${data.pathId}`);

        // Add Section
        const sectRes = await req('admin', 'POST', `/api/learning-paths/${data.pathId}/sections`, {
            name: "Core Modules",
            order: 1
        });
        
        if (sectRes.ok) {
            data.sectionId = sectRes.data.id;
            console.log(`✅ Section Created: ${data.sectionId}`);

            // Add Course to Path
            const addCRes = await req('admin', 'POST', `/api/learning-paths/${data.pathId}/courses`, {
                courseId: data.courseId,
                sectionId: data.sectionId,
                order: 1
            });
            if (addCRes.ok) console.log('✅ Course added to Learning Path');
            else console.error('❌ Add Course to Path failed', addCRes.data);
        }
    } else {
        console.error('❌ Create Learning Path failed', lpRes.data);
    }


    // --- PHASE 4: ENROLLMENT & ACCESS (Learner) ---
    console.log('\n🎓 PHASE 4: Learner Experience');

    // Enroll in Course (Direct)
    const enrollC = await req('learner', 'POST', '/api/enrollments', {
        courseId: data.courseId,
        userId: data.learnerId
    });
    if (enrollC.ok) console.log('✅ Enrolled in Course');
    else console.error('❌ Course Enrollment failed', enrollC.data);

    // Enroll in Learning Path (via Admin usually, or self if public)
    // Let's test Admin enrolling Learner to Path
    if (data.pathId) {
        const enrollP = await req('admin', 'POST', `/api/learning-paths/${data.pathId}/enrollments`, {
            userIds: [data.learnerId],
            role: 'LEARNER'
        });
        if (enrollP.ok) console.log('✅ Enrolled in Learning Path (Admin action)');
        else console.error('❌ Path Enrollment failed', enrollP.data);
    }

    // Verify Dashboard
    const myEnrollments = await req('learner', 'GET', '/api/enrollments');
    const hasCourse = myEnrollments.data.data?.find(e => e.courseId === data.courseId);
    if (hasCourse) console.log('✅ Course visible in Dashboard');
    else console.error('❌ Course missing from Dashboard');


    // --- PHASE 5: CLEANUP ---
    console.log('\n🧹 PHASE 5: Cleanup');

    // Delete Users (Cascades? Usually not fully, but good practice)
    await req('admin', 'DELETE', `/api/users/${data.instructorId}`);
    await req('admin', 'DELETE', `/api/users/${data.learnerId}`);
    
    // Bulk Delete Content
    if (data.courseId) {
        await fetch(`${API_URL}/api/courses`, {
            method: 'DELETE',
            headers: { 'Cookie': cookies.admin, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [data.courseId] })
        });
        console.log('✅ Course Deleted');
    }

    if (data.pathId) {
        await req('admin', 'DELETE', `/api/learning-paths/${data.pathId}`);
        console.log('✅ Learning Path Deleted');
    }

    console.log('\n✨ FULL E2E TEST COMPLETED');
}

runFullE2E();
