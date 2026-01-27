"""
User Management Routes

CRUD operations for user management with proper authorization.
"""

from typing import Annotated, Any

from app.auth import RequireAuth, hash_password
from app.db.models import RoleKey, User, UserStatus
from app.db.session import get_db
from app.errors import BadRequestError, ConflictError, NotFoundError, RBACError
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


# ============= Request/Response Schemas =============

class CreateUserRequest(BaseModel):
    email: EmailStr
    username: str | None = None
    firstName: str
    lastName: str
    password: str
    role: str = "LEARNER"


class UpdateUserRequest(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    username: str | None = None
    role: str | None = None
    status: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    username: str | None
    firstName: str
    lastName: str
    fullName: str
    role: str
    status: str
    createdAt: str
    lastLoginAt: str | None


class UsersListResponse(BaseModel):
    data: list[UserResponse]
    pagination: dict[str, Any]


# ============= Helper Functions =============

def can_manage_users(role: str) -> bool:
    """Check if user role can manage other users."""
    return role in ["ADMIN", "SUPER_INSTRUCTOR"]


def user_to_response(user: User) -> UserResponse:
    """Convert User model to response format."""
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        firstName=user.first_name,
        lastName=user.last_name,
        fullName=user.full_name,
        role=user.role.value,
        status=user.status.value,
        createdAt=user.created_at.isoformat(),
        lastLoginAt=user.last_login_at.isoformat() if user.last_login_at else None,
    )


# ============= Endpoints =============

@router.get("", response_model=UsersListResponse)
async def list_users(
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str = Query("", description="Search by name, email, or username"),
    role: str = Query("", description="Filter by role"),
    status: str = Query("", description="Filter by status"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List users with pagination and filtering."""
    
    if not can_manage_users(context.role):
        raise RBACError("user:read")
    
    # Build base query
    query = select(User).where(User.tenant_id == context.tenant_id)
    count_query = select(func.count()).select_from(User).where(User.tenant_id == context.tenant_id)
    
    # Apply search filter
    if search:
        search_filter = or_(
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%") if search else False,
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    # Apply role filter
    if role and role != "all":
        try:
            role_enum = RoleKey(role.upper())
            query = query.where(User.role == role_enum)
            count_query = count_query.where(User.role == role_enum)
        except ValueError:
            raise BadRequestError(f"Invalid role: {role}")
    
    # Apply status filter
    if status and status != "all":
        try:
            status_enum = UserStatus(status.upper())
            query = query.where(User.status == status_enum)
            count_query = count_query.where(User.status == status_enum)
        except ValueError:
            raise BadRequestError(f"Invalid status: {status}")
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Convert to response format
    user_responses = [user_to_response(user) for user in users]
    
    # Calculate pagination info
    total_pages = (total + limit - 1) // limit
    
    return UsersListResponse(
        data=user_responses,
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": total_pages,
        }
    )


@router.post("", response_model=UserResponse)
async def create_user(
    request: CreateUserRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new user."""
    
    if not can_manage_users(context.role):
        raise RBACError("user:create")
    
    # Check if user already exists
    stmt = select(User).where(User.email == request.email, User.tenant_id == context.tenant_id)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise ConflictError("User with this email already exists")
    
    # Validate role
    try:
        role_enum = RoleKey(request.role.upper())
    except ValueError:
        raise BadRequestError(f"Invalid role: {request.role}")
    
    # Only admins can create admin users
    if role_enum == RoleKey.ADMIN and context.role != "ADMIN":
        raise RBACError("Only admins can create admin users")
    
    # Create user
    user = User(
        tenant_id=context.tenant_id,
        email=request.email,
        username=request.username,
        password_hash=hash_password(request.password),
        first_name=request.firstName,
        last_name=request.lastName,
        role=role_enum,
        status=UserStatus.ACTIVE,
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user_to_response(user)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific user by ID."""
    
    # Users can view their own profile, others need permission
    if user_id != context.user_id and not can_manage_users(context.role):
        raise RBACError("user:read")
    
    stmt = select(User).where(User.id == user_id, User.tenant_id == context.tenant_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User")
    
    return user_to_response(user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    request: UpdateUserRequest,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a user."""
    
    # Users can update their own profile (limited fields), others need permission
    is_self_update = user_id == context.user_id
    
    if not is_self_update and not can_manage_users(context.role):
        raise RBACError("user:update")
    
    # Get user
    stmt = select(User).where(User.id == user_id, User.tenant_id == context.tenant_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User")
    
    # Build update data
    update_data = {}
    
    if request.firstName is not None:
        update_data["first_name"] = request.firstName
    
    if request.lastName is not None:
        update_data["last_name"] = request.lastName
    
    if request.username is not None:
        update_data["username"] = request.username
    
    # Only managers can update role and status
    if not is_self_update:
        if request.role is not None:
            try:
                role_enum = RoleKey(request.role.upper())
                # Only admins can assign admin role
                if role_enum == RoleKey.ADMIN and context.role != "ADMIN":
                    raise RBACError("Only admins can assign admin role")
                update_data["role"] = role_enum
            except ValueError:
                raise BadRequestError(f"Invalid role: {request.role}")
        
        if request.status is not None:
            try:
                status_enum = UserStatus(request.status.upper())
                update_data["status"] = status_enum
            except ValueError:
                raise BadRequestError(f"Invalid status: {request.status}")
    
    # Apply updates
    if update_data:
        await db.execute(
            update(User).where(User.id == user_id).values(**update_data)
        )
        await db.commit()
        await db.refresh(user)
    
    return user_to_response(user)


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    context: RequireAuth,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a user (soft delete by deactivating)."""
    
    if not can_manage_users(context.role):
        raise RBACError("user:delete")
    
    # Cannot delete self
    if user_id == context.user_id:
        raise BadRequestError("Cannot delete your own account")
    
    # Get user
    stmt = select(User).where(User.id == user_id, User.tenant_id == context.tenant_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise NotFoundError("User")
    
    # Soft delete by deactivating
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(status=UserStatus.DEACTIVATED)
    )
    await db.commit()
    
    return {"ok": True, "message": "User deactivated successfully"}