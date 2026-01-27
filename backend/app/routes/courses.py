"""
Course Management Routes

CRUD operations for course management with enrollment tracking.
"""

from typing import Annotated, Any

from app.auth import RequireAuth
from app.db.models import Course, CourseStatus, Enrollment, EnrollmentStatus
from app.db.session import get_db
from app.errors import BadRequestError, ConflictError, NotFoundError, RBACError
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateCourseRequest(BaseModel):
    title: str
    code: str | None = None
    description: str | None = None
    image: str | None = None


class UpdateCourseRequest(BaseModel):
    title: str | None = None
    code: str | None = None
    description: str | None = None
    image: str | None = None
    status: str | None = None
    isActive: bool | None = None
    hiddenFromCatalog: bool | None = None


class CourseResponse(BaseModel):
    id: str
    title: str
    code: str | None
    description: str | None
    status: str
    image: str | None
    isActive: bool
    hiddenFromCatalog: bool
    createdAt: str
    updatedAt: str
    enrollmentCount: int = 0


class CoursesListResponse(BaseModel):
    data: list[CourseResponse]
    pagination: dict[str, Any]


class EnrollRequest(BaseModel):
    userId: str


class EnrollmentResponse(BaseModel):
    id: str
    userId: str
    courseId: str
    status: str
    progress: int
    score: int | None
    enrolledAt: str
    startedAt: str | None
    completedAt: str | None


# ============= Helper Functions =============

def can_manage_courses(role: str) -> bool:
    """Check if user role can manage courses."""
    return role in ["ADMIN", "INSTRUCTOR", "SUPER_INSTRUCTOR"]


def can_view_courses(role: str) -> bool:
    """Check if user role can view courses."""
    return role in ["ADMIN", "INSTRUCTOR", "SUPER_INSTRUCTOR", "LEARNER"]


async def course_to_response(course: Course, db: AsyncSession) -> CourseResponse:
    """Convert Course model to response format with enrollment count."""
    
    # Get enrollment count
    enrollment_count_stmt = select(func.count()).select_from(Enrollment).where(Enrollment.course_id == course.id)
    enrollment_result = await db.execute(enrollment_count_stmt)
    enrollment_count = enrollment_result.scalar() or 0
    
    return CourseResponse(
        id=course.id,
        title=course.title,
        code=course.code,
        description=course.description,
        status=course.status.value,
        image=course.image,
        isActive=course.is_active,
        hiddenFromCatalog=course.hidden_from_catalog,
        createdAt=course.created_at.isoformat(),
        updatedAt=course.updated_at.isoformat(),
        enrollmentCount=enrollment_count,
    )


# ============= Endpoints =============

@router.get("", response_model=CoursesListResponse)
async def list_courses(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str = Query("", description="Search by title, code, or description"),
    status: str = Query("", description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List courses with pagination and filtering."""
    
    if not can_view_courses(context.role):
        raise RBACError("course:read")
    
    # Build base query
    query = select(Course).where(Course.tenant_id == context.tenant_id)
    count_query = select(func.count()).select_from(Course).where(Course.tenant_id == context.tenant_id)
    
    # For learners, only show published and active courses
    if context.role == "LEARNER":
        learner_filter = (Course.status == CourseStatus.PUBLISHED) & (Course.is_active == True) & (Course.hidden_from_catalog == False)
        query = query.where(learner_filter)
        count_query = count_query.where(learner_filter)
    
    # Apply search filter
    if search:
        search_filter = or_(
            Course.title.ilike(f"%{search}%"),
            Course.code.ilike(f"%{search}%") if search else False,
            Course.description.ilike(f"%{search}%") if search else False,
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Apply status filter
    if status and status != "all":
        try:
            status_enum = CourseStatus(status.upper())
            query = query.where(Course.status == status_enum)
            count_query = count_query.where(Course.status == status_enum)
        except ValueError:
            raise BadRequestError(f"Invalid status: {status}")
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination and ordering
    offset = (page - 1) * limit
    query = query.order_by(Course.created_at.desc()).offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    courses = result.scalars().all()
    
    # Convert to response format
    course_responses = []
    for course in courses:
        course_response = await course_to_response(course, db)
        course_responses.append(course_response)
    
    # Calculate pagination info
    total_pages = (total + limit - 1) // limit
    
    return CoursesListResponse(
        data=course_responses,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": total_pages,
        }
    )


@router.post("", response_model=CourseResponse)
async def create_course(
    request: CreateCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new course."""
    
    if not can_manage_courses(context.role):
        raise RBACError("course:create")
    
    # Check if course code already exists (if provided)
    if request.code:
        stmt = select(Course).where(Course.code == request.code, Course.tenant_id == context.tenant_id)
        result = await db.execute(stmt)
        existing_course = result.scalar_one_or_none()
        
        if existing_course:
            raise ConflictError("Course with this code already exists")
    
    # Create course
    course = Course(
        tenant_id=context.tenant_id,
        title=request.title,
        code=request.code,
        description=request.description,
        image=request.image,
        status=CourseStatus.DRAFT,
        is_active=True,
        hidden_from_catalog=False,
    )
    
    db.add(course)
    await db.commit()
    await db.refresh(course)
    
    return await course_to_response(course, db)


@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific course by ID."""
    
    if not can_view_courses(context.role):
        raise RBACError("course:read")
    
    stmt = select(Course).where(Course.id == course_id, Course.tenant_id == context.tenant_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundError("Course")
    
    # For learners, only show published and active courses
    if context.role == "LEARNER":
        if course.status != CourseStatus.PUBLISHED or not course.is_active or course.hidden_from_catalog:
            raise NotFoundError("Course")
    
    return await course_to_response(course, db)


@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: str,
    request: UpdateCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a course."""
    
    if not can_manage_courses(context.role):
        raise RBACError("course:update")
    
    # Get course
    stmt = select(Course).where(Course.id == course_id, Course.tenant_id == context.tenant_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundError("Course")
    
    # Build update data
    update_data = {}
    
    if request.title is not None:
        update_data["title"] = request.title
    
    if request.code is not None:
        # Check if new code conflicts with existing course
        if request.code != course.code:
            code_stmt = select(Course).where(Course.code == request.code, Course.tenant_id == context.tenant_id)
            code_result = await db.execute(code_stmt)
            existing_course = code_result.scalar_one_or_none()
            
            if existing_course:
                raise ConflictError("Course with this code already exists")
        
        update_data["code"] = request.code
    
    if request.description is not None:
        update_data["description"] = request.description
    
    if request.image is not None:
        update_data["image"] = request.image
    
    if request.status is not None:
        try:
            status_enum = CourseStatus(request.status.upper())
            update_data["status"] = status_enum
        except ValueError:
            raise BadRequestError(f"Invalid status: {request.status}")
    
    if request.isActive is not None:
        update_data["is_active"] = request.isActive
    
    if request.hiddenFromCatalog is not None:
        update_data["hidden_from_catalog"] = request.hiddenFromCatalog
    
    # Apply updates
    if update_data:
        await db.execute(
            update(Course).where(Course.id == course_id).values(**update_data)
        )
        await db.commit()
        await db.refresh(course)
    
    return await course_to_response(course, db)


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a course (soft delete by deactivating)."""
    
    if not can_manage_courses(context.role):
        raise RBACError("course:delete")
    
    # Get course
    stmt = select(Course).where(Course.id == course_id, Course.tenant_id == context.tenant_id)
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    
    if not course:
        raise NotFoundError("Course")
    
    # Soft delete by deactivating
    await db.execute(
        update(Course)
        .where(Course.id == course_id)
        .values(is_active=False, hidden_from_catalog=True)
    )
    await db.commit()
    
    return {"ok": True, "message": "Course deactivated successfully"}


@router.post("/{course_id}/enroll", response_model=EnrollmentResponse)
async def enroll_user(
    course_id: str,
    request: EnrollRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Enroll a user in a course."""
    
    # Only managers can enroll others, learners can self-enroll
    if request.userId != context.user_id and not can_manage_courses(context.role):
        raise RBACError("enrollment:create")
    
    # Get course
    course_stmt = select(Course).where(Course.id == course_id, Course.tenant_id == context.tenant_id)
    course_result = await db.execute(course_stmt)
    course = course_result.scalar_one_or_none()
    
    if not course:
        raise NotFoundError("Course")
    
    if course.status != CourseStatus.PUBLISHED or not course.is_active:
        raise BadRequestError("Course is not available for enrollment")
    
    # Check if already enrolled
    enrollment_stmt = select(Enrollment).where(
        Enrollment.user_id == request.userId,
        Enrollment.course_id == course_id
    )
    enrollment_result = await db.execute(enrollment_stmt)
    existing_enrollment = enrollment_result.scalar_one_or_none()
    
    if existing_enrollment:
        raise ConflictError("User is already enrolled in this course")
    
    # Create enrollment
    enrollment = Enrollment(
        user_id=request.userId,
        course_id=course_id,
        status=EnrollmentStatus.NOT_STARTED,
        progress=0,
    )
    
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    
    return EnrollmentResponse(
        id=enrollment.id,
        userId=enrollment.user_id,
        courseId=enrollment.course_id,
        status=enrollment.status.value,
        progress=enrollment.progress,
        score=enrollment.score,
        enrolledAt=enrollment.enrolled_at.isoformat(),
        startedAt=enrollment.started_at.isoformat() if enrollment.started_at else None,
        completedAt=enrollment.completed_at.isoformat() if enrollment.completed_at else None,
    )