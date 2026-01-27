"""add_assigned_instructor_id

Revision ID: 84ec1731bc05
Revises: 1505e877ab3f
Create Date: 2026-01-21 18:50:51.868957

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "84ec1731bc05"
down_revision: Union[str, Sequence[str], None] = "1505e877ab3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "assignments", sa.Column("assignedInstructorId", sa.String(), nullable=True)
    )
    op.create_foreign_key(
        "fk_assignments_assigned_instructor",
        "assignments",
        "users",
        ["assignedInstructorId"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_assignments_assigned_instructor", "assignments", type_="foreignkey"
    )
    op.drop_column("assignments", "assignedInstructorId")
