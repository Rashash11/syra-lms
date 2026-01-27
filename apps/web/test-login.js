async function testLogin() {
    try {
        const res = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin-a@test.local',
                password: 'TestPass123!'
            })
        });
        
        console.log('Status:', res.status);
        console.log('Set-Cookie:', res.headers.get('set-cookie'));
        
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error(e);
    }
}

testLogin();
