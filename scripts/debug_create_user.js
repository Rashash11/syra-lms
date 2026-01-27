import fetch from 'node-fetch';

async function test() {
    // 1. Login to get session
    console.log("Logging in...");
    const loginRes = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@portal.com', password: 'Admin123!' })
    });

    if (!loginRes.ok) {
        console.error("Login failed", await loginRes.text());
        return;
    }

    const cookies = loginRes.headers.get('set-cookie');
    console.log("Login success, cookies obtained");

    // 2. Create User
    const payload = {
        firstName: "Debug",
        lastName: "User",
        email: "debug.user." + Date.now() + "@example.com",
        username: "debuguser_" + Date.now(),
        password: "Password123!",
        status: "ACTIVE",
        roleIds: ["dc47626c-ffd3-4345-94e0-e523b8dae3c2", "0ad7b799-a04d-4e87-984e-ea534ed3d68c"],
        grantIds: ["4f7f6a70-7634-4a18-9366-0d6741162443"], // user:read ID
        denyIds: [],
        activeRole: "ADMIN",
        excludeFromEmails: false,
        bio: "Test bio",
        timezone: "UTC",
        language: "en"
    };

    console.log("Creating user...");
    const res = await fetch('http://localhost:8001/api/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
        },
        body: JSON.stringify(payload)
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
}

test();
