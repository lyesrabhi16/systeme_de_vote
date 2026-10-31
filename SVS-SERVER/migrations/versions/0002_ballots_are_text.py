"""ballots are text

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-30 17:28:00.000000+00:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("bulletin") as batch_op:
        batch_op.alter_column(
            "content",
            existing_type=sa.String(length=100000),
            type_=sa.Text(),
            existing_nullable=False,
        )

    with op.batch_alter_table("vote") as batch_op:
        batch_op.alter_column(
            "encrypted_tally",
            existing_type=sa.String(length=20000),
            type_=sa.Text(),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "tally_proof",
            existing_type=sa.String(length=20000),
            type_=sa.Text(),
            existing_nullable=True,
        )


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("vote") as batch_op:
        batch_op.alter_column(
            "encrypted_tally",
            existing_type=sa.Text(),
            type_=sa.String(length=20000),
            existing_nullable=True,
        )
        batch_op.alter_column(
            "tally_proof",
            existing_type=sa.Text(),
            type_=sa.String(length=20000),
            existing_nullable=True,
        )

    with op.batch_alter_table("bulletin") as batch_op:
        batch_op.alter_column(
            "content",
            existing_type=sa.Text(),
            type_=sa.String(length=100000),
            existing_nullable=False,
        )
