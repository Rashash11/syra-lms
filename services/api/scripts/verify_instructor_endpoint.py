import asyncio
import os
import sys

# Add parent directory to path to import app
sys.path.append(os.path.join(os.path.dirname(__file__), "../"))

from app.db.models import Assignment, User
from app.db.session import get_db_context
from app.routes.instructor import get_grading_hub_data
from sqlalchemy import select


# Mock RequireAuth
class MockContext:
    def __init__(self, user_id, tenant_id):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.role = "INSTRUCTOR"


async def verify_instructor_endpoint():
    print("Verifying Instructor Grading Hub API...")

    async with get_db_context() as db:
        # 1. Find the assignment and its instructor
        result = await db.execute(
            select(Assignment).where(Assignment.title == "Grading Assignment")
        )
        assignment = result.scalar_one_or_none()

        if not assignment:
            print("Assignment not found.")
            return

        instructor_id = assignment.assigned_instructor_id
        if not instructor_id:
            print("Assignment has no assigned instructor.")
            return

        print(f"Assignment {assignment.id} is assigned to instructor {instructor_id}")

        # 2. Call the API function as the instructor
        context = MockContext(instructor_id, assignment.tenant_id)

        try:
            response = await get_grading_hub_data(
                context=context, db=db, tab="assignments"
            )

            submissions = response.get("submissions", [])
            print(f"Found {len(submissions)} submissions.")

            found = False
            for s in submissions:
                print(f" - Submission: {s['id']}, Unit/Assignment: {s['unitId']}")
                # unitId in the response is populated from assignment_unit_id OR assignment_id
                if s["unitId"] == assignment.id:
                    found = True

            if found:
                print(
                    "SUCCESS: Submission for the assignment is visible to the instructor."
                )
            else:
                print("FAILURE: Submission not found in instructor's list.")

        except Exception as e:
            print(f"Error calling API: {e}")
            import traceback

            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(verify_instructor_endpoint())
