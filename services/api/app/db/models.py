"""
SQLAlchemy ORM Models

Models match the existing Prisma schema. Uses snake_case for Python
but maps to the actual table names in PostgreSQL.
"""

import enum  # noqa: E402
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""

    pass


# ============= Enums =============


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DEACTIVATED = "DEACTIVATED"
    LOCKED = "LOCKED"


class RoleKey(str, enum.Enum):
    ADMIN = "ADMIN"
    INSTRUCTOR = "INSTRUCTOR"
    LEARNER = "LEARNER"
    SUPER_INSTRUCTOR = "SUPER_INSTRUCTOR"


class CourseStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"


class EnrollmentStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"


class UnitType(str, enum.Enum):
    TEXT = "TEXT"
    FILE = "FILE"
    EMBED = "EMBED"
    VIDEO = "VIDEO"
    TEST = "TEST"
    SURVEY = "SURVEY"
    ASSIGNMENT = "ASSIGNMENT"
    ILT = "ILT"
    CMI5 = "CMI5"
    TALENTCRAFT = "TALENTCRAFT"
    SECTION = "SECTION"
    WEB = "WEB"
    AUDIO = "AUDIO"
    DOCUMENT = "DOCUMENT"
    IFRAME = "IFRAME"
    SCORM = "SCORM"
    XAPI = "XAPI"


class UnitStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    UNPUBLISHED_CHANGES = "UNPUBLISHED_CHANGES"


class SkillLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class UnlockType(str, enum.Enum):
    NONE = "NONE"
    AFTER_COURSE = "AFTER_COURSE"
    AFTER_SCORE = "AFTER_SCORE"


class CourseOrderMode(str, enum.Enum):
    SEQUENTIAL = "SEQUENTIAL"
    ANY = "ANY"


class CompletionRule(str, enum.Enum):
    ALL_COURSES_COMPLETED = "ALL_COURSES_COMPLETED"


class CertificateType(str, enum.Enum):
    CLASSIC = "CLASSIC"
    FANCY = "FANCY"
    MODERN = "MODERN"
    SIMPLE = "SIMPLE"


class AudienceType(str, enum.Enum):
    EVERYONE = "EVERYONE"
    BRANCH = "BRANCH"
    GROUP = "GROUP"
    COURSE = "COURSE"
    SPECIFIC_USERS = "SPECIFIC_USERS"


# ============= Core Models =============


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    domain: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime)

    # Relationships
    branches: Mapped[list["Branch"]] = relationship(
        back_populates="tenant", passive_deletes=True
    )


class UserType(Base):
    __tablename__ = "user_types"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    permissions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    branches: Mapped[list["Branch"]] = relationship(back_populates="default_user_type")
    users: Mapped[list["User"]] = relationship(back_populates="user_type")


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    default_language: Mapped[str] = mapped_column(
        "defaultLanguage", String, default="en"
    )
    ai_enabled: Mapped[bool] = mapped_column("aiEnabled", Boolean, default=True)
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime)
    ai_features_enabled: Mapped[bool] = mapped_column(
        "aiFeaturesEnabled", Boolean, default=False
    )
    allowed_domains: Mapped[list[str]] = mapped_column("allowedDomains", ARRAY(String))
    badge_set: Mapped[str] = mapped_column("badgeSet", String, default="old-school")
    branding_favicon_url: Mapped[str | None] = mapped_column(
        "brandingFaviconUrl", String
    )
    branding_logo_url: Mapped[str | None] = mapped_column("brandingLogoUrl", String)
    credits_enabled: Mapped[bool] = mapped_column(
        "creditsEnabled", Boolean, default=False
    )
    default_course_image_url: Mapped[str | None] = mapped_column(
        "defaultCourseImageUrl", String
    )
    default_group_id: Mapped[str | None] = mapped_column(
        "defaultGroupId", String, ForeignKey("groups.id")
    )
    default_user_type_id: Mapped[str | None] = mapped_column(
        "defaultUserTypeId", String, ForeignKey("user_types.id")
    )
    disallow_main_domain_login: Mapped[bool] = mapped_column(
        "disallowMainDomainLogin", Boolean, default=False
    )
    ecommerce_processor: Mapped[str | None] = mapped_column(
        "ecommerceProcessor", String
    )
    external_announcement: Mapped[str | None] = mapped_column(
        "externalAnnouncement", String
    )
    external_announcement_enabled: Mapped[bool] = mapped_column(
        "externalAnnouncementEnabled", Boolean, default=False
    )
    internal_announcement: Mapped[str | None] = mapped_column(
        "internalAnnouncement", String
    )
    internal_announcement_enabled: Mapped[bool] = mapped_column(
        "internalAnnouncementEnabled", Boolean, default=False
    )
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=False)
    language_code: Mapped[str] = mapped_column("languageCode", String, default="en")
    max_registrations: Mapped[int | None] = mapped_column("maxRegistrations", Integer)
    signup_mode: Mapped[str] = mapped_column("signupMode", String, default="direct")
    subscription_enabled: Mapped[bool] = mapped_column(
        "subscriptionEnabled", Boolean, default=False
    )
    terms_of_service: Mapped[str | None] = mapped_column("termsOfService", String)
    timezone: Mapped[str] = mapped_column("timezone", String, default="UTC")

    # Relationships
    tenant: Mapped["Tenant"] = relationship(back_populates="branches")
    default_group: Mapped["Group | None"] = relationship(
        foreign_keys=[default_group_id]
    )
    default_user_type: Mapped["UserType | None"] = relationship(
        foreign_keys=[default_user_type_id]
    )
    users: Mapped[list["User"]] = relationship(
        back_populates="node", passive_deletes=True
    )
    groups: Mapped[list["Group"]] = relationship(
        back_populates="branch", passive_deletes=True, foreign_keys="Group.branch_id"
    )
    learning_paths: Mapped[list["LearningPath"]] = relationship(
        back_populates="branch", passive_deletes=True
    )
    gamification_settings: Mapped[list["GamificationSettings"]] = relationship(
        back_populates="branch", passive_deletes=True
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "slug", name="branches_tenant_slug_unique"),
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    username: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str] = mapped_column("firstName", String, nullable=False)
    last_name: Mapped[str] = mapped_column("lastName", String, nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(String, default="UTC")
    language: Mapped[str] = mapped_column(String, default="en")
    user_type_id: Mapped[str | None] = mapped_column(
        "userTypeId", String, ForeignKey("user_types.id")
    )
    password_hash: Mapped[str | None] = mapped_column("passwordHash", String)
    avatar: Mapped[str | None] = mapped_column(String)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="UserStatus", native_enum=False),
        default=UserStatus.ACTIVE,
    )
    deactivate_at: Mapped[datetime | None] = mapped_column("deactivateAt", DateTime)
    active_role: Mapped[RoleKey] = mapped_column(
        "activeRole",
        Enum(RoleKey, name="RoleKey", native_enum=False),
        default=RoleKey.LEARNER,
    )
    role: Mapped[RoleKey] = mapped_column(
        "role",
        Enum(RoleKey, name="RoleKey", native_enum=False),
        default=RoleKey.LEARNER,
    )
    is_active: Mapped[bool] = mapped_column("is_active", Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column("is_verified", Boolean, default=False)
    last_login_at: Mapped[datetime | None] = mapped_column("lastLoginAt", DateTime)
    failed_login_attempts: Mapped[int] = mapped_column(
        "failedLoginAttempts", Integer, default=0
    )
    locked_until: Mapped[datetime | None] = mapped_column("lockedUntil", DateTime)
    exclude_from_emails: Mapped[bool] = mapped_column(
        "excludeFromEmails", Boolean, default=False
    )
    certificates_archive: Mapped[dict | None] = mapped_column(
        "certificatesArchive", JSONB
    )
    rbac_overrides: Mapped[dict | None] = mapped_column("rbac_overrides", JSONB)
    node_id: Mapped[str | None] = mapped_column(
        "node_id", String, ForeignKey("branches.id", ondelete="SET NULL")
    )
    token_version: Mapped[int] = mapped_column("token_version", Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime)

    # Relationships
    tenant: Mapped["Tenant"] = relationship(foreign_keys=[tenant_id])
    node: Mapped["Branch | None"] = relationship(back_populates="users")
    user_type: Mapped["UserType | None"] = relationship(back_populates="users")
    roles: Mapped[list["UserRole"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    learning_path_enrollments: Mapped[list["LearningPathEnrollment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    user_skills: Mapped[list["UserSkill"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    created_assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="creator",
        foreign_keys="Assignment.created_by",
        passive_deletes=True,
    )
    assignment_submissions: Mapped[list["AssignmentSubmission"]] = relationship(
        back_populates="user",
        foreign_keys="AssignmentSubmission.user_id",
        cascade="all, delete-orphan",
    )
    graded_submissions: Mapped[list["AssignmentSubmission"]] = relationship(
        back_populates="grader",
        foreign_keys="AssignmentSubmission.graded_by",
        passive_deletes=True,
    )


    # Instructor relationships
    calendar_events: Mapped[list["CalendarEvent"]] = relationship(
        back_populates="instructor", passive_deletes=True
    )
    conferences: Mapped[list["Conference"]] = relationship(
        back_populates="instructor", passive_deletes=True
    )
    instructed_courses: Mapped[list["Course"]] = relationship(
        back_populates="instructor",
        foreign_keys="Course.instructor_id",
        passive_deletes=True,
    )
    instructed_learning_paths: Mapped[list["LearningPath"]] = relationship(
        back_populates="instructor",
        foreign_keys="LearningPath.instructor_id",
        passive_deletes=True,
    )
    instructed_groups: Mapped[list["Group"]] = relationship(
        back_populates="instructor",
        foreign_keys="Group.instructor_id",
        passive_deletes=True,
    )
    course_instructors: Mapped[list["CourseInstructor"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    learner_course_states: Mapped[list["LearnerCourseState"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    course_ratings: Mapped[list["CourseRating"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    test_attempts: Mapped[list["TestAttempt"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    # Recommendations
    sent_recommendations: Mapped[list["SkillRecommendation"]] = relationship(
        back_populates="from_user",
        foreign_keys="SkillRecommendation.from_user_id",
        cascade="all, delete-orphan",
    )
    received_recommendations: Mapped[list["SkillRecommendation"]] = relationship(
        back_populates="to_user",
        foreign_keys="SkillRecommendation.to_user_id",
        cascade="all, delete-orphan",
    )

    enrollment_requests: Mapped[list["EnrollmentRequest"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        back_populates="creator", passive_deletes=True
    )
    certificate_issues: Mapped[list["CertificateIssue"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    points_ledger: Mapped[list["PointsLedger"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserRole(Base):
    __tablename__ = "user_roles"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role_key: Mapped[RoleKey] = mapped_column(
        "roleKey", Enum(RoleKey, native_enum=False), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="roles", foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint(
            "tenantId", "userId", "roleKey", name="user_roles_user_role_unique"
        ),
    )


# ============= RBAC Models =============


class AuthRole(Base):
    __tablename__ = "auth_role"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    permissions: Mapped[list["AuthRolePermission"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )


class AuthPermission(Base):
    __tablename__ = "auth_permission"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    full_permission: Mapped[str] = mapped_column(
        "fullPermission", String, unique=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    role_permissions: Mapped[list["AuthRolePermission"]] = relationship(
        back_populates="permission", cascade="all, delete-orphan"
    )


class AuthRolePermission(Base):
    __tablename__ = "auth_role_permission"

    role_id: Mapped[str] = mapped_column(
        "roleId",
        String,
        ForeignKey("auth_role.id", ondelete="CASCADE"),
        primary_key=True,
    )
    permission_id: Mapped[str] = mapped_column(
        "permissionId",
        String,
        ForeignKey("auth_permission.id", ondelete="CASCADE"),
        primary_key=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    role: Mapped["AuthRole"] = relationship(back_populates="permissions")
    permission: Mapped["AuthPermission"] = relationship(
        back_populates="role_permissions"
    )


# ============= Course Models =============


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[CourseStatus] = mapped_column(
        Enum(CourseStatus, name="CourseStatus", native_enum=False),
        default=CourseStatus.DRAFT,
    )
    hidden_from_catalog: Mapped[bool] = mapped_column(
        "hiddenFromCatalog", Boolean, default=False
    )
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=False)
    category_id: Mapped[str | None] = mapped_column(
        "categoryId", String, ForeignKey("categories.id", ondelete="SET NULL")
    )
    instructor_id: Mapped[str | None] = mapped_column(
        "instructorId", String, ForeignKey("users.id", ondelete="SET NULL")
    )
    thumbnail_url: Mapped[str | None] = mapped_column("thumbnail_url", String)
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    settings: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime)

    # Relationships
    tenant: Mapped["Tenant"] = relationship(foreign_keys=[tenant_id])
    category: Mapped["Category | None"] = relationship(back_populates="courses")
    instructor: Mapped["User | None"] = relationship(
        back_populates="instructed_courses", foreign_keys=[instructor_id]
    )
    sections: Mapped[list["CourseSection"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    units: Mapped[list["CourseUnit"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    assignment_submissions: Mapped[list["AssignmentSubmission"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    certificate_issues: Mapped[list["CertificateIssue"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    files: Mapped[list["CourseFile"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    instructors: Mapped[list["CourseInstructor"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    skills: Mapped[list["CourseSkill"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    versions: Mapped[list["CourseVersion"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    enrollment_requests: Mapped[list["EnrollmentRequest"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    assets: Mapped[list["UnitAsset"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    group_courses: Mapped[list["GroupCourse"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    prerequisites: Mapped[list["Prerequisite"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    timeline_events: Mapped[list["TimelineEvent"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    question_pools: Mapped[list["QuestionPool"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    test_attempts: Mapped[list["TestAttempt"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    course_ratings: Mapped[list["CourseRating"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    learner_course_states: Mapped[list["LearnerCourseState"]] = relationship(
        back_populates="course", passive_deletes=True
    )
    acquired_library_courses: Mapped[list["AcquiredLibraryCourse"]] = relationship(
        back_populates="course", passive_deletes=True
    )


class CourseVersion(Base):
    __tablename__ = "course_versions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column("tenantId", String, nullable=False)
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    version_number: Mapped[int] = mapped_column(
        "versionNumber", Integer, nullable=False
    )
    snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="versions")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="course_versions_tenant_id_key"),
    )


class CourseFile(Base):
    __tablename__ = "course_files"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column("tenantId", String, nullable=False)
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    size_bytes: Mapped[int] = mapped_column("sizeBytes", BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column("mimeType", String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="files")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="course_files_tenant_id_key"),
    )


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[EnrollmentStatus] = mapped_column(
        Enum(EnrollmentStatus, native_enum=False), default=EnrollmentStatus.NOT_STARTED
    )
    progress: Mapped[int] = mapped_column(Integer, default=0)
    score: Mapped[int | None] = mapped_column(Integer)
    # grade: Mapped[str | None] = mapped_column(String) # Removed as not in DB
    # enrolled_at: Mapped[datetime] = mapped_column("enrolledAt", DateTime, default=datetime.utcnow) # Removed as not in DB
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime)
    expires_at: Mapped[datetime | None] = mapped_column("expiresAt", DateTime)
    certificate_id: Mapped[str | None] = mapped_column("certificateId", String)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    user: Mapped["User"] = relationship(back_populates="enrollments")
    course: Mapped["Course"] = relationship()
    extensions: Mapped[list["EnrollmentExtension"]] = relationship(
        back_populates="enrollment", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("userId", "courseId", name="enrollments_user_course_unique"),
        UniqueConstraint("tenantId", "id", name="enrollments_tenant_id_key"),
    )


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str | None] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    course_id: Mapped[str | None] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE")
    )
    branch_id: Mapped[str | None] = mapped_column(
        "branchId", String, ForeignKey("branches.id", ondelete="CASCADE")
    )
    event_type: Mapped[str] = mapped_column("eventType", String, nullable=False)
    data: Mapped[dict | None] = mapped_column("details", JSONB)
    created_at: Mapped[datetime] = mapped_column(
        "timestamp", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    user: Mapped["User | None"] = relationship()
    course: Mapped["Course | None"] = relationship(back_populates="timeline_events")
    branch: Mapped["Branch | None"] = relationship()

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="timeline_events_tenant_id_key"),
    )


class EnrollmentRequest(Base):
    __tablename__ = "enrollment_requests"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column("tenantId", String, nullable=False)
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(String, default="pending")
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    resolved_at: Mapped[datetime | None] = mapped_column("resolvedAt", DateTime)
    resolved_by: Mapped[str | None] = mapped_column("resolvedBy", String)

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="enrollment_requests")
    user: Mapped["User"] = relationship(back_populates="enrollment_requests")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="enrollment_requests_tenant_id_key"),
    )


class CourseInstructor(Base):
    __tablename__ = "course_instructors"

    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, nullable=False, primary_key=True
    )
    course_id: Mapped[str] = mapped_column(
        "courseId",
        String,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )
    user_id: Mapped[str] = mapped_column(
        "userId",
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        primary_key=True,
    )

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="instructors")
    user: Mapped["User"] = relationship(back_populates="course_instructors")


class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column("tenantId", String, nullable=False)
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    path_index: Mapped[int] = mapped_column("pathIndex", Integer, nullable=False)
    required_course_id: Mapped[str] = mapped_column(
        "requiredCourseId", String, nullable=False
    )
    required_level: Mapped[int | None] = mapped_column("requiredLevel", Integer)

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="prerequisites")

    __table_args__ = (
        UniqueConstraint(
            "tenantId",
            "courseId",
            "pathIndex",
            "requiredCourseId",
            name="prerequisites_unique",
        ),
    )


class CourseSection(Base):
    __tablename__ = "course_sections"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    drip_enabled: Mapped[bool] = mapped_column("dripEnabled", Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="sections")
    units: Mapped[list["CourseUnit"]] = relationship(
        back_populates="section", passive_deletes=True
    )


class CourseUnit(Base):
    __tablename__ = "course_units"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    section_id: Mapped[str | None] = mapped_column(
        "sectionId", String, ForeignKey("course_sections.id", ondelete="SET NULL")
    )
    type: Mapped[UnitType] = mapped_column(
        Enum(UnitType, name="UnitType"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[UnitStatus] = mapped_column(
        Enum(UnitStatus, name="UnitStatus"), default=UnitStatus.DRAFT
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    config: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="units")
    section: Mapped["CourseSection | None"] = relationship(back_populates="units")
    assignment_submissions: Mapped[list["AssignmentSubmission"]] = relationship(
        back_populates="assignment_unit", passive_deletes=True
    )
    learner_course_states: Mapped[list["LearnerCourseState"]] = relationship(
        back_populates="unit", passive_deletes=True
    )
    assets: Mapped[list["UnitAsset"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )
    scorm_data: Mapped[list["SCORMData"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )
    ilt_sessions: Mapped[list["ILTSession"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )
    tests: Mapped[list["Test"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan"
    )


class UnitAsset(Base):
    __tablename__ = "unit_assets"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    unit_id: Mapped[str] = mapped_column(
        "unitId",
        String,
        ForeignKey("course_units.id", ondelete="CASCADE"),
        nullable=False,
    )
    kind: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    storage_key: Mapped[str | None] = mapped_column("storageKey", String)
    name: Mapped[str] = mapped_column(String, nullable=False)
    size_bytes: Mapped[int] = mapped_column("sizeBytes", BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column("mimeType", String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    course: Mapped["Course"] = relationship()
    unit: Mapped["CourseUnit"] = relationship(back_populates="assets")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="unit_assets_tenant_id_key"),
    )


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String, default="draft")
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=False)
    is_sequential: Mapped[bool] = mapped_column("isSequential", Boolean, default=False)
    branch_id: Mapped[str | None] = mapped_column(
        "branchId", String, ForeignKey("branches.id", ondelete="SET NULL")
    )
    instructor_id: Mapped[str | None] = mapped_column(
        "instructorId", String, ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship(foreign_keys=[tenant_id])
    branch: Mapped["Branch | None"] = relationship(back_populates="learning_paths")
    instructor: Mapped["User | None"] = relationship(
        back_populates="instructed_learning_paths", foreign_keys=[instructor_id]
    )
    enrollments: Mapped[list["LearningPathEnrollment"]] = relationship(
        back_populates="path", cascade="all, delete-orphan"
    )
    sections: Mapped[list["LearningPathSection"]] = relationship(
        back_populates="path", cascade="all, delete-orphan"
    )
    skills: Mapped[list["LearningPathSkill"]] = relationship(
        back_populates="learning_path", cascade="all, delete-orphan"
    )
    certificate_issues: Mapped[list["CertificateIssue"]] = relationship(
        back_populates="path", passive_deletes=True
    )
    courses: Mapped[list["Course"]] = relationship(
        secondary="learning_path_courses", viewonly=True
    )


class LearningPathSection(Base):
    __tablename__ = "learning_path_sections"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    path_id: Mapped[str] = mapped_column(
        "pathId",
        String,
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    path: Mapped["LearningPath"] = relationship(back_populates="sections")
    courses: Mapped[list["LearningPathCourse"]] = relationship(back_populates="section")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="learning_path_sections_tenant_id_key"),
    )


class LearningPathCourse(Base):
    __tablename__ = "learning_path_courses"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    path_id: Mapped[str] = mapped_column(
        "pathId",
        String,
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    min_score: Mapped[int | None] = mapped_column("minScore", Integer)
    unlock_course_id: Mapped[str | None] = mapped_column("unlockCourseId", String)
    unlock_type: Mapped[UnlockType] = mapped_column(
        "unlockType", Enum(UnlockType, native_enum=False), default=UnlockType.NONE
    )
    section_id: Mapped[str | None] = mapped_column(
        "sectionId",
        String,
        ForeignKey("learning_path_sections.id", ondelete="SET NULL"),
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    path: Mapped["LearningPath"] = relationship()
    course: Mapped["Course"] = relationship()
    section: Mapped["LearningPathSection | None"] = relationship(
        back_populates="courses"
    )

    __table_args__ = (
        UniqueConstraint(
            "tenantId",
            "pathId",
            "courseId",
            name="lp_courses_tenant_path_course_unique",
        ),
    )


class LearningPathEnrollment(Base):
    __tablename__ = "learning_path_enrollments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    path_id: Mapped[str] = mapped_column(
        "pathId",
        String,
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String, default="NOT_STARTED")
    progress: Mapped[int] = mapped_column(Integer, default=0)
    enrolled_at: Mapped[datetime] = mapped_column(
        "enrolledAt", DateTime, default=datetime.utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime)
    created_at: Mapped[datetime | None] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="learning_path_enrollments")
    path: Mapped["LearningPath"] = relationship(back_populates="enrollments")

    __table_args__ = (
        UniqueConstraint("userId", "pathId", name="lp_enrollments_user_path_unique"),
    )


# ============= Skills Models =============


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column("imageUrl", String)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    user_skills: Mapped[list["UserSkill"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan"
    )
    resources: Mapped[list["SkillResource"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan"
    )
    questions: Mapped[list["SkillQuestion"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan"
    )
    course_skills: Mapped[list["CourseSkill"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan"
    )
    learning_path_skills: Mapped[list["LearningPathSkill"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("tenantId", "id", name="skills_tenant_id_key"),)


class UserSkill(Base):
    __tablename__ = "user_skills"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(
        "skillId", String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[SkillLevel] = mapped_column(
        Enum(SkillLevel, native_enum=False), default=SkillLevel.BEGINNER
    )
    progress: Mapped[int] = mapped_column(Integer, default=0)
    evidence: Mapped[dict | None] = mapped_column(JSONB)
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    user: Mapped["User"] = relationship(back_populates="user_skills")
    skill: Mapped["Skill"] = relationship(back_populates="user_skills")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="user_skills_tenant_id_key"),
        UniqueConstraint(
            "tenantId", "userId", "skillId", name="user_skills_user_skill_unique"
        ),
    )


class JobRole(Base):
    __tablename__ = "job_roles"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    skills: Mapped[list["RoleSkill"]] = relationship(
        back_populates="role", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="job_roles_tenant_id_key"),
    )


class RoleSkill(Base):
    __tablename__ = "role_skills"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    role_id: Mapped[str] = mapped_column(
        "roleId", String, ForeignKey("job_roles.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(
        "skillId", String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    required_level: Mapped[SkillLevel] = mapped_column(
        "requiredLevel",
        Enum(SkillLevel, native_enum=False),
        default=SkillLevel.BEGINNER,
    )
    weight: Mapped[int] = mapped_column(Integer, default=1)

    # Relationships
    role: Mapped["JobRole"] = relationship(back_populates="skills")
    skill: Mapped["Skill"] = relationship()

    __table_args__ = (
        UniqueConstraint(
            "tenantId", "roleId", "skillId", name="role_skills_tenant_role_skill_unique"
        ),
    )


class SkillRecommendation(Base):
    __tablename__ = "skill_recommendations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    from_user_id: Mapped[str] = mapped_column(
        "fromUserId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    to_user_id: Mapped[str] = mapped_column(
        "toUserId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(
        "skillId", String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    from_user: Mapped["User"] = relationship(
        foreign_keys=[from_user_id], back_populates="sent_recommendations"
    )
    to_user: Mapped["User"] = relationship(
        foreign_keys=[to_user_id], back_populates="received_recommendations"
    )
    skill: Mapped["Skill"] = relationship()

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="skill_recommendations_tenant_id_key"),
    )


class SkillResource(Base):
    __tablename__ = "skill_resources"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(
        "skillId", String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    url: Mapped[str] = mapped_column(String, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    skill: Mapped["Skill"] = relationship(back_populates="resources")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="skill_resources_tenant_id_key"),
    )


class SkillQuestion(Base):
    __tablename__ = "skill_questions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(
        "skillId", String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict] = mapped_column(JSONB, nullable=False)
    correct_answer: Mapped[str] = mapped_column("correctAnswer", String, nullable=False)
    ai_generated: Mapped[bool] = mapped_column("aiGenerated", Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False)

    # Relationships
    skill: Mapped["Skill"] = relationship(back_populates="questions")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="skill_questions_tenant_id_key"),
    )


class CourseSkill(Base):
    __tablename__ = "course_skills"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[str] = mapped_column(
        "skillId", String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    weight: Mapped[int] = mapped_column(Integer, default=1)

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="skills")
    skill: Mapped["Skill"] = relationship(back_populates="course_skills")

    __table_args__ = (
        UniqueConstraint(
            "tenantId",
            "courseId",
            "skillId",
            name="course_skills_tenant_course_skill_unique",
        ),
    )


class LearningPathSkill(Base):
    __tablename__ = "learning_path_skills"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    learning_path_id: Mapped[str] = mapped_column(
        "learningPathId",
        String,
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False,
    )
    skill_id: Mapped[str] = mapped_column(
        "skillId", String, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    weight: Mapped[int] = mapped_column(Integer, default=1)

    # Relationships
    learning_path: Mapped["LearningPath"] = relationship(back_populates="skills")
    skill: Mapped["Skill"] = relationship(back_populates="learning_path_skills")

    __table_args__ = (
        UniqueConstraint(
            "tenantId",
            "learningPathId",
            "skillId",
            name="learning_path_skills_tenant_path_skill_unique",
        ),
    )


# ============= Group & Category Models =============


class Group(Base):
    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))
    branch_id: Mapped[str | None] = mapped_column(
        "branchId", String, ForeignKey("branches.id", ondelete="SET NULL")
    )
    instructor_id: Mapped[str | None] = mapped_column(
        "instructorId", String, ForeignKey("users.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    deleted_at: Mapped[datetime | None] = mapped_column("deletedAt", DateTime)
    auto_enroll: Mapped[bool] = mapped_column("autoEnroll", Boolean, default=False)
    max_members: Mapped[int | None] = mapped_column("maxMembers", Integer)
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    group_key: Mapped[str | None] = mapped_column("groupKey", String)

    # Relationships
    tenant: Mapped["Tenant"] = relationship(foreign_keys=[tenant_id])
    branch: Mapped["Branch | None"] = relationship(
        back_populates="groups", foreign_keys=[branch_id]
    )
    instructor: Mapped["User | None"] = relationship(
        back_populates="instructed_groups", foreign_keys=[instructor_id]
    )
    members: Mapped[list["GroupMember"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )
    courses: Mapped[list["GroupCourse"]] = relationship(
        back_populates="group", cascade="all, delete-orphan"
    )


class GroupMember(Base):
    __tablename__ = "group_members"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    group_id: Mapped[str] = mapped_column(
        "groupId", String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    added_at: Mapped[datetime] = mapped_column(
        "addedAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    group: Mapped["Group"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()

    __table_args__ = (
        UniqueConstraint("groupId", "userId", name="group_members_group_user_unique"),
    )


class GroupCourse(Base):
    __tablename__ = "group_courses"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    group_id: Mapped[str] = mapped_column(
        "groupId", String, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    added_at: Mapped[datetime] = mapped_column(
        "addedAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    group: Mapped["Group"] = relationship(back_populates="courses")
    course: Mapped["Course"] = relationship(back_populates="group_courses")

    __table_args__ = (
        UniqueConstraint(
            "groupId", "courseId", name="group_courses_group_course_unique"
        ),
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[str | None] = mapped_column(
        "parentId", String, ForeignKey("categories.id", ondelete="SET NULL")
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    # slug: Mapped[str] = mapped_column(String, nullable=False) # Column missing in DB
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships (self-referential)
    parent: Mapped["Category | None"] = relationship(
        back_populates="children", remote_side=[id]
    )
    children: Mapped[list["Category"]] = relationship(
        back_populates="parent", passive_deletes=True
    )
    courses: Mapped[list["Course"]] = relationship(
        back_populates="category", passive_deletes=True
    )


# ============= Assignment Models =============


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    course_id: Mapped[str | None] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="SET NULL")
    )
    due_at: Mapped[datetime | None] = mapped_column("dueAt", DateTime)
    created_by: Mapped[str] = mapped_column(
        "createdBy", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship(foreign_keys=[tenant_id])
    course: Mapped["Course | None"] = relationship(back_populates="assignments")
    creator: Mapped["User"] = relationship(
        back_populates="created_assignments", foreign_keys=[created_by]
    )


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    assignment_unit_id: Mapped[str | None] = mapped_column(
        "assignmentUnitId", String, ForeignKey("course_units.id", ondelete="CASCADE")
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    submission_type: Mapped[str] = mapped_column(
        "submissionType", String, nullable=False, default="text"
    )
    content: Mapped[str | None] = mapped_column(Text)
    file_id: Mapped[str | None] = mapped_column(
        "fileId", String, ForeignKey("files.id", ondelete="SET NULL")
    )
    status: Mapped[str] = mapped_column(String, nullable=False)
    score: Mapped[int | None] = mapped_column(Integer)
    max_score: Mapped[int] = mapped_column("maxScore", Integer, default=100)
    comment: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(
        "submittedAt", DateTime, default=datetime.utcnow
    )
    graded_at: Mapped[datetime | None] = mapped_column("gradedAt", DateTime)
    graded_by: Mapped[str | None] = mapped_column(
        "gradedBy", String, ForeignKey("users.id", ondelete="SET NULL")
    )

    # Relationships
    assignment_unit: Mapped["CourseUnit | None"] = relationship(
        back_populates="assignment_submissions"
    )
    user: Mapped["User"] = relationship(
        back_populates="assignment_submissions", foreign_keys=[user_id]
    )
    grader: Mapped["User | None"] = relationship(
        back_populates="graded_submissions", foreign_keys=[graded_by]
    )
    course: Mapped["Course"] = relationship(back_populates="assignment_submissions")
    file: Mapped["File | None"] = relationship(back_populates="submissions")


class LearnerCourseState(Base):
    __tablename__ = "learner_course_state"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    last_unit_id: Mapped[str | None] = mapped_column(
        "lastUnitId", String, ForeignKey("course_units.id", ondelete="SET NULL")
    )
    last_accessed_at: Mapped[datetime] = mapped_column(
        "lastAccessedAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    course: Mapped["Course"] = relationship(back_populates="learner_course_states")
    unit: Mapped["CourseUnit | None"] = relationship(
        back_populates="learner_course_states"
    )
    user: Mapped["User"] = relationship(back_populates="learner_course_states")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="learner_course_state_tenant_id_key"),
        UniqueConstraint(
            "tenantId",
            "userId",
            "courseId",
            name="learner_course_state_tenant_user_course_unique",
        ),
    )


class CourseRatingSetting(Base):
    __tablename__ = "course_rating_settings"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()


class CourseRating(Base):
    __tablename__ = "course_ratings"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    course: Mapped["Course"] = relationship(back_populates="course_ratings")
    user: Mapped["User"] = relationship(back_populates="course_ratings")

    __table_args__ = (
        UniqueConstraint(
            "tenantId",
            "courseId",
            "userId",
            name="course_ratings_tenant_course_user_unique",
        ),
    )


class Test(Base):
    __tablename__ = "tests"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    unit_id: Mapped[str] = mapped_column(
        "unitId",
        String,
        ForeignKey("course_units.id", ondelete="CASCADE"),
        nullable=False,
    )
    is_randomized: Mapped[bool] = mapped_column("isRandomized", Boolean, default=False)
    questions_to_show: Mapped[int | None] = mapped_column("questionsToShow", Integer)
    passing_score: Mapped[int] = mapped_column("passingScore", Integer, default=50)
    settings: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    unit: Mapped["CourseUnit"] = relationship(back_populates="tests")
    attempts: Mapped[list["TestAttempt"]] = relationship(
        back_populates="test", cascade="all, delete-orphan"
    )
    questions: Mapped[list["Question"]] = relationship(back_populates="test")

    __table_args__ = (UniqueConstraint("tenantId", "id", name="tests_tenant_id_key"),)


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    test_id: Mapped[str | None] = mapped_column(
        "testId", String, ForeignKey("tests.id")
    )
    question_pool_id: Mapped[str | None] = mapped_column("questionPoolId", String)
    type: Mapped[str] = mapped_column(String, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict | None] = mapped_column(JSONB)
    correct_answer: Mapped[dict] = mapped_column("correctAnswer", JSONB, nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=1)
    feedback: Mapped[str | None] = mapped_column(Text)
    tags: Mapped[dict | None] = mapped_column(JSONB)
    ai_generated: Mapped[bool] = mapped_column("aiGenerated", Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    test: Mapped["Test | None"] = relationship(back_populates="questions")
    keywords: Mapped[list["FreeTextKeyword"]] = relationship(
        back_populates="question", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="questions_tenant_id_key"),
    )


class QuestionPool(Base):
    __tablename__ = "question_pools"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    course_id: Mapped[str | None] = mapped_column(
        "courseId", String, ForeignKey("courses.id")
    )
    min_questions: Mapped[int] = mapped_column("minQuestions", Integer, default=2)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    course: Mapped["Course | None"] = relationship(back_populates="question_pools")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="question_pools_tenant_id_key"),
    )


class FreeTextKeyword(Base):
    __tablename__ = "free_text_keywords"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[str] = mapped_column(
        "questionId",
        String,
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    keyword: Mapped[str] = mapped_column(String, nullable=False)
    points_modifier: Mapped[int] = mapped_column(
        "pointsModifier", Integer, nullable=False
    )
    is_required: Mapped[bool] = mapped_column("isRequired", Boolean, default=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    question: Mapped["Question"] = relationship(back_populates="keywords")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="free_text_keywords_tenant_id_key"),
    )


class TestAttempt(Base):
    __tablename__ = "test_attempts"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    test_id: Mapped[str] = mapped_column(
        "testId", String, ForeignKey("tests.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        "startedAt", DateTime, default=datetime.utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column("completedAt", DateTime)
    score: Mapped[int | None] = mapped_column(Integer)
    max_score: Mapped[int] = mapped_column("maxScore", Integer, nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    answers: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    test: Mapped["Test"] = relationship(back_populates="attempts")
    user: Mapped["User"] = relationship(back_populates="test_attempts")
    course: Mapped["Course"] = relationship(back_populates="test_attempts")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="test_attempts_tenant_id_key"),
    )


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_time: Mapped[datetime] = mapped_column("startTime", DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column("endTime", DateTime, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    instructor_id: Mapped[str] = mapped_column(
        "instructorId",
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    instructor: Mapped["User"] = relationship(back_populates="calendar_events")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="calendar_events_tenant_id_key"),
    )


class Conference(Base):
    __tablename__ = "conferences"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    start_time: Mapped[datetime] = mapped_column("startTime", DateTime, nullable=False)
    end_time: Mapped[datetime] = mapped_column("endTime", DateTime, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    meeting_url: Mapped[str | None] = mapped_column("meetingUrl", String)
    instructor_id: Mapped[str] = mapped_column(
        "instructorId",
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    instructor: Mapped["User"] = relationship(back_populates="conferences")
    participants: Mapped[list["ConferenceParticipant"]] = relationship(
        back_populates="conference", cascade="all, delete-orphan"
    )
    tenant: Mapped["Tenant"] = relationship()

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="conferences_tenant_id_key"),
    )


# ============= Notification & Automation Models =============


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    event_key: Mapped[str] = mapped_column("eventKey", String, nullable=False)
    message_subject: Mapped[str] = mapped_column(
        "messageSubject", String, nullable=False
    )
    message_body: Mapped[str] = mapped_column("messageBody", Text, nullable=False)
    recipient_type: Mapped[str] = mapped_column("recipientType", String, nullable=False)
    recipient_user_id: Mapped[str | None] = mapped_column(
        "recipientUserId", String, ForeignKey("users.id", ondelete="SET NULL")
    )
    filter_branches: Mapped[list[str] | None] = mapped_column(
        "filterBranches", ARRAY(String), default=[]
    )
    filter_courses: Mapped[list[str] | None] = mapped_column(
        "filterCourses", ARRAY(String), default=[]
    )
    filter_groups: Mapped[list[str] | None] = mapped_column(
        "filterGroups", ARRAY(String), default=[]
    )
    hours_offset: Mapped[int | None] = mapped_column("hoursOffset", Integer)
    offset_direction: Mapped[str | None] = mapped_column("offsetDirection", String)
    is_active: Mapped[bool] = mapped_column("isActive", Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    history: Mapped[list["NotificationHistory"]] = relationship(
        back_populates="notification"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="notifications_tenant_id_key"),
    )


class NotificationHistory(Base):
    __tablename__ = "notification_history"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    notification_id: Mapped[str] = mapped_column(
        "notificationId",
        String,
        ForeignKey("notifications.id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_email: Mapped[str] = mapped_column(
        "recipientEmail", String, nullable=False
    )
    recipient_user_id: Mapped[str | None] = mapped_column("recipientUserId", String)
    event_key: Mapped[str] = mapped_column("eventKey", String, nullable=False)
    context_json: Mapped[dict | None] = mapped_column("contextJson", JSONB)
    sent_at: Mapped[datetime] = mapped_column(
        "sentAt", DateTime, default=datetime.utcnow
    )
    status: Mapped[str] = mapped_column(String, nullable=False)
    error_message: Mapped[str | None] = mapped_column("errorMessage", String)

    # Relationships
    notification: Mapped["Notification"] = relationship(back_populates="history")
    tenant: Mapped["Tenant"] = relationship()


class Automation(Base):
    __tablename__ = "automations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    trigger: Mapped[str] = mapped_column("type", String, nullable=False)
    conditions: Mapped[dict] = mapped_column("parameters", JSONB, default={})
    actions: Mapped[list[dict] | None] = mapped_column("filters", JSONB, default=[])
    active: Mapped[bool] = mapped_column("enabled", Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship(foreign_keys=[tenant_id])
    logs: Mapped[list["AutomationLog"]] = relationship(
        back_populates="automation", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="automations_tenant_id_key"),
    )


class AutomationLog(Base):
    __tablename__ = "automation_logs"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    automation_id: Mapped[str] = mapped_column(
        "automationId",
        String,
        ForeignKey("automations.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column("userId", String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB)
    executed_at: Mapped[datetime] = mapped_column(
        "executedAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    automation: Mapped["Automation"] = relationship(back_populates="logs")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="automation_logs_tenant_id_key"),
    )


# ============= Report & Certificate Models =============


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    ruleset: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_by: Mapped[str] = mapped_column(
        "createdBy", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    creator: Mapped["User"] = relationship(back_populates="reports")


class CertificateTemplate(Base):
    __tablename__ = "certificate_templates"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    html_body: Mapped[str] = mapped_column("htmlBody", Text, nullable=False)
    smart_tags: Mapped[dict] = mapped_column("smartTags", JSONB, nullable=False)
    is_system: Mapped[bool] = mapped_column("isSystem", Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    issues: Mapped[list["CertificateIssue"]] = relationship(
        back_populates="template", passive_deletes=True
    )


class CertificateIssue(Base):
    __tablename__ = "certificate_issues"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    course_id: Mapped[str | None] = mapped_column(
        "courseId", String, ForeignKey("courses.id", ondelete="SET NULL")
    )
    path_id: Mapped[str | None] = mapped_column(
        "pathId", String, ForeignKey("learning_paths.id", ondelete="SET NULL")
    )
    template_id: Mapped[str] = mapped_column(
        "templateId",
        String,
        ForeignKey("certificate_templates.id", ondelete="RESTRICT"),
        nullable=False,
    )
    issued_at: Mapped[datetime] = mapped_column(
        "issuedAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="certificate_issues")
    course: Mapped["Course | None"] = relationship(back_populates="certificate_issues")
    path: Mapped["LearningPath | None"] = relationship(
        back_populates="certificate_issues"
    )
    template: Mapped["CertificateTemplate"] = relationship(back_populates="issues")


# ============= Gamification Models =============


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image: Mapped[str] = mapped_column(String, nullable=False)
    criteria: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()

    __table_args__ = (UniqueConstraint("tenantId", "id", name="badges_tenant_id_key"),)


class Level(Base):
    __tablename__ = "levels"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    level_number: Mapped[int] = mapped_column("levelNumber", Integer, nullable=False)
    points_required: Mapped[int] = mapped_column(
        "pointsRequired", Integer, nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    badge: Mapped[str | None] = mapped_column(String)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="levels_tenant_id_key"),
        UniqueConstraint("tenantId", "levelNumber", name="levels_tenant_level_unique"),
    )


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    discount_percent: Mapped[int | None] = mapped_column("discountPercent", Integer)
    criteria: Mapped[dict] = mapped_column(JSONB, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()

    __table_args__ = (UniqueConstraint("tenantId", "id", name="rewards_tenant_id_key"),)


class GamificationSettings(Base):
    __tablename__ = "gamification_settings"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    branch_id: Mapped[str | None] = mapped_column(
        "branchId", String, ForeignKey("branches.id", ondelete="SET NULL")
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    points_enabled: Mapped[bool] = mapped_column("pointsEnabled", Boolean, default=True)
    badges_enabled: Mapped[bool] = mapped_column("badgesEnabled", Boolean, default=True)
    levels_enabled: Mapped[bool] = mapped_column("levelsEnabled", Boolean, default=True)
    rewards_enabled: Mapped[bool] = mapped_column(
        "rewardsEnabled", Boolean, default=True
    )
    leaderboard_enabled: Mapped[bool] = mapped_column(
        "leaderboardEnabled", Boolean, default=True
    )
    points_per_login: Mapped[int] = mapped_column("pointsPerLogin", Integer, default=10)
    max_level: Mapped[int] = mapped_column("maxLevel", Integer, default=20)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    branch: Mapped["Branch | None"] = relationship(
        back_populates="gamification_settings"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="gamification_settings_tenant_id_key"),
    )


class PointsLedger(Base):
    __tablename__ = "points_ledger"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="points_ledger")


# ============= Password Reset =============


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column("expiresAt", DateTime, nullable=False)
    used_at: Mapped[datetime | None] = mapped_column("usedAt", DateTime)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="password_reset_tokens")

    __table_args__ = (
        UniqueConstraint("token", name="password_reset_tokens_token_key"),
    )


# ============= Discussion Models =============


class Discussion(Base):
    __tablename__ = "discussions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    topic: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    audience_type: Mapped[AudienceType] = mapped_column(
        "audienceType", Enum(AudienceType, native_enum=False), nullable=False
    )
    audience_id: Mapped[str | None] = mapped_column("audienceId", String)
    branch_id: Mapped[str | None] = mapped_column("branchId", String)
    created_by: Mapped[str] = mapped_column("createdBy", String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    comments: Mapped[list["DiscussionComment"]] = relationship(
        back_populates="discussion", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="discussions_tenant_id_key"),
    )


class DiscussionComment(Base):
    __tablename__ = "discussion_comments"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    discussion_id: Mapped[str] = mapped_column(
        "discussionId",
        String,
        ForeignKey("discussions.id", ondelete="CASCADE"),
        nullable=False,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[str] = mapped_column("createdBy", String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    discussion: Mapped["Discussion"] = relationship(back_populates="comments")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="discussion_comments_tenant_id_key"),
    )


class DiscussionModerationSettings(Base):
    __tablename__ = "discussion_moderation_settings"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    edit_window_hours: Mapped[int] = mapped_column(
        "editWindowHours", Integer, default=2
    )
    moderator_role: Mapped[str] = mapped_column(
        "moderatorRole", String, default="Instructor"
    )
    settings: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()

    __table_args__ = (
        UniqueConstraint(
            "tenantId", "id", name="discussion_moderation_settings_tenant_id_key"
        ),
    )


# ============= Messaging Models =============


class MessageThread(Base):
    __tablename__ = "message_threads"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    subject: Mapped[str] = mapped_column(String, nullable=False)
    created_by: Mapped[str] = mapped_column("createdBy", String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    messages: Mapped[list["Message"]] = relationship(
        back_populates="thread", cascade="all, delete-orphan"
    )
    recipients: Mapped[list["MessageRecipient"]] = relationship(
        back_populates="thread", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="message_threads_tenant_id_key"),
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    thread_id: Mapped[str] = mapped_column(
        "threadId",
        String,
        ForeignKey("message_threads.id", ondelete="CASCADE"),
        nullable=False,
    )
    sender_id: Mapped[str] = mapped_column("senderId", String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    attachments: Mapped[dict | None] = mapped_column(JSONB)
    sent_at: Mapped[datetime] = mapped_column(
        "sentAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    thread: Mapped["MessageThread"] = relationship(back_populates="messages")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="messages_tenant_id_key"),
    )


class MessageRecipient(Base):
    __tablename__ = "message_recipients"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    thread_id: Mapped[str] = mapped_column(
        "threadId",
        String,
        ForeignKey("message_threads.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column("userId", String, nullable=False)
    is_read: Mapped[bool] = mapped_column("isRead", Boolean, default=False)
    read_at: Mapped[datetime | None] = mapped_column("readAt", DateTime)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    thread: Mapped["MessageThread"] = relationship(back_populates="recipients")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="message_recipients_tenant_id_key"),
        UniqueConstraint(
            "tenantId", "threadId", "userId", name="message_recipients_unique"
        ),
    )


class MessagingPermissions(Base):
    __tablename__ = "messaging_permissions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_type_id: Mapped[str] = mapped_column("userTypeId", String, nullable=False)
    can_message_admins: Mapped[bool] = mapped_column(
        "canMessageAdmins", Boolean, default=True
    )
    can_message_users: Mapped[bool] = mapped_column(
        "canMessageUsers", Boolean, default=True
    )
    can_message_instructors: Mapped[bool] = mapped_column(
        "canMessageInstructors", Boolean, default=True
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="messaging_permissions_tenant_id_key"),
    )


class TalentLibraryCourse(Base):
    __tablename__ = "talent_library_courses"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    external_id: Mapped[str] = mapped_column(
        "externalId", String, unique=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    preview_trailer: Mapped[str | None] = mapped_column("previewTrailer", String)
    categories: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_promoted: Mapped[bool] = mapped_column("isPromoted", Boolean, default=False)
    license: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Relationships
    acquired_by: Mapped[list["AcquiredLibraryCourse"]] = relationship(
        back_populates="library_course", cascade="all, delete-orphan"
    )


class AcquiredLibraryCourse(Base):
    __tablename__ = "acquired_library_courses"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    library_course_id: Mapped[str] = mapped_column(
        "libraryCourseId",
        String,
        ForeignKey("talent_library_courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    local_course_id: Mapped[str] = mapped_column(
        "localCourseId",
        String,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )
    hidden_from_catalog: Mapped[bool] = mapped_column(
        "hiddenFromCatalog", Boolean, default=True
    )
    acquired_at: Mapped[datetime] = mapped_column(
        "acquiredAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    course: Mapped["Course"] = relationship(back_populates="acquired_library_courses")
    library_course: Mapped["TalentLibraryCourse"] = relationship(
        back_populates="acquired_by"
    )

    __table_args__ = (
        UniqueConstraint(
            "tenantId", "id", name="acquired_library_courses_tenant_id_key"
        ),
        UniqueConstraint(
            "tenantId",
            "libraryCourseId",
            name="acquired_library_courses_tenant_library_course_unique",
        ),
    )


class EnrollmentExtension(Base):
    __tablename__ = "enrollment_extensions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    enrollment_id: Mapped[str] = mapped_column(
        "enrollmentId",
        String,
        ForeignKey("enrollments.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column("userId", String, nullable=False)
    course_id: Mapped[str] = mapped_column("courseId", String, nullable=False)
    new_expiration_date: Mapped[datetime] = mapped_column(
        "newExpirationDate", DateTime, nullable=False
    )
    extended_by: Mapped[str] = mapped_column("extendedBy", String, nullable=False)
    reason: Mapped[str | None] = mapped_column(String)
    extended_at: Mapped[datetime] = mapped_column(
        "extendedAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    enrollment: Mapped["Enrollment"] = relationship(back_populates="extensions")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="enrollment_extensions_tenant_id_key"),
    )


class PortalFeatureFlags(Base):
    __tablename__ = "portal_feature_flags"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId",
        String,
        ForeignKey("tenants.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        "createdAt", DateTime, default=datetime.utcnow
    )
    plan_tier: Mapped[str] = mapped_column("planTier", String, nullable=False)
    prerequisites_enabled: Mapped[bool] = mapped_column(
        "prerequisitesEnabled", Boolean, default=True
    )
    learning_paths_enabled: Mapped[bool] = mapped_column(
        "learningPathsEnabled", Boolean, default=False
    )
    learning_paths_limit: Mapped[int | None] = mapped_column(
        "learningPathsLimit", Integer
    )
    messaging_enabled: Mapped[bool] = mapped_column(
        "messagingEnabled", Boolean, default=False
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="portal_feature_flags_tenant_id_key"),
    )


class SCORMData(Base):
    __tablename__ = "scorm_data"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        "userId", String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    unit_id: Mapped[str] = mapped_column(
        "unitId",
        String,
        ForeignKey("course_units.id", ondelete="CASCADE"),
        nullable=False,
    )
    lesson_status: Mapped[str | None] = mapped_column("lessonStatus", String)
    lesson_location: Mapped[str | None] = mapped_column("lessonLocation", String)
    suspend_data: Mapped[str | None] = mapped_column("suspendData", String)
    score_raw: Mapped[float | None] = mapped_column("scoreRaw", Numeric)
    score_max: Mapped[float | None] = mapped_column("scoreMax", Numeric)
    score_min: Mapped[float | None] = mapped_column("scoreMin", Numeric)
    session_time: Mapped[str | None] = mapped_column("sessionTime", String)
    total_time: Mapped[str | None] = mapped_column("totalTime", String)
    updated_at: Mapped[datetime] = mapped_column(
        "updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    user: Mapped["User"] = relationship()
    unit: Mapped["CourseUnit"] = relationship(back_populates="scorm_data")

    __table_args__ = (
        UniqueConstraint(
            "tenantId", "userId", "unitId", name="scorm_data_tenant_user_unit_unique"
        ),
    )


class ILTSession(Base):
    __tablename__ = "ilt_sessions"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    ilt_unit_id: Mapped[str] = mapped_column(
        "iltUnitId",
        String,
        ForeignKey("course_units.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_id: Mapped[str] = mapped_column("courseId", String, nullable=False)
    session_date: Mapped[datetime] = mapped_column(
        "sessionDate", DateTime, nullable=False
    )
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    provider_data: Mapped[dict] = mapped_column("providerData", JSONB, nullable=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    unit: Mapped["CourseUnit"] = relationship(back_populates="ilt_sessions")
    attendance: Mapped[list["ILTAttendance"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="ilt_sessions_tenant_id_key"),
    )


class ILTAttendance(Base):
    __tablename__ = "ilt_attendance"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    session_id: Mapped[str] = mapped_column(
        "sessionId",
        String,
        ForeignKey("ilt_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column("userId", String, nullable=False)
    attended: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, nullable=False)
    graded_at: Mapped[datetime | None] = mapped_column("gradedAt", DateTime)
    graded_by: Mapped[str | None] = mapped_column("gradedBy", String)
    comment: Mapped[str | None] = mapped_column(String)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    session: Mapped["ILTSession"] = relationship(back_populates="attendance")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="ilt_attendance_tenant_id_key"),
    )


class File(Base):
    __tablename__ = "files"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(String, nullable=False)
    filepath: Mapped[str | None] = mapped_column(String)
    external_url: Mapped[str | None] = mapped_column("externalUrl", String)
    filesize: Mapped[int | None] = mapped_column(Integer)
    mime_type: Mapped[str] = mapped_column("mimeType", String, nullable=False)
    owner_type: Mapped[str] = mapped_column("ownerType", String, nullable=False)
    owner_id: Mapped[str] = mapped_column("ownerId", String, nullable=False)
    uploaded_by: Mapped[str] = mapped_column("uploadedBy", String, nullable=False)
    is_shared: Mapped[bool] = mapped_column("isShared", Boolean, default=False)
    can_share: Mapped[bool] = mapped_column("canShare", Boolean, default=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        "uploadedAt", DateTime, default=datetime.utcnow
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    submissions: Mapped[list["AssignmentSubmission"]] = relationship(
        back_populates="file", cascade="all, delete-orphan"
    )
    visibilities: Mapped[list["FileVisibility"]] = relationship(
        back_populates="file", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("tenantId", "id", name="files_tenant_id_key"),)


class FileVisibility(Base):
    __tablename__ = "file_visibility"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    file_id: Mapped[str] = mapped_column(
        "fileId", String, ForeignKey("files.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[str] = mapped_column("userId", String, nullable=False)
    can_view: Mapped[bool] = mapped_column("canView", Boolean, default=True)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    file: Mapped["File"] = relationship(back_populates="visibilities")

    __table_args__ = (
        UniqueConstraint("tenantId", "id", name="file_visibilities_tenant_id_key"),
    )


class ConferenceParticipant(Base):
    __tablename__ = "conference_participants"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    tenant_id: Mapped[str] = mapped_column(
        "tenantId", String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False
    )
    conference_id: Mapped[str] = mapped_column(
        "conferenceId",
        String,
        ForeignKey("conferences.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column("userId", String, nullable=False)
    notified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship()
    conference: Mapped["Conference"] = relationship(back_populates="participants")

    __table_args__ = (
        UniqueConstraint(
            "tenantId", "id", name="conference_participants_tenant_id_key"
        ),
        UniqueConstraint(
            "tenantId",
            "conferenceId",
            "userId",
            name="conference_participants_tenant_conference_user_unique",
        ),
    )


class LRSStatement(Base):
    __tablename__ = "lrs_statements"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid4())
    )
    actor: Mapped[dict] = mapped_column(JSONB, nullable=False)
    verb: Mapped[dict] = mapped_column(JSONB, nullable=False)
    object: Mapped[dict] = mapped_column(JSONB, nullable=False)
    result: Mapped[dict | None] = mapped_column(JSONB)
    context: Mapped[dict | None] = mapped_column(JSONB)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    stored: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    authority: Mapped[dict | None] = mapped_column(JSONB)
    version: Mapped[str] = mapped_column(String, default="1.0.3")


