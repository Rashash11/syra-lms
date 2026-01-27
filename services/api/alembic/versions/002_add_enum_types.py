"""Add enum types to PostgreSQL

Revision ID: 002_add_enum_types
Revises: 001_add_fk_constraints
Create Date: 2026-01-20

Adds PostgreSQL enum types that are referenced by the SQLAlchemy models.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = "002_add_enum_types"
down_revision: Union[str, Sequence[str], None] = "001_add_fk_constraints"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add missing enum types - simplified approach."""
    conn = op.get_bind()

    # Define all enums: (enum_name, [values])
    enums = [
        ("userstatus", ["ACTIVE", "SUSPENDED", "PENDING", "DEACTIVATED"]),
        ("rolekey", ["ADMIN", "BRANCH_ADMIN", "INSTRUCTOR", "LEARNER"]),
        ("coursestatus", ["DRAFT", "PUBLISHED", "ARCHIVED"]),
        (
            "enrollmentstatus",
            ["ACTIVE", "COMPLETED", "DROPPED", "PENDING", "EXPIRED", "SUSPENDED"],
        ),
        (
            "unittype",
            [
                "TEXT",
                "VIDEO",
                "QUIZ",
                "ASSIGNMENT",
                "SCORM",
                "INTERACTIVE",
                "DISCUSSION",
                "SURVEY",
                "FILE",
                "LINK",
                "EMBED",
                "H5P",
                "WEBINAR",
                "ILT",
                "PODCAST",
                "EBOOK",
                "CASE_STUDY",
            ],
        ),
        ("unitstatus", ["DRAFT", "PUBLISHED", "ARCHIVED"]),
        ("skilllevel", ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
        ("unlocktype", ["IMMEDIATELY", "SEQUENTIAL", "SCHEDULED", "PREREQUISITE"]),
        ("courseordermode", ["FLEXIBLE", "SEQUENTIAL"]),
        ("completionrule", ["ALL", "MINIMUM_PERCENT", "MINIMUM_COUNT"]),
        ("certificatetype", ["COMPLETION", "PARTICIPATION", "ACHIEVEMENT"]),
        ("audiencetype", ["ALL", "BRANCHES", "GROUPS", "USERS"]),
    ]

    # Create all enum types - using DO block to handle errors gracefully
    for enum_name, values in enums:
        values_str = ", ".join([f"'{val}'" for val in values])
        create_sql = text(f"""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '{enum_name}') THEN
                    CREATE TYPE {enum_name} AS ENUM ({values_str});
                    RAISE NOTICE 'Created enum type: {enum_name}';
                ELSE
                    RAISE NOTICE 'Enum type already exists: {enum_name}';
                END IF;
            END
            $$;
        """)
        conn.execute(create_sql)
        # conn.commit()  # Commit after each enum creation

    # Map columns to their enum types: (table_name, column_name, enum_name)
    column_mappings = [
        # Users table
        ("users", "status", "userstatus"),
        # UserRole table
        ("user_roles", "role", "rolekey"),
        # Courses table
        ("courses", "status", "coursestatus"),
        ("courses", "orderMode", "courseordermode"),
        ("courses", "unlockType", "unlocktype"),
        ("courses", "completionRule", "completionrule"),
        ("courses", "skillLevel", "skilllevel"),
        ("courses", "audienceType", "audiencetype"),
        # Enrollments table
        ("enrollments", "status", "enrollmentstatus"),
        # CourseUnit table
        ("course_units", "type", "unittype"),
        ("course_units", "status", "unitstatus"),
        # LearningPath table
        ("learning_paths", "skillLevel", "skilllevel"),
        # CertificateTemplate table
        ("certificate_templates", "certificateType", "certificatetype"),
    ]

    # Alter columns to use enum types
    for table_name, column_name, enum_name in column_mappings:
        # Use DO block to handle errors gracefully
        alter_sql = text(f"""
            DO $$
            BEGIN
                -- Check if column exists
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = '{table_name}' AND column_name = '{column_name}'
                ) THEN
                    -- Check if column is not already an enum
                    IF (SELECT data_type FROM information_schema.columns 
                        WHERE table_name = '{table_name}' AND column_name = '{column_name}') != 'USER-DEFINED' THEN
                        ALTER TABLE "{table_name}" 
                        ALTER COLUMN "{column_name}" TYPE {enum_name} 
                        USING "{column_name}"::{enum_name};
                        RAISE NOTICE 'Altered column {table_name}.{column_name} to use {enum_name}';
                    ELSE
                        RAISE NOTICE 'Column {table_name}.{column_name} already uses enum type';
                    END IF;
                ELSE
                    RAISE NOTICE 'Column {table_name}.{column_name} does not exist - skipping';
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE NOTICE 'Failed to alter {table_name}.{column_name}: %', SQLERRM;
            END
            $$;
        """)
        conn.execute(alter_sql)
        # conn.commit()  # Commit after each column alteration

    print("\n✓ Migration complete. All enum types created and columns updated.")


def downgrade() -> None:
    """Drop enum types (dangerous - only for dev)."""
    conn = op.get_bind()

    # First, alter columns back to VARCHAR
    column_mappings = [
        ("users", "status"),
        ("user_roles", "role"),
        ("courses", "status"),
        ("courses", "orderMode"),
        ("courses", "unlockType"),
        ("courses", "completionRule"),
        ("courses", "skillLevel"),
        ("courses", "audienceType"),
        ("enrollments", "status"),
        ("course_units", "type"),
        ("course_units", "status"),
        ("learning_paths", "skillLevel"),
        ("certificate_templates", "certificateType"),
    ]

    for table_name, column_name in column_mappings:
        try:
            alter_sql = text(f"""
                ALTER TABLE "{table_name}" 
                ALTER COLUMN "{column_name}" TYPE VARCHAR 
                USING "{column_name}"::VARCHAR
            """)
            conn.execute(alter_sql)
        except Exception:
            pass

    # Drop enum types
    enum_names = [
        "userstatus",
        "rolekey",
        "coursestatus",
        "enrollmentstatus",
        "unittype",
        "unitstatus",
        "skilllevel",
        "unlocktype",
        "courseordermode",
        "completionrule",
        "certificatetype",
        "audiencetype",
    ]

    for enum_name in enum_names:
        try:
            conn.execute(text(f"DROP TYPE IF EXISTS {enum_name} CASCADE"))
        except Exception:
            pass
