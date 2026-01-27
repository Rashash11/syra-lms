import asyncio
import httpx
import json
import os
from dotenv import load_dotenv

async def diagnose():
    load_dotenv('.env.local')
    load_dotenv()
    
    base_url = "http://localhost:8001" # Direct to API
    
    # Read admin storage state
    with open('tests/e2e/storage/admin.json', 'r') as f:
        state = json.load(f)
    
    cookies = {c['name']: c['value'] for c in state['cookies']}
    
    async with httpx.AsyncClient(base_url=base_url, cookies=cookies) as client:
        # Try to create a branch
        print("Testing Branch Creation...")
        branch_data = {
            "name": "Diag Branch",
            "isActive": True
        }
        res = await client.post("/api/branches", json=branch_data)
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text}")
        
        # Try to create a notification (as admin via admin routes)
        print("\nTesting Notification Creation (Admin)...")
        # Note: /api/admin/notifications
        notif_data = {
            "name": "Diag Notif",
            "eventKey": "USER_CREATED",
            "messageSubject": "Diag Subject",
            "messageBody": "Diag Body",
            "recipientType": "ALL_USERS"
        }
        res = await client.post("/api/admin/notifications", json=notif_data)
        print(f"Status: {res.status_code}")
        print(f"Body: {res.text}")

if __name__ == "__main__":
    asyncio.run(diagnose())
