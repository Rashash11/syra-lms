
const fetch = require('node-fetch');

const API_URL = 'http://localhost:8001';

// Test Data Config
const TIMESTAMP = Date.now();
const TENANT_ID = '62143487-327a-4280-96a4-f21911acae95';

const USERS = {
    admin: { email: 'admin-journey@test.local', password: 'TestPass123!' },
    instructor: { 
        email: `inst-master-${TIMESTAMP}@example.com`, 
        password: 'TestPass123!',
        firstName: 'Master',
        lastName: 'Instructor'
    },
    learner: { 
        email: `learn-master-${TIMESTAMP}@example.com`, 
        password: 'TestPass123!',
        firstName: 'Master',
        lastName: 'Learner'
    }
};

const DATA = {
    instructorId: null,
    learnerId: null,
    courseId: null,
    assignmentId: null,
    pathId: null
};

const COOKIES = {
    admin: null,
    instructor: null,
    learner: null
};

// Utils
async function login(role, user) {
    console.log(`\n🔑 Logging in as ${role} (${user.email})...`);
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password })
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

async function req(role, method, path, body = null, expectedStatus = 200) {
    const cookie = COOKIES[role.toLowerCase()];
    if (!cookie) {
        console.error(`❌ No cookie for ${role}`);
        return null;
    }

    try {
        const options = {
            method,
            headers: { 
                'Cookie': cookie,
                'Content-Type': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);

        console.log(`[${role}] ${method} ${path}`);
        const res = await fetch(`${API_URL}${path}`, options);
        
        let data = null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await res.json();
        } else {
            const text = await res.text();
            try { data = JSON.parse(text); } catch(e) { data = text; }
        }

        if (res.status !== expectedStatus) {
            console.error(`❌ Expected ${expectedStatus}, got ${res.status}`);
            console.error('Response:', JSON.stringify(data, null, 2));
            return null;
        }
        
        return data;
    } catch (e) {
        console.error(`❌ Request error: ${e.message}`);
        return null;
    }
}

async function runMasterSuite() {
    console.log('🚀 STARTING MASTER TEST SUITE');
    console.log('==================================================');

    // 1. SETUP: Admin Login
    COOKIES.admin = await login('Admin', USERS.admin);
    if (!COOKIES.admin) process.exit(1);

    // 2. USER MANAGEMENT (Admin creates users)
    console.log('\n👤 PHASE 1: User Provisioning');
    
    // Create Instructor
    const instRes = await req('Admin', 'POST', '/api/users', {
        email: USERS.instructor.email,
        firstName: USERS.instructor.firstName,
        lastName: USERS.instructor.lastName,
        role: "INSTRUCTOR",
        password: USERS.instructor.password,
        status: "ACTIVE"
    });
    if (instRes) {
        DATA.instructorId = instRes.id || instRes.userId;
        console.log(`✅ Instructor Created: ${DATA.instructorId}`);
    } else process.exit(1);

    // Create Learner
    const learnRes = await req('Admin', 'POST', '/api/users', {
        email: USERS.learner.email,
        firstName: USERS.learner.firstName,
        lastName: USERS.learner.lastName,
        role: "LEARNER",
        password: USERS.learner.password,
        status: "ACTIVE"
    });
    if (learnRes) {
        DATA.learnerId = learnRes.id || learnRes.userId;
        console.log(`✅ Learner Created: ${DATA.learnerId}`);
    } else process.exit(1);

    // 3. LOGINS
    console.log('\n🔑 PHASE 2: Verify New User Logins');
    COOKIES.instructor = await login('Instructor', USERS.instructor);
    COOKIES.learner = await login('Learner', USERS.learner);
    
    if (!COOKIES.instructor || !COOKIES.learner) {
        console.error('❌ Failed to log in new users');
        process.exit(1);
    }

    // 4. CONTENT CREATION (Instructor)
    console.log('\n📚 PHASE 3: Instructor Content Creation');
    
    // Note: Instructors usually can create courses, or Admin creates and assigns. 
    // Let's try Instructor creating a course directly.
    const courseRes = await req('Instructor', 'POST', '/api/courses', {
        title: "Master Suite Course",
        code: `MST-${TIMESTAMP}`,
        description: "A course for full system testing",
        status: "published", // Publish immediately for learner visibility
        isActive: true, // Ensure active for catalog
        hiddenFromCatalog: false,
        price: 0
    });
    
    if (courseRes) {
        DATA.courseId = courseRes.id;
        console.log(`✅ Course Created: ${DATA.courseId}`);
    } else {
        console.log('⚠️ Instructor cannot create course, trying Admin...');
        const adminCourseRes = await req('Admin', 'POST', '/api/courses', {
            title: "Master Suite Course (Admin)",
            code: `MST-${TIMESTAMP}`,
            description: "Created by Admin for Instructor",
            status: "published",
            instructorId: DATA.instructorId
        });
        if (adminCourseRes) {
            DATA.courseId = adminCourseRes.id;
            console.log(`✅ Course Created by Admin: ${DATA.courseId}`);
        } else process.exit(1);
    }

    // Create Assignment (Instructor)
    if (DATA.courseId) {
        const assignRes = await req('Instructor', 'POST', '/api/assignments', {
            title: "Master Test Assignment",
            description: "Complete this",
            courseId: DATA.courseId,
            dueAt: new Date(Date.now() + 86400000).toISOString()
        });
        if (assignRes) {
            DATA.assignmentId = assignRes.id;
            console.log(`✅ Assignment Created: ${DATA.assignmentId}`);
        }
    }

    // 5. LEARNER JOURNEY
    console.log('\n🎓 PHASE 4: Learner Journey');
    
    // Browse Catalog
    const catalog = await req('Learner', 'GET', '/api/courses/catalog');
    if (catalog && (catalog.data || catalog.items).find(c => c.id === DATA.courseId)) {
        console.log('✅ Course visible in catalog');
    } else {
        console.error('❌ Course NOT found in catalog');
    }

    // Enroll
    const enrollRes = await req('Learner', 'POST', '/api/enrollments', {
        courseId: DATA.courseId,
        userId: DATA.learnerId // REQUIRED by backend
    });
    if (enrollRes) {
        console.log('✅ Enrolled successfully');
    }

    // Check My Enrollments
    const myEnrollments = await req('Learner', 'GET', '/api/enrollments');
    if (myEnrollments && (myEnrollments.data || myEnrollments.items).find(e => e.courseId === DATA.courseId)) {
        console.log('✅ Enrollment confirmed in list');
    }

    // Check Assignments
    const myAssignments = await req('Learner', 'GET', `/api/assignments?courseId=${DATA.courseId}`);
    if (myAssignments && (myAssignments.data || myAssignments.items).length > 0) {
        console.log('✅ Learner sees assignments');
    }

    // 6. ADMIN VERIFICATION
    console.log('\n🛡️ PHASE 5: Admin Verification');
    
    // Check User List
    const userList = await req('Admin', 'GET', `/api/users?search=${USERS.learner.email}`);
    if (userList && userList.users.length > 0) {
        console.log('✅ Admin sees new learner');
    }

    // 7. CLEANUP
    console.log('\n🧹 PHASE 6: Cleanup');
    
    // Delete Course (should cascade enrollments/assignments usually, but we'll see)
    if (DATA.courseId) {
        // Delete assignment first if cascading is not set up
        if (DATA.assignmentId) {
            await req('Admin', 'DELETE', `/api/assignments/${DATA.assignmentId}`);
        }
        
        // Delete enrollments? We don't have enrollment ID easily here unless we saved it.
        // But let's try bulk delete course which usually forces things or we expect cascade.
        // If 409, we know why.
        
        await fetch(`${API_URL}/api/courses`, {
            method: 'DELETE',
            headers: { 
                'Cookie': COOKIES.admin, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ ids: [DATA.courseId] })
        }).then(async r => {
             console.log(`Course Delete Status: ${r.status}`);
             if (r.status !== 200) {
                 const t = await r.text();
                 console.log('Delete Error:', t);
             }
        });
    }

    // Delete Users
    if (DATA.instructorId) await req('Admin', 'DELETE', `/api/users/${DATA.instructorId}`);
    if (DATA.learnerId) await req('Admin', 'DELETE', `/api/users/${DATA.learnerId}`);

    console.log('\n✅ MASTER TEST SUITE COMPLETED');
}

runMasterSuite();
