import asyncio
import os
import sys
from datetime import datetime

# Add parent directory to path to import app
sys.path.append(os.path.join(os.path.dirname(__file__), "../"))

from app.auth import AuthContext
from app.db.models import Assignment, AssignmentSubmission, Course, User
from app.db.session import get_db_context
from app.routes.assignments import (
    CreateAssignmentSubmissionRequest,
    create_assignment_submission,
)
from sqlalchemy import select


# Mock RequireAuth
class MockContext:
    def __init__(self, user_id, tenant_id):
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.role = "LEARNER"


async def verify_submission_api():
    print("Verifying submission API...")

    async with get_db_context() as db:
        # 1. Get a learner and a course/assignment
        # We can reuse the ones from verify_grading_hub.py or find existing
        TARGET_TENANT_ID = "00000000-0000-0000-0000-000000000001"

        # Find a learner
        result = await db.execute(select(User).limit(1))
        learner = result.scalar_one_or_none()
        if not learner:
            print("No users found, skipping.")
            return

        # Find an assignment (created by verify_grading_hub.py preferably)
        result = await db.execute(
            select(Assignment).where(Assignment.title == "Grading Assignment")
        )
        assignment = result.scalar_one_or_none()
        if not assignment:
            print("Assignment not found, run verify_grading_hub.py first.")
            return

        # Use the tenant_id from the assignment to ensure consistency
        TARGET_TENANT_ID = assignment.tenant_id
        print(f"Using Tenant ID: {TARGET_TENANT_ID} from assignment")

        # 2. Call the API function directly
        print(
            f"Creating submission for assignment {assignment.id} as learner {learner.id}"
        )

        request = CreateAssignmentSubmissionRequest(
            content="API Verification Submission",
            attachments=[{"url": "/files/test.txt", "name": "test.txt"}],
        )

        context = MockContext(learner.id, TARGET_TENANT_ID)

        try:
            response = await create_assignment_submission(
                assignment_id=assignment.id, request=request, context=context, db=db
            )
            print("Submission created successfully:", response)

            # 3. Verify it's in the DB with correct assignment_id
            submission_id = response["id"]
            result = await db.execute(
                select(AssignmentSubmission).where(
                    AssignmentSubmission.id == submission_id
                )
            )
            submission = result.scalar_one()

            print(f"Verified DB: Submission {submission.id}")
            print(f"  Assignment ID: {submission.assignment_id}")
            print(f"  Content: {submission.content}")

            if submission.assignment_id == assignment.id:
                print("SUCCESS: assignment_id is correctly linked.")
            else:
                print("FAILURE: assignment_id mismatch.")

            if "ATTACHMENTS_METADATA" in submission.content:
                print("SUCCESS: Attachments stored in content.")
            else:
                print("FAILURE: Attachments missing from content.")

        except Exception as e:
            print(f"Error calling API: {e}")
            import traceback

            traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(verify_submission_api())
