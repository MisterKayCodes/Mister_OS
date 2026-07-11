"""merge heads

Revision ID: aaa000merge001
Revises: c16625661111, 875961938e0d
Create Date: 2026-07-11 19:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'aaa000merge001'
down_revision = ('c16625661111', '875961938e0d')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
