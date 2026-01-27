import requests
import json

url = "http://localhost:8001/api/auth/login"
payload = {
    "email": "admin-a@test.local",
    "password": "TestPass123!"
}

try:
    response = requests.post(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Cookies: {response.cookies.get_dict()}")
except Exception as e:
    print(f"Error: {e}")
