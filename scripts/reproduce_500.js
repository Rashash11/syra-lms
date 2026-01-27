import fetch from 'node-fetch';

async function testCreateUser() {
    const payload = {
        firstName: "Test",
        lastName: "User",
        email: "test.user.rbac@example.com",
        username: "testuser_rbac_" + Date.now(),
        password: "Password123!",
        status: "ACTIVE",
        roleIds: ["dc47626c-ffd3-4345-94e0-e523b8dae3c2"], // ADMIN role ID from check_enum_values.py
        nodeId: null,
        grantIds: [],
        denyIds: [],
        activeRole: "ADMIN",
        excludeFromEmails: false,
        bio: "Test bio",
        timezone: "UTC",
        language: "en"
    };

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    try {
        const res = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We'll skip CSRF for direct API call if we can, or we need to get a session
            },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

testCreateUser();
