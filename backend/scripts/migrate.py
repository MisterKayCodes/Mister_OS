from data.database import engine, Base
from data.models import Wallet, Transaction, Goal, Debt, BudgetCap, FinanceSettings

def migrate():
    # Create the new tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")

if __name__ == "__main__":
    migrate()
