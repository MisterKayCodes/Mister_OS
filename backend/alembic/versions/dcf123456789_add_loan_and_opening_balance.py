"""add loan and opening balance

Revision ID: dcf123456789
Revises: dceaa7e4494b
Create Date: 2026-07-11 16:47:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'dcf123456789'
down_revision = 'bb4d823b7339'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # add opening_balance column
    op.add_column('wallets', sa.Column('opening_balance', sa.Integer(), nullable=True, server_default='0'))
    
    # create loans table
    op.create_table('loans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('principal_amount', sa.Integer(), nullable=True),
        sa.Column('repayment_amount', sa.Integer(), nullable=True),
        sa.Column('payment_type', sa.String(), nullable=True),
        sa.Column('installments_count', sa.Integer(), nullable=True),
        sa.Column('amount_paid', sa.Integer(), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('settled', sa.Boolean(), nullable=True),
        sa.Column('wallet_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_loans_id'), 'loans', ['id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_loans_id'), table_name='loans')
    op.drop_table('loans')
    op.drop_column('wallets', 'opening_balance')
