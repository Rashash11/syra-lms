import asyncio
import logging
import os
import sys
from datetime import datetime, timedelta
from uuid import uuid4

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth.password import hash_password
from app.db.hooks import tenant_context
from app.db.models import (
    Branch,
    Category,
    Course,
    CourseSection,
    CourseStatus,
    CourseUnit,
    Enrollment,
    EnrollmentStatus,
    LearningPath,
    LearningPathCourse,
    RoleKey,
    Tenant,
    UnitStatus,
    UnitType,
    User,
    UserStatus,
    UserType,
)
from app.db.session import async_session_factory
from sqlalchemy import delete, select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TARGET_TENANT_ID = "62143487-327a-4280-96a4-f21911acae95"
PASSWORD = "TestPass123!"


async def seed_journeys():
    logger.info(f"Starting journey seed for Tenant: {TARGET_TENANT_ID}")

    # Set Tenant Context for RLS/Hooks
    token = tenant_context.set(TARGET_TENANT_ID)

    try:
        async with async_session_factory() as db:
            # 1. Verify Tenant Exists
            tenant = await db.get(Tenant, TARGET_TENANT_ID)
            if not tenant:
                logger.error("Tenant not found! Creating default...")
                tenant = Tenant(
                    id=TARGET_TENANT_ID, name="Journey Test Tenant", domain="test.local"
                )
                db.add(tenant)
                await db.commit()

            # 2. Ensure Dependencies (Category, UserType, Branch)
            # UserType
            result = await db.execute(select(UserType).limit(1))
            user_type = result.scalar_one_or_none()
            if not user_type:
                user_type = UserType(name="Default", permissions={})
                db.add(user_type)
                await db.commit()
                await db.refresh(user_type)

            # Branch
            result = await db.execute(select(Branch).limit(1))
            branch = result.scalar_one_or_none()
            if not branch:
                branch = Branch(
                    tenant_id=TARGET_TENANT_ID,
                    name="Main Branch",
                    slug="main",
                    default_user_type_id=user_type.id,
                )
                db.add(branch)
                await db.commit()
                await db.refresh(branch)

            # Category
            result = await db.execute(
                select(Category).where(Category.name == "Journey Category")
            )
            category = result.scalar_one_or_none()
            if not category:
                category = Category(
                    tenant_id=TARGET_TENANT_ID,
                    name="Journey Category",
                    description="For testing journeys",
                )
                db.add(category)
                await db.commit()
                await db.refresh(category)

            # 3. Create Users
            users_data = [
                {
                    "email": "admin-journey@test.local",
                    "role": RoleKey.ADMIN,
                    "first": "Admin",
                    "last": "Journey",
                },
                {
                    "email": "instructor-journey@test.local",
                    "role": RoleKey.INSTRUCTOR,
                    "first": "Instructor",
                    "last": "Journey",
                },
                {
                    "email": "super-instructor-journey@test.local",
                    "role": RoleKey.SUPER_INSTRUCTOR,
                    "first": "Super",
                    "last": "Journey",
                },
                {
                    "email": "learner-journey@test.local",
                    "role": RoleKey.LEARNER,
                    "first": "Learner",
                    "last": "Journey",
                },
            ]

            created_users = {}

            for u_data in users_data:
                result = await db.execute(
                    select(User).where(User.email == u_data["email"])
                )
                user = result.scalar_one_or_none()

                if not user:
                    user = User(
                        tenant_id=TARGET_TENANT_ID,
                        email=u_data["email"],
                        username=u_data["email"].split("@")[0],
                        first_name=u_data["first"],
                        last_name=u_data["last"],
                        password_hash=hash_password(PASSWORD),
                        role=u_data["role"],
                        active_role=u_data["role"],
                        status=UserStatus.ACTIVE,
                        is_active=True,
                        is_verified=True,
                        node_id=branch.id,
                    )
                    db.add(user)
                    await db.commit()
                    await db.refresh(user)
                    logger.info(f"Created user: {u_data['email']}")
                else:
                    # Update role just in case
                    user.role = u_data["role"]
                    user.active_role = u_data["role"]
                    user.password_hash = hash_password(
                        PASSWORD
                    )  # Reset password to known value
                    db.add(user)
                    await db.commit()
                    logger.info(f"Updated user: {u_data['email']}")

                created_users[u_data["role"]] = user

            instructor = created_users[RoleKey.INSTRUCTOR]
            learner = created_users[RoleKey.LEARNER]

            # 4. Create Content (Courses)
            # Course 1: Published (Instructor Journey)
            c1_code = "JOURNEY-101"
            result = await db.execute(select(Course).where(Course.code == c1_code))
            course1 = result.scalar_one_or_none()

            if not course1:
                course1 = Course(
                    tenant_id=TARGET_TENANT_ID,
                    title="Introduction to Journeys",
                    code=c1_code,
                    description="A test course for the learner journey",
                    status=CourseStatus.PUBLISHED,
                    is_active=True,
                    instructor_id=instructor.id,
                    category_id=category.id,
                    price=0,
                )
                db.add(course1)
                await db.commit()
                await db.refresh(course1)

                # Add Section & Unit
                section = CourseSection(
                    tenant_id=TARGET_TENANT_ID,
                    course_id=course1.id,
                    title="Basics",
                    order_index=0,
                )
                db.add(section)
                await db.commit()
                await db.refresh(section)

                unit = CourseUnit(
                    tenant_id=TARGET_TENANT_ID,
                    course_id=course1.id,
                    section_id=section.id,
                    title="Welcome Unit",
                    type=UnitType.TEXT,
                    status=UnitStatus.PUBLISHED,
                    order_index=0,
                    config={
                        "content": "<h1>Welcome</h1><p>This is the start of your journey.</p>"
                    },
                )
                db.add(unit)
                await db.commit()
                logger.info("Created Published Course: Introduction to Journeys")
            else:
                logger.info("Found existing Course: Introduction to Journeys")

            # Course 2: Draft (Instructor Journey - should see drafts)
            c2_code = "JOURNEY-DRAFT"
            result = await db.execute(select(Course).where(Course.code == c2_code))
            course2 = result.scalar_one_or_none()

            if not course2:
                course2 = Course(
                    tenant_id=TARGET_TENANT_ID,
                    title="Draft Course Concept",
                    code=c2_code,
                    description="A draft course only visible to instructors",
                    status=CourseStatus.DRAFT,
                    is_active=False,
                    instructor_id=instructor.id,
                    category_id=category.id,
                )
                db.add(course2)
                await db.commit()
                logger.info("Created Draft Course: Draft Course Concept")

            # 5. Create Learning Path
            lp_name = "Full Stack Journey"
            result = await db.execute(
                select(LearningPath).where(LearningPath.name == lp_name)
            )
            lp = result.scalar_one_or_none()

            if not lp:
                lp = LearningPath(
                    tenant_id=TARGET_TENANT_ID,
                    name=lp_name,
                    description="A complete learning path",
                    status="published",
                    is_active=True,
                    instructor_id=instructor.id,
                )
                db.add(lp)
                await db.commit()
                await db.refresh(lp)

                # Add Course to Path
                lp_course = LearningPathCourse(
                    tenant_id=TARGET_TENANT_ID,
                    path_id=lp.id,
                    course_id=course1.id,
                    order=0,
                )
                db.add(lp_course)
                await db.commit()
                logger.info("Created Learning Path: Full Stack Journey")

            # 6. Create Enrollments (Learner Journey)
            # Enroll in Course 1
            result = await db.execute(
                select(Enrollment).where(
                    (Enrollment.user_id == learner.id)
                    & (Enrollment.course_id == course1.id)
                )
            )
            enrollment = result.scalar_one_or_none()

            if not enrollment:
                enrollment = Enrollment(
                    tenant_id=TARGET_TENANT_ID,
                    user_id=learner.id,
                    course_id=course1.id,
                    status=EnrollmentStatus.IN_PROGRESS,
                    progress=50,
                    enrolled_at=datetime.utcnow(),
                )
                db.add(enrollment)
                await db.commit()
                logger.info(f"Enrolled {learner.email} in {course1.title}")

    except Exception as e:
        logger.error(f"Seeding failed: {e}")
        import traceback

        traceback.print_exc()
    finally:
        tenant_context.reset(token)
        logger.info("Seeding completed.")


if __name__ == "__main__":
    asyncio.run(seed_journeys())
