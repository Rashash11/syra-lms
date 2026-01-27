import asyncio
import logging
import os
import sys
from datetime import datetime
from uuid import uuid4

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth.password import hash_password
from app.db.hooks import tenant_context
from app.db.models import (
    Assignment,
    AssignmentSubmission,
    Branch,
    Category,
    Course,
    CourseSection,
    CourseStatus,
    CourseUnit,
    Enrollment,
    EnrollmentStatus,
    RoleKey,
    Tenant,
    UnitStatus,
    UnitType,
    User,
    UserStatus,
    UserType,
)
from app.db.session import async_session_factory
from sqlalchemy import select

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

TARGET_TENANT_ID = "62143487-327a-4280-96a4-f21911acae95"
PASSWORD = "TestPass123!"


async def verify_grading_hub():
    logger.info(f"Starting Grading Hub verification for Tenant: {TARGET_TENANT_ID}")

    # Set Tenant Context for RLS/Hooks
    token = tenant_context.set(TARGET_TENANT_ID)

    try:
        async with async_session_factory() as db:
            # 1. Ensure Tenant
            tenant = await db.get(Tenant, TARGET_TENANT_ID)
            if not tenant:
                tenant = Tenant(
                    id=TARGET_TENANT_ID, name="Journey Test Tenant", domain="test.local"
                )
                db.add(tenant)
                await db.commit()

            # 2. Ensure Instructor
            email = "instructor-grading@test.local"
            result = await db.execute(select(User).where(User.email == email))
            instructor = result.scalar_one_or_none()
            if not instructor:
                instructor = User(
                    tenant_id=TARGET_TENANT_ID,
                    email=email,
                    username=email.split("@")[0],
                    first_name="Instructor",
                    last_name="Grading",
                    password_hash=hash_password(PASSWORD),
                    role=RoleKey.INSTRUCTOR,
                    status=UserStatus.ACTIVE,
                )
                db.add(instructor)
                await db.commit()
                await db.refresh(instructor)
            logger.info(f"Instructor ID: {instructor.id}")

            # 3. Ensure Learner
            email = "learner-grading@test.local"
            result = await db.execute(select(User).where(User.email == email))
            learner = result.scalar_one_or_none()
            if not learner:
                learner = User(
                    tenant_id=TARGET_TENANT_ID,
                    email=email,
                    username=email.split("@")[0],
                    first_name="Learner",
                    last_name="Grading",
                    password_hash=hash_password(PASSWORD),
                    role=RoleKey.LEARNER,
                    status=UserStatus.ACTIVE,
                )
                db.add(learner)
                await db.commit()
                await db.refresh(learner)
            logger.info(f"Learner ID: {learner.id}")

            # 4. Create Course
            result = await db.execute(
                select(Course).where(Course.code == "GRADING-101")
            )
            course = result.scalar_one_or_none()
            if not course:
                course = Course(
                    tenant_id=TARGET_TENANT_ID,
                    title="Grading Test Course",
                    code="GRADING-101",
                    instructor_id=instructor.id,
                    status=CourseStatus.PUBLISHED,
                )
                db.add(course)
                await db.commit()
                await db.refresh(course)
            logger.info(f"Course ID: {course.id}")

            # 5. Create Assignment linked to Instructor
            result = await db.execute(
                select(Assignment).where(Assignment.course_id == course.id)
            )
            assignment = result.scalar_one_or_none()
            if not assignment:
                assignment = Assignment(
                    tenant_id=TARGET_TENANT_ID,
                    title="Grading Assignment",
                    course_id=course.id,
                    assigned_instructor_id=instructor.id,  # KEY FIELD
                    created_by=instructor.id,
                )
                db.add(assignment)
                await db.commit()
                await db.refresh(assignment)
            logger.info(
                f"Assignment ID: {assignment.id} assigned to {assignment.assigned_instructor_id}"
            )

            # 6. Create Submission
            result = await db.execute(
                select(AssignmentSubmission).where(
                    AssignmentSubmission.assignment_id == assignment.id
                )
            )
            submission = result.scalar_one_or_none()
            if not submission:
                submission = AssignmentSubmission(
                    tenant_id=TARGET_TENANT_ID,
                    assignment_id=assignment.id,  # KEY FIELD
                    user_id=learner.id,
                    course_id=course.id,
                    content="Test submission content",
                    status="SUBMITTED",
                    submitted_at=datetime.utcnow(),
                )
                db.add(submission)
                await db.commit()
                await db.refresh(submission)
            logger.info(
                f"Submission ID: {submission.id} for Assignment {submission.assignment_id}"
            )

            # 7. Verify Query Logic (Same as in Instructor Route)
            query = (
                select(AssignmentSubmission)
                .join(Assignment)
                .where(Assignment.assigned_instructor_id == instructor.id)
            )
            result = await db.execute(query)
            submissions = result.scalars().all()

            found = False
            for s in submissions:
                if s.id == submission.id:
                    found = True
                    logger.info(
                        "SUCCESS: Submission found via assigned instructor query!"
                    )
                    break

            if not found:
                logger.error(
                    "FAILURE: Submission NOT found via assigned instructor query."
                )
                # Debug
                logger.info(f"Found {len(submissions)} submissions for instructor.")

    except Exception as e:
        logger.error(f"Error: {e}")
        raise
    finally:
        tenant_context.reset(token)


if __name__ == "__main__":
    asyncio.run(verify_grading_hub())
