from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from app.routes import users, products, base
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from app.admin import init_admin
from app.db import engine, Base


app = FastAPI()


templates = Jinja2Templates(directory="app/templates")
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(users.router)
app.include_router(products.router)
app.include_router(base.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)


init_admin(app)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def get_register_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})
    
@app.get("/login/")
def get_login_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@app.get("/logout/")
def get_login_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@app.get("/shop/")
def shop_page(request: Request):
    return templates.TemplateResponse("shop.html", {"request": request})

@app.get("/home/")
def home_page():
    return FileResponse("app/templates/home.html")

@app.get("/about/")
def about_page():
    return FileResponse("app/templates/about.html") 

@app.get("/product/{product_id}/")
def get_product_detail():
    return FileResponse("app/templates/product_detail.html") 

@app.get("/profile/")
def profile_page():
    return FileResponse("app/templates/profile.html")

# @app.get("/stat/")
# def stat_page():
#     return FileResponse("app/templates/analytics.html")

@app.get("/cart/")
def cart():
    return FileResponse("app/templates/cart-bag.html")

@app.get("/test/")
def test():
    return FileResponse("app/templates/yandexmap.html")

@app.get("/collections/")
def collections():
    return FileResponse("app/templates/collections.html")

@app.get("/addresses/")
async def get_addresses():
    return {"message": "List of addresses"}

# @app.post("/addresses/")
# def addresses():
#     return FileResponse("app/templates/adresses.html")

# @app.post("/liked/")
# def liked():
#     return FileResponse("app/templates/liked.html")

# @app.post("/archive/")
# def archive():
#     return FileResponse("app/templates/archive.html")

# @app.post("/filter_shop/")
# def archive():
#     return FileResponse("app/templates/shop.html")

#     venv/Scripts/activate
#     uvicorn app.main:app --reload
#     http://localhost:8000/docs#/
#     python manage.py runserver 8080
#     Get-Process | Where-Object { $_.ProcessName -like "*python*" } | Stop-Process -Force
#     http://127.0.0.1:8000/admin
#     docker run -d --name redis -p 6379:6379 redis
#     http://localhost:3000/analytics/






