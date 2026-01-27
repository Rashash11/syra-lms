from typing import Annotated, Any, Optional

from app.auth import RequireAuth
from app.db.models import AssignmentSubmission, Course, LearningPath, CourseUnit, Enrollment, EnrollmentStatus, Skill
from app.db.session import get_db
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, or_
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("/grading-hub")
async def get_grading_hub_data(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    tab: str = Query("assignments"),
) -> dict[str, Any]:
    if tab == "assignments":
        query = (
            select(AssignmentSubmission)
            .join(Course, AssignmentSubmission.course_id == Course.id)
            .where(Course.instructor_id == context.user_id)
        )

        result = await db.execute(query)
        submissions = result.scalars().all()

        return {
            "submissions": [
                {
                    "id": s.id,
                    "learnerId": s.user_id,
                    "courseId": s.course_id,
                    "unitId": s.assignment_unit_id,
                    "content": s.content,
                    "submittedAt": (
                        s.submitted_at.isoformat() if s.submitted_at else None
                    ),
                    "status": s.status,
                }
                for s in submissions
            ]
        }
    elif tab == "ilt":
        return {"iltSessions": []}

    return {}


@router.get("/courses")
async def list_instructor_courses(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
) -> dict[str, Any]:
    """
    GET /api/instructor/courses
    List courses managed by the current instructor.
    """
    skip = (page - 1) * limit

    query = select(Course).where(Course.instructor_id == context.user_id)
    count_query = (
        select(func.count())
        .select_from(Course)
        .where(Course.instructor_id == context.user_id)
    )

    if search:
        query = query.where(Course.title.ilike(f"%{search}%"))
        count_query = count_query.where(Course.title.ilike(f"%{search}%"))

    # Total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = query.offset(skip).limit(limit).order_by(Course.updated_at.desc())
    result = await db.execute(query)
    courses = result.scalars().all()

    data = []
    for c in courses:
        data.append(
            {
                "id": c.id,
                "title": c.title,
                "code": c.code,
                "status": (
                    c.status.value if hasattr(c.status, "value") else str(c.status)
                ),
                "thumbnailUrl": c.thumbnail_url,
                "description": c.description,
                "instructorId": c.instructor_id,
                "createdAt": (
                    c.created_at.isoformat() if c.created_at else None
                ),  # Added createdAt
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


@router.get("/groups")
async def list_instructor_groups(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/instructor/groups
    List groups managed by the instructor (Dummy for now).
    """
    # If we had Group.instructor_id or similar, we'd query it.
    # For now return empty or all groups if admin?
    # Returning empty list to satisfy 404 check
    return {
        "data": [],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 0,
            "totalPages": 0,
        },
    }


@router.post("/groups")
async def create_group(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return {"success": True}


@router.post("/calendar/events")
async def create_event(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return {"success": True}


@router.get("/conferences")
async def list_conferences(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/instructor/conferences
    List conferences managed by the instructor (Placeholder).
    """
    return {
        "conferences": [],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 0,
            "totalPages": 0,
        },
    }


@router.post("/conferences")
async def create_conference(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    return {"success": True}


@router.get("/learning-paths")
async def list_instructor_learning_paths(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
) -> dict[str, Any]:
    """
    GET /api/instructor/learning-paths
    List learning paths managed by the current instructor.
    """
    skip = (page - 1) * limit

    query = select(LearningPath).where(LearningPath.instructor_id == context.user_id)
    count_query = (
        select(func.count())
        .select_from(LearningPath)
        .where(LearningPath.instructor_id == context.user_id)
    )

    if search:
        query = query.where(LearningPath.name.ilike(f"%{search}%"))
        count_query = count_query.where(LearningPath.name.ilike(f"%{search}%"))

    # Total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = query.offset(skip).limit(limit).order_by(LearningPath.updated_at.desc())
    result = await db.execute(query)
    paths = result.scalars().all()

    data = []
    for p in paths:
        data.append(
            {
                "id": p.id,
                "name": p.name,
                "code": p.code,
                "status": p.status,
                "description": p.description,
                "instructorId": p.instructor_id,
                "createdAt": (
                    p.created_at.isoformat() if p.created_at else None
                ),
                "updatedAt": (
                    p.updated_at.isoformat() if p.updated_at else None
                ),
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

 

@router.get("/reports")
async def get_instructor_reports(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/instructor/reports
    Get reports/stats for the instructor dashboard.
    """
    # 1. Courses count
    course_count = (
        await db.execute(
            select(func.count())
            .select_from(Course)
            .where(Course.instructor_id == context.user_id)
        )
    ).scalar() or 0

    # 2. Learning Paths count
    lp_count = (
        await db.execute(
            select(func.count())
            .select_from(LearningPath)
            .where(LearningPath.instructor_id == context.user_id)
        )
    ).scalar() or 0

    # 3. Learning Activities (Units in instructor's courses)
    units_query = (
        select(func.count())
        .select_from(CourseUnit)
        .join(Course, CourseUnit.course_id == Course.id)
        .where(Course.instructor_id == context.user_id)
    )
    activities_count = (await db.execute(units_query)).scalar() or 0

    # 4. Training Matrix (Completion Rate)
    # Total enrollments in instructor's courses
    total_enr_query = (
        select(func.count())
        .select_from(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .where(Course.instructor_id == context.user_id)
    )
    total_enr = (await db.execute(total_enr_query)).scalar() or 0

    # Completed enrollments
    completed_enr_query = (
        select(func.count())
        .select_from(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .where(
            Course.instructor_id == context.user_id,
            Enrollment.status == EnrollmentStatus.COMPLETED
        )
    )
    completed_enr = (await db.execute(completed_enr_query)).scalar() or 0

    completion_rate = "0.0"
    if total_enr > 0:
        completion_rate = f"{(completed_enr / total_enr) * 100:.1f}"

    # 5. Timeline (Recent enrollments or submissions?)
    # Let's use count of enrollments in last 30 days as a proxy for timeline volume
    # Or just return 0 as "Coming soon" or similar if logic is complex.
    timeline_count = total_enr

    return {
        "courses": course_count,
        "learningPaths": lp_count,
        "learningActivities": activities_count,
        "trainingMatrix": completion_rate,
        "timeline": timeline_count,
        "trainingTime": "0h 0m", # Placeholder
    }


@router.get("/skills")
async def list_instructor_skills(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    tab: Optional[str] = Query("all"),
    sort: Optional[str] = Query("suggested"),
) -> dict[str, Any]:
    """
    GET /api/instructor/skills
    List skills (for now returns all skills as 'managed' skills logic isn't defined yet).
    """
    skip = (page - 1) * limit

    # For now, instructors can see all skills in tenant
    query = select(Skill).where(Skill.tenant_id == context.tenant_id)
    count_query = (
        select(func.count())
        .select_from(Skill)
        .where(Skill.tenant_id == context.tenant_id)
    )

    if search:
        query = query.where(Skill.name.ilike(f"%{search}%"))
        count_query = count_query.where(Skill.name.ilike(f"%{search}%"))
        
    # Tab Logic (Placeholder)
    # if tab == 'my': ...

    # Sort Logic (Placeholder)
    # if sort == 'suggested': ...

    # Total
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = query.offset(skip).limit(limit).order_by(Skill.name.asc())
    result = await db.execute(query)
    skills = result.scalars().all()

    data = []
    for s in skills:
        data.append(
            {
                "id": s.id,
                "name": s.name,
                "description": s.description,
                "imageUrl": s.image_url,
                "createdAt": (
                    s.created_at.isoformat() if s.created_at else None
                ),
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
# reload
