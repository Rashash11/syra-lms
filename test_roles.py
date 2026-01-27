import json
import httpx

with open('tests/e2e/storage/admin.json', 'r') as f:
    state = json.load(f)

cookies = {c['name']: c['value'] for c in state['cookies']}

with httpx.Client(base_url="http://localhost:3000", cookies=cookies) as client:
    res = client.get("/api/admin/roles")
    print(f"Status: {res.status_code}")
    print(f"Body: {res.text[:500]}")
