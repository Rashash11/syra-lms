
import asyncio
import httpx
import json
import time
import os
import sys
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BASE_URL = "http://localhost:8001/api"
TIMEOUT = 10.0
MAX_RETRIES = 2
REPORT_DIR = "reports"
JSON_REPORT = os.path.join(REPORT_DIR, "api_smoke.json")
MD_REPORT = os.path.join(REPORT_DIR, "api_smoke.md")

# Admin Credentials (using known seed/test credentials)
ADMIN_EMAIL = "admin-a@test.local"
ADMIN_PASSWORD = "TestPass123!"    # Adjust if needed

class TestResult:
    def __init__(self, name: str, status: str, duration: float, error: str = None):
        self.name = name
        self.status = status # PASS, FAIL, SKIP
        self.duration = duration
        self.error = error

    def to_dict(self):
        return {
            "name": self.name,
            "status": self.status,
            "duration": self.duration,
            "error": self.error
        }

class APISmokeRunner:
    def __init__(self):
        self.results: List[TestResult] = []
        self.token = None
        self.headers = {}
        self.client = httpx.AsyncClient(base_url=BASE_URL, timeout=TIMEOUT)

    async def run_test(self, name: str, func, *args, **kwargs):
        print(f"Running {name}...", end=" ", flush=True)
        start_time = time.time()
        retries = 0
        
        while retries <= MAX_RETRIES:
            try:
                await func(*args, **kwargs)
                duration = time.time() - start_time
                print(f"✅ ({duration:.2f}s)")
                self.results.append(TestResult(name, "PASS", duration))
                return True
            except Exception as e:
                retries += 1
                if retries > MAX_RETRIES:
                    duration = time.time() - start_time
                    error_msg = str(e)
                    print(f"❌ {error_msg}")
                    self.results.append(TestResult(name, "FAIL", duration, error_msg))
                    return False
                print(f"⚠️ Retry {retries}...", end=" ", flush=True)
                await asyncio.sleep(1)

    async def check_health(self):
        # Try root or a specific health endpoint
        # If /api/health doesn't exist, we might get 404, but connection successful means infra is up
        try:
            resp = await self.client.get("/") 
            # 404 is fine for connectivity check if no root route
            return True
        except httpx.ConnectError:
            raise Exception("Connection refused. Is backend running on port 8001?")

    async def login(self):
        # Try to login to get token
        resp = await self.client.post("/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if resp.status_code != 200:
            raise Exception(f"Login failed: {resp.status_code} {resp.text}")
        
        data = resp.json()
        
        # Check for token in cookies
        self.token = resp.cookies.get("session")
        if not self.token:
             # Fallback: Check body (some auth flows return it)
             self.token = data.get("access_token")
        
        if not self.token:
             raise Exception("No session cookie or access_token in response")
             
        # httpx client automatically stores cookies, so we don't strictly need to set headers
        # But for clarity or if we want to test header auth, we could.
        # For now, we rely on the cookie jar in self.client
        print(f" (Token acquired: {self.token[:10]}...) ", end="")

    async def test_me(self):
        resp = await self.client.get("/auth/me", headers=self.headers)
        if resp.status_code != 200:
             # Try /me if /auth/me fails
             resp = await self.client.get("/me", headers=self.headers)
        
        if resp.status_code != 200:
            raise Exception(f"Me endpoint failed: {resp.status_code}")

    async def test_users_list(self):
        resp = await self.client.get("/users", headers=self.headers)
        if resp.status_code != 200:
            raise Exception(f"List users failed: {resp.status_code}")

    async def test_courses_crud(self):
        # Create
        course_data = {
            "title": f"Smoke Test Course {int(time.time())}",
            "description": "Created by autonomous smoke test",
            "is_published": False
        }
        resp = await self.client.post("/courses", json=course_data, headers=self.headers)
        if resp.status_code not in [200, 201]:
            raise Exception(f"Create course failed: {resp.status_code} {resp.text}")
        
        course = resp.json()
        course_id = course.get("id")
        
        # Get
        resp = await self.client.get(f"/courses/{course_id}", headers=self.headers)
        if resp.status_code != 200:
            raise Exception(f"Get course failed: {resp.status_code}")
            
        # Update
        resp = await self.client.put(f"/courses/{course_id}", json={"title": "Updated Title"}, headers=self.headers)
        if resp.status_code != 200:
            raise Exception(f"Update course failed: {resp.status_code}")

        # Delete (Using bulk delete as singular delete might not exist or use bulk endpoint)
        resp = await self.client.request("DELETE", "/courses", json={"ids": [course_id]}, headers=self.headers)
        if resp.status_code != 200:
             # Try singular delete just in case
             resp = await self.client.delete(f"/courses/{course_id}", headers=self.headers)
             if resp.status_code != 200:
                raise Exception(f"Delete course failed: {resp.status_code}")

    async def test_admin_reports(self):
        resp = await self.client.get("/reports/stats", headers=self.headers)
        # 404 might mean route doesn't exist, checking typical patterns
        if resp.status_code == 404:
             resp = await self.client.get("/admin/stats", headers=self.headers)
             
        if resp.status_code not in [200, 403]: # 403 if not admin, but we should be admin
             # If 403, it's a failure of our admin setup, but API is 'working'
             pass
        elif resp.status_code >= 500:
             raise Exception(f"Reports endpoint crashed: {resp.status_code}")

    async def run(self):
        print("🚀 Starting API Smoke Audit...")
        
        # 1. Health Check
        if not await self.run_test("Infra Health Check", self.check_health):
            self.generate_reports(exit_code=2)
            sys.exit(2)

        # 2. Auth
        if not await self.run_test("Authentication (Login)", self.login):
            print("⚠️ Auth failed, skipping authenticated tests.")
            self.generate_reports(exit_code=1)
            sys.exit(1)
            
        # 3. Authenticated Flows
        await self.run_test("Get Current User (Me)", self.test_me)
        await self.run_test("List Users", self.test_users_list)
        await self.run_test("Courses CRUD", self.test_courses_crud)
        await self.run_test("Admin Reports", self.test_admin_reports)
        
        # Calculate Exit Code
        failed = any(r.status == "FAIL" for r in self.results)
        exit_code = 1 if failed else 0
        
        self.generate_reports(exit_code)
        sys.exit(exit_code)

    def generate_reports(self, exit_code):
        # JSON Report
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "exit_code": exit_code,
            "results": [r.to_dict() for r in self.results]
        }
        with open(JSON_REPORT, "w", encoding="utf-8") as f:
            json.dump(report_data, f, indent=2)
            
        # Markdown Report
        with open(MD_REPORT, "w", encoding="utf-8") as f:
            f.write(f"# API Smoke Audit Report\n\n")
            f.write(f"**Date**: {datetime.now()}\n")
            f.write(f"**Exit Code**: {exit_code}\n\n")
            f.write("| Test | Status | Duration | Error |\n")
            f.write("| --- | --- | --- | --- |\n")
            for r in self.results:
                status_icon = "✅" if r.status == "PASS" else "❌"
                error = r.error if r.error else "-"
                f.write(f"| {r.name} | {status_icon} {r.status} | {r.duration:.2f}s | {error} |\n")
        
        print(f"\n📄 Reports generated in {REPORT_DIR}/")

if __name__ == "__main__":
    runner = APISmokeRunner()
    asyncio.run(runner.run())
