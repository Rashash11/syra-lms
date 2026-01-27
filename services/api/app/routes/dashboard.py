import json
from typing import Annotated, Any

from app.auth import RequireAuth
from app.db.models import Branch, Course, CourseStatus, TimelineEvent, User
from app.db.session import get_db
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get("")
async def dashboard_alias(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/dashboard
    Returns dashboard statistics, timeline, and recent courses.
    """
    print(f">>> REACHED DASHBOARD ALIAS ENDPOINT for tenant {context.tenant_id} <<<")
    try:
        # ACTIVE USERS
        active_users_res = await db.execute(
            select(func.count())
            .select_from(User)
            .where(
                (User.tenant_id == context.tenant_id)
                & (User.is_active == True)  # noqa: E712
            )
        )
        active_users = active_users_res.scalar() or 0

        # TOTAL USERS
        total_users_res = await db.execute(
            select(func.count())
            .select_from(User)
            .where(User.tenant_id == context.tenant_id)
        )
        total_users = total_users_res.scalar() or 0

        # TOTAL COURSES
        total_courses_res = await db.execute(
            select(func.count())
            .select_from(Course)
            .where(Course.tenant_id == context.tenant_id)
        )
        total_courses = total_courses_res.scalar() or 0

        # PUBLISHED COURSES
        published_courses_res = await db.execute(
            select(func.count())
            .select_from(Course)
            .where(
                (Course.tenant_id == context.tenant_id)
                & (Course.status == CourseStatus.PUBLISHED)
            )
        )
        published_courses = published_courses_res.scalar() or 0

        # BRANCHES
        branches_res = await db.execute(
            select(func.count())
            .select_from(Branch)
            .where(Branch.tenant_id == context.tenant_id)
        )
        total_branches = branches_res.scalar() or 0

        # TIMELINE EVENTS
        timeline = []
        try:
            timeline_res = await db.execute(
                select(
                    TimelineEvent.id,
                    TimelineEvent.event_type,
                    TimelineEvent.data,
                    TimelineEvent.created_at,
                )
                .where(TimelineEvent.tenant_id == context.tenant_id)
                .order_by(TimelineEvent.created_at.desc())
                .limit(5)
            )
            for row in timeline_res.all():
                details = row.data
                if isinstance(details, str):
                    try:
                        details = json.loads(details)
                    except ValueError:
                        details = {}
                timeline.append(
                    {
                        "id": row.id,
                        "eventType": row.event_type,
                        "details": details or {},
                        "timestamp": (
                            row.created_at.isoformat()
                            if getattr(row, "created_at", None)
                            else None
                        ),
                    }
                )
        except Exception as e:
            print(f"Error fetching timeline: {e}")
            import traceback
            traceback.print_exc()
            # Don't fail the whole dashboard if timeline fails
            pass

        # RECENT COURSES
        recent_courses = []
        try:
            recent_courses_res = await db.execute(
                select(Course.id, Course.title, Course.status, Course.created_at)
                .where(Course.tenant_id == context.tenant_id)
                .order_by(Course.created_at.desc())
                .limit(4)
            )
            for row in recent_courses_res.all():
                recent_courses.append(
                    {
                        "id": row.id,
                        "title": row.title,
                        "status": row.status,
                        "createdAt": (
                            row.created_at.isoformat()
                            if getattr(row, "created_at", None)
                            else None
                        ),
                    }
                )
        except Exception as e:
            print(f"Error fetching recent courses: {e}")
            import traceback
            traceback.print_exc()

        # Fallback: if no timeline events, synthesize from recent courses
        if not timeline and recent_courses:
            for rc in recent_courses[:5]:
                timeline.append(
                    {
                        "id": rc["id"],
                        "eventType": "COURSE_CREATED",
                        "details": {"title": rc["title"]},
                        "timestamp": rc["createdAt"],
                    }
                )

        return {
            "stats": {
                "activeUsers": active_users,
                "totalUsers": total_users,
                "totalCourses": total_courses,
                "publishedCourses": published_courses,
                "totalBranches": total_branches,
            },
            "timeline": timeline,
            "recentCourses": recent_courses,
            "trainingTime": "12h 45m",  # Mock data for now
        }
    except Exception as e:
        print(f"CRITICAL ERROR in dashboard_alias: {e}")
        import traceback
        traceback.print_exc()
        # Re-raise to let FastAPI handle it (returns 500)
        raise
