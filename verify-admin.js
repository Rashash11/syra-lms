
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function main() {
    // Read admin cookie
    const cookiePath = path.join('tests', 'e2e', 'storage', 'admin.json');
    if (!fs.existsSync(cookiePath)) {
        console.error('Admin cookie not found at', cookiePath);
        return;
    }
    const cookieData = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
    const sessionCookie = cookieData.cookies.find(c => c.name === 'session');
    
    if (!sessionCookie) {
        console.error('Session cookie not found in storage state');
        return;
    }

    const cookieHeader = `session=${sessionCookie.value}`;
    console.log('Using cookie:', cookieHeader.substring(0, 50) + '...');

    // Check /api/me
    console.log('\n--- Checking /api/me ---');
    try {
        const res = await fetch('http://localhost:3000/api/me', {
            headers: {
                'Cookie': cookieHeader
            }
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error fetching /api/me:', e.message);
    }

    // Check /api/auth/permissions
    console.log('\n--- Checking /api/auth/permissions ---');
    try {
        const res = await fetch('http://localhost:3000/api/auth/permissions', {
            headers: {
                'Cookie': cookieHeader
            }
        });
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Permissions count:', data.permissions ? data.permissions.length : 0);
        // console.log('Permissions:', data.permissions);
    } catch (e) {
        console.error('Error fetching permissions:', e.message);
    }

    // Check /api/users
    console.log('\n--- Checking /api/users ---');
    try {
        const res = await fetch('http://localhost:3000/api/users', {
            headers: {
                'Cookie': cookieHeader
            }
        });
        console.log('Status:', res.status);
        if (res.ok) {
            const data = await res.json();
            console.log('Users count:', data.users ? data.users.length : 0);
        } else {
            console.log('Error body:', await res.text());
        }
    } catch (e) {
        console.error('Error fetching /api/users:', e.message);
    }
}

main();
