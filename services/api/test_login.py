
import asyncio
import httpx

async def test_login():
    url = "http://127.0.0.1:8001/api/auth/login"
    payload = {
        "email": "admin-a@test.local",
        "password": "TestPass123!"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response Body: {response.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())
