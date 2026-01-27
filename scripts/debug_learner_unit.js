
const fetch = require('node-fetch');

async function testLearnerUnit() {
    const API_URL = 'http://localhost:8001';
    console.log('Logging in as Learner (learner-a@test.local)...');
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'learner-a@test.local', password: 'TestPass123!' })
        });
        
        console.log(`Login Status: ${res.status}`);
        if (!res.ok) {
            console.log(await res.text());
            return;
        }
        const cookie = res.headers.get('set-cookie');

        // Course A ID and Unit Video ID from fixtures (verified in debug_fixtures.ts)
        const courseId = 'de192b65-4a23-45ad-bf21-39d423818994';
        const unitId = '7bcbc4b6-9097-4a3b-bc69-9189aa2184c6';

        console.log(`Fetching Unit: /api/courses/${courseId}/units/${unitId}`);
        const unitRes = await fetch(`${API_URL}/api/courses/${courseId}/units/${unitId}`, {
            headers: { 'Cookie': cookie }
        });
        console.log(`Unit Status: ${unitRes.status}`);
        if (!unitRes.ok) {
            console.log('Error Body:', await unitRes.text());
        } else {
            const unitData = await unitRes.json();
            console.log('Unit Data:', JSON.stringify(unitData, null, 2));
        }

        // Test Instructor Calendar/Conferences (need instructor login)
    } catch (e) {
        console.error('Request Failed:', e);
    }
}

async function testInstructorRoutes() {
    const API_URL = 'http://localhost:8001';
    console.log('\nLogging in as Instructor (instructor-a@test.local)...');
    try {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'instructor-a@test.local', password: 'TestPass123!' })
        });
        
        const cookie = res.headers.get('set-cookie');

        console.log('Fetching Calendar Events: /api/calendar-events?start=2024-01-01&end=2025-01-01');
        const calRes = await fetch(`${API_URL}/api/calendar-events?start=2024-01-01T00:00:00Z&end=2025-01-01T00:00:00Z`, {
            headers: { 'Cookie': cookie }
        });
        console.log(`Calendar Status: ${calRes.status}`);

        console.log('Fetching Conferences: /api/conferences');
        const confRes = await fetch(`${API_URL}/api/conferences`, {
            headers: { 'Cookie': cookie }
        });
        console.log(`Conferences Status: ${confRes.status}`);

    } catch (e) {
        console.error('Request Failed:', e);
    }
}

(async () => {
    await testLearnerUnit();
    await testInstructorRoutes();
})();
