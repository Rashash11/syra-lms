from typing import Annotated, Any

from app.auth import RequireAuth
from app.db.models import Course, Enrollment, EnrollmentStatus
from app.db.session import get_db
from app.errors import NotFoundError
from app.rbac import can, require_permission
from fastapi import APIRouter, Depends, File, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter()


@router.get("/test")
async def test_route():
    return {"message": "Test route works"}


# ============= Schemas =============


class BulkEnrollRequest(BaseModel):
    userIds: list[str]


# ============= Endpoints =============


@router.get("/{course_id}/units")
async def list_units(
    course_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    return {"data": []}


@router.get("/{course_id}/units/{unit_id}")
async def get_unit(
    course_id: str,
    unit_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    from app.db.models import CourseUnit, Enrollment

    has_read = await can(db, context, "course:read")
    if not has_read and str(context.role) != "LEARNER":
        raise NotFoundError("Unit")
    if str(context.role) == "LEARNER":
        enr = await db.execute(
            select(Enrollment.id).where(
                and_(
                    Enrollment.course_id == course_id,
                    Enrollment.user_id == context.user_id,
                )
            )
        )
        if enr.scalar_one_or_none() is None:
            # Check if enrolled via a Learning Path
            from app.db.models import LearningPathCourse, LearningPathEnrollment

            lp_check = await db.execute(
                select(LearningPathEnrollment.id)
                .join(
                    LearningPathCourse,
                    LearningPathCourse.path_id == LearningPathEnrollment.path_id,
                )
                .where(
                    and_(
                        LearningPathEnrollment.user_id == context.user_id,
                        LearningPathCourse.course_id == course_id,
                    )
                )
            )
            if lp_check.scalar_one_or_none() is None:
                raise NotFoundError("Unit")
    result = await db.execute(
        select(CourseUnit).where(
            and_(CourseUnit.id == unit_id, CourseUnit.course_id == course_id)
        )
    )
    unit = result.scalar_one_or_none()
    if not unit:
        if unit_id == "overview":
            return {
                "id": "overview",
                "title": "Course Overview",
                "type": "TEXT",
                "orderIndex": 1,
                "config": {
                    "content": "<p>Welcome to this course. Start with the overview.</p>"
                },
            }
        raise NotFoundError("Unit")
    return {
        "id": unit.id,
        "title": unit.title,
        "type": unit.type.value if hasattr(unit.type, "value") else str(unit.type),
        "orderIndex": unit.order_index,
        "config": unit.config or {},
    }


@router.get("/{course_id}/files")
async def list_course_files(
    course_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> list[dict[str, Any]]:
    await require_permission(db, context, "course:read")
    return []


class ReorderRequest(BaseModel):
    sections: list[dict[str, Any]] | None = None
    units: list[dict[str, Any]] | None = None


@router.patch("/{course_id}/reorder")
async def reorder_course(
    course_id: str,
    request: ReorderRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "course:update")
    return {"success": True}


class ImportUnitRequest(BaseModel):
    sourceCourseId: str
    sourceUnitId: str
    mode: str = "clone"


class CreateUnitRequest(BaseModel):
    type: str
    title: str
    config: dict = {}
    status: str = "DRAFT"
    sectionId: str | None = None
    orderIndex: int | None = None


class UpdateUnitRequest(BaseModel):
    title: str | None = None
    config: dict | None = None
    status: str | None = None


class CreateSectionRequest(BaseModel):
    title: str
    orderIndex: int | None = None


class UpdateSectionRequest(BaseModel):
    title: str | None = None


@router.post("/{course_id}/import-unit")
async def import_unit(
    course_id: str,
    request: ImportUnitRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "course:update")
    return {"success": True}


@router.post("/{course_id}/units")
async def create_unit(
    course_id: str,
    request: CreateUnitRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    print(f"DEBUG: Inside create_unit with request: {request}")
    from app.db.models import CourseUnit, UnitStatus, UnitType

    await require_permission(db, context, "course:update")

    # Calculate order index if not provided
    if request.orderIndex is None:
        # Find max order index for this section (or unassigned if sectionId is None)
        query = select(func.max(CourseUnit.order_index)).where(
            and_(
                CourseUnit.course_id == course_id,
                CourseUnit.section_id == request.sectionId,
            )
        )
        result = await db.execute(query)
        max_order = result.scalar()
        order_index = (max_order or 0) + 1
    else:
        order_index = request.orderIndex

    try:
        unit_type = UnitType(request.type)
    except ValueError:
        # Fallback for types not matching exactly or if lower/upper case mismatch
        # Try upper case
        try:
            unit_type = UnitType(request.type.upper())
        except ValueError:
            # Default to TEXT if unknown
            unit_type = UnitType.TEXT

    new_unit = CourseUnit(
        tenant_id=context.tenant_id,
        course_id=course_id,
        section_id=request.sectionId,
        type=unit_type,
        title=request.title,
        status=UnitStatus(request.status),
        config=request.config,
        order_index=order_index,
    )
    db.add(new_unit)
    await db.commit()
    await db.refresh(new_unit)

    return {
        "id": new_unit.id,
        "title": new_unit.title,
        "type": (
            new_unit.type.value
            if hasattr(new_unit.type, "value")
            else str(new_unit.type)
        ),
        "orderIndex": new_unit.order_index,
        "config": new_unit.config,
        "sectionId": new_unit.section_id,
        "status": (
            new_unit.status.value
            if hasattr(new_unit.status, "value")
            else str(new_unit.status)
        ),
        "courseId": new_unit.course_id,
    }


@router.put("/{course_id}/units/{unit_id}")
async def update_unit(
    course_id: str,
    unit_id: str,
    request: UpdateUnitRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    from app.db.models import CourseUnit, UnitStatus

    await require_permission(db, context, "course:update")

    result = await db.execute(
        select(CourseUnit).where(
            and_(CourseUnit.id == unit_id, CourseUnit.course_id == course_id)
        )
    )
    unit = result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit")

    if request.title is not None:
        unit.title = request.title
    if request.config is not None:
        # For now, let's assume partial updates if it was a dict, but here we replace
        # top keys? Actually frontend sends full config usually. Let's do a merge if
        # needed or just update. But JSONB updates can be tricky. Let's replace for now
        # as usually frontend sends full config state.
        # Wait, frontend sends { config: newConfig }.
        unit.config = request.config
    if request.status is not None:
        unit.status = UnitStatus(request.status)

    await db.commit()
    await db.refresh(unit)
    return {"success": True}


@router.delete("/{course_id}/units/{unit_id}")
async def delete_unit(
    course_id: str,
    unit_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    from app.db.models import CourseUnit

    await require_permission(db, context, "course:update")

    result = await db.execute(
        select(CourseUnit).where(
            and_(CourseUnit.id == unit_id, CourseUnit.course_id == course_id)
        )
    )
    unit = result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit")

    await db.delete(unit)
    await db.commit()
    return {"success": True}


@router.get("/{course_id}/sections")
async def list_sections(
    course_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    # This is usually covered by get_course but if needed separately
    return {"data": []}


@router.post("/{course_id}/sections")
async def create_section(
    course_id: str,
    request: CreateSectionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    from app.db.models import CourseSection

    await require_permission(db, context, "course:update")

    if request.orderIndex is None:
        query = select(func.max(CourseSection.order_index)).where(
            CourseSection.course_id == course_id
        )
        result = await db.execute(query)
        max_order = result.scalar()
        order_index = (max_order or 0) + 1
    else:
        order_index = request.orderIndex

    new_section = CourseSection(
        course_id=course_id, title=request.title, order_index=order_index
    )
    db.add(new_section)
    await db.commit()
    await db.refresh(new_section)

    return {
        "id": new_section.id,
        "title": new_section.title,
        "orderIndex": new_section.order_index,
        "units": [],
    }


@router.put("/{course_id}/sections/{section_id}")
async def update_section(
    course_id: str,
    section_id: str,
    request: UpdateSectionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    from app.db.models import CourseSection

    await require_permission(db, context, "course:update")

    result = await db.execute(
        select(CourseSection).where(
            and_(CourseSection.id == section_id, CourseSection.course_id == course_id)
        )
    )
    section = result.scalar_one_or_none()
    if not section:
        raise NotFoundError("Section")

    if request.title is not None:
        section.title = request.title

    await db.commit()
    return {"success": True}


@router.delete("/{course_id}/sections/{section_id}")
async def delete_section(
    course_id: str,
    section_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    from app.db.models import CourseSection

    await require_permission(db, context, "course:update")

    result = await db.execute(
        select(CourseSection).where(
            and_(CourseSection.id == section_id, CourseSection.course_id == course_id)
        )
    )
    section = result.scalar_one_or_none()
    if not section:
        raise NotFoundError("Section")

    await db.delete(section)
    await db.commit()
    return {"success": True}


@router.get("/{course_id}/enrollments")
async def list_course_enrollments(
    course_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    await require_permission(db, context, "course:read")

    result = await db.execute(
        select(Enrollment)
        .options(selectinload(Enrollment.user))
        .where(Enrollment.course_id == course_id)
        # .order_by(Enrollment.enrolled_at.desc())  # Field removed from model
    )
    enrollments = result.scalars().all()

    data = []
    for enr in enrollments:
        data.append(
            {
                "id": enr.id,
                "userId": enr.user_id,
                "status": (
                    enr.status.value
                    if hasattr(enr.status, "value")
                    else str(enr.status)
                ),
                "progress": enr.progress,
                "enrolledAt": enr.created_at.isoformat() if enr.created_at else None,
                "completedAt": (
                    enr.completed_at.isoformat() if enr.completed_at else None
                ),
                "user": (
                    {
                        "id": enr.user.id,
                        "name": f"{enr.user.first_name} {enr.user.last_name}",
                        "firstName": enr.user.first_name,
                        "lastName": enr.user.last_name,
                        "email": enr.user.email,
                    }
                    if enr.user
                    else None
                ),
            }
        )

    return {"enrollments": data, "data": data}


@router.post("/{course_id}/enrollments")
async def add_course_enrollment(
    course_id: str,
    request: BulkEnrollRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "course:update")

    # Check course
    course_res = await db.execute(select(Course).where(Course.id == course_id))
    if not course_res.scalar_one_or_none():
        raise NotFoundError("Course")

    for user_id in request.userIds:
        # Check if already enrolled
        existing = await db.execute(
            select(Enrollment).where(
                and_(Enrollment.course_id == course_id, Enrollment.user_id == user_id)
            )
        )
        if existing.scalar_one_or_none():
            continue

        enr = Enrollment(
            tenant_id=context.tenant_id,
            user_id=user_id,
            course_id=course_id,
            status=EnrollmentStatus.NOT_STARTED,
            progress=0,
        )
        db.add(enr)

    await db.commit()
    return {"success": True}


@router.delete("/{course_id}/enrollments")
async def remove_course_enrollment(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    enrollmentId: str = Query(...),
) -> dict:
    await require_permission(db, context, "course:update")

    await db.execute(
        delete(Enrollment).where(
            and_(Enrollment.id == enrollmentId, Enrollment.course_id == course_id)
        )
    )
    await db.commit()
    return {"success": True}


@router.get("/{course_id}/enrollment-requests")
async def list_enrollment_requests(
    course_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    return {"requests": [], "data": []}


@router.post("/{course_id}/image")
async def set_course_image(
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
) -> dict:
    from app.routes.uploads import PRIMARY_UPLOADS_DIR, SECONDARY_UPLOADS_DIR
    import uuid
    from pathlib import Path

    await require_permission(db, context, "course:update")

    # Check course
    course_res = await db.execute(select(Course).where(Course.id == course_id))
    course = course_res.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course")

    # Save file
    suffix = Path(str(file.filename)).suffix or ".png"
    unique_name = f"course-{course_id}-{uuid.uuid4().hex[:8]}{suffix}"
    
    contents = await file.read()
    
    # Write to primary
    try:
        with open(PRIMARY_UPLOADS_DIR / unique_name, "wb") as f:
            f.write(contents)
    except Exception:
        pass
    # Also write to secondary for compatibility
    try:
        with open(SECONDARY_UPLOADS_DIR / unique_name, "wb") as f:
            f.write(contents)
    except Exception:
        pass

    image_url = f"/files/{unique_name}"
    
    # Update course
    course.thumbnail_url = image_url
    await db.commit()

    return {"ok": True, "imageUrl": image_url}
