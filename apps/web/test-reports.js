async function testReports() {
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
        console.log('Login successful, cookie:', setCookie);

        // 2. Fetch Reports Overview
        // Note: fetch in Node (or native fetch) handles cookies differently than browser.
        // We need to manually extract the session cookie and pass it in the Cookie header.
        // set-cookie string might be multiple cookies separated by comma or array.
        // For simplicity, we just pass the whole set-cookie string as Cookie header.
        
        const reportRes = await fetch('http://localhost:3000/api/reports/overview', {
            headers: {
                'Cookie': setCookie
            }
        });

        console.log('Reports Status:', reportRes.status);
        const text = await reportRes.text();
        console.log('Reports Response:', text.substring(0, 500)); // Print first 500 chars

    } catch (e) {
        console.error(e);
    }
}

testReports();
