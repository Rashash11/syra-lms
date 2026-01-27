import asyncio
import json
import os
import sys
from datetime import datetime

# Setup path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
API_ROOT = os.path.dirname(CURRENT_DIR)
PROJECT_ROOT = os.path.dirname(os.path.dirname(API_ROOT))
if API_ROOT not in sys.path:
    sys.path.insert(0, API_ROOT)

from app.auth.password import hash_password
from app.db.models import (
    Assignment,
    AssignmentSubmission,
    Branch,
    Course,
    CourseStatus,
    CourseUnit,
    Enrollment,
    RoleKey,
    Tenant,
    User,
    UserStatus,
)
from app.db.session import async_session_factory
from sqlalchemy import delete, select


async def seed_e2e():
    seed_path = os.path.join(
        PROJECT_ROOT, "apps", "web", "tests", "e2e", "fixtures", "seed.json"
    )
    if not os.path.exists(seed_path):
        # Fallback path if running from different context
        seed_path = os.path.join(PROJECT_ROOT, "tests", "e2e", "fixtures", "seed.json")

    if not os.path.exists(seed_path):
        print(f"Seed file not found at {seed_path}")
        return

    with open(seed_path, "r") as f:
        data = json.load(f)

    print("Seeding data for E2E tests...")

    async with async_session_factory() as session:
        # 1. Tenants
        t_a = await session.get(Tenant, data["tenantAId"])
        if not t_a:
            session.add(
                Tenant(id=data["tenantAId"], name="Tenant A", domain="tenant-a.local")
            )

        t_b = await session.get(Tenant, data["tenantBId"])
        if not t_b:
            session.add(
                Tenant(id=data["tenantBId"], name="Tenant B", domain="tenant-b.local")
            )

        await session.commit()

        # 2. Nodes (Branches)
        # Node A (Tenant A)
        n_a = await session.get(Branch, data["nodeAId"])
        if not n_a:
            session.add(
                Branch(
                    id=data["nodeAId"],
                    tenant_id=data["tenantAId"],
                    name="Node A",
                    slug="node-a",
                )
            )

        # Node B (Tenant A)
        n_b = await session.get(Branch, data["nodeBId"])
        if not n_b:
            session.add(
                Branch(
                    id=data["nodeBId"],
                    tenant_id=data["tenantAId"],
                    name="Node B",
                    slug="node-b",
                )
            )

        # Node C (Tenant B)
        n_c = await session.get(Branch, data["nodeCId"])
        if not n_c:
            session.add(
                Branch(
                    id=data["nodeCId"],
                    tenant_id=data["tenantBId"],
                    name="Node C",
                    slug="node-c",
                )
            )

        await session.commit()

        # 3. Users
        pwd = hash_password(data["testPassword"])

        users_to_seed = [
            # Admin A (Tenant A)
            {
                "id": data["adminAId"],
                "email": data["adminAEmail"],
                "tenant_id": data["tenantAId"],
                "role": RoleKey.ADMIN,
                "node_id": None,
            },
            # Admin B (Tenant B)
            {
                "id": data["adminBId"],
                "email": data["adminBEmail"],
                "tenant_id": data["tenantBId"],
                "role": RoleKey.ADMIN,
                "node_id": None,
            },
            # Instructor A (Tenant A)
            {
                "id": data["instructorAId"],
                "email": data["instructorAEmail"],
                "tenant_id": data["tenantAId"],
                "role": RoleKey.INSTRUCTOR,
                "node_id": data["nodeAId"],
            },
            # Learner A (Tenant A, Node A)
            {
                "id": data["learnerAId"],
                "email": data["learnerAEmail"],
                "tenant_id": data["tenantAId"],
                "role": RoleKey.LEARNER,
                "node_id": data["nodeAId"],
            },
            # Learner B (Tenant A, Node B)
            {
                "id": data["learnerBId"],
                "email": data["learnerBEmail"],
                "tenant_id": data["tenantAId"],
                "role": RoleKey.LEARNER,
                "node_id": data["nodeBId"],
            },
            # Super Instructor A
            {
                "id": data["superInstructorAId"],
                "email": data["superInstructorAEmail"],
                "tenant_id": data["tenantAId"],
                "role": RoleKey.SUPER_INSTRUCTOR,
                "node_id": None,
            },
        ]

        for u_data in users_to_seed:
            u = await session.get(User, u_data["id"])
            if not u:
                session.add(
                    User(
                        id=u_data["id"],
                        email=u_data["email"],
                        username=u_data["email"].split("@")[0],
                        first_name=u_data["role"].value.capitalize(),
                        last_name="Test",
                        password_hash=pwd,
                        role=u_data["role"],
                        active_role=u_data["role"],
                        status=UserStatus.ACTIVE,
                        tenant_id=u_data["tenant_id"],
                        node_id=u_data["node_id"],
                        is_active=True,
                        is_verified=True,
                    )
                )
            else:
                # Update existing user to ensure correct state
                u.email = u_data["email"]
                u.role = u_data["role"]
                u.active_role = u_data["role"]
                u.tenant_id = u_data["tenant_id"]
                u.node_id = u_data["node_id"]
                u.password_hash = pwd

        await session.commit()

        # 4. Courses
        # Course A (Tenant A, Instructor A)
        c_a = await session.get(Course, data["courseAId"])
        if not c_a:
            session.add(
                Course(
                    id=data["courseAId"],
                    tenant_id=data["tenantAId"],
                    title="Test Course A",
                    code="COURSE-A",
                    instructor_id=data["instructorAId"],
                    status=CourseStatus.PUBLISHED,
                    is_active=True,
                )
            )

        # Course B (Tenant A, Instructor A) - Used for Node isolation test?
        # Wait, rbac-tenant.spec.ts says: "node isolation blocks cross-node course access"
        # learnerA is in Node A. courseBId is used.
        # learnerB is in Node B.
        # If Course B is in Tenant A, it needs to be restricted?
        # Usually courses are global to Tenant unless restricted?
        # But let's assume Course B is created by Instructor A (Node A) but maybe assigned to Node B?
        # Or maybe the test assumes Course B is just "another course".
        # Let's just create it in Tenant A.
        c_b = await session.get(Course, data["courseBId"])
        if not c_b:
            session.add(
                Course(
                    id=data["courseBId"],
                    tenant_id=data["tenantAId"],
                    title="Test Course B",
                    code="COURSE-B",
                    instructor_id=data["instructorAId"],
                    status=CourseStatus.PUBLISHED,
                    is_active=True,
                )
            )

        await session.commit()

        # 5. Enrollments
        # Learner B in Course B
        # The test expects Learner B to access Course B.
        # The test expects Learner A NOT to access Course B (Node isolation).
        # This implies Course B is somehow restricted to Node B or Learner A is restricted to Node A and cannot see Node B stuff?
        # If Course B is just a course, both should see it unless there is an enrollment requirement?
        # Let's verify if we need to enroll them.
        # "node isolation blocks cross-node course access"
        # If Learner A is in Node A, and Course B is... ?
        # Maybe Course B is linked to Node B? The Course model doesn't have node_id directly (it has category_id).
        # But maybe `instructed_courses`?
        # Let's just create the course. The test checks if they can SEE it.

        # We need an enrollment for Learner B in Course B for the test to succeed?
        # "await expect(pageB).toHaveURL(new RegExp(`/learner/courses/${seed.courseBId}/units/`));"
        # This implies Learner B is enrolled.

        e_b = await session.execute(
            select(Enrollment).where(
                Enrollment.user_id == data["learnerBId"],
                Enrollment.course_id == data["courseBId"],
            )
        )
        if not e_b.scalar_one_or_none():
            session.add(
                Enrollment(
                    id=str(
                        datetime.utcnow().timestamp()
                    ),  # Random ID or specific? seed.json has enrollment IDs but maybe not for this pair
                    tenant_id=data["tenantAId"],
                    user_id=data["learnerBId"],
                    course_id=data["courseBId"],
                    status="IN_PROGRESS",
                )
            )

        await session.commit()
        print("Seeding complete.")


if __name__ == "__main__":
    asyncio.run(seed_e2e())
