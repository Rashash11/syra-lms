"""
Learning Path Routes

CRUD endpoints for learning paths.
"""

from typing import Annotated, Any, Optional

from app.auth import RequireAuth
from app.db.models import LearningPath, LearningPathCourse, LearningPathSection
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter()


# ============= Helper Functions =============


def _format_learning_path(path: LearningPath) -> dict[str, Any]:
    """Helper to transform LearningPath model to frontend format."""
    courses_data = []
    if hasattr(path, "courses") and path.courses:
        for course in path.courses:
            courses_data.append(
                {
                    "id": course.id, # This is the course ID
                    "courseId": course.id, # Also set courseId for compatibility
                    "title": course.title,
                    "code": course.code,
                }
            )

    # Transform sections
    sections_data = []
    if hasattr(path, "sections") and path.sections:
        for section in sorted(path.sections, key=lambda s: s.order):
            section_courses = []
            if section.courses:
                for pc in sorted(section.courses, key=lambda c: c.order):
                    section_courses.append(
                        {
                            "id": pc.id,
                            "courseId": pc.course_id,
                            "order": pc.order,
                            "sectionId": pc.section_id,
                            "unlockType": (
                                pc.unlock_type.name if pc.unlock_type else "NONE"
                            ),
                            "unlockCourseId": pc.unlock_course_id,
                            "minScore": pc.min_score,
                            "course": (
                                {
                                    "id": pc.course.id,
                                    "title": pc.course.title,
                                    "code": pc.course.code,
                                }
                                if pc.course
                                else None
                            ),
                        }
                    )

            sections_data.append(
                {
                    "id": section.id,
                    "name": section.name,
                    "order": section.order,
                    "courses": section_courses,
                }
            )

    return {
        "id": path.id,
        "name": path.name,
        "code": path.code,
        "description": path.description,
        "status": path.status,
        "isActive": path.is_active,
        "isSequential": path.is_sequential,
        "courses": courses_data,
        "sections": sections_data,
        "createdAt": path.created_at.isoformat() if path.created_at else None,
        "updatedAt": path.updated_at.isoformat() if path.updated_at else None,
    }


# ============= Request/Response Schemas =============


class CreateLearningPathRequest(BaseModel):
    name: str = Field(min_length=1)
    code: Optional[str] = None
    description: Optional[str] = None
    isSequential: Optional[bool] = False
    isActive: Optional[bool] = False


class UpdateLearningPathRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    isSequential: Optional[bool] = None
    isActive: Optional[bool] = None


# ============= Endpoints =============


@router.get("")
async def list_learning_paths(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(
        None, description="Search by name, code, or category"
    ),
    status: Optional[str] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
) -> dict[str, Any]:
    """
    GET /api/learning-paths
    List all learning paths with filtering.
    """
    if not await can(db, context, "learning_path:read"):
        raise RBACError("learning_path:read")

    # Build query
    query = select(LearningPath).where(LearningPath.tenant_id == context.tenant_id)

    # Apply search filter
    if search:
        query = query.where(
            or_(
                LearningPath.name.ilike(f"%{search}%"),
                LearningPath.code.ilike(f"%{search}%"),
            )
        )

    # Apply status filter
    if status and status != "all":
        if status == "active":
            query = query.where(LearningPath.status == "published")
        else:
            query = query.where(LearningPath.status == status)

    # Apply node scope filtering
    # Allow seeing Global paths (branch_id=null) + Node paths
    if context.node_id:
        query = query.where(
            or_(
                LearningPath.branch_id == context.node_id,
                LearningPath.branch_id.is_(None),
            )
        )

    # Include courses count via relationship
    query = query.options(
        selectinload(LearningPath.courses),
        selectinload(LearningPath.sections)
        .selectinload(LearningPathSection.courses)
        .selectinload(LearningPathCourse.course),
    )
    query = query.order_by(LearningPath.updated_at.desc())

    # Execute query
    result = await db.execute(query)
    learning_paths = result.scalars().all()

    # Transform for response
    paths_data = []
    for path in learning_paths:
        course_count = len(path.courses) if path.courses else 0

        paths_data.append(
            {
                "id": path.id,
                "name": path.name,
                "code": path.code or "",
                "description": path.description,
                "status": path.status,
                "isActive": path.is_active,
                "courseCount": course_count,
                "createdAt": path.created_at.isoformat() if path.created_at else None,
                "updatedAt": path.updated_at.isoformat() if path.updated_at else None,
            }
        )

    return {"data": paths_data}


@router.post("")
async def create_learning_path(
    request: CreateLearningPathRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/learning-paths
    Create a new learning path.
    """
    if not await can(db, context, "learning_path:create"):
        raise RBACError("learning_path:create")

    # Check for duplicate code
    if request.code:
        existing_result = await db.execute(
            select(LearningPath).where(LearningPath.code == request.code)
        )
        existing = existing_result.scalar_one_or_none()
        if existing:
            raise BadRequestError("Learning path with this code already exists")

    # Create learning path
    learning_path = LearningPath(
        tenant_id=context.tenant_id,
        branch_id=context.node_id,
        name=request.name,
        code=request.code,
        description=request.description,
        status="draft",
        is_active=request.isActive if request.isActive is not None else False,
        is_sequential=(
            request.isSequential if request.isSequential is not None else False
        ),
    )

    db.add(learning_path)
    await db.commit()
    await db.refresh(learning_path)

    # Return manually to avoid lazy load issues with _format_learning_path
    return {
        "ok": True,
        "id": learning_path.id,
        "name": learning_path.name,
        "code": learning_path.code,
        "description": learning_path.description,
        "status": learning_path.status,
        "isActive": learning_path.is_active,
        "isSequential": learning_path.is_sequential,
        "courses": [],
        "sections": [],
        "createdAt": (
            learning_path.created_at.isoformat() if learning_path.created_at else None
        ),
        "updatedAt": (
            learning_path.updated_at.isoformat() if learning_path.updated_at else None
        ),
    }


@router.get("/{path_id}")
async def get_learning_path(
    path_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/learning-paths/{path_id}
    Get a single learning path by ID.
    """
    if not await can(db, context, "learning_path:read"):
        raise RBACError("learning_path:read")

    # Load path with sections and their courses preloaded
    result = await db.execute(
        select(LearningPath)
        .options(
            selectinload(LearningPath.sections)
            .selectinload(LearningPathSection.courses)
            .selectinload(LearningPathCourse.course)
        )
        .where(
            (LearningPath.id == path_id) & (LearningPath.tenant_id == context.tenant_id)
        )
    )
    learning_path = result.scalar_one_or_none()
    if not learning_path:
        raise NotFoundError("LearningPath")

    # Load all LearningPathCourse entries for this path (including unassigned)
    lpc_result = await db.execute(
        select(LearningPathCourse)
        .options(selectinload(LearningPathCourse.course))
        .where(LearningPathCourse.path_id == path_id)
        .order_by(LearningPathCourse.order.asc())
    )
    lpcs = lpc_result.scalars().all()

    # Build global courses list expected by the frontend (includes sectionId etc.)
    courses_data = [
        {
            "id": pc.id,
            "courseId": pc.course_id,
            "order": pc.order,
            "sectionId": pc.section_id,
            "unlockType": pc.unlock_type.name if pc.unlock_type else "NONE",
            "unlockCourseId": pc.unlock_course_id,
            "minScore": pc.min_score,
            "course": {
                "id": pc.course.id if pc.course else None,
                "title": pc.course.title if pc.course else "",
                "code": pc.course.code if pc.course else "",
            },
        }
        for pc in lpcs
    ]

    # Build sections list (with nested courses)
    sections_data = []
    for section in sorted(learning_path.sections or [], key=lambda s: s.order):
        section_courses = [
            {
                "id": pc.id,
                "courseId": pc.course_id,
                "order": pc.order,
                "sectionId": pc.section_id,
                "unlockType": pc.unlock_type.name if pc.unlock_type else "NONE",
                "unlockCourseId": pc.unlock_course_id,
                "minScore": pc.min_score,
                "course": {
                    "id": pc.course.id if pc.course else None,
                    "title": pc.course.title if pc.course else "",
                    "code": pc.course.code if pc.course else "",
                },
            }
            for pc in sorted(section.courses or [], key=lambda c: c.order)
        ]

        sections_data.append(
            {
                "id": section.id,
                "name": section.name,
                "order": section.order,
                "courses": section_courses,
            }
        )

    return {
        "id": learning_path.id,
        "name": learning_path.name,
        "code": learning_path.code,
        "description": learning_path.description,
        "status": learning_path.status,
        "isActive": learning_path.is_active,
        "isSequential": learning_path.is_sequential,
        "courses": courses_data,
        "sections": sections_data,
        "createdAt": (
            learning_path.created_at.isoformat() if learning_path.created_at else None
        ),
        "updatedAt": (
            learning_path.updated_at.isoformat() if learning_path.updated_at else None
        ),
    }


@router.put("/{path_id}")
@router.patch("/{path_id}")
async def update_learning_path(
    path_id: str,
    request: UpdateLearningPathRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PUT /api/learning-paths/{path_id}
    Update a learning path.
    """
    if not await can(db, context, "learning_path:update"):
        raise RBACError("learning_path:update")

    result = await db.execute(
        select(LearningPath)
        .options(
            selectinload(LearningPath.courses),
            selectinload(LearningPath.sections)
            .selectinload(LearningPathSection.courses)
            .selectinload(LearningPathCourse.course),
        )
        .where(LearningPath.id == path_id)
    )
    learning_path = result.scalar_one_or_none()

    if not learning_path:
        raise NotFoundError("LearningPath")

    # Update fields
    if request.name is not None:
        learning_path.name = request.name
    if request.code is not None:
        learning_path.code = request.code
    if request.description is not None:
        learning_path.description = request.description
    if request.status is not None:
        learning_path.status = request.status
    if request.isSequential is not None:
        learning_path.is_sequential = request.isSequential
    if request.isActive is not None:
        learning_path.is_active = request.isActive

    await db.commit()
    await db.refresh(learning_path)

    return _format_learning_path(learning_path)


@router.delete("/{path_id}")
async def delete_learning_path(
    path_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/learning-paths/{path_id}
    Delete a learning path.
    """
    if not await can(db, context, "learning_path:delete"):
        raise RBACError("learning_path:delete")

    result = await db.execute(select(LearningPath).where(LearningPath.id == path_id))
    learning_path = result.scalar_one_or_none()

    if not learning_path:
        raise NotFoundError("LearningPath")

    await db.delete(learning_path)
    await db.commit()

    return {"success": True, "deleted": path_id}
