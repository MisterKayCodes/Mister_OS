"""dynamic loan installments

Revision ID: 875961938e0d
Revises: dcf123456789
Create Date: 2026-07-11 19:38:46.541216

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '875961938e0d'
down_revision = 'dcf123456789'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create loan_installments table
    op.create_table('loan_installments',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('loan_id', sa.Integer(), nullable=True),
    sa.Column('amount_due', sa.Integer(), nullable=True),
    sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('status', sa.String(), nullable=True),
    sa.ForeignKeyConstraint(['loan_id'], ['loans.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('loan_installments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_loan_installments_id'), ['id'], unique=False)

    # Remove old columns from loans that are replaced by installments
    with op.batch_alter_table('loans', schema=None) as batch_op:
        batch_op.drop_column('installments_count')
        batch_op.drop_column('due_date')


def downgrade() -> None:
    with op.batch_alter_table('loans', schema=None) as batch_op:
        batch_op.add_column(sa.Column('due_date', sa.DATETIME(), nullable=True))
        batch_op.add_column(sa.Column('installments_count', sa.INTEGER(), nullable=True))

    with op.batch_alter_table('loan_installments', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_loan_installments_id'))

    op.drop_table('loan_installments')
