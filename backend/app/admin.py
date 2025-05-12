from sqladmin import Admin, ModelView
from .models import User, Product, ProductColor
from .db import engine  

class UserAdmin(ModelView, model=User):
    column_list = [User.user_id, User.username, User.email, User.role, User.created_at]
    form_excluded_columns = ["salt"]

class ProductAdmin(ModelView, model=Product):
    column_list = [Product.product_id, Product.product_name, Product.price, Product.amount]

class ProductColorAdmin(ModelView, model=ProductColor):
    column_list = [ProductColor.color_id, ProductColor.color_name, ProductColor.image_path]

def init_admin(app):
    admin = Admin(app=app, engine=engine)
    admin.add_view(UserAdmin)
    admin.add_view(ProductAdmin)
    admin.add_view(ProductColorAdmin)
