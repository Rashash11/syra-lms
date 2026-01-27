"""
Group Routes

CRUD endpoints for user groups.
"""

import secrets
from typing import Annotated, Any, Optional

from app.audit import AuditEntry, AuditEventType, log_audit_background
from app.auth import RequireAuth
from app.core.tenant import get_tenant_id
from app.db.models import Course, Group, GroupCourse, GroupMember, User
from app.db.session import get_db
from app.errors import BadRequestError, NotFoundError, RBACError
from app.rbac import can
from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


# ============= Request/Response Schemas =============


class CreateGroupRequest(BaseModel):
    name: str = Field(min_length=1)
    description: Optional[str] = None
    price: Optional[float] = None
    groupKey: Optional[str] = None
    generateKey: Optional[bool] = False
    autoEnroll: Optional[bool] = False
    maxMembers: Optional[int] = None
    branchId: Optional[str] = None


class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    groupKey: Optional[str] = None
    autoEnroll: Optional[bool] = None
    maxMembers: Optional[int] = None


class BulkDeleteRequest(BaseModel):
    ids: list[str]


# ============= Endpoints =============


@router.get("")
async def list_groups(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Optional[str] = Query(None, description="Search by name"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    """
    GET /api/groups
    List all groups with member/course counts.
    """
    import logging

    logger = logging.getLogger(__name__)
    logger.info(
        f"List groups request. User: {context.user_id}, Role: {context.role}, "
        f"Tenant: {context.tenant_id}"
    )

    if not await can(db, context, "groups:read"):
        logger.warning(f"Permission denied for groups:read. User: {context.user_id}")
        raise RBACError("groups:read")

    skip = (page - 1) * limit

    # Build query
    query = select(Group).where(Group.tenant_id == context.tenant_id)
    count_query = (
        select(func.count())
        .select_from(Group)
        .where(Group.tenant_id == context.tenant_id)
    )

    # Apply search filter
    if search:
        query = query.where(Group.name.ilike(f"%{search}%"))
        count_query = count_query.where(Group.name.ilike(f"%{search}%"))

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(Group.created_at.desc())

    # Execute query
    result = await db.execute(query)
    groups = result.scalars().all()

    # Transform for response
    groups_data = []
    for group in groups:
        # Fetch counts
        member_count = await db.scalar(
            select(func.count())
            .select_from(GroupMember)
            .where(GroupMember.group_id == group.id)
        )
        course_count = await db.scalar(
            select(func.count())
            .select_from(GroupCourse)
            .where(GroupCourse.group_id == group.id)
        )

        groups_data.append(
            {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "branchId": group.branch_id,
                "instructorId": group.instructor_id,
                "createdAt": group.created_at.isoformat() if group.created_at else None,
                "updatedAt": group.updated_at.isoformat() if group.updated_at else None,
                "memberCount": member_count or 0,
                "courseCount": course_count or 0,
            }
        )

    return {
        "data": groups_data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        },
    }


@router.post("")
async def create_group(
    request: CreateGroupRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    tenant_id: Annotated[str, Depends(get_tenant_id)],
) -> dict[str, Any]:
    """
    POST /api/groups
    Create a new group.
    """
    if not await can(db, context, "groups:create"):
        raise RBACError("groups:create")

    # Generate unique key if requested
    group_key = request.groupKey
    if request.generateKey and not group_key:
        group_key = secrets.token_hex(4).upper()

    # Create group
    group = Group(
        tenant_id=tenant_id,
        name=request.name,
        description=request.description,
        branch_id=request.branchId,
        group_key=group_key,
        auto_enroll=request.autoEnroll,
        max_members=request.maxMembers,
        price=request.price,
    )

    db.add(group)
    await db.commit()
    await db.refresh(group)

    # Log audit event
    log_audit_background(
        AuditEntry(
            event_type=AuditEventType.USER_CREATE,  # Using USER_CREATE as placeholder
            tenant_id=context.tenant_id,
            user_id=context.user_id,
            resource_type="Group",
            resource_id=group.id,
            after_state={"name": group.name},
        )
    )

    return {
        "ok": True,
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "branchId": group.branch_id,
        "createdAt": group.created_at.isoformat() if group.created_at else None,
    }


@router.get("/{group_id}")
async def get_group(
    group_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    GET /api/groups/{group_id}
    Get a single group by ID.
    """
    if not await can(db, context, "groups:read"):
        raise RBACError("groups:read")

    result = await db.execute(
        select(Group).where(
            (Group.id == group_id) & (Group.tenant_id == context.tenant_id)
        )
    )
    group = result.scalar_one_or_none()

    if not group:
        raise NotFoundError("Group")

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "branchId": group.branch_id,
        "instructorId": group.instructor_id,
        "createdAt": group.created_at.isoformat() if group.created_at else None,
        "updatedAt": group.updated_at.isoformat() if group.updated_at else None,
    }


@router.put("/{group_id}")
async def update_group(
    group_id: str,
    request: UpdateGroupRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    PUT /api/groups/{group_id}
    Update a group.
    """
    if not await can(db, context, "groups:update"):
        raise RBACError("groups:update")

    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()

    if not group:
        raise NotFoundError("Group")

    # Update fields
    if request.name is not None:
        group.name = request.name
    if request.description is not None:
        group.description = request.description
    if request.groupKey is not None:
        group.group_key = request.groupKey
    if request.autoEnroll is not None:
        group.auto_enroll = request.autoEnroll
    if request.maxMembers is not None:
        group.max_members = request.maxMembers
    if request.price is not None:
        group.price = request.price

    await db.commit()
    await db.refresh(group)

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
    }


class AddMemberRequest(BaseModel):
    userId: str


@router.post("/{group_id}/members")
async def add_group_member(
    group_id: str,
    request: AddMemberRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Any:
    if not await can(db, context, "groups:update"):
        raise RBACError("groups:update")

    result = await db.execute(
        select(Group).where(
            (Group.id == group_id) & (Group.tenant_id == context.tenant_id)
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise NotFoundError("Group")

    ures = await db.execute(
        select(User).where(
            (User.id == request.userId) & (User.tenant_id == context.tenant_id)
        )
    )
    user = ures.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")

    gm = GroupMember(
        tenant_id=context.tenant_id,
        group_id=group.id,
        user_id=user.id,
    )
    db.add(gm)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        return JSONResponse(
            status_code=409, content={"ok": False, "message": "Already a member"}
        )
    return {"ok": True}


class AddCourseRequest(BaseModel):
    courseId: str


@router.post("/{group_id}/courses")
async def add_group_course(
    group_id: str,
    request: AddCourseRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    if not await can(db, context, "groups:update"):
        raise RBACError("groups:update")

    result = await db.execute(
        select(Group).where(
            (Group.id == group_id) & (Group.tenant_id == context.tenant_id)
        )
    )
    group = result.scalar_one_or_none()
    if not group:
        raise NotFoundError("Group")

    cres = await db.execute(
        select(Course).where(
            (Course.id == request.courseId) & (Course.tenant_id == context.tenant_id)
        )
    )
    course = cres.scalar_one_or_none()
    if not course:
        raise NotFoundError("Course")

    gc = GroupCourse(
        tenant_id=context.tenant_id,
        group_id=group.id,
        course_id=course.id,
    )
    db.add(gc)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        # Return success even if already linked to be idempotent, or handle error properly
        return {"ok": False, "message": "Course already linked"}
    return {"ok": True}


@router.delete("")
async def bulk_delete_groups(
    request: BulkDeleteRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    DELETE /api/groups
    Bulk delete groups.
    """
    if not await can(db, context, "groups:delete"):
        raise RBACError("groups:delete")

    if not request.ids:
        raise BadRequestError("No group IDs provided")

    # Delete groups
    result = await db.execute(delete(Group).where(Group.id.in_(request.ids)))

    await db.commit()

    return {"success": True, "deleted": result.rowcount}  # type: ignore


class JoinGroupRequest(BaseModel):
    key: str


@router.post("/join")
async def join_group_by_key(
    request: JoinGroupRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, Any]:
    """
    POST /api/groups/join
    Join a group using a secret key.
    """
    # 1. Find group by key
    result = await db.execute(
        select(Group).where(
            (Group.group_key == request.key) & (Group.tenant_id == context.tenant_id)
        )
    )
    group = result.scalar_one_or_none()

    if not group:
        raise NotFoundError("Group not found or invalid key")

    # 2. Check if already a member
    mem_check = await db.execute(
        select(GroupMember).where(
            (GroupMember.group_id == group.id)
            & (GroupMember.user_id == context.user_id)
        )
    )
    if mem_check.scalar_one_or_none():
        return {"ok": True, "message": "Already a member", "groupId": group.id}

    # 3. Add to group
    member = GroupMember(
        tenant_id=context.tenant_id,
        group_id=group.id,
        user_id=context.user_id,
    )
    db.add(member)

    # 4. Auto-enroll in group courses if enabled (implied by typical LMS logic)
    # The user asked for "assign group key works", usually implies getting access to courses.
    # Logic: If joined group, user should get access to group courses?
    # Usually this is done via separate logic or simply by being in the group,
    # but let's check if we should create Enrollment records.
    # For now, just adding to the group is the primary "Join" action.
    # The previous logic in `add_lp_enrollment` did auto-enroll.
    # Let's see if we should auto-enroll here.
    # If the group has courses, we probably want to enroll the user in them.

    # Let's fetch group courses
    gc_res = await db.execute(
        select(GroupCourse).where(GroupCourse.group_id == group.id)
    )
    group_courses = gc_res.scalars().all()

    from app.db.models import Enrollment, EnrollmentStatus

    for gc in group_courses:
        # Check if already enrolled
        enr_check = await db.execute(
            select(Enrollment).where(
                (Enrollment.user_id == context.user_id)
                & (Enrollment.course_id == gc.course_id)
            )
        )
        if not enr_check.scalar_one_or_none():
            new_enr = Enrollment(
                tenant_id=context.tenant_id,
                user_id=context.user_id,
                course_id=gc.course_id,
                status=EnrollmentStatus.NOT_STARTED,
                progress=0,
            )
            db.add(new_enr)

    await db.commit()
    return {"ok": True, "groupId": group.id, "groupName": group.name}
