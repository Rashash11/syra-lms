"""Drop duplicate lowercase enum types

Revision ID: 003_fix_enum_case
Revises: 002_add_enum_types
Create Date: 2026-01-20

Removes duplicate lowercase enum types that were created in error.
The database already has uppercase enum types (UnitType, UnitStatus, etc.)
that are being used by tables. We'll drop the lowercase duplicates.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = "003_fix_enum_case"
down_revision: Union[str, Sequence[str], None] = "002_add_enum_types"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop duplicate lowercase enum types."""
    conn = op.get_bind()

    # List of lowercase enum types to drop
    lowercase_enums = [
        "audiencetype",
        "certificatetype",
        "completionrule",
        "courseordermode",
        "coursestatus",
        "enrollmentstatus",
        "rolekey",
        "skilllevel",
        "unitstatus",
        "unittype",
        "unlocktype",
        "userstatus",
    ]

    for enum_name in lowercase_enums:
        drop_sql = text(f"DROP TYPE IF EXISTS {enum_name} CASCADE")
        try:
            conn.execute(drop_sql)
            print(f"✓ Dropped duplicate enum: {enum_name}")
        except Exception as e:
            print(f"✗ Failed to drop {enum_name}: {e}")

    print("\n✓ Migration complete. Removed all duplicate lowercase enum types.")


def downgrade() -> None:
    """Recreate lowercase enum types (not recommended)."""
    # Downgrade not supported - would need to recreate all lowercase enums
    pass
