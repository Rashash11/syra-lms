from typing import Annotated, Any, Optional

from app.auth import RequireAuth
from app.db.models import Assignment, Course, CourseUnit, Enrollment, EnrollmentStatus, LearningPath, LearningPathEnrollment
from app.db.session import get_db
from app.errors import NotFoundError
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter()


@router.get("/progress")
async def get_learner_progress(
    courseId: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    """Get learner progress for a specific course"""
    # Verify enrollment
    result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == context.user_id, Enrollment.course_id == courseId
        )
    )
    enrollment = result.scalar_one_or_none()

    if not enrollment:
        raise NotFoundError("Enrollment")

    completed_unit_ids: list[str] = []

    return {
        "courseId": courseId,
        "progress": enrollment.progress,
        "status": enrollment.status,
        "completedAt": enrollment.completed_at,
        "completedUnitIds": completed_unit_ids,
    }


@router.post("/progress/units/{unitId}/complete")
async def mark_unit_complete(
    unitId: str, context: RequireAuth, db: Annotated[AsyncSession, Depends(get_db)]
) -> dict:
    unit_result = await db.execute(select(CourseUnit).where(CourseUnit.id == unitId))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit")
    courseId = unit.course_id
    enrollment_result = await db.execute(
        select(Enrollment).where(
            Enrollment.user_id == context.user_id, Enrollment.course_id == courseId
        )
    )
    enrollment = enrollment_result.scalar_one_or_none()
    if not enrollment:
        raise NotFoundError("Enrollment")
    total_units_result = await db.execute(
        select(func.count())
        .select_from(CourseUnit)
        .where(CourseUnit.course_id == courseId)
    )
    total_units = total_units_result.scalar() or 1
    step = max(1, int(100 / total_units))
    new_progress = min(100, enrollment.progress + step)
    enrollment.progress = new_progress
    if enrollment.status == EnrollmentStatus.NOT_STARTED:
        enrollment.status = EnrollmentStatus.IN_PROGRESS
    if new_progress == 100:
        enrollment.status = EnrollmentStatus.COMPLETED
    await db.commit()
    return {"percent": enrollment.progress}


@router.get("/enrollments")
async def list_learner_enrollments(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
) -> dict[str, Any]:
    """
    GET /api/learner/enrollments
    List enrollments for the current learner.
    """
    skip = (page - 1) * limit

    query = select(Enrollment).where(Enrollment.user_id == context.user_id)
    count_query = (
        select(func.count())
        .select_from(Enrollment)
        .where(Enrollment.user_id == context.user_id)
    )

    if status and status != "ALL":
        query = query.where(Enrollment.status == status)
        count_query = count_query.where(Enrollment.status == status)

    if search:
        # Join with Course to search by title
        query = query.join(Enrollment.course).where(Course.title.ilike(f"%{search}%"))
        count_query = count_query.join(Enrollment.course).where(
            Course.title.ilike(f"%{search}%")
        )

    # Get total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Execute query
    query = (
        query.options(selectinload(Enrollment.course))
        .offset(skip)
        .limit(limit)
        .order_by(Enrollment.id.desc())
    )

    enrollments = (await db.execute(query)).scalars().all()

    data = []
    for enrollment in enrollments:
        course_data = None
        if enrollment.course:
            course_data = {
                "id": enrollment.course.id,
                "title": enrollment.course.title,
                "code": enrollment.course.code,
                "thumbnailUrl": enrollment.course.thumbnail_url,
                "description": enrollment.course.description,
            }

        data.append(
            {
                "id": enrollment.id,
                "userId": enrollment.user_id,
                "courseId": enrollment.course_id,
                "status": (
                    enrollment.status.value
                    if hasattr(enrollment.status, "value")
                    else str(enrollment.status)
                ),
                "progress": enrollment.progress,
                "enrolledAt": None,
                "completedAt": (
                    enrollment.completed_at.isoformat()
                    if enrollment.completed_at
                    else None
                ),
                "course": course_data,
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


@router.get("/assignments")
async def list_learner_assignments(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    courseId: Optional[str] = None,
) -> dict[str, Any]:
    """
    GET /api/learner/assignments
    List assignments for courses the learner is enrolled in.
    """
    # 1. Get enrolled course IDs
    enrollment_query = select(Enrollment.course_id).where(
        Enrollment.user_id == context.user_id
    )
    enrollment_result = await db.execute(enrollment_query)
    enrolled_course_ids = [row[0] for row in enrollment_result.all()]

    if not enrolled_course_ids:
        return {
            "data": [],
            "pagination": {"page": page, "limit": limit, "total": 0, "totalPages": 0},
        }

    skip = (page - 1) * limit

    query = select(Assignment).where(Assignment.course_id.in_(enrolled_course_ids))
    count_query = (
        select(func.count())
        .select_from(Assignment)
        .where(Assignment.course_id.in_(enrolled_course_ids))
    )

    if courseId:
        if courseId not in enrolled_course_ids:
            return {
                "data": [],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": 0,
                    "totalPages": 0,
                },
            }
        query = query.where(Assignment.course_id == courseId)
        count_query = count_query.where(Assignment.course_id == courseId)

    # Get total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Execute
    query = (
        query.options(selectinload(Assignment.course))
        .offset(skip)
        .limit(limit)
        .order_by(Assignment.due_at.asc().nulls_last())
    )

    result = await db.execute(query)
    assignments = result.scalars().all()

    data = []
    for a in assignments:
        course_data = None
        if a.course:
            course_data = {
                "title": a.course.title,
                "code": a.course.code,
            }

        data.append(
            {
                "id": a.id,
                "title": a.title,
                "description": a.description,
                "courseId": a.course_id,
                "dueAt": a.due_at.isoformat() if a.due_at else None,
                "course": course_data,
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


@router.post("/courses/{course_id}/last-unit")
async def update_last_unit(
    course_id: str,
    context: RequireAuth,
) -> dict[str, Any]:
    """
    POST /api/learner/courses/{course_id}/last-unit
    Stub endpoint for updating last accessed unit.
    """
    # In a real implementation, this would update the Enrollment record
    return {"success": True}
@router.get("/learning-paths")
async def list_learner_learning_paths(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/learner/learning-paths
    List learning paths enrolled by the current learner.
    """
    query = (
        select(LearningPathEnrollment)
        .options(
            selectinload(LearningPathEnrollment.path)
            .selectinload(LearningPath.courses)
        )
        .where(LearningPathEnrollment.user_id == context.user_id)
        .order_by(LearningPathEnrollment.enrolled_at.desc())
    )

    result = await db.execute(query)
    enrollments = result.scalars().all()

    # Get all course enrollments for this user to calculate real progress
    enr_res = await db.execute(
        select(Enrollment).where(Enrollment.user_id == context.user_id)
    )
    user_course_enrollments = {e.course_id: e for e in enr_res.scalars().all()}

    data = []
    for enr in enrollments:
        lp = enr.path
        if not lp:
            continue
            
        course_ids = [c.id for c in lp.courses] if lp.courses else []
        total_courses = len(course_ids)
        
        if total_courses > 0:
            completed_courses = 0
            total_progress = 0
            for cid in course_ids:
                if cid in user_course_enrollments:
                    ce = user_course_enrollments[cid]
                    if ce.status == EnrollmentStatus.COMPLETED or ce.progress == 100:
                        completed_courses += 1
                    total_progress += ce.progress
            
            # Use average progress of courses
            calculated_progress = int(total_progress / total_courses)
            # Update the DB record if it differs (optional, but good for persistence)
            if enr.progress != calculated_progress:
                enr.progress = calculated_progress
                if calculated_progress == 100:
                    enr.status = "COMPLETED"
                elif calculated_progress > 0:
                    enr.status = "IN_PROGRESS"
                db.add(enr)
        else:
            calculated_progress = enr.progress

        data.append({
            "id": enr.id,
            "pathId": enr.path_id,
            "status": enr.status,
            "progress": calculated_progress,
            "enrolledAt": enr.enrolled_at.isoformat() if enr.enrolled_at else None,
            "learningPath": {
                "id": lp.id,
                "name": lp.name,
                "description": lp.description,
                "courseCount": total_courses,
            }
        })

    await db.commit()
    return {"data": data}
