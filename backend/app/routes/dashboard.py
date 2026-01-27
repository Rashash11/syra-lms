"""
Dashboard Routes

Dashboard data and statistics for different user roles.
"""

from typing import Annotated, Any

from app.auth import RequireAuth
from app.db.models import Course, CourseStatus, Enrollment, EnrollmentStatus, User, UserStatus
from app.db.session import get_db
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


# ============= Response Schemas =============

class DashboardStats(BaseModel):
    totalUsers: int = 0
    activeUsers: int = 0
    totalCourses: int = 0
    publishedCourses: int = 0
    totalEnrollments: int = 0
    completedEnrollments: int = 0


class RecentActivity(BaseModel):
    type: str
    title: str
    description: str
    timestamp: str
    userId: str | None = None
    courseId: str | None = None


class DashboardResponse(BaseModel):
    stats: DashboardStats
    recentActivity: list[RecentActivity] = []
    userRole: str
    userName: str


# ============= Endpoints =============

@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get dashboard data based on user role."""
    
    # Get current user info
    user_stmt = select(User).where(User.id == context.user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalar_one()
    
    stats = DashboardStats()
    recent_activity = []
    
    # Admin and Super Instructor get full stats
    if context.role in ["ADMIN", "SUPER_INSTRUCTOR"]:
        # User stats
        total_users_stmt = select(func.count()).select_from(User).where(User.tenant_id == context.tenant_id)
        total_users_result = await db.execute(total_users_stmt)
        stats.totalUsers = total_users_result.scalar() or 0
        
        active_users_stmt = select(func.count()).select_from(User).where(
            User.tenant_id == context.tenant_id,
            User.status == UserStatus.ACTIVE
        )
        active_users_result = await db.execute(active_users_stmt)
        stats.activeUsers = active_users_result.scalar() or 0
        
        # Course stats
        total_courses_stmt = select(func.count()).select_from(Course).where(Course.tenant_id == context.tenant_id)
        total_courses_result = await db.execute(total_courses_stmt)
        stats.totalCourses = total_courses_result.scalar() or 0
        
        published_courses_stmt = select(func.count()).select_from(Course).where(
            Course.tenant_id == context.tenant_id,
            Course.status == CourseStatus.PUBLISHED
        )
        published_courses_result = await db.execute(published_courses_stmt)
        stats.publishedCourses = published_courses_result.scalar() or 0
        
        # Enrollment stats
        total_enrollments_stmt = select(func.count()).select_from(Enrollment).join(Course).where(
            Course.tenant_id == context.tenant_id
        )
        total_enrollments_result = await db.execute(total_enrollments_stmt)
        stats.totalEnrollments = total_enrollments_result.scalar() or 0
        
        completed_enrollments_stmt = select(func.count()).select_from(Enrollment).join(Course).where(
            Course.tenant_id == context.tenant_id,
            Enrollment.status == EnrollmentStatus.COMPLETED
        )
        completed_enrollments_result = await db.execute(completed_enrollments_stmt)
        stats.completedEnrollments = completed_enrollments_result.scalar() or 0
        
        # Recent activity - recent enrollments
        recent_enrollments_stmt = select(Enrollment, Course, User).join(Course).join(User).where(
            Course.tenant_id == context.tenant_id
        ).order_by(Enrollment.enrolled_at.desc()).limit(5)
        
        recent_enrollments_result = await db.execute(recent_enrollments_stmt)
        recent_enrollments = recent_enrollments_result.all()
        
        for enrollment, course, enrolled_user in recent_enrollments:
            recent_activity.append(RecentActivity(
                type="enrollment",
                title="New Enrollment",
                description=f"{enrolled_user.full_name} enrolled in {course.title}",
                timestamp=enrollment.enrolled_at.isoformat(),
                userId=enrolled_user.id,
                courseId=course.id,
            ))
    
    # Instructor gets course-specific stats
    elif context.role == "INSTRUCTOR":
        # For now, show basic stats - in a full implementation, 
        # we'd filter by courses the instructor manages
        total_courses_stmt = select(func.count()).select_from(Course).where(
            Course.tenant_id == context.tenant_id,
            Course.status == CourseStatus.PUBLISHED
        )
        total_courses_result = await db.execute(total_courses_stmt)
        stats.totalCourses = total_courses_result.scalar() or 0
        stats.publishedCourses = stats.totalCourses
    
    # Learner gets personal stats
    elif context.role == "LEARNER":
        # Personal enrollment stats
        user_enrollments_stmt = select(func.count()).select_from(Enrollment).where(
            Enrollment.user_id == context.user_id
        )
        user_enrollments_result = await db.execute(user_enrollments_stmt)
        stats.totalEnrollments = user_enrollments_result.scalar() or 0
        
        completed_enrollments_stmt = select(func.count()).select_from(Enrollment).where(
            Enrollment.user_id == context.user_id,
            Enrollment.status == EnrollmentStatus.COMPLETED
        )
        completed_enrollments_result = await db.execute(completed_enrollments_stmt)
        stats.completedEnrollments = completed_enrollments_result.scalar() or 0
        
        # Available courses
        available_courses_stmt = select(func.count()).select_from(Course).where(
            Course.tenant_id == context.tenant_id,
            Course.status == CourseStatus.PUBLISHED,
            Course.is_active == True,
            Course.hidden_from_catalog == False
        )
        available_courses_result = await db.execute(available_courses_stmt)
        stats.totalCourses = available_courses_result.scalar() or 0
        
        # Recent personal activity - recent enrollments
        recent_enrollments_stmt = select(Enrollment, Course).join(Course).where(
            Enrollment.user_id == context.user_id
        ).order_by(Enrollment.enrolled_at.desc()).limit(5)
        
        recent_enrollments_result = await db.execute(recent_enrollments_stmt)
        recent_enrollments = recent_enrollments_result.all()
        
        for enrollment, course in recent_enrollments:
            status_text = "started" if enrollment.status == EnrollmentStatus.IN_PROGRESS else "enrolled in"
            if enrollment.status == EnrollmentStatus.COMPLETED:
                status_text = "completed"
            
            recent_activity.append(RecentActivity(
                type="enrollment",
                title=f"Course {status_text.title()}",
                description=f"You {status_text} {course.title}",
                timestamp=enrollment.enrolled_at.isoformat(),
                courseId=course.id,
            ))
    
    return DashboardResponse(
        stats=stats,
        recentActivity=recent_activity,
        userRole=context.role,
        userName=user.full_name,
    )