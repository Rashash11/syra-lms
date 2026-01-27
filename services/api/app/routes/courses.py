from typing import Annotated, Any

from app.auth import RequireAuth
from app.core.tenant import get_tenant_id
from app.db.models import Course, CourseStatus, Enrollment
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can
from fastapi import APIRouter, Depends, Query
from pydantic import UUID4, BaseModel, Field
from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter()


# ============= Request/Response Schemas =============


class CreateCourseRequest(BaseModel):
    title: str = Field(min_length=1)
    code: str | None = None
    description: str | None = None
    status: str | None = None
    image: str | None = None
    isActive: bool | None = None
    hiddenFromCatalog: bool | None = None
    categoryId: UUID4 | None = None


class UpdateCourseRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    image: str | None = None
    isActive: bool | None = None
    hiddenFromCatalog: bool | None = None
    categoryId: UUID4 | None = None


class BulkActionRequest(BaseModel):
    ids: list[str]
    action: str | None = None


class CourseActionRequest(BaseModel):
    action: str


class CourseListResponse(BaseModel):
    courses: list[dict[str, Any]]
    total: int
    page: int
    limit: int
    totalPages: int


# ============= Endpoints =============


@router.get("")
async def list_courses(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str = Query("", description="Search by title, code, or description"),
    status: str = Query("", description="Filter by status"),
    hidden: str | None = Query(None, description="Filter by hiddenFromCatalog"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> CourseListResponse:
    """
    List courses with pagination and filtering.
    """
    if not await can(db, context, "course:read"):
        raise RBACError("course:read")

    # Build query
    query = select(Course).where(Course.tenant_id == context.tenant_id)
    count_query = (
        select(func.count())
        .select_from(Course)
        .where(Course.tenant_id == context.tenant_id)
    )

    # Apply search filter
    if search:
        search_filter = (
            Course.title.ilike(f"%{search}%")
            | Course.code.ilike(f"%{search}%")
            | Course.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Apply status filter
    if status and status != "all":
        query = query.where(Course.status == status.upper())
        count_query = count_query.where(Course.status == status.upper())

    # Apply hidden filter
    if hidden is not None:
        is_hidden = hidden.lower() == "true"
        query = query.where(Course.hidden_from_catalog == is_hidden)
        count_query = count_query.where(Course.hidden_from_catalog == is_hidden)

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply pagination
    skip = (page - 1) * limit
    query = query.offset(skip).limit(limit).order_by(Course.created_at.desc())

    # Execute query
    result = await db.execute(query)
    courses = result.scalars().all()

    # Transform for response
    courses_data = []
    for course in courses:
        courses_data.append(
            {
                "id": course.id,
                "code": course.code,
                "title": course.title,
                "description": course.description,
                "status": (
                    course.status.value
                    if hasattr(course.status, "value")
                    else str(course.status)
                ),
                "isActive": course.is_active,
                "hiddenFromCatalog": course.hidden_from_catalog,
                "thumbnailUrl": course.thumbnail_url,
                "categoryId": course.category_id,
                "createdAt": (
                    course.created_at.isoformat() if course.created_at else None
                ),
                "updatedAt": (
                    course.updated_at.isoformat() if course.updated_at else None
                ),
            }
        )

    return CourseListResponse(
        courses=courses_data,
        total=total,
        page=page,
        limit=limit,
        totalPages=(total + limit - 1) // limit,
    )


@router.post("")
async def create_course(
    request: CreateCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> dict[str, Any]:
    """
    Create a new course.
    """
    if not await can(db, context, "course:create"):
        raise RBACError("course:create")

    # Auto-generate code if not provided
    code = request.code or f"COURSE-{int(__import__('time').time())}"

    # Check if code exists
    result = await db.execute(
        select(Course).where(Course.code == code, Course.tenant_id == tenant_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise BadRequestError("Course with this code already exists")

    # Create course
    course = Course(
        tenant_id=tenant_id,
        code=code,
        title=request.title,
        description=request.description,
        status=(
            CourseStatus(request.status.upper())
            if request.status
            else CourseStatus.DRAFT
        ),
        thumbnail_url=request.image,
        is_active=request.isActive or False,
        hidden_from_catalog=request.hiddenFromCatalog or False,
        category_id=request.categoryId,
        instructor_id=context.user_id,
    )

    db.add(course)
    await db.commit()
    await db.refresh(course)

    return {
        "ok": True,
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "description": course.description,
        "status": (
            course.status.value
            if hasattr(course.status, "value")
            else str(course.status)
        ),
        "isActive": course.is_active,
        "hiddenFromCatalog": course.hidden_from_catalog,
        "createdAt": course.created_at.isoformat() if course.created_at else None,
    }


@router.get("/catalog")
async def get_catalog(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Search courses"),
) -> dict[str, Any]:
    """
    GET /api/courses/catalog
    Public course catalog.
    """
    # Reuse list_courses logic but force filters for catalog visibility
    skip = (page - 1) * limit

    query = select(Course).where(
        (Course.status == "PUBLISHED")
        & (Course.hidden_from_catalog.is_(False))
        & (Course.is_active.is_(True))
    )

    count_query = (
        select(func.count())
        .select_from(Course)
        .where(
            (Course.status == "PUBLISHED")
            & (Course.hidden_from_catalog.is_(False))
            & (Course.is_active.is_(True))
        )
    )

    if search:
        search_filter = (
            Course.title.ilike(f"%{search}%")
            | Course.code.ilike(f"%{search}%")
            | Course.description.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Get total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = query.offset(skip).limit(limit).order_by(Course.created_at.desc())
    result = await db.execute(query)
    courses = result.scalars().all()

    data = []
    for c in courses:
        data.append(
            {
                "id": c.id,
                "title": c.title,
                "code": c.code,
                "thumbnailUrl": c.thumbnail_url,
                "description": c.description,
                "categoryId": c.category_id,
            }
        )

    return {
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        },
    }


@router.get("/{course_id}/enrollments")
async def list_course_enrollments(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """
    Get enrollments for a specific course.
    """
    if not await can(db, context, "course:read"):
        raise RBACError("course:read")

    # Check if course exists
    course_result = await db.execute(
        select(Course).where(
            (Course.id == course_id) & (Course.tenant_id == context.tenant_id)
        )
    )
    course = course_result.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course")

    skip = (page - 1) * limit

    query = (
        select(Enrollment)
        .where(Enrollment.course_id == course_id)
        .options(selectinload(Enrollment.user))
        .offset(skip)
        .limit(limit)
        .order_by(Enrollment.created_at.desc())
    )

    count_query = (
        select(func.count())
        .select_from(Enrollment)
        .where(Enrollment.course_id == course_id)
    )

    # Get total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Execute query
    enrollment_result = await db.execute(query)
    enrollments = enrollment_result.scalars().all()

    data = []
    for e in enrollments:
        data.append(
            {
                "id": e.id,
                "userId": e.user_id,
                "status": (
                    e.status.value if hasattr(e.status, "value") else str(e.status)
                ),
                "progress": e.progress,
                "enrolledAt": e.created_at.isoformat() if e.created_at else None,
                "user": (
                    {
                        "name": f"{e.user.first_name} {e.user.last_name}",
                        "email": e.user.email,
                    }
                    if e.user
                    else None
                ),
            }
        )

    return {
        "enrollments": data,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit,
    }


@router.get("/{course_id}")
async def get_course(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Get a single course by ID.
    """
    if not await can(db, context, "course:read"):
        raise RBACError("course:read")

    result = await db.execute(
        select(Course).where(
            (Course.id == course_id) & (Course.tenant_id == context.tenant_id)
        )
    )
    course = result.scalar_one_or_none()

    if not course:
        raise NotFoundError("Course")
    # Node/learner isolation: learners can only access courses they are enrolled in
    if str(context.role) == "LEARNER":
        from app.db.models import Enrollment

        enr_check = await db.execute(
            select(Enrollment.id).where(
                (Enrollment.user_id == context.user_id)
                & (Enrollment.course_id == course_id)
            )
        )
        if enr_check.scalar_one_or_none() is None:
            # Check if enrolled via a Learning Path
            from app.db.models import LearningPathCourse, LearningPathEnrollment

            lp_check = await db.execute(
                select(LearningPathEnrollment.id)
                .join(
                    LearningPathCourse,
                    LearningPathCourse.path_id == LearningPathEnrollment.path_id,
                )
                .where(
                    (LearningPathEnrollment.user_id == context.user_id)
                    & (LearningPathCourse.course_id == course_id)
                )
            )
            if lp_check.scalar_one_or_none() is None:
                raise NotFoundError("Course")

    # Load sections and units for learner navigation
    from app.db.models import CourseSection, CourseUnit

    sec_result = await db.execute(
        select(CourseSection).where(CourseSection.course_id == course_id)
    )
    sections = sec_result.scalars().all()
    unit_result = await db.execute(
        select(CourseUnit).where(CourseUnit.course_id == course_id)
    )
    units = unit_result.scalars().all()
    units_data = [
        {
            "id": u.id,
            "title": u.title,
            "orderIndex": u.order_index,
            "type": u.type.value if hasattr(u.type, "value") else str(u.type),
            "sectionId": u.section_id,
            "config": u.config or {},
            "status": u.status.value if hasattr(u.status, "value") else str(u.status),
        }
        for u in units
    ]
    sections_data = [
        {
            "id": s.id,
            "name": s.title,
            "order": s.order_index,
            "units": [ud for ud in units_data if ud["sectionId"] == s.id],
        }
        for s in sections
    ]
    unassigned_units = [ud for ud in units_data if ud["sectionId"] is None]
    if not sections_data and not unassigned_units:
        unassigned_units = []

    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "description": course.description,
        "status": (
            course.status.value
            if hasattr(course.status, "value")
            else str(course.status)
        ),
        "isActive": course.is_active,
        "hiddenFromCatalog": course.hidden_from_catalog,
        "thumbnailUrl": course.thumbnail_url,
        "categoryId": course.category_id,
        "instructorId": course.instructor_id,
        "createdAt": course.created_at.isoformat() if course.created_at else None,
        "updatedAt": course.updated_at.isoformat() if course.updated_at else None,
        "sections": sections_data,
        "unassignedUnits": unassigned_units,
        "totalUnits": len(units),
        "totalDuration": "45m",
    }


@router.get("/{course_id}/units/{unit_id}")
async def get_course_unit(
    course_id: str,
    unit_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Get a single unit by ID.
    """
    if not await can(db, context, "course:read"):
        raise RBACError("course:read")

    # Verify course enrollment if learner
    if str(context.role) == "LEARNER":
        from app.db.models import Enrollment

        enr_check = await db.execute(
            select(Enrollment.id).where(
                (Enrollment.user_id == context.user_id)
                & (Enrollment.course_id == course_id)
            )
        )
        if enr_check.scalar_one_or_none() is None:
            # Check if enrolled via a Learning Path
            from app.db.models import LearningPathCourse, LearningPathEnrollment

            lp_check = await db.execute(
                select(LearningPathEnrollment.id)
                .join(
                    LearningPathCourse,
                    LearningPathCourse.path_id == LearningPathEnrollment.path_id,
                )
                .where(
                    (LearningPathEnrollment.user_id == context.user_id)
                    & (LearningPathCourse.course_id == course_id)
                )
            )
            if lp_check.scalar_one_or_none() is None:
                raise NotFoundError("Course")

    from app.db.models import CourseUnit

    result = await db.execute(
        select(CourseUnit).where(
            (CourseUnit.id == unit_id) & (CourseUnit.course_id == course_id)
        )
    )
    unit = result.scalar_one_or_none()

    if not unit:
        raise NotFoundError("Unit")

    return {
        "id": unit.id,
        "title": unit.title,
        "type": unit.type.value if hasattr(unit.type, "value") else str(unit.type),
        "config": unit.config or {},
        "orderIndex": unit.order_index,
        "sectionId": unit.section_id,
        "status": (
            unit.status.value if hasattr(unit.status, "value") else str(unit.status)
        ),
    }


@router.put("/{course_id}")
async def update_course(
    course_id: str,
    request: UpdateCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Update a course.
    """
    has_update = await can(db, context, "course:update")
    has_update_any = await can(db, context, "course:update_any")

    if not has_update and not has_update_any:
        raise RBACError("course:update")

    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()

    if not course:
        raise NotFoundError("Course")

    # Update fields
    if request.title is not None:
        course.title = request.title
    if request.description is not None:
        course.description = request.description
    if request.status is not None:
        course.status = CourseStatus(request.status)
    if request.image is not None:
        course.thumbnail_url = request.image
    if request.isActive is not None:
        course.is_active = request.isActive
    if request.hiddenFromCatalog is not None:
        course.hidden_from_catalog = request.hiddenFromCatalog
    if request.categoryId is not None:
        course.category_id = str(request.categoryId)

    await db.commit()
    await db.refresh(course)

    return {
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "status": (
            course.status.value
            if hasattr(course.status, "value")
            else str(course.status)
        ),
    }


@router.delete("/{course_id}")
async def delete_course(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    has_delete = await can(db, context, "course:delete_any")
    if not has_delete:
        raise RBACError("course:delete_any")
    result = await db.execute(
        select(Course).where(
            (Course.id == course_id) & (Course.tenant_id == context.tenant_id)
        )
    )
    course = result.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course")
    await db.execute(delete(Course).where(Course.id == course_id))
    await db.commit()
    return {"success": True, "deleted": 1}


@router.delete("")
async def bulk_delete_courses(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk delete courses.
    """
    if not await can(db, context, "course:delete_any"):
        raise RBACError("course:delete_any")

    if not request.ids:
        raise BadRequestError("No course IDs provided")

    result = await db.execute(delete(Course).where(Course.id.in_(request.ids)))

    await db.commit()

    return {"success": True, "deleted": result.rowcount}  # type: ignore


@router.patch("")
async def bulk_update_courses(
    request: BulkActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    Bulk update courses (publish, unpublish, hide, show).
    """
    has_update = await can(db, context, "course:update_any")
    has_publish = await can(db, context, "course:publish")

    if not has_update and not has_publish:
        raise RBACError("course:update_any")

    if not request.ids:
        raise BadRequestError("No course IDs provided")

    update_data = {}

    if request.action == "publish":
        update_data = {"status": "PUBLISHED"}
    elif request.action == "unpublish":
        update_data = {"status": "DRAFT"}
    elif request.action == "hide":
        update_data = {"hidden_from_catalog": True}  # type: ignore
    elif request.action == "show":
        update_data = {"hidden_from_catalog": False}  # type: ignore
    else:
        raise BadRequestError("Invalid action")

    result = await db.execute(
        update(Course).where(Course.id.in_(request.ids)).values(**update_data)
    )

    await db.commit()

    return {"success": True, "updated": result.rowcount}  # type: ignore


@router.patch("/{course_id}")
async def patch_course(
    course_id: str,
    request: CourseActionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PATCH /api/courses/{course_id}
    Handle singular course actions (publish, clone, etc.)
    """
    result = await db.execute(select(Course).where(Course.id == course_id))
    course = result.scalar_one_or_none()

    if not course:
        raise NotFoundError("Course")

    if request.action == "publish":
        if not await can(db, context, "course:publish"):
            raise RBACError("course:publish")
        course.status = CourseStatus.PUBLISHED
        await db.commit()
        return {"success": True, "status": "PUBLISHED"}

    elif request.action == "unpublish":
        if not await can(db, context, "course:publish"):
            raise RBACError("course:publish")
        course.status = CourseStatus.DRAFT
        await db.commit()
        return {"success": True, "status": "DRAFT"}

    elif request.action == "clone":
        if not await can(db, context, "course:create"):
            raise RBACError("course:create")

        from app.db.models import CourseSection, CourseUnit, UnitStatus

        # 1. Create the new course
        new_course = Course(
            tenant_id=course.tenant_id,
            code=f"{course.code}-COPY-{int(__import__('time').time())}",
            title=f"{course.title} (Copy)",
            description=course.description,
            status=CourseStatus.DRAFT,
            thumbnail_url=course.thumbnail_url,
            is_active=False,
            hidden_from_catalog=course.hidden_from_catalog,
            category_id=course.category_id,
            instructor_id=context.user_id,
        )
        db.add(new_course)
        await db.flush()

        # 2. Clone sections
        sec_result = await db.execute(
            select(CourseSection).where(CourseSection.course_id == course_id)
        )
        sections = sec_result.scalars().all()
        section_map = {}
        for sec in sections:
            new_sec = CourseSection(
                tenant_id=new_course.tenant_id,
                course_id=new_course.id,
                title=sec.title,
                order_index=sec.order_index,
                drip_enabled=sec.drip_enabled,
            )
            db.add(new_sec)
            await db.flush()
            section_map[sec.id] = new_sec.id

        # 3. Clone units
        unit_result = await db.execute(
            select(CourseUnit).where(CourseUnit.course_id == course_id)
        )
        units = unit_result.scalars().all()
        for unit in units:
            new_unit = CourseUnit(
                tenant_id=new_course.tenant_id,
                course_id=new_course.id,
                section_id=section_map.get(unit.section_id) if unit.section_id else None,
                type=unit.type,
                title=unit.title,
                status=UnitStatus.DRAFT,
                order_index=unit.order_index,
                config=unit.config,
            )
            db.add(new_unit)

        await db.commit()
        return {"success": True, "id": new_course.id}

    else:
        raise BadRequestError(f"Invalid action: {request.action}")
