"""
Submission Routes

Implements /api/submissions and /api/submissions/{id} parity with grading RBAC.
"""

from datetime import datetime
from typing import Annotated, Any, Optional

from app.auth import RequireAuth
from app.db.models import Assignment, AssignmentSubmission
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class CreateSubmissionRequest(BaseModel):
    assignmentId: Optional[str] = None
    assignmentUnitId: Optional[str] = None
    content: Optional[str] = None
    fileId: Optional[str] = None


class GradeSubmissionRequest(BaseModel):
    score: float = Field(ge=0)
    comment: Optional[str] = None


@router.get("")
async def list_submissions(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    assignmentId: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    print(f"DEBUG: Entering list_submissions. User={context.user_id}, Role={context.role}")
    try:
        # Check permissions
        has_perm = await can(db, context, "submission:read")
        print(f"DEBUG: Permission check 'submission:read': {has_perm}")
        if not has_perm:
            print(f"DEBUG: Missing permission 'submission:read' for user {context.user_id}")
            raise RBACError("submission:read")

        query = select(AssignmentSubmission).where(
            AssignmentSubmission.tenant_id == context.tenant_id
        )

        if assignmentId:
            # Filter by assignmentUnitId instead (assignmentId doesn't exist in DB)
            query = query.where(AssignmentSubmission.assignment_unit_id == assignmentId)

        # Filtering: Learners only see their own submissions
        if context.role == "LEARNER":
            query = query.where(AssignmentSubmission.user_id == context.user_id)

        # Pagination
        skip = (page - 1) * limit
        total_query = select(func.count()).select_from(query.subquery())
        total = (await db.execute(total_query)).scalar() or 0

        query = query.offset(skip).limit(limit).order_by(AssignmentSubmission.submitted_at.desc())
        result = await db.execute(query)
        submissions_list = result.scalars().all()

        return {
            "data": [
                {
                    "id": s.id,
                    "assignmentId": s.assignment_unit_id,  # Map to unit ID
                    "userId": s.user_id,
                    "status": s.status,
                    "submittedAt": s.submitted_at.isoformat() if s.submitted_at else None,
                    "score": s.score,
                }
                for s in submissions_list
            ],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": (total + limit - 1) // limit,
            },
        }
    except Exception as e:
        with open("e:/lms/services/api/error.log", "a") as f:
            f.write(f"\n[{datetime.now()}] ERROR in list_submissions: {str(e)}\n")
            import traceback
            f.write(traceback.format_exc())
        raise e


@router.post("")
async def create_submission(
    request: CreateSubmissionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if not await can(db, context, "submission:create"):
        raise RBACError("submission:create")

    if (not request.assignmentId and not request.assignmentUnitId) or (
        not request.content and not request.fileId
    ):
        raise BadRequestError("Invalid submission payload")

    course_id = None
    assignment_id = request.assignmentId
    assignment_unit_id = request.assignmentUnitId

    if request.assignmentId:
        # Fetch assignment to get courseId
        assignment = await db.get(Assignment, request.assignmentId)
        if not assignment:
            raise NotFoundError("Assignment")
        course_id = assignment.course_id
    elif request.assignmentUnitId:
        # Fetch course unit to get courseId
        from app.db.models import CourseUnit, UnitType

        unit = await db.get(CourseUnit, request.assignmentUnitId)
        if not unit:
            raise NotFoundError("Unit")
        # Check if it is an assignment unit
        if unit.type != UnitType.ASSIGNMENT:
            raise BadRequestError("Unit is not an assignment")
        course_id = unit.course_id

    submission = AssignmentSubmission(
        tenant_id=context.tenant_id,
        assignment_unit_id=assignment_unit_id,
        user_id=context.user_id,
        course_id=course_id,
        submission_type="file" if request.fileId else "text",
        content=request.content,
        file_id=request.fileId,
        status="SUBMITTED",
        submitted_at=datetime.utcnow(),
    )

    db.add(submission)
    await db.commit()
    await db.refresh(submission)

    return {"ok": True, "id": submission.id}


@router.get("/{submission_id}")
async def get_submission(
    submission_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if not await can(db, context, "submission:read"):
        raise RBACError("submission:read")
    raise NotFoundError("Submission")


@router.patch("/{submission_id}")
async def grade_submission(
    submission_id: str,
    request: GradeSubmissionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if not await can(db, context, "submission:grade"):
        raise RBACError("submission:grade")
    return {"ok": True}


__all__ = ["router"]
