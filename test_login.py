import httpx

# Test with correct test credentials
with httpx.Client(base_url="http://localhost:8001") as client:
    res = client.post("/api/auth/login", json={
        "email": "admin-a@test.local",
        "password": "TestPass123!"
    })
    print(f"Direct Backend - Status: {res.status_code}")
    print(f"Direct Backend - Body: {res.text[:500]}")

# Test through Next.js proxy
with httpx.Client(base_url="http://localhost:3000") as client:
    res = client.post("/api/auth/login", json={
        "email": "admin-a@test.local",
        "password": "TestPass123!"
    })
    print(f"\nVia Next.js - Status: {res.status_code}")
    print(f"Via Next.js - Body: {res.text[:500]}")
