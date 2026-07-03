from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from ..database import Base

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, default="uncategorized")

class PriceLog(Base):
    __tablename__ = "price_logs"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False)
    vendor_id = Column(Integer, nullable=False)
    price = Column(Integer, nullable=False)
    date = Column(DateTime(timezone=True), server_default=func.now())