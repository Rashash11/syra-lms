"""add_enrolled_at_to_enrollments

Revision ID: 1505e877ab3f
Revises: 003_fix_enum_case
Create Date: 2026-01-21 00:16:54.331225

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "1505e877ab3f"
down_revision: Union[str, Sequence[str], None] = "003_fix_enum_case"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add enrolledAt column
    op.add_column("enrollments", sa.Column("enrolledAt", sa.DateTime(), nullable=True))

    # Backfill with createdAt for existing records
    op.execute(
        'UPDATE enrollments SET "enrolledAt" = "createdAt" WHERE "enrolledAt" IS NULL'
    )

    # Make it nullable=False if desired, but keeping it nullable=True initially is safer for migration
    # op.alter_column('enrollments', 'enrolledAt', nullable=False)


def downgrade() -> None:
    op.drop_column("enrollments", "enrolledAt")
