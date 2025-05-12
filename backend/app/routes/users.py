from fastapi import APIRouter, Request, Form, Depends, HTTPException, status
from fastapi.templating import Jinja2Templates
from datetime import datetime
from fastapi.responses import RedirectResponse, JSONResponse
from app.database import get_db_connection
# from app.routes import products
from psycopg2 import Binary
import psycopg2.extras
from pydantic import BaseModel
import hashlib
import base64
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from pydantic import BaseModel
import traceback
from typing import List
import logging
from psycopg2 import Error as Psycopg2Error
from typing import Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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



salt = os.urandom(16)

router = APIRouter()


class UserCreate(BaseModel):
    name: str
    email: str
    password: int
    created_at: int
    # role = 'user'

templates = Jinja2Templates(directory="app/templates")

@router.get("/register/")
def show_registration_page(request: Request):
    return templates.TemplateResponse("register.html", {"request": request})

@router.get("/users/")
def get_users(request: Request):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users")
    # cur.execute("SELECT id, name FROM users")
    users = cur.fetchall()
    cur.close()
    conn.close()
    return templates.TemplateResponse("start.html", {"request": request, "users": users})

@router.post("/users/")
def create_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        hashed_password = hashlib.pbkdf2_hmac(
            'sha256',  
            password.encode('utf-8'),  
            salt, 
            100000,  
            dklen=32 
        )
        email = email.strip()
        email = email.lower()
        cur.execute(
            "INSERT INTO users (username, email, password_hash, salt, created_at, role) VALUES (%s, %s, %s, %s, NOW(), %s) RETURNING user_id",
            (name, email, hashed_password, salt, "user")
        )


        row = cur.fetchone()
        print("DEBUG: fetchone() output ->", row) 
        
        if not row:
            raise HTTPException(status_code=500, detail="Ошибка при создании пользователя (id не получен)")

        conn.commit()

        # return RedirectResponse(url="/login/", status_code=303)
        return JSONResponse({"message": "User created successfully"}, status_code=201)


    except Exception as e:
        conn.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Ошибка SQL: {e}\nДетали:\n{error_details}")  
        raise HTTPException(status_code=500, detail=f"Ошибка SQL: {str(e)}")

    finally:
        cur.close()
        conn.close()

@router.post("/login/")
async def login_user(email: str = Form(...), password: str = Form(...)):
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        try:
            cur.execute("SELECT user_id, password_hash, salt FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
        except Exception as e:
            print(f"DEBUG: Ошибка при выполнении запроса: {e}")
            raise HTTPException(status_code=500, detail="Ошибка при запросе к базе данных")
        
        if not user:
            raise HTTPException(status_code=400, detail="Неверный email или пароль")


        user_id = user["user_id"]
        stored_password = user["password_hash"]
        stored_salt = user["salt"]
        
        try:
            user_id = int(user_id)
        except ValueError:
            raise HTTPException(status_code=500, detail=f"Ошибка: id={user_id} (ожидался int)")

        hashed_input_password = hashlib.pbkdf2_hmac(
            'sha256',  
            password.encode('utf-8'),  
            stored_salt, 
            100000,  
            dklen=32 
        )

        if hashed_input_password != bytes.fromhex(stored_password[2:]): 
            raise HTTPException(status_code=400, detail="Неверный email или пароль")
        
        # return {"message": "вход выполнен успешно", "user_id": user_id}
        response = RedirectResponse(url="/home/", status_code=303)
        response.set_cookie(
            key="user_id", 
            value=str(user_id), 
            httponly=True, 
            samesite="lax"  
        )
        return response
    


    except Exception as e:
        print(f"Ошибка: {e}")
        raise HTTPException(status_code=500, detail="Неверный email или пароль")

    finally:
        cur.close()
        conn.close()

@router.get("/profile/")
async def get_profile(request: Request):
    conn = get_db_connection()
    cur = conn.cursor()
    user_id = request.cookies.get("user_id")
    
    profile_data = {}

    try:
        cur.execute("SELECT user_id, username, email, full_name, phone, avatar, created_at, bonus FROM users WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
        if row:
            profile_data = {
                "id": row['user_id'],
                "username": row['username'],
                "email": row['email'],
                "full_name": row['full_name'] or '',
                "phone": row['phone'] or '',
                "avatar": row['avatar'] or "/static/images/g.webp",
                "created_at": row['created_at'].strftime("%B %Y"),
                "bonus": row['bonus'] or '',
            }
    finally:
        cur.close()
        conn.close()

    return JSONResponse(content={"user": profile_data})

@router.put("/profile/")
async def update_profile(
    request: Request,
    username: str = Form(...),
    email: str = Form(...),
    full_name: str = Form(None),  
    phone: str = Form(None)      
):
    print(f"Получены данные: {username}, {email}, {full_name}, {phone}")
    
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Необходима авторизация")
    print("USER_ID из куки:", user_id)
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE users
            SET username = %s, email = %s, full_name = %s, phone = %s
            WHERE user_id = %s
            RETURNING username, email, full_name, phone
        """, (username, email, full_name, phone, user_id))

        
        cur.execute("""
            SELECT username, email, full_name, phone
            FROM users
            WHERE user_id = %s
        """, (user_id,))
        updated_data = cur.fetchone()
        conn.commit()
        return JSONResponse({
            "message": "Профиль обновлен",
            "user": {
                "username": updated_data["username"],
                "email": updated_data["email"],
                "full_name": updated_data["full_name"],
                "phone": updated_data["phone"]

            }
        })
    except Exception as e:
        print("Произошла ошибка при обновлении профиля:")
        traceback.print_exc()  
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()



@router.post("/change-password/")
async def change_password(
    request: Request,
    currentPassword: str = Form(...),
    newPassword: str = Form(...),
    confirmPassword: str = Form(...),
):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User not logged in")

    if newPassword != confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute("SELECT password_hash, salt FROM users WHERE user_id = %s", (user_id,))
        result = cur.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="User not found")

        stored_password_hash = result['password_hash']  
        stored_salt = result['salt']  

        if isinstance(stored_salt, memoryview):
            stored_salt = stored_salt.tobytes()

        print("🔐 Stored hash:", stored_password_hash)
        print("🔑 Stored salt:", stored_salt)

        try:
            stored_password_hash_bytes = base64.b64decode(stored_password_hash)
            print("🔑 Stored password hash (base64 decoded):", stored_password_hash_bytes)
        except Exception as e:
            print("Ошибка при декодировании base64:", e)
            stored_password_hash_bytes = None

        if stored_password_hash_bytes is None:
            try:
                stored_password_hash_bytes = bytes.fromhex(stored_password_hash)
                print("🔑 Stored password hash (hex decoded):", stored_password_hash_bytes)
            except Exception as e:
                print("Ошибка при декодировании hex:", e)
                stored_password_hash_bytes = None

        if stored_password_hash_bytes is None:
            raise HTTPException(status_code=500, detail="Stored password hash is not in valid format")

        hashed_input_password = hashlib.pbkdf2_hmac(
            'sha256',
            currentPassword.encode('utf-8'),
            stored_salt,
            100000,
            dklen=32
        )

        print("🔑 Input hash:", hashed_input_password)

        if hashed_input_password != stored_password_hash_bytes:
            raise HTTPException(status_code=400, detail="Incorrect current password")

        new_salt = os.urandom(16)  
        hashed_new_password = hashlib.pbkdf2_hmac(
            'sha256',
            newPassword.encode('utf-8'),
            new_salt,
            100000,
            dklen=32
        )

        cur.execute(
            "UPDATE users SET password_hash = %s, salt = %s WHERE user_id = %s",
            (base64.b64encode(hashed_new_password).decode('utf-8'), new_salt, user_id)
        )
        conn.commit()

    except Exception as e:
        print("Ошибка при смене пароля:", e)
        raise HTTPException(status_code=500, detail=f"Error updating password: {str(e)}")

    finally:
        cur.close()
        conn.close()

    return RedirectResponse("/profile/", status_code=303)



class AddressCreate(BaseModel):
    label: str
    details: str
    latitude: float
    longitude: float

class AddressResponse(BaseModel):
    id: int
    label: str
    details: str
    latitude: float
    longitude: float


class Address(AddressCreate):
    id: int


@router.post("/addresses/", response_model=dict)
async def create_address(address: dict, request: Request):
    try:
        logger.info(f"Получен запрос на создание адреса: {address}")
        
        user_id = request.cookies.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Требуется авторизация")

        required_fields = ['label', 'details', 'latitude', 'longitude']
        if not all(field in address for field in required_fields):
            raise HTTPException(
                status_code=400,
                detail="Не все обязательные поля заполнены"
            )

        conn = get_db_connection()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO addresses 
                    (user_id, label, details, latitude, longitude)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        user_id,
                        address['label'],
                        address['details'],
                        float(address['latitude']),
                        float(address['longitude'])
                    )
                )
                
                address_id = cur.fetchone()['id']
                conn.commit()
                
                logger.info(f"Адрес создан с ID: {address_id}")
                return {
                    "status": "success",
                    "id": address_id,
                    "message": "Адрес успешно сохранен"
                }
                
        except psycopg2.Error as e:
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка базы данных: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Неожиданная ошибка: {str(e)}"
            )
        finally:
            if conn:
                conn.close()
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Неожиданная ошибка: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Внутренняя ошибка сервера: {str(e)}"
        )

@router.get("/addresses/", response_model=List[AddressResponse])
async def get_addresses(request: Request):
    print("GET /addresses/ received!")
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Необходима авторизация",
            headers={"WWW-Authenticate": "Bearer"}
        )

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, label, details, latitude, longitude 
                FROM addresses 
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (user_id,)
            )
            
            addresses = cur.fetchall()
            
            if not addresses:
                return []
                
            return [
                {
                    "id": addr["id"],
                    "label": addr["label"],
                    "details": addr["details"],
                    "latitude": float(addr["latitude"]),
                    "longitude": float(addr["longitude"])
                }
                for addr in addresses
            ]
            
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка базы данных: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Неожиданная ошибка: {str(e)}"
        )
    finally:
        if conn:
            conn.close()



@router.put("/addresses/{address_id}")
async def update_address(
    address_id: int, 
    address_data: Dict, 
    request: Request
):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация"
        )

    required_fields = ['label', 'details', 'latitude', 'longitude']
    if not all(field in address_data for field in required_fields):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неполные данные адреса"
        )

    try:
        conn = get_db_connection()
        
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE addresses 
                SET 
                    label = %s, 
                    details = %s, 
                    latitude = %s, 
                    longitude = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND user_id = %s
                RETURNING id
                """,
                (
                    address_data['label'],
                    address_data['details'],
                    float(address_data['latitude']),
                    float(address_data['longitude']),
                    address_id,
                    user_id
                )
            )
            
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Адрес не найден или не принадлежит пользователю"
                )
            
            conn.commit()
            return {
                "status": "success",
                "message": "Адрес успешно обновлен"
            }
            
    except (ValueError, TypeError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Некорректные данные координат: {str(e)}"
        )
    except psycopg2.Error as e:
        if 'conn' in locals():
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка базы данных: {str(e)}"
        )
    finally:
        if 'conn' in locals():
            conn.close()


@router.delete("/addresses/{address_id}")
async def delete_address(address_id: int, request: Request):
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация"
        )

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM addresses WHERE id = %s AND user_id = %s RETURNING id",
                (address_id, user_id)
            )
            
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Адрес не найден или не принадлежит пользователю"
                )
            
            conn.commit()
            
            return {"status": "success", "message": "Адрес успешно удален"}
            
    except psycopg2.Error as e:
        if 'conn' in locals() and conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка базы данных: {str(e)}"
        )
    finally:
        if 'conn' in locals() and conn:
            conn.close()