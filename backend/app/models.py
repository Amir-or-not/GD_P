from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import BYTEA
from datetime import datetime
import enum

from .db import Base

class Role(enum.Enum):
    admin = 'admin'
    user = 'user'
    seller = 'seller'

class User(Base):
    __tablename__ = 'users'

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(Text, nullable=False)
    full_name = Column(String(100))
    phone = Column(String(50))
    password_hash = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    role = Column(SqlEnum(Role), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    avatar = Column(String(255))
    salt = Column(BYTEA, nullable=False)

class Product(Base):
    __tablename__ = 'products'

    product_id = Column(Integer, primary_key=True, autoincrement=True)
    product_name = Column(String(255), nullable=False)
    description = Column(Text)
    product_category = Column(Text)
    image = Column(Text)
    posted_at = Column(DateTime, default=datetime.utcnow)
    price = Column(Float, nullable=False)
    amount = Column(Integer, nullable=False)

    colors = relationship("ProductColor", back_populates="product", cascade="all, delete-orphan")

class ProductColor(Base):
    __tablename__ = 'product_colors'

    color_id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey('products.product_id', ondelete="CASCADE"), nullable=False)
    color_name = Column(String(50), nullable=False)
    image_path = Column(String(255), nullable=False)

    product = relationship("Product", back_populates="colors")
