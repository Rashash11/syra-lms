"""update assignment submission model

Revision ID: e7ea8eb5b60d
Revises: 84ec1731bc05
Create Date: 2026-01-21 18:57:14.171917

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "e7ea8eb5b60d"
down_revision: Union[str, Sequence[str], None] = "84ec1731bc05"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # op.add_column(
    #     "assignment_submissions", sa.Column("assignmentId", sa.String(), nullable=True)
    # )
    op.alter_column(
        "assignment_submissions",
        "assignmentUnitId",
        existing_type=sa.String(),
        nullable=True,
    )
    # op.create_foreign_key(
    #     "fk_assignment_submissions_assignment",
    #     "assignment_submissions",
    #     "assignments",
    #     ["assignmentId"],
    #     ["id"],
    #     ondelete="CASCADE",
    # )


def downgrade() -> None:
    # op.drop_constraint(
    #     "fk_assignment_submissions_assignment",
    #     "assignment_submissions",
    #     type_="foreignkey",
    # )
    op.alter_column(
        "assignment_submissions",
        "assignmentUnitId",
        existing_type=sa.String(),
        nullable=False,
    )
    # op.drop_column("assignment_submissions", "assignmentId")
