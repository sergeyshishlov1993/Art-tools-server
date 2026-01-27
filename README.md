README.md

Markdown
# ART-TOOLS Server

Backend API сервер для інтернет-магазину інструментів.

## 🛠 Технології

- **Node.js** + **Express**
- **PostgreSQL** + **Sequelize ORM**
- **JWT** автентифікація
- **Multer** для завантаження файлів

## 📁 Структура проекту

ART-TOOLS_server/
├── src/
│   ├── index.js              
│   ├── db.js                 
│   ├── config/
│   │   └── database.js       
│   ├── models/               
│   │   ├── Products.js
│   │   ├── Category.js
│   │   ├── SubCategory.js
│   │   ├── Pictures.js
│   │   ├── Parameter.js
│   │   ├── Orders.js
│   │   ├── OrderItems.js
│   │   ├── Review.js
│   │   ├── ReviewResponse.js
│   │   ├── Feedback.js
│   │   ├── CategoryFilter.js
│   │   ├── CategoryMapping.js
│   │   ├── SliderImg.js
│   │   └── Admin.js
│   ├── routes/
│   │   ├── admin/            
│   │   │   ├── index.js
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── categories.js
│   │   │   ├── filters.js
│   │   │   ├── reviews.js
│   │   │   └── import.js
│   │   └── public/           
│   │       ├── index.js
│   │       ├── products.js
│   │       ├── orders.js
│   │       ├── feedback.js
│   │       └── slider.js
│   ├── services/             
│   │   ├── importService.js
│   │   ├── productService.js
│   │   ├── filterService.js
│   │   ├── autoMappingService.js
│   │   └── cleanupService.js
│   └── middleware/
│       └── auth.js           
├── migrations/               
├── seeders/                 
├── file/                     
├── .env                      
├── package.json
└── docker-compose.yml


Clean

## 🚀 Запуск

### 1. Встановлення залежностей

```bash
npm install
2. Налаштування .env
DB_HOST=localhost
DB_NAME=art_tools
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DIALECT=postgres

ACCESS_TOKEN_SECRET=your_access_secret
REFRESH_TOKEN_SECRET=your_refresh_secret

PORT=8000
3. Запуск PostgreSQL (Docker)

Bash
docker-compose up -d
4. Запуск сервера

Bash
# Development
npm run start

# або напряму
node src/index.js
Сервер запуститься на http://localhost:8000

📡 API Endpoints
Публічні
Метод	Endpoint	Опис
GET	/api/products	Список товарів
GET	/api/products/:id	Товар по ID
GET	/api/products/filters/:subcategory	Фільтри підкатегорії
POST	/api/orders	Створити замовлення
POST	/api/feedback	Надіслати відгук
GET	/api/slider	Зображення слайдера
Адмін (потрібен JWT токен)
Метод	Endpoint	Опис
POST	/api/admin/auth/login	Логін
POST	/api/admin/auth/refresh	Оновити токен
GET	/api/admin/products	Список товарів
POST	/api/admin/products	Створити товар
PUT	/api/admin/products/:id	Оновити товар
DELETE	/api/admin/products/:id	Видалити товар
POST	/api/admin/import/xml	Імпорт з XML
GET	/api/admin/categories	Категорії
POST	/api/admin/filters	Створити фільтр
🔐 Автентифікація
Використовується JWT. Додайте токен в заголовок:


Nix
Authorization: Bearer <your_token>
📦 Імпорт товарів
Підтримується імпорт з XML (Prom.ua формат):


Bash
POST /api/admin/import/xml
Content-Type: multipart/form-data

file: <xml_file>
🗄 База даних
Міграції

Bash
npx sequelize-cli db:migrate
Сіди

Bash
npx sequelize-cli db:seed:all
👤 Автор
Sergej Sislov

