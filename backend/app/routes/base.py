from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from app.database import get_db_connection
from fastapi.responses import RedirectResponse, FileResponse, HTMLResponse, JSONResponse
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

app = FastAPI()

genai.configure(api_key="")
# model = genai.GenerativeModel(model_name="models/gemini-1.5-pro-latest")
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")



templates = Jinja2Templates(directory="app/templates")
router = APIRouter()


origins = [
    "http://localhost:3000",  
    # "https://GD.com", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,           
    allow_credentials=True,
    allow_methods=["*"],             
    allow_headers=["*"],             
)

@router.get("/home/")
def home_page():
    return {"message": "Welcome to the Home Page!"} 

@router.get("/about/")
def about_page():
    return FileResponse("app/templates/about.html") 



@router.get("/stat/", response_class=JSONResponse)
async def show_stat(request: Request):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("select product_id, product_name, description, price, image from products")
        products = cur.fetchall()

        cur.execute("""
            select p.product_id, p.product_name, count(c.product_id) as cart_count
            from products p
            left join cart c on p.product_id = c.product_id
            group by p.product_id, p.product_name
        """)
        cart_stats = cur.fetchall()

        cur.execute("""
            select p.product_id, p.product_name, count(l.product_id) as like_count
            from products p
            left join liked l on p.product_id = l.product_id
            group by p.product_id, p.product_name
        """)
        like_stats = cur.fetchall()

        cur.execute("""
            select p.product_id, p.product_name, sum(a.quantity) as sold_count
            from products p
            join archive a on p.product_id = a.product_id
            group by p.product_id, p.product_name
            order by sold_count desc
            limit 1
        """)
        most_sold = cur.fetchone()

        cur.execute("""
            select p.product_id, p.product_name, count(l.product_id) as like_count
            from products p
            left join liked l on p.product_id = l.product_id
            group by p.product_id, p.product_name
            order by like_count desc
            limit 5
        """)
        top_liked = cur.fetchall()

        formatted_data = "\n".join([
            f"{row['product_name']} — {row['price']} ₸. {row['description'] or 'Нет описания'}"
            for row in products
        ])

        popularity_data = "\n".join([
            f"{row['product_name']} — добавлен в корзину {row['cart_count']} раз, лайков: {next((x['like_count'] for x in like_stats if x['product_id'] == row['product_id']), 0)}, в топе лайков: {'Да' if any(x['product_id'] == row['product_id'] for x in top_liked) else 'Нет'}"
            for row in cart_stats
        ])

        prompt = (
            "Сделай расширенный аналитический отчёт по следующим товарам:\n"
            f"{formatted_data}\n\n"
            "Дополнительная информация о популярности товаров:\n"
            f"{popularity_data}\n\n"
            "1. Проанализируй ассортимент товаров\n"
            "2. Проанализируй популярность товаров\n"
            "3. Выяви взаимосвязь между ценой и популярностью\n"
            "4. Определи потенциально популярные товары\n"
            "5. Дай рекомендации по улучшению ассортимента\n"
            "6. Учитывая историю продаж и лайки, спрогнозируй тренды"
        )

        try:
            response = model.generate_content(prompt)
            stat_text = response.text
            stat_text = stat_text.replace('#', '').replace('*', '')
        except Exception as e:
            print("error from gemini:", e)
            stat_text = "Ошибка при генерации анализа."

        response_data = {
            "products_count": len(products),
            "total_value": sum(row['price'] for row in products),
            "average_price": sum(row['price'] for row in products) / len(products) if products else 0,
            "most_expensive": max(products, key=lambda x: x['price'], default=None),
            "cheapest": min(products, key=lambda x: x['price'], default=None),
            "most_sold": most_sold,
            "top_liked": [{"product_id": row["product_id"], "product_name": row["product_name"], "like_count": row["like_count"]} for row in top_liked],
            "cart_stats": {row['product_id']: row['cart_count'] for row in cart_stats},
            "like_stats": {row['product_id']: row['like_count'] for row in like_stats},
            "analysis": stat_text.split('\n'),
            "recommendations": {
                "labels": [row['product_name'] for row in products],
                "prices": [row['price'] for row in products],
                "cart_counts": [row['cart_count'] for row in cart_stats],
                "like_counts": [row['like_count'] for row in like_stats],
                "in_top_liked": [any(x['product_id'] == row['product_id'] for x in top_liked) for row in products]
            },
            "products": products
        }
        

    finally:
        cur.close()
        conn.close()

    return response_data