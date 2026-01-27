API_DOCS.md

Markdown
# ART-TOOLS API Documentation

**Base URL:** `http://localhost:8000/api`

---

## 📌 Зміст

- [Автентифікація](#автентифікація)
- [Товари (Public)](#товари-public)
- [Товари (Admin)](#товари-admin)
- [Категорії](#категорії)
- [Замовлення](#замовлення)
- [Зворотній зв'язок](#зворотній-звязок)
- [Слайдер](#слайдер)

---

## 🔐 Автентифікація

### POST `/api/admin/login`
Авторизація адміністратора.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
Response:


Json
{
  "message": "Успішна авторизація",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "admin": {
    "id": 1,
    "name": "admin",
    "role": "admin"
  }
}
POST /api/admin/login/add-admin
Створити нового адміністратора.

Request Body:


Json
{
  "username": "newadmin",
  "password": "securepassword"
}
Response:


Json
{
  "message": "Адміністратор доданий"
}
POST /api/admin/login/token
Оновити access token.

Request Body:


Json
{
  "token": "refresh_token_here"
}
Response:


Json
{
  "accessToken": "new_access_token"
}
POST /api/admin/login/logout
Вийти з системи.

Request Body:


Json
{
  "token": "refresh_token_here"
}
Response:


Json
{
  "message": "Logged out"
}
📦 Товари (Public)
GET /api/products
Отримати список всіх товарів з пагінацією.

Query Parameters:

Параметр	Тип	За замовчуванням	Опис
page	number	1	Номер сторінки
limit	number	20	Кількість на сторінку
Response:


Json
{
  "products": [
    {
      "product_id": "ABC123",
      "product_name": "Дриль акумуляторний",
      "price": 2500,
      "slug": "dryl-akumulyatornyi-abc123",
      "pictures": [
        { "id": 1, "pictures_name": "https://..." }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
GET /api/products/sub-category/:subCategoryId
Товари підкатегорії з фільтрами.

Path Parameters:

Параметр	Опис
subCategoryId	ID підкатегорії
Query Parameters:

Параметр	Тип	Опис
page	number	Номер сторінки
limit	number	Кількість на сторінку
minPrice	number	Мінімальна ціна
maxPrice	number	Максимальна ціна
brand	string	Бренд (через кому для кількох)
sale	boolean	Тільки акційні
bestseller	boolean	Тільки бестселери
discount	boolean	Тільки зі знижкою
sort	string	Сортування: price_asc, price_desc, name_asc, name_desc, newest
[attr_slug]	string	Фільтр по атрибуту (напр. dvygun=Безщітковий)
Example:


Device tree
GET /api/products/sub-category/dryli?minPrice=1000&maxPrice=5000&brand=Makita,Bosch&sort=price_asc
Response:


Json
{
  "products": [...],
  "filters": {
    "brands": ["Makita", "Bosch", "DeWalt"],
    "price": { "min": 500, "max": 10000 },
    "attributes": [
      {
        "slug": "dvygun",
        "name": "Двигун",
        "values": ["Щітковий", "Безщітковий"]
      }
    ]
  },
  "pagination": { ... },
  "applied_filters": {
    "minPrice": "1000",
    "maxPrice": "5000",
    "brand": "Makita,Bosch",
    "sort": "price_asc"
  }
}
GET /api/products/:slug
Отримати товар по slug.

Response:


Json
{
  "product": {
    "product_id": "ABC123",
    "product_name": "Дриль акумуляторний",
    "slug": "dryl-akumulyatornyi-abc123",
    "price": 2500,
    "discount": 10,
    "product_description": "Опис товару...",
    "brand": "Makita",
    "pictures": [...],
    "params": [
      { "parameter_name": "Напруга", "parameter_value": "18В" }
    ]
  }
}
🛠 Товари (Admin)
⚠️ Потрібен JWT токен в заголовку:
Authorization: Bearer <access_token>

GET /api/admin/products
Список товарів з розширеними фільтрами.

Query Parameters:

Параметр	Тип	Опис
page	number	Номер сторінки
limit	number	Кількість на сторінку
search	string	Пошук по назві
sub_category	string	ID підкатегорії
price_min	number	Мін. ціна
price_max	number	Макс. ціна
brands	string/array	Бренди
special	string/array	sale, bestseller, discount
attributes	JSON	Фільтр по атрибутах
Response:


Json
{
  "products": [...],
  "total": 150,
  "pages": 8
}
GET /api/admin/products/:id
Товар по ID.

GET /api/admin/products/by-slug/:slug
Товар по slug.

POST /api/admin/products/add
Створити товар.

Request Body:


Json
{
  "id": "CUSTOM_001",
  "product_name": "Новий товар",
  "sub_category_id": "dryli",
  "product_description": "Опис",
  "price": 3000,
  "available": "true",
  "brand": "Makita",
  "pictures": ["https://url1.jpg", "https://url2.jpg"],
  "parameters": [
    { "name": "Напруга", "value": "18В" }
  ]
}
Response:


Json
{
  "message": "Created",
  "product_id": "CUSTOM_001",
  "slug": "novyi-tovar-custom-001"
}
PUT /api/admin/products/update/:id
Оновити товар.

Request Body:


Json
{
  "product_name": "Оновлена назва",
  "price": 3500,
  "discount": 15
}
PUT /api/admin/products/update-discount/:id
Оновити знижку.

Request Body:


Json
{
  "discount": 20,
  "sale": "true"
}
DELETE /api/admin/products/:id
Видалити товар.

DELETE /api/admin/products/destroy-by-brand?brand=BrandName
Видалити всі товари бренду.

DELETE /api/admin/products/:id/picture/:pictureId
Видалити фото товару.

POST /api/admin/products/generate-slugs
Згенерувати slug для товарів без нього.

Response:


Json
{
  "success": true,
  "updated": 45
}
POST /api/admin/products/check-slug
Перевірити доступність slug.

Request Body:


Json
{
  "slug": "my-product-slug",
  "product_id": "ABC123"
}
Response:


Json
{
  "success": true,
  "available": true
}
PUT /api/admin/products/regenerate-slug/:productId
Перегенерувати slug товару.

📂 Категорії
GET /api/admin/categories/overview
Огляд категорій і статистика.

Response:


Json
{
  "success": true,
  "my": {
    "categories": [
      {
        "category_id": "elektroinstrument",
        "category_name": "Електроінструмент",
        "subcategories_count": 12
      }
    ]
  },
  "stats": {
    "total": 1500,
    "mapped": 1200,
    "unmapped": 300,
    "percent_mapped": "80.0%"
  }
}
GET /api/admin/categories/my-catalogue
Повний каталог категорій.

Response:


Json
{
  "success": true,
  "total_categories": 5,
  "total_products": 1200,
  "categories": [
    {
      "id": "elektroinstrument",
      "category_name": "Електроінструмент",
      "subcategories": [
        {
          "id": "dryli",
          "name": "Дрилі",
          "picture": "https://...",
          "products_count": 45
        }
      ],
      "total_products": 350
    }
  ]
}
GET /api/admin/categories/active
Категорії з товарами в наявності.

GET /api/admin/categories/sub-category
Список підкатегорій з пагінацією.

Query Parameters:

Параметр	Тип	За замовчуванням
page	number	1
limit	number	10
GET /api/admin/categories/unmapped
Категорії постачальників без маппінгу.

Response:


Json
{
  "total_unmapped": 15,
  "total_products": 230,
  "categories": [
    {
      "supplier_sub_category_id": "DEFAULT_SUBCAT_123",
      "supplier_sub_category_name": "Дрилі ударні",
      "product_count": 45
    }
  ],
  "my_categories": [
    {
      "id": "dryli",
      "name": "Дрилі",
      "parent_name": "Електроінструмент"
    }
  ]
}
POST /api/admin/categories/map
Замапити категорію постачальника на свою.

Request Body:


Json
{
  "from_sub_category_id": "DEFAULT_SUBCAT_123",
  "to_sub_category_id": "dryli"
}
Response:


Json
{
  "success": true,
  "message": "Mapping saved",
  "moved_products": 45,
  "from": "DEFAULT_SUBCAT_123",
  "to": "dryli"
}
POST /api/admin/categories/category
Створити категорію.

Request Body:


Json
{
  "name": "Електроінструмент",
  "id": "elektroinstrument"
}
PUT /api/admin/categories/category/:id
Оновити категорію.

Request Body:


Json
{
  "name": "Нова назва"
}
DELETE /api/admin/categories/category/:id
Видалити категорію.

POST /api/admin/categories/subcategory
Створити підкатегорію.

Request Body:


Json
{
  "name": "Дрилі",
  "parentId": "elektroinstrument",
  "id": "dryli",
  "picture": "https://..."
}
PUT /api/admin/categories/subcategory/:id
Оновити підкатегорію.

DELETE /api/admin/categories/subcategory/:id
Видалити підкатегорію.

🛒 Замовлення
POST /api/order/add-order
Створити замовлення.

Request Body:


Json
{
  "order_id": "ORD-20240128-001",
  "name": "Іван",
  "secondName": "Петренко",
  "phone": "+380991234567",
  "payment": "Карткою",
  "city": "Київ",
  "warehouses": "Відділення №5",
  "totalPrice": 5500,
  "courierDeliveryAddress": null,
  "qwery": "utm_source=google",
  "orders": [
    {
      "orderName": "Дриль Makita",
      "count": 1,
      "product_id": "ABC123",
      "img": "https://...",
      "price": 3000,
      "discount": 10,
      "discountProduct": 2700
    }
  ]
}
Response:


Json
{
  "message": "Замовлення успішно додано"
}
GET /api/order/all-orders
Список замовлень.

Query Parameters:

Параметр	Тип	Опис
page	number	Номер сторінки
limit	number	Кількість на сторінку
search	string	Пошук по телефону
status	string	Фільтр по статусу
year	number	Рік
month	number	Місяць
Response:


Json
{
  "message": "Замовлення знайдено",
  "notFound": false,
  "orders": [
    {
      "order_id": "ORD-20240128-001",
      "name": "Іван",
      "second_name": "Петренко",
      "phone": "+380991234567",
      "status": "Новий",
      "total_price": 5500,
      "items": [...]
    }
  ],
  "totalItems": 50,
  "totalPages": 5,
  "currentPage": 1
}
PUT /api/order/change-status/:id?status=Виконано
Змінити статус замовлення.

DELETE /api/order/delete/:id
Видалити замовлення.

PUT /api/order/delete/:parentId/:itemId?totalPrice=2500
Видалити товар із замовлення.

📞 Зворотній зв’язок
POST /api/feedback
Створити заявку.

Request Body:


Json
{
  "name": "Олена",
  "phone": "+380991234567"
}
GET /api/feedback/all
Список заявок.

Query Parameters:

Параметр	Тип	За замовчуванням
page	number	1
limit	number	10
Response:


Json
{
  "message": "Зворотній зв'язок",
  "feedback": [
    {
      "id": 1,
      "name": "Олена",
      "phone": "+380991234567",
      "status": "Новий",
      "createdAt": "2024-01-28T10:00:00Z"
    }
  ],
  "totalItems": 25,
  "totalPages": 3,
  "currentPage": 1
}
PUT /api/feedback/change-status/:id
Позначити як виконано.

DELETE /api/feedback/delete/:id
Видалити заявку.

🖼 Слайдер
GET /api/slider
Отримати зображення слайдера.

Response:


Json
{
  "images": [
    {
      "id": 1,
      "image_url": "https://..."
    }
  ]
}
🔧 Коди помилок
Код	Опис
200	Успіх
400	Невірний запит
401	Не авторизовано
403	Доступ заборонено
404	Не знайдено
500	Помилка сервера
📝 Приклади використання
cURL - Логін

Bash
curl -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
cURL - Отримати товари

Bash
curl http://localhost:8000/api/products?page=1&limit=10
cURL - Створити замовлення

Bash
curl -X POST http://localhost:8000/api/order/add-order \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-001",
    "name": "Іван",
    "phone": "+380991234567",
    "totalPrice": 3000,
    "orders": [{"orderName":"Дриль","count":1,"price":3000}]
  }'
JavaScript - Fetch

Javascript
// Логін
const login = async () => {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'pass' })
  });
  return res.json();
};

// Отримати товари з токеном
const getProducts = async (token) => {
  const res = await fetch('/api/admin/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return res.json();
};