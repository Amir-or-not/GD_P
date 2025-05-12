from fastapi import APIRouter, Request, Form, Depends, HTTPException, UploadFile, File
from fastapi.templating import Jinja2Templates
from app.database import get_db_connection
from fastapi.responses import RedirectResponse, JSONResponse
from app.routes import users, products, base
import google.generativeai as genai
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import shutil
import uuid
import os
from psycopg2.extras import RealDictCursor
from typing import List

app = FastAPI()

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



genai.configure(api_key="")
model = genai.GenerativeModel(model_name="models/gemini-1.5-flash")


templates = Jinja2Templates(directory="app/templates")
router = APIRouter()

@router.get("/shop/")
def show_shop(request: Request):
    conn = get_db_connection()
    cur = conn.cursor()
    role = request.cookies.get("role", "user")
    try:
        cur.execute("SELECT product_id, product_name, description, price, image FROM products")
        products = cur.fetchall()
        # print("DEBUG: products from DB -->", products)
        product_list = [
            {
                "id": row["product_id"],
                "name": row["product_name"],
                "description": row["description"] if row["description"] else "No description.",
                "price": row["price"],
                "image": row["image"]
            } for row in products
        ]
        
    finally:
        cur.close()
        conn.close()

    return JSONResponse(content={"products": product_list, "role": role})

@router.get("/filter_shop/")
def filter_shop(product_category: str):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        category_upper = product_category.upper()
        if category_upper == "ALL":
            cur.execute("SELECT product_id, product_name, description, price, image FROM products")
        else:
            cur.execute(
                "SELECT product_id, product_name, description, price, image FROM products WHERE product_category = %s",
                (category_upper,)
            )
        
        products = cur.fetchall()
        
        product_list = [
            {
                "id": row["product_id"],
                "name": row["product_name"],
                "description": row["description"] if row["description"] else "No description",
                "price": row["price"],
                "image": row["image"]
            } for row in products
        ]
        
        return {"products": product_list}
        
    except Exception as e:
        print(f"Ошибка при фильтрации товаров: {e}")
        return {"products": [], "error": str(e)}
    finally:
        cur.close()
        conn.close()

@router.get("/product/{product_name}/")
def product_detail(product_name: str, request: Request):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT product_id, product_name, description, price, image FROM products WHERE product_name = %s", (product_name,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Product not found")

        product = {
            "id": row["product_id"],
            "name": row["product_name"],
            "description": row["description"] if row["description"] else "Нет описания.",
            "price": row["price"],
            "image": row["image"]
        }

        cur.execute("SELECT color_name, image_path FROM product_colors WHERE product_id = %s", (product["id"],))
        colors = cur.fetchall()

        color_options = [
            {"color": c["color_name"], "image": c["image_path"]}
            for c in colors
        ]

        cur.execute("SELECT product_name, description, price FROM products WHERE product_id != %s", (product["id"],))
        other_products = cur.fetchall()

        formatted_data = "\n".join([
            f"{p['product_name']} — {p['price']} ₸. {p['description'] or 'Нет описания'}"
            for p in other_products
        ])

        prompt = (
            f"Дан товар: {product['name']} — {product['price']} ₸. {product['description']}\n\n"
            f"Вот другие товары:\n{formatted_data}\n\n"
            # "Выбери 4 наиболее похожих на основании полученных данных. Выведи только названия."
            "Выбери 4 наиболее похожих на основании полученных данных. Выведи только названия и ничего больше, никогда."
        )

        try:
            response = model.generate_content(prompt)
            similar_names = [name.strip() for name in response.text.split('\n') if name.strip()]
            print('Gemini answer --->', similar_names)
        except Exception as e:
            print("ERROR FROM GEMINI:", e)
            similar_names = []

        placeholders = ','.join(['%s'] * len(similar_names))
        cur.execute(f"SELECT product_id, product_name, description, price, image FROM products WHERE product_name IN ({placeholders})", tuple(similar_names))
        similar_products = cur.fetchall()

    finally:
        cur.close()
        conn.close()

    return JSONResponse(content={
        "product": product,
        "similar_products": similar_products,
        "colors": color_options
    })



@router.get("/cart/")
async def show_cart(request: Request):
    conn = get_db_connection()
    cur = conn.cursor()
    
    user_id = request.cookies.get("user_id")
    if user_id is None:
        return RedirectResponse(url="/login/")
    
    try:
        cur.execute("""
            SELECT p.product_id, p.product_name, p.description, p.price, p.image, c.quantity
            FROM cart c
            JOIN products p ON c.product_id = p.product_id
            WHERE c.user_id = %s
        """, (user_id,))
        cart_items = cur.fetchall()

        items = [
            {
                "id": row['product_id'],
                "name": row['product_name'],
                "description": row['description'] or "Нет описания",
                "price": row['price'],
                "image": row['image'],
                "quantity": row['quantity']
            } for row in cart_items
        ]

        cur.execute("""
            SELECT product_id, product_name, description, price, image 
            FROM products
        """)
        all_products = cur.fetchall()

        if items:
            cart_summary = "\n".join(
                f"- {item['name']} ({item['price']}₸): {item['description']}"
                for item in items
            )

            all_products_summary = "\n".join(
                f"- {p['product_name']} ({p['price']}₸): {p['description'] or 'Нет описания'}"
                for p in all_products
            )

            prompt = f"""
            На основе этих товаров в корзине:
            {cart_summary}

            И всех доступных товаров:
            {all_products_summary}

            Рекомендуй 4 товара которые:
            1. Хорошо сочетаются с товарами из корзины
            2. Точно подойдут пользователю исходя из всех данных которые тебе предоставлены
            3. Имею схожие данные и категорию
            4. Не повторяй товары которые у пользователя уже в корзине
            Верни только названия рекомендуемых товаров, каждое с новой строки, без дополнительного текста.
            """

            try:
                response = model.generate_content(prompt)
                recommended_names = [name.strip() for name in response.text.split('\n') if name.strip()]
                recommended_names = recommended_names[:4]  
                print(recommended_names)
            except Exception as e:
                print("Ошибка генерации рекомендаций:", e)
                recommended_names = []

            if recommended_names:
                placeholders = ','.join(['%s'] * len(recommended_names))
                cur.execute(
                    f"SELECT product_id, product_name, description, price, image FROM products WHERE product_name IN ({placeholders})",
                    tuple(recommended_names)
                )
                recommended_products = cur.fetchall()
            else:
                recommended_products = []
        else:
            recommended_products = []

    finally:
        cur.close()
        conn.close()

    return JSONResponse(content={
        "items": items,
        "recommendations": [
            {
                "id": p['product_id'],
                "name": p['product_name'],
                "description": p['description'] or "Нет описания",
                "price": p['price'],
                "image": p['image']
            } for p in recommended_products
        ]
    })

@router.post("/add-to-cart/{product_id}")
def add_to_cart(request: Request, product_id: int, quantity: int = Form(1)):
    conn = get_db_connection()
    cur = conn.cursor()

    user_id = request.cookies.get("user_id") 

    # user_id = 14

    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    user_id = int(user_id)

    try:
        cur.execute("""
            select quantity from cart
            where user_id = %s and product_id = %s
        """, (user_id, product_id))
        result = cur.fetchone()

        if result:
            cur.execute("""
                update cart
                set quantity = quantity + %s
                where user_id = %s and product_id = %s
            """, (quantity, user_id, product_id))
        else:
            cur.execute("""
                insert into cart (user_id, product_id, quantity)
                values (%s, %s, %s)
            """, (user_id, product_id, quantity))

        conn.commit()
    finally:
        cur.close()
        conn.close()

    
    print(f"User {user_id} добавил товар {product_id} в количестве {quantity}")
    return {"message": "Added to cart"}

@router.delete("/remove-from-cart/{product_id}")
async def remove_from_cart(request: Request, product_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    user_id = request.cookies.get("user_id")

    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    user_id = int(user_id)

    try:
        cur.execute("""
            DELETE FROM cart
            WHERE user_id = %s AND product_id = %s
        """, (user_id, product_id))
        
        conn.commit()
        
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found in cart")
            
    finally:
        cur.close()
        conn.close()

    # print(f"User {user_id} removed product {product_id} from cart")
    return {"message": "Item removed from cart"}

@router.get("/liked/")
def show_liked(request: Request):
    print("ок like")
    conn = get_db_connection()
    cur = conn.cursor()
    user_id = request.cookies.get("user_id")
    # print(user_id)
    if user_id is None:
        return RedirectResponse(url="/login/")  
    try:
        cur.execute("""
            select p.product_id, p.product_name, p.description, p.image, p.price
            from liked l
            join products p on l.product_id = p.product_id
            where l.user_id = %s
        """, (user_id,))
        
        liked_items = cur.fetchall()

        items = [
            {
                "id": row['product_id'],
                "name": row['product_name'],
                "description": row['description'] or "Нет описания",
                "image": row['image'],
                "price": row['price']
            } for row in liked_items
        ]

    finally:
        cur.close()
        conn.close()

    return JSONResponse(content={"items": items})


@router.post("/add-to-liked/{product_id}")
def add_to_liked(request: Request, product_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    user_id = request.cookies.get("user_id") 

    # user_id = 14

    if not user_id:
        raise HTTPException(status_code=401, detail="User not authenticated")

    user_id = int(user_id)

    try:
        cur.execute("""
            select user_id, product_id from cart
            where user_id = %s
        """, (user_id,))
        result = cur.fetchone()

        if result:
            cur.execute("""
                insert into liked (user_id, product_id)
                values (%s, %s)
            """, (user_id, product_id))

        conn.commit()
    finally:
        cur.close()
        conn.close()

    
    print(f"User {user_id} добавил товар {product_id} в любимые")
    return {"message": "Added to liked"}

@router.get("/archive/")
def show_archive(request: Request):
    conn = get_db_connection()
    cur = conn.cursor()
    user_id = request.cookies.get("user_id")
    # print(user_id)
    if user_id is None:
        return RedirectResponse(url="/login/")  
    try:
        cur.execute("""
            select 
                a.order_id,
                a.purchase_date,
                a.quantity,
                p.product_id, 
                p.product_name, 
                p.description, 
                p.image, 
                p.price
            from archive a
            join products p on a.product_id = p.product_id
            where a.user_id = %s
            order by a.purchase_date desc
        """, (user_id,))

        
        archive_items = cur.fetchall()

        items = [
            {
                "order_id": row["order_id"],
                "date": row["purchase_date"].strftime("%B %d, %Y"),  # для красоты
                # "date": row["purchase_date"].isoformat(),
                # "date": row["purchase_date"].strftime("%Y-%m-%dT%H:%M:%S"),
                "product_id": row["product_id"],
                "name": row["product_name"],
                "description": row["description"] or "Нет описания",
                "image": row["image"],
                "price": float(row["price"]),
                "quantity": row["quantity"]
                
            }
            for row in archive_items
        ]


    finally:
        cur.close()
        conn.close()

    return JSONResponse(content={"items": items})

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "upload"
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/shop/")
async def add_product(
    request: Request,
    product_name: str = Form(...),
    description: str = Form(""),
    price: float = Form(...),
    image: str = Form(...)
):
    role = request.cookies.get("role", "user")
    # if role not in ("admin", "seller"):
    #     return JSONResponse(status_code=403, content={"message": "forbidden"})

    # image_filename = f"{uuid.uuid4()}{os.path.splitext(image.filename)[1]}"
    # image_path = UPLOAD_DIR / image_filename
    # with open(image_path, "wb") as buffer:
    #     shutil.copyfileobj(image.file, buffer)
    image_filename = image
    amount = 10
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "insert into products (product_name, description, price, image, amount) values (%s, %s, %s, %s, %s)",
            (product_name, description, price, image_filename, amount)
        )

        conn.commit()
    finally:
        cur.close()
        conn.close()

    return JSONResponse(content={"message": "product added"})



@router.post("/update-product/")
def update_product(
    request: Request,
    product_id: int = Form(...),
    product_name: str = Form(...),
    description: str = Form(...),
    price: float = Form(...),
    image: str = Form(...),  
    colors: List[str] = Form([]),  
    color_images: List[str] = Form([]) 
):
    if len(colors) != len(color_images):
        return JSONResponse(status_code=400, content={"error": "Каждому цвету должен соответствовать путь к изображению."})

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            update products
            set product_name = %s,
                description = %s,
                price = %s,
                image = %s
            where product_id = %s
        """, (product_name, description, price, image, product_id))

        for name, img_path in zip(colors, color_images):
            cur.execute("""
                insert into product_colors (product_id, color_name, image_path)
                values (%s, %s, %s)
            """, (product_id, name, img_path))

        conn.commit()
        return JSONResponse(content={"message": "Продукт успешно обновлён."})
    
    except Exception as e:
        conn.rollback()
        return JSONResponse(status_code=500, content={"error": str(e)})
    
    finally:
        cur.close()
        conn.close()
