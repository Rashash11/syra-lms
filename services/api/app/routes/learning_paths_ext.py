from typing import Annotated, Optional

from app.auth import RequireAuth
from app.db.models import (
    Course,
    LearningPath,
    LearningPathCourse,
    LearningPathEnrollment,
    LearningPathSection,
    UnlockType,
    User,
)
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError
from app.rbac import require_permission
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter()

# ============= Schemas =============


class AddCourseRequest(BaseModel):
    courseId: str
    sectionId: Optional[str] = None
    unlockType: Optional[str] = None
    unlockCourseId: Optional[str] = None
    minScore: Optional[int] = None


class AddEnrollmentRequest(BaseModel):
    userId: Optional[str] = None
    userIds: Optional[list[str]] = None
    role: Optional[str] = "LEARNER"


class SectionRequest(BaseModel):
    name: str
    order: Optional[int] = None


class ReorderRequest(BaseModel):
    ids: list[str]


class MoveCourseRequest(BaseModel):
    items: list[dict]


# ============= Endpoints =============


@router.get("/{path_id}/courses")
async def list_lp_courses(
    path_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    await require_permission(db, context, "learning_path:read")

    result = await db.execute(
        select(LearningPathCourse)
        .options(selectinload(LearningPathCourse.course))
        .where(LearningPathCourse.path_id == path_id)
        .order_by(LearningPathCourse.order.asc())
    )
    lp_courses = result.scalars().all()

    data = []
    for lpc in lp_courses:
        data.append(
            {
                "id": lpc.id,
                "courseId": lpc.course_id,
                "order": lpc.order,
                "sectionId": lpc.section_id,
                "course": (
                    {
                        "id": lpc.course.id,
                        "title": lpc.course.title,
                        "code": lpc.course.code,
                        "thumbnailUrl": lpc.course.thumbnail_url,
                    }
                    if lpc.course
                    else None
                ),
            }
        )

    return {"data": data}


@router.post("/{path_id}/courses")
async def add_lp_course(
    path_id: str,
    request: AddCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "learning_path:update")

    # Check if exists
    lp_res = await db.execute(select(LearningPath).where(LearningPath.id == path_id))
    lp = lp_res.scalar_one_or_none()
    if not lp:
        raise NotFoundError("LearningPath")
    # Auto-fix legacy records missing tenantId
    if not lp.tenant_id:
        if not context.tenant_id:
            raise ValueError("Tenant ID missing in context")
        lp.tenant_id = context.tenant_id
        await db.commit()
        await db.refresh(lp)
    # Enforce tenant match
    if lp.tenant_id != context.tenant_id:
        raise BadRequestError("Learning path belongs to a different tenant")

    # Check course
    course_res = await db.execute(
        select(Course).where(
            (Course.id == request.courseId) & (Course.tenant_id == context.tenant_id)
        )
    )
    if not course_res.scalar_one_or_none():
        raise NotFoundError("Course")

    # Check if already in path
    existing = await db.execute(
        select(LearningPathCourse).where(
            and_(
                LearningPathCourse.path_id == path_id,
                LearningPathCourse.course_id == request.courseId,
            )
        )
    )
    if existing.scalar_one_or_none():
        raise BadRequestError("Course already in learning path")

    # Get max order
    order_res = await db.execute(
        select(func.max(LearningPathCourse.order)).where(
            LearningPathCourse.path_id == path_id
        )
    )
    max_order = order_res.scalar() or 0

    lpc = LearningPathCourse(
        tenant_id=context.tenant_id,
        path_id=path_id,
        course_id=request.courseId,
        section_id=request.sectionId,
        order=max_order + 1,
    )
    if request.unlockType:
        try:
            lpc.unlock_type = (
                UnlockType[request.unlockType]
                if hasattr(UnlockType, request.unlockType)
                else UnlockType.NONE
            )
        except Exception:
            lpc.unlock_type = UnlockType.NONE
    if request.unlockCourseId:
        lpc.unlock_course_id = request.unlockCourseId
    if request.minScore is not None:
        lpc.min_score = request.minScore
    db.add(lpc)
    await db.commit()

    return {"success": True, "id": lpc.id}


@router.delete("/{path_id}/courses/{course_id}")
async def remove_lp_course(
    path_id: str,
    course_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "learning_path:update")

    await db.execute(
        delete(LearningPathCourse).where(
            and_(
                LearningPathCourse.path_id == path_id,
                LearningPathCourse.course_id == course_id,
            )
        )
    )
    await db.commit()
    return {"success": True}


@router.patch("/{path_id}/courses/reorder")
async def reorder_lp_courses(
    path_id: str,
    request: MoveCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "learning_path:update")
    if not request.items:
        return {"success": True}

    result = await db.execute(
        select(LearningPathCourse)
        .where(LearningPathCourse.path_id == path_id)
        .order_by(LearningPathCourse.order.asc())
        .options(selectinload(LearningPathCourse.course))
    )
    lpcs = result.scalars().all()
    by_id = {pc.id: pc for pc in lpcs}

    groups: dict[str | None, list[LearningPathCourse]] = {}
    for pc in lpcs:
        sid = pc.section_id
        groups.setdefault(sid, []).append(pc)

    for item in request.items:
        iid = str(item.get("id"))
        target_section = item.get("sectionId", None)
        target_index = int(item.get("order", 0))
        target_pc = by_id.get(iid)
        if not target_pc:
            continue
        current_sid = target_pc.section_id
        current_list = groups.get(current_sid, [])
        try:
            current_list.remove(target_pc)
        except ValueError:
            pass
        dest_list = groups.setdefault(target_section, [])
        if target_index < 0:
            target_index = 0
        if target_index > len(dest_list):
            target_index = len(dest_list)
        dest_list.insert(target_index, target_pc)
        target_pc.section_id = target_section

    for sid, lst in groups.items():
        for idx, pc in enumerate(lst):
            pc.order = idx
            pc.section_id = sid
            db.add(pc)
    await db.commit()
    return {"success": True}


@router.get("/{path_id}/enrollments")
async def list_lp_enrollments(
    path_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    await require_permission(db, context, "learning_path:read")

    result = await db.execute(
        select(LearningPathEnrollment)
        .options(selectinload(LearningPathEnrollment.user))
        .where(LearningPathEnrollment.path_id == path_id)
        .order_by(LearningPathEnrollment.enrolled_at.desc())
    )
    enrollments = result.scalars().all()

    data = []
    for enr in enrollments:
        data.append(
            {
                "id": enr.id,
                "userId": enr.user_id,
                "status": enr.status,
                "progress": enr.progress,
                "enrolledAt": enr.enrolled_at.isoformat() if enr.enrolled_at else None,
                "role": "LEARNER",  # Fixed role for now
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


@router.post("/{path_id}/enrollments")
async def add_lp_enrollment(
    path_id: str,
    request: AddEnrollmentRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "learning_path:update")

    # Check if path exists
    path_res = await db.execute(select(LearningPath).where(LearningPath.id == path_id))
    if not path_res.scalar_one_or_none():
        raise NotFoundError("LearningPath")

    uids = (
        request.userIds
        if request.userIds
        else ([request.userId] if request.userId else [])
    )

    for uid in uids:
        # Check user
        user_res = await db.execute(select(User).where(User.id == uid))
        if not user_res.scalar_one_or_none():
            continue

        # Check if already enrolled
        existing = await db.execute(
            select(LearningPathEnrollment).where(
                and_(
                    LearningPathEnrollment.path_id == path_id,
                    LearningPathEnrollment.user_id == uid,
                )
            )
        )
        if existing.scalar_one_or_none():
            continue

        enr = LearningPathEnrollment(
            tenant_id=context.tenant_id,
            user_id=uid,
            path_id=path_id,
            status="NOT_STARTED",
            progress=0,
        )
        db.add(enr)

        # Auto-enroll user in all courses in this path
        courses_res = await db.execute(
            select(LearningPathCourse.course_id).where(
                LearningPathCourse.path_id == path_id
            )
        )
        course_ids = courses_res.scalars().all()

        from app.db.models import Enrollment, EnrollmentStatus

        for cid in course_ids:
            # Check if already enrolled in the course
            course_enr_res = await db.execute(
                select(Enrollment).where(
                    (Enrollment.user_id == uid) & (Enrollment.course_id == cid)
                )
            )
            if not course_enr_res.scalar_one_or_none():
                new_course_enr = Enrollment(
                    tenant_id=context.tenant_id,
                    user_id=uid,
                    course_id=cid,
                    status=EnrollmentStatus.NOT_STARTED,
                    progress=0,
                )
                db.add(new_course_enr)

    await db.commit()
    return {"success": True}


@router.delete("/{path_id}/enrollments")
async def remove_lp_enrollment(
    path_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    userId: str = Query(...),
) -> dict:
    await require_permission(db, context, "learning_path:update")

    await db.execute(
        delete(LearningPathEnrollment).where(
            and_(
                LearningPathEnrollment.user_id == userId,
                LearningPathEnrollment.path_id == path_id,
            )
        )
    )
    await db.commit()
    return {"success": True}


# Placeholder for sections to avoid 404s/500s if UI calls them
@router.get("/{path_id}/sections")
async def list_lp_sections(
    path_id: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    await require_permission(db, context, "learning_path:read")
    return {"data": []}


@router.post("/{path_id}/sections")
async def create_lp_section(
    path_id: str,
    request: SectionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "learning_path:update")

    # Get max order if not provided
    if request.order is None:
        result = await db.execute(
            select(func.max(LearningPathSection.order)).where(
                LearningPathSection.path_id == path_id
            )
        )
        max_order = result.scalar() or 0
        order = max_order + 1
    else:
        order = request.order

    new_section = LearningPathSection(
        tenant_id=context.tenant_id, path_id=path_id, name=request.name, order=order
    )
    db.add(new_section)
    await db.commit()
    await db.refresh(new_section)
    return {"success": True, "id": new_section.id}


@router.patch("/{path_id}/sections/{section_id}")
async def update_lp_section(
    path_id: str,
    section_id: str,
    request: SectionRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "learning_path:update")
    result = await db.execute(
        select(LearningPathSection).where(LearningPathSection.id == section_id)
    )
    section = result.scalar_one_or_none()
    if not section:
        raise NotFoundError("Section")

    section.name = request.name
    await db.commit()
    return {"success": True}


@router.delete("/{path_id}/sections/{section_id}")
async def delete_lp_section(
    path_id: str,
    section_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    await require_permission(db, context, "learning_path:update")
    await db.execute(
        delete(LearningPathSection).where(LearningPathSection.id == section_id)
    )
    await db.commit()
    return {"success": True}
