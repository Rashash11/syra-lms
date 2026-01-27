import json
import os
import sys

import requests  # type: ignore

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8001"


def test_health():
    print("=== Testing /api/health via Frontend ===")
    try:
        resp = requests.get(f"{FRONTEND_URL}/api/health", timeout=5)
        print(f"Status: {resp.status_code}")
        x_backend = resp.headers.get("x-backend")
        print(f"x-backend: {x_backend}")

        if resp.status_code == 200 and x_backend == "fastapi":
            print("PASS: Health check proxied to FastAPI")
        else:
            print("FAIL: Health check failed or not proxied")
            print(f"Response headers: {resp.headers}")
    except Exception as e:
        print(f"FAIL: Request failed: {e}")


def test_login():
    print("\n=== Testing /api/auth/login ===")
    creds = {"email": "admin-a@test.local", "password": "TestPass123!"}
    try:
        resp = requests.post(f"{FRONTEND_URL}/api/auth/login", json=creds, timeout=5)
        print(f"Status: {resp.status_code}")

        if resp.status_code == 200:
            print("PASS: Login successful")
            cookies = resp.cookies
            print(f"Cookies received: {cookies.get_dict()}")

            # Check /api/auth/me
            print("\n=== Testing /api/auth/me ===")
            resp_me = requests.get(
                f"{FRONTEND_URL}/api/auth/me", cookies=cookies, timeout=5
            )
            print(f"Status: {resp_me.status_code}")

            x_user_id = resp_me.headers.get("x-user-id")
            print(f"x-user-id: {x_user_id}")

            if resp_me.status_code == 200:
                data = resp_me.json()
                print(f"User: {data.get('email')}")
                if x_user_id:
                    print("PASS: /api/auth/me successful and authenticated")
                else:
                    print("WARN: /api/auth/me successful but x-user-id missing")
            else:
                print("FAIL: /api/auth/me failed")
                print(f"Response: {resp_me.text}")

            # Check /api/auth/permissions
            print("\n=== Testing /api/auth/permissions ===")
            resp_perms = requests.get(
                f"{FRONTEND_URL}/api/auth/permissions", cookies=cookies, timeout=5
            )
            print(f"Status: {resp_perms.status_code}")
            if resp_perms.status_code == 200:
                perms_data = resp_perms.json()
                perms = perms_data.get("permissions", [])
                print(f"Permissions count: {len(perms)}")
                if "groups:read" in perms:
                    print("PASS: 'groups:read' permission found")
                else:
                    print("FAIL: 'groups:read' permission MISSING")
                    print(f"Permissions: {perms}")
            else:
                print(f"FAIL: /api/auth/permissions failed: {resp_perms.text}")

            # Check debug context
            print("\n=== Testing /api/_debug/context ===")
            resp_dbg = requests.get(
                f"{BACKEND_URL}/api/_debug/context", cookies=cookies, timeout=5
            )
            print(f"Status: {resp_dbg.status_code}")
            if resp_dbg.status_code == 200:
                print(f"Debug Context: {json.dumps(resp_dbg.json(), indent=2)}")
            else:
                print("FAIL: Debug context failed")

            # Check /api/users
            print("\n=== Testing /api/users ===")
            resp_users = requests.get(
                f"{FRONTEND_URL}/api/users", cookies=cookies, timeout=5
            )
            print(f"Status: {resp_users.status_code}")
            if resp_users.status_code == 200:
                users = resp_users.json()
                data = users.get("data", users)
                print(f"Users count: {len(data)}")
                if len(data) > 0:
                    print("PASS: Users list retrieved")
                else:
                    print("WARN: Users list is empty")
            else:
                print(f"FAIL: /api/users failed: {resp_users.text}")

            # Check /api/groups
            print("\n=== Testing /api/groups ===")
            resp_groups = requests.get(
                f"{FRONTEND_URL}/api/groups", cookies=cookies, timeout=5
            )
            print(f"Status: {resp_groups.status_code}")
            if resp_groups.status_code == 200:
                groups = resp_groups.json()
                data = groups.get("data", groups)
                print(f"Groups count: {len(data)}")
                print("PASS: Groups list retrieved")
            else:
                print(f"FAIL: /api/groups failed: {resp_groups.text}")

        else:
            print("FAIL: Login failed")
            print(f"Response: {resp.text}")
    except Exception as e:
        print(f"FAIL: Login request failed: {e}")


if __name__ == "__main__":
    # Check if requests is installed
    try:
        import requests
    except ImportError:
        print("requests module not found. Please run 'pip install requests'")
        sys.exit(1)

    test_health()
    test_login()
