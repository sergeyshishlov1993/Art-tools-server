// /**
//  * @swagger
//  * /home:
//  *   get:
//  *     tags: [Home]
//  *     summary: Головна сторінка
//  *     description: Повертає bestsellers та акційні товари
//  *     responses:
//  *       200:
//  *         description: Успішно
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                 bestsellers:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/ProductShort'
//  *                 sale:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/ProductShort'
//  */
//
// /**
//  * @swagger
//  * /home/sale:
//  *   get:
//  *     tags: [Home]
//  *     summary: Акційні товари
//  *     responses:
//  *       200:
//  *         description: Успішно
//  */
//
// /**
//  * @swagger
//  * /home/bestsellers:
//  *   get:
//  *     tags: [Home]
//  *     summary: Хіти продажів
//  *     responses:
//  *       200:
//  *         description: Успішно
//  */
//
// /**
//  * @swagger
//  * /products:
//  *   get:
//  *     tags: [Products]
//  *     summary: Список всіх товарів
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *         description: Номер сторінки
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 20
//  *           maximum: 100
//  *         description: Кількість товарів на сторінці
//  *     responses:
//  *       200:
//  *         description: Список товарів
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 products:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/ProductShort'
//  *                 pagination:
//  *                   $ref: '#/components/schemas/Pagination'
//  */
//
// /**
//  * @swagger
//  * /products/{slug}:
//  *   get:
//  *     tags: [Products]
//  *     summary: Отримати товар по slug
//  *     parameters:
//  *       - in: path
//  *         name: slug
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Slug товару
//  *     responses:
//  *       200:
//  *         description: Товар знайдено
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 product:
//  *                   $ref: '#/components/schemas/ProductFull'
//  *       404:
//  *         description: Товар не знайдено
//  */
//
// /**
//  * @swagger
//  * /products/sub-category/{subCategoryId}:
//  *   get:
//  *     tags: [Products]
//  *     summary: Товари підкатегорії з фільтрами
//  *     parameters:
//  *       - in: path
//  *         name: subCategoryId
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           default: 1
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           default: 20
//  *       - in: query
//  *         name: price_min
//  *         schema:
//  *           type: number
//  *       - in: query
//  *         name: price_max
//  *         schema:
//  *           type: number
//  *       - in: query
//  *         name: brand
//  *         schema:
//  *           type: string
//  *         description: Бренд(и) через кому
//  *       - in: query
//  *         name: sale
//  *         schema:
//  *           type: string
//  *           enum: ['true', 'false']
//  *       - in: query
//  *         name: bestseller
//  *         schema:
//  *           type: string
//  *           enum: ['true', 'false']
//  *       - in: query
//  *         name: sort
//  *         schema:
//  *           type: string
//  *           enum: [price_asc, price_desc, name_asc, newest]
//  *     responses:
//  *       200:
//  *         description: Товари з фільтрами
//  */
//
// /**
//  * @swagger
//  * /products/category/{categoryId}:
//  *   get:
//  *     tags: [Products]
//  *     summary: Товари категорії
//  *     parameters:
//  *       - in: path
//  *         name: categoryId
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: Товари категорії
//  */
//
// /**
//  * @swagger
//  * /order/quick-buy:
//  *   post:
//  *     tags: [Orders]
//  *     summary: Швидка покупка
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - phone
//  *               - slug
//  *             properties:
//  *               name:
//  *                 type: string
//  *                 example: "Іван"
//  *               phone:
//  *                 type: string
//  *                 example: "+380991234567"
//  *               slug:
//  *                 type: string
//  *                 example: "product-slug"
//  *               quantity:
//  *                 type: integer
//  *                 default: 1
//  *     responses:
//  *       200:
//  *         description: Замовлення створено
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                 order_id:
//  *                   type: string
//  *                 product:
//  *                   type: object
//  *       400:
//  *         description: Помилка валідації
//  *       404:
//  *         description: Товар не знайдено
//  */
//
// /**
//  * @swagger
//  * /order/add-order:
//  *   post:
//  *     tags: [Orders]
//  *     summary: Створити повне замовлення
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - order_id
//  *               - name
//  *               - phone
//  *               - orders
//  *             properties:
//  *               order_id:
//  *                 type: string
//  *               name:
//  *                 type: string
//  *               secondName:
//  *                 type: string
//  *               phone:
//  *                 type: string
//  *               payment:
//  *                 type: string
//  *               city:
//  *                 type: string
//  *               warehouses:
//  *                 type: string
//  *               courierDeliveryAddress:
//  *                 type: string
//  *               totalPrice:
//  *                 type: number
//  *               qwery:
//  *                 type: string
//  *               orders:
//  *                 type: array
//  *                 items:
//  *                   type: object
//  *                   properties:
//  *                     orderName:
//  *                       type: string
//  *                     count:
//  *                       type: integer
//  *                     product_id:
//  *                       type: string
//  *                     img:
//  *                       type: string
//  *                     price:
//  *                       type: number
//  *                     discount:
//  *                       type: number
//  *                     discountProduct:
//  *                       type: number
//  *     responses:
//  *       200:
//  *         description: Замовлення створено
//  */
//
// /**
//  * @swagger
//  * /order/all-orders:
//  *   get:
//  *     tags: [Orders]
//  *     summary: Всі замовлення
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: search
//  *         schema:
//  *           type: string
//  *         description: Пошук по телефону, імені, order_id
//  *       - in: query
//  *         name: status
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: year
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: month
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: Список замовлень
//  */
//
// /**
//  * @swagger
//  * /order/{id}:
//  *   get:
//  *     tags: [Orders]
//  *     summary: Отримати замовлення по ID
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Замовлення
//  *       404:
//  *         description: Не знайдено
//  */
//
// /**
//  * @swagger
//  * /order/change-status/{id}:
//  *   put:
//  *     tags: [Orders]
//  *     summary: Змінити статус замовлення
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: status
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Статус змінено
//  */
//
// /**
//  * @swagger
//  * /order/delete/{id}:
//  *   delete:
//  *     tags: [Orders]
//  *     summary: Видалити замовлення
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Видалено
//  */
//
// /**
//  * @swagger
//  * /feedback:
//  *   post:
//  *     tags: [Feedback]
//  *     summary: Створити заявку на зворотній зв'язок
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - phone
//  *             properties:
//  *               name:
//  *                 type: string
//  *               phone:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Заявка створена
//  */
//
// /**
//  * @swagger
//  * /feedback/all:
//  *   get:
//  *     tags: [Feedback]
//  *     summary: Всі заявки
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: Список заявок
//  */
//
// /**
//  * @swagger
//  * /feedback/change-status/{id}:
//  *   put:
//  *     tags: [Feedback]
//  *     summary: Змінити статус заявки
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Статус змінено
//  */
//
// /**
//  * @swagger
//  * /feedback/delete/{id}:
//  *   delete:
//  *     tags: [Feedback]
//  *     summary: Видалити заявку
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Видалено
//  */
//
// /**
//  * @swagger
//  * /slider:
//  *   get:
//  *     tags: [Slider]
//  *     summary: Отримати слайдер
//  *     responses:
//  *       200:
//  *         description: Слайдер
//  */
//
// /**
//  * @swagger
//  * /slider/add:
//  *   post:
//  *     tags: [Slider]
//  *     summary: Додати слайд
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               id:
//  *                 type: string
//  *               linkImg:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Додано
//  */
//
// /**
//  * @swagger
//  * /slider/{id}:
//  *   delete:
//  *     tags: [Slider]
//  *     summary: Видалити слайд
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Видалено
//  */
//
// /**
//  * @swagger
//  * /nova-poshta/cities:
//  *   get:
//  *     tags: [Nova Poshta]
//  *     summary: Отримати список міст
//  *     responses:
//  *       200:
//  *         description: Список міст
//  */
//
// /**
//  * @swagger
//  * /nova-poshta/citi:
//  *   post:
//  *     tags: [Nova Poshta]
//  *     summary: Пошук міста та відділень
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               city:
//  *                 type: string
//  *               cityRef:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Результат пошуку
//  */
//
// /**
//  * @swagger
//  * /nova-poshta/citi/warehouses:
//  *   post:
//  *     tags: [Nova Poshta]
//  *     summary: Отримати відділення
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               city:
//  *                 type: string
//  *               numberWarehouses:
//  *                 type: string
//  *               type:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Список відділень
//  */
//
// // ===================== ADMIN =====================
//
// /**
//  * @swagger
//  * /admin/login:
//  *   post:
//  *     tags: [Admin Auth]
//  *     summary: Авторизація адміністратора
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - username
//  *               - password
//  *             properties:
//  *               username:
//  *                 type: string
//  *               password:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Успішна авторизація
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 accessToken:
//  *                   type: string
//  *                 refreshToken:
//  *                   type: string
//  *                 admin:
//  *                   type: object
//  *       401:
//  *         description: Невірні дані
//  */
//
// /**
//  * @swagger
//  * /admin/login/add-admin:
//  *   post:
//  *     tags: [Admin Auth]
//  *     summary: Додати адміністратора
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               username:
//  *                 type: string
//  *               password:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Адміністратор доданий
//  */
//
// /**
//  * @swagger
//  * /admin/login/token:
//  *   post:
//  *     tags: [Admin Auth]
//  *     summary: Оновити access token
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               token:
//  *                 type: string
//  *                 description: Refresh token
//  *     responses:
//  *       200:
//  *         description: Новий access token
//  */
//
// /**
//  * @swagger
//  * /admin/login/logout:
//  *   post:
//  *     tags: [Admin Auth]
//  *     summary: Вихід
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               token:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Logged out
//  */
//
// /**
//  * @swagger
//  * /admin/products:
//  *   get:
//  *     tags: [Admin Products]
//  *     summary: Список товарів (адмін)
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: search
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: sub_category
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: brand
//  *         schema:
//  *           type: string
//  *       - in: query
//  *         name: available
//  *         schema:
//  *           type: string
//  *           enum: ['true', 'false']
//  *       - in: query
//  *         name: sort
//  *         schema:
//  *           type: string
//  *           enum: [price_asc, price_desc, name_asc, newest]
//  *     responses:
//  *       200:
//  *         description: Список товарів
//  *   post:
//  *     tags: [Admin Products]
//  *     summary: Створити товар
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               product_name:
//  *                 type: string
//  *               price:
//  *                 type: string
//  *               brand:
//  *                 type: string
//  *               sub_category_id:
//  *                 type: string
//  *               available:
//  *                 type: string
//  *     responses:
//  *       201:
//  *         description: Товар створено
//  */
//
// /**
//  * @swagger
//  * /admin/products/{id}:
//  *   get:
//  *     tags: [Admin Products]
//  *     summary: Отримати товар по ID
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Товар
//  *       404:
//  *         description: Не знайдено
//  *   put:
//  *     tags: [Admin Products]
//  *     summary: Оновити товар
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *     responses:
//  *       200:
//  *         description: Оновлено
//  *   delete:
//  *     tags: [Admin Products]
//  *     summary: Видалити товар
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Видалено
//  */
//
// /**
//  * @swagger
//  * /admin/products/{id}/discount:
//  *   put:
//  *     tags: [Admin Products]
//  *     summary: Оновити знижку
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               discount:
//  *                 type: number
//  *               sale_price:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Знижку оновлено
//  */
//
// /**
//  * @swagger
//  * /admin/products/{id}/pictures:
//  *   post:
//  *     tags: [Admin Products]
//  *     summary: Додати картинки
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               pictures:
//  *                 type: array
//  *                 items:
//  *                   type: string
//  *     responses:
//  *       200:
//  *         description: Картинки додано
//  */
//
// /**
//  * @swagger
//  * /admin/categories/overview:
//  *   get:
//  *     tags: [Admin Categories]
//  *     summary: Огляд категорій
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Статистика категорій
//  */
//
// /**
//  * @swagger
//  * /admin/categories/my-catalogue:
//  *   get:
//  *     tags: [Admin Categories]
//  *     summary: Мій каталог
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Каталог категорій
//  */
//
// /**
//  * @swagger
//  * /admin/categories/active:
//  *   get:
//  *     tags: [Admin Categories]
//  *     summary: Активні категорії
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Категорії з товарами
//  */
//
// /**
//  * @swagger
//  * /admin/categories/unmapped:
//  *   get:
//  *     tags: [Admin Categories]
//  *     summary: Немаповані категорії
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Категорії без мапінгу
//  */
//
// /**
//  * @swagger
//  * /admin/categories/map:
//  *   post:
//  *     tags: [Admin Categories]
//  *     summary: Мапінг категорій
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - from_sub_category_id
//  *               - to_sub_category_id
//  *             properties:
//  *               from_sub_category_id:
//  *                 type: string
//  *               to_sub_category_id:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Мапінг збережено
//  */
//
// /**
//  * @swagger
//  * /admin/categories/category:
//  *   post:
//  *     tags: [Admin Categories]
//  *     summary: Створити категорію
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *             properties:
//  *               name:
//  *                 type: string
//  *               id:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Категорія створена
//  */
//
// /**
//  * @swagger
//  * /admin/categories/category/{id}:
//  *   put:
//  *     tags: [Admin Categories]
//  *     summary: Оновити категорію
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               name:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Оновлено
//  *   delete:
//  *     tags: [Admin Categories]
//  *     summary: Видалити категорію
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Видалено
//  */
//
// /**
//  * @swagger
//  * /admin/categories/subcategory:
//  *   post:
//  *     tags: [Admin Categories]
//  *     summary: Створити підкатегорію
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - name
//  *               - parentId
//  *             properties:
//  *               name:
//  *                 type: string
//  *               parentId:
//  *                 type: string
//  *               id:
//  *                 type: string
//  *               picture:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Підкатегорія створена
//  */
//
// /**
//  * @swagger
//  * /admin/categories/subcategory/{id}:
//  *   put:
//  *     tags: [Admin Categories]
//  *     summary: Оновити підкатегорію
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Оновлено
//  *   delete:
//  *     tags: [Admin Categories]
//  *     summary: Видалити підкатегорію
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Видалено
//  */
//
// /**
//  * @swagger
//  * /admin/import/url:
//  *   post:
//  *     tags: [Admin Import]
//  *     summary: Імпорт з URL
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - xmlUrl
//  *             properties:
//  *               xmlUrl:
//  *                 type: string
//  *               supplierPrefix:
//  *                 type: string
//  *                 default: DEFAULT
//  *               supplierName:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Імпорт завершено
//  */
//
// /**
//  * @swagger
//  * /admin/import/file:
//  *   post:
//  *     tags: [Admin Import]
//  *     summary: Імпорт з файлу
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         multipart/form-data:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               file:
//  *                 type: string
//  *                 format: binary
//  *               supplierPrefix:
//  *                 type: string
//  *               supplierName:
//  *                 type: string
//  *     responses:
//  *       200:
//  *         description: Імпорт завершено
//  */
//
// /**
//  * @swagger
//  * /admin/import/sources:
//  *   get:
//  *     tags: [Admin Import]
//  *     summary: Список джерел імпорту
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Джерела імпорту
//  */
//
// /**
//  * @swagger
//  * /admin/import/sources/{id}/run:
//  *   post:
//  *     tags: [Admin Import]
//  *     summary: Запустити імпорт джерела
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: Імпорт завершено
//  */
//
// /**
//  * @swagger
//  * /admin/import/run-all:
//  *   post:
//  *     tags: [Admin Import]
//  *     summary: Запустити всі імпорти
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Всі імпорти завершено
//  */
//
// /**
//  * @swagger
//  * /admin/filters/active:
//  *   get:
//  *     tags: [Admin Filters]
//  *     summary: Активні фільтри
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: Фільтри
//  */
//
// /**
//  * @swagger
//  * /admin/filters/subcategory/{subcategoryId}:
//  *   get:
//  *     tags: [Admin Filters]
//  *     summary: Фільтри підкатегорії
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: subcategoryId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Фільтри
//  */
//
// /**
//  * @swagger
//  * /admin/filters/recalc/{subcategoryId}:
//  *   post:
//  *     tags: [Admin Filters]
//  *     summary: Перерахувати фільтри
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: subcategoryId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Фільтри перераховано
//  */
//
// /**
//  * @swagger
//  * /admin/reviews:
//  *   get:
//  *     tags: [Admin Reviews]
//  *     summary: Список відгуків
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *     responses:
//  *       200:
//  *         description: Відгуки
//  */
//
// /**
//  * @swagger
//  * /admin/reviews/{reviewId}:
//  *   delete:
//  *     tags: [Admin Reviews]
//  *     summary: Видалити відгук
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: reviewId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     responses:
//  *       200:
//  *         description: Видалено
//  */
//
// // ===================== SCHEMAS =====================
//
// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     ProductShort:
//  *       type: object
//  *       properties:
//  *         product_id:
//  *           type: string
//  *         slug:
//  *           type: string
//  *         product_name:
//  *           type: string
//  *         brand:
//  *           type: string
//  *         price:
//  *           type: string
//  *         sale_price:
//  *           type: string
//  *         discount:
//  *           type: number
//  *         available:
//  *           type: string
//  *         bestseller:
//  *           type: string
//  *         sale:
//  *           type: string
//  *         sub_category_id:
//  *           type: string
//  *         pictures:
//  *           type: array
//  *           items:
//  *             type: object
//  *             properties:
//  *               pictures_name:
//  *                 type: string
//  *     ProductFull:
//  *       allOf:
//  *         - $ref: '#/components/schemas/ProductShort'
//  *         - type: object
//  *           properties:
//  *             description:
//  *               type: string
//  *             params:
//  *               type: array
//  *               items:
//  *                 type: object
//  *             subCategory:
//  *               type: object
//  *     Pagination:
//  *       type: object
//  *       properties:
//  *         page:
//  *           type: integer
//  *         limit:
//  *           type: integer
//  *         total:
//  *           type: integer
//  *         pages:
//  *           type: integer
//  *     Order:
//  *       type: object
//  *       properties:
//  *         order_id:
//  *           type: string
//  *         name:
//  *           type: string
//  *         phone:
//  *           type: string
//  *         status:
//  *           type: string
//  *         total_price:
//  *           type: string
//  *         items:
//  *           type: array
//  *           items:
//  *             type: object
//  */


// src/docs/api.js

/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         error:
 *           type: string
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 150
 *         pages:
 *           type: integer
 *           example: 8
 *
 *     PictureShort:
 *       type: object
 *       properties:
 *         pictures_name:
 *           type: string
 *           example: "https://example.com/image.jpg"
 *
 *     Picture:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         product_id:
 *           type: string
 *         pictures_name:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Parameter:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         product_id:
 *           type: string
 *         parameter_name:
 *           type: string
 *           example: "Напруга"
 *         slug:
 *           type: string
 *           example: "napruha"
 *         parameter_value:
 *           type: string
 *           example: "18В"
 *         param_value_slug:
 *           type: string
 *           example: "18v"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Category:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "elektroinstrument"
 *         category_name:
 *           type: string
 *           example: "Електроінструмент"
 *
 *     SubCategory:
 *       type: object
 *       properties:
 *         sub_category_id:
 *           type: string
 *           example: "dryli"
 *         sub_category_name:
 *           type: string
 *           example: "Дрилі"
 *         parent_id:
 *           type: string
 *           example: "elektroinstrument"
 *         pictures:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/subcat.jpg"
 *         category:
 *           $ref: '#/components/schemas/Category'
 *
 *     ProductShort:
 *       type: object
 *       properties:
 *         product_id:
 *           type: string
 *           example: "DEFAULT_12345"
 *         slug:
 *           type: string
 *           example: "dryl-akumulyatornyi-default-12345"
 *         product_name:
 *           type: string
 *           example: "Дриль акумуляторний"
 *         brand:
 *           type: string
 *           nullable: true
 *           example: "Makita"
 *         price:
 *           type: string
 *           example: "2500.00"
 *         sale_price:
 *           type: string
 *           nullable: true
 *           example: "3000.00"
 *         discount:
 *           type: integer
 *           example: 10
 *         available:
 *           type: string
 *           enum: ['true', 'false']
 *           example: "true"
 *         bestseller:
 *           type: string
 *           enum: ['true', 'false']
 *           example: "false"
 *         sale:
 *           type: string
 *           enum: ['true', 'false']
 *           example: "true"
 *         sub_category_id:
 *           type: string
 *           nullable: true
 *           example: "dryli"
 *         pictures:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PictureShort'
 *
 *     Product:
 *       allOf:
 *         - $ref: '#/components/schemas/ProductShort'
 *         - type: object
 *           properties:
 *             xml_id:
 *               type: string
 *               nullable: true
 *             supplier_prefix:
 *               type: string
 *               nullable: true
 *             is_manual_category:
 *               type: boolean
 *               example: false
 *             product_description:
 *               type: string
 *               nullable: true
 *             custom_product:
 *               type: boolean
 *               example: false
 *             params:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parameter'
 *             pictures:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Picture'
 *             subCategory:
 *               $ref: '#/components/schemas/SubCategory'
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 *
 *     OrderItem:
 *       type: object
 *       properties:
 *         item_id:
 *           type: string
 *           format: uuid
 *         order_id:
 *           type: string
 *           format: uuid
 *         order_name:
 *           type: string
 *         count:
 *           type: integer
 *         product_id:
 *           type: string
 *         product_img:
 *           type: string
 *           nullable: true
 *         price:
 *           type: string
 *           example: "2500.00"
 *         discount:
 *           type: string
 *           example: "10.00"
 *         discounted_product:
 *           oneOf:
 *             - type: number
 *               example: 2250
 *             - type: boolean
 *               example: true
 *             - type: "null"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Order:
 *       type: object
 *       properties:
 *         order_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         second_name:
 *           type: string
 *         phone:
 *           type: string
 *         payment_method:
 *           type: string
 *         city:
 *           type: string
 *         postal_office:
 *           type: string
 *         courier_delivery_address:
 *           type: string
 *           nullable: true
 *         total_price:
 *           type: string
 *         status:
 *           type: string
 *         qwery:
 *           type: string
 *           nullable: true
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         status:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     SliderImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *
 *     ReviewProductShort:
 *       type: object
 *       properties:
 *         product_id:
 *           type: string
 *         product_name:
 *           type: string
 *         slug:
 *           type: string
 *         price:
 *           type: string
 *           nullable: true
 *         main_image:
 *           type: string
 *           nullable: true
 *
 *     ReviewResponse:
 *       type: object
 *       properties:
 *         response_id:
 *           type: string
 *           format: uuid
 *         review_id:
 *           type: string
 *           format: uuid
 *         user_name:
 *           type: string
 *         comment:
 *           type: string
 *         admin_response:
 *           type: integer
 *           example: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Review:
 *       type: object
 *       properties:
 *         review_id:
 *           type: string
 *           format: uuid
 *         product_id:
 *           type: string
 *         user_name:
 *           type: string
 *         comment:
 *           type: string
 *         rating:
 *           type: string
 *           example: "5"
 *         responses:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReviewResponse'
 *         product:
 *           $ref: '#/components/schemas/ReviewProductShort'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ImportSource:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         supplierPrefix:
 *           type: string
 *         supplierName:
 *           type: string
 *         sourceType:
 *           type: string
 *           enum: [url, file]
 *         sourceUrl:
 *           type: string
 *           nullable: true
 *         sourceFilename:
 *           type: string
 *           nullable: true
 *         lastImportAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         lastImportStats:
 *           type: object
 *           nullable: true
 *         isActive:
 *           type: boolean
 *
 *     CategoryMapping:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         supplier_prefix:
 *           type: string
 *         external_category_id:
 *           type: string
 *         external_category_name:
 *           type: string
 *           nullable: true
 *         parent_category_name:
 *           type: string
 *           nullable: true
 *         internal_sub_category_id:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 version: { type: string }
 *                 status: { type: string }
 */

/**
 * @swagger
 * /home:
 *   get:
 *     tags: [Home]
 *     summary: Головна сторінка (bestsellers + sale)
 *     responses:
 *       200:
 *         description: Успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 bestsellers:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *                 sale:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *
 * /home/sale:
 *   get:
 *     tags: [Home]
 *     summary: Акційні товари
 *     responses:
 *       200:
 *         description: Успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 sale:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *
 * /home/bestsellers:
 *   get:
 *     tags: [Home]
 *     summary: Хіти продажів
 *     responses:
 *       200:
 *         description: Успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 bestsellers:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: Список всіх товарів
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Список товарів
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *
 * /products/category/{categoryId}:
 *   get:
 *     tags: [Products]
 *     summary: Товари категорії
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *     responses:
 *       200:
 *         description: Товари категорії
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *
 * /products/sub-category/{subCategoryId}:
 *   get:
 *     tags: [Products]
 *     summary: Товари підкатегорії з фільтрами
 *     parameters:
 *       - in: path
 *         name: subCategoryId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: price_min
 *         schema: { type: number }
 *       - in: query
 *         name: price_max
 *         schema: { type: number }
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         description: Бренд(и) через кому
 *       - in: query
 *         name: sale
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: bestseller
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: discount
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, name_asc, newest] }
 *     responses:
 *       200:
 *         description: Товари з фільтрами
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *                 filters:
 *                   nullable: true
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *
 * /products/{slug}:
 *   get:
 *     tags: [Products]
 *     summary: Отримати товар по slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Товар не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: "Product not found" }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @swagger
 * /filters:
 *   get:
 *     tags: [Filters]
 *     summary: Отримати агреговані фільтри (brands/categories/subcategories/price/attributes/special)
 *     parameters:
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         description: Список брендів через кому
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: sub_category
 *         schema: { type: string }
 *       - in: query
 *         name: price_min
 *         schema: { type: number }
 *       - in: query
 *         name: price_max
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Фільтри
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 total_products: { type: integer }
 *                 applied_filters:
 *                   type: object
 *                 filters:
 *                   type: object
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */

/**
 * @swagger
 * /order/quick-buy:
 *   post:
 *     tags: [Orders]
 *     summary: Швидка покупка (slug або product_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, slug]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               slug: { type: string }
 *               quantity: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Замовлення створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order_id: { type: string, format: uuid }
 *                 product:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     price: { type: number }
 *                     quantity: { type: integer }
 *                     total: { type: number }
 *       400:
 *         description: Помилка валідації/недоступний товар
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Товар не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /order/add-order:
 *   post:
 *     tags: [Orders]
 *     summary: Створити замовлення (повне)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, name, phone, orders]
 *             properties:
 *               order_id: { type: string }
 *               name: { type: string }
 *               secondName: { type: string }
 *               phone: { type: string }
 *               payment: { type: string }
 *               city: { type: string }
 *               warehouses: { type: string }
 *               courierDeliveryAddress: { type: string, nullable: true }
 *               totalPrice: { type: number }
 *               qwery: { type: string, nullable: true }
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [orderName, count, product_id]
 *                   properties:
 *                     orderName: { type: string }
 *                     count: { type: integer }
 *                     product_id: { type: string }
 *                     img: { type: string, nullable: true }
 *                     price: { type: number }
 *                     discount: { type: number }
 *                     discountProduct: { type: number, nullable: true }
 *     responses:
 *       200:
 *         description: Додано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 order_id: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /order/all-orders:
 *   get:
 *     tags: [Orders]
 *     summary: Список замовлень (пагінація + пошук)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string, default: "" }
 *       - in: query
 *         name: status
 *         schema: { type: string, default: "" }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Список
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 notFound: { type: boolean }
 *                 orders:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Order' }
 *                 totalItems: { type: integer }
 *                 totalPages: { type: integer }
 *                 currentPage: { type: integer }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /order/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Отримати замовлення по order_id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Замовлення
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order: { $ref: '#/components/schemas/Order' }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /order/change-status/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Змінити статус замовлення
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: Нема статусу
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /order/delete/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Видалити замовлення
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /order/delete/{parentId}/{itemId}:
 *   put:
 *     tags: [Orders]
 *     summary: Видалити товар із замовлення
 *     parameters:
 *       - in: path
 *         name: parentId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: totalPrice
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */

/**
 * @swagger
 * /feedback:
 *   post:
 *     tags: [Feedback]
 *     summary: Створити заявку на зворотній зв'язок
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /feedback/all:
 *   get:
 *     tags: [Feedback]
 *     summary: Всі заявки
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Список
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 feedback:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Feedback' }
 *                 totalItems: { type: integer }
 *                 totalPages: { type: integer }
 *                 currentPage: { type: integer }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /feedback/change-status/{id}:
 *   put:
 *     tags: [Feedback]
 *     summary: Позначити як виконано
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /feedback/delete/{id}:
 *   delete:
 *     tags: [Feedback]
 *     summary: Видалити заявку
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */

/**
 * @swagger
 * /slider:
 *   get:
 *     tags: [Slider]
 *     summary: Отримати слайдер
 *     responses:
 *       200:
 *         description: Слайдер
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 slider:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/SliderImage' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /slider/add:
 *   post:
 *     tags: [Slider]
 *     summary: Додати слайд
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, linkImg]
 *             properties:
 *               id: { type: string }
 *               linkImg: { type: string }
 *     responses:
 *       200:
 *         description: Додано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 slider: { $ref: '#/components/schemas/SliderImage' }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /slider/{id}:
 *   delete:
 *     tags: [Slider]
 *     summary: Видалити слайд
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Видалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */

/**
 * @swagger
 * /nova-poshta/cities:
 *   get:
 *     tags: [Nova Poshta]
 *     summary: Отримати список міст
 *     responses:
 *       200:
 *         description: Список міст
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /nova-poshta/citi:
 *   post:
 *     tags: [Nova Poshta]
 *     summary: Пошук міста та відділень
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [city, cityRef]
 *             properties:
 *               city: { type: string }
 *               cityRef: { type: string }
 *     responses:
 *       200:
 *         description: Результат
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 city:
 *                   type: array
 *                   items: { type: object }
 *                 warehouses:
 *                   type: array
 *                   items: { type: object }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /nova-poshta/citi/warehouses:
 *   post:
 *     tags: [Nova Poshta]
 *     summary: Отримати відділення
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [city]
 *             properties:
 *               city: { type: string }
 *               numberWarehouses: { type: string }
 *               type: { type: string }
 *     responses:
 *       200:
 *         description: Список відділень
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 warehouses:
 *                   type: array
 *                   items: { type: object }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */

// ===================== ADMIN =====================

/**
 * @swagger
 * /admin:
 *   get:
 *     tags: [Health]
 *     summary: Admin API root
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */

/**
 * @swagger
 * /admin/login:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Авторизація адміністратора
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Успішно
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     role: { type: string }
 *       401:
 *         description: Невірні дані
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /admin/login/add-admin:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Додати адміністратора
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Додано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       400:
 *         description: Вже існує
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       500:
 *         description: Помилка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /admin/login/token:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Оновити access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Новий токен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken: { type: string }
 *       403:
 *         description: Недійсний/протермінований refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /admin/login/logout:
 *   post:
 *     tags: [Admin Auth]
 *     summary: Вихід (invalidate refresh token)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */

/**
 * @swagger
 * /admin/products:
 *   get:
 *     tags: [Admin Products]
 *     summary: Список товарів (адмін)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sub_category
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *       - in: query
 *         name: sale
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: bestseller
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: available
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: price_min
 *         schema: { type: number }
 *       - in: query
 *         name: price_max
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, name_asc, newest] }
 *     responses:
 *       200:
 *         description: Список
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductShort' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       500:
 *         description: Помилка
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   post:
 *     tags: [Admin Products]
 *     summary: Створити товар (custom_product=true)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id: { type: string, nullable: true }
 *               slug: { type: string, nullable: true }
 *               sub_category_id: { type: string, nullable: true }
 *               product_name: { type: string }
 *               product_description: { type: string, nullable: true }
 *               brand: { type: string, nullable: true }
 *               price: { type: string }
 *               sale_price: { type: string, nullable: true }
 *               discount: { type: integer, nullable: true }
 *               available: { type: string, enum: ['true', 'false'], nullable: true }
 *               bestseller: { type: string, enum: ['true', 'false'], nullable: true }
 *               sale: { type: string, enum: ['true', 'false'], nullable: true }
 *     responses:
 *       201:
 *         description: Створено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product: { $ref: '#/components/schemas/Product' }
 *                 message: { type: string }
 *       500:
 *         description: Помилка
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *
 * /admin/products/{id}:
 *   get:
 *     tags: [Admin Products]
 *     summary: Отримати товар по product_id або slug
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Товар
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *       500:
 *         description: Помилка
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   put:
 *     tags: [Admin Products]
 *     summary: Оновити товар (by PK = product_id)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Оновлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product: { $ref: '#/components/schemas/Product' }
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *       500:
 *         description: Помилка
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *   delete:
 *     tags: [Admin Products]
 *     summary: Видалити товар (by PK = product_id)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Видалено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *       500:
 *         description: Помилка
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *
 * /admin/products/{id}/discount:
 *   put:
 *     tags: [Admin Products]
 *     summary: Оновити знижку та sale_price
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discount: { type: number }
 *               sale_price: { type: string }
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product: { $ref: '#/components/schemas/Product' }
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *
 * /admin/products/{id}/pictures:
 *   post:
 *     tags: [Admin Products]
 *     summary: Додати картинки (bulk)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pictures]
 *             properties:
 *               pictures:
 *                 oneOf:
 *                   - type: array
 *                     items: { type: string }
 *                   - type: string
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 *
 * /admin/products/{id}/pictures/{pictureId}:
 *   delete:
 *     tags: [Admin Products]
 *     summary: Видалити картинку
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: pictureId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: ОК
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *       404:
 *         description: Не знайдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string }
 */

/**
 * @swagger
 * /admin/categories/overview:
 *   get:
 *     tags: [Admin Categories]
 *     summary: Огляд категорій і статистика
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/my-catalogue:
 *   get:
 *     tags: [Admin Categories]
 *     summary: Повний каталог категорій
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/active:
 *   get:
 *     tags: [Admin Categories]
 *     summary: Категорії з товарами в наявності
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/sub-category:
 *   get:
 *     tags: [Admin Categories]
 *     summary: Список підкатегорій (пагінація) + список категорій
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/unmapped:
 *   get:
 *     tags: [Admin Categories]
 *     summary: Немаповані категорії постачальників
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/map:
 *   post:
 *     tags: [Admin Categories]
 *     summary: Мапінг категорій (перенос товарів з supplier sub_category_id в internal sub_category_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [from_sub_category_id, to_sub_category_id]
 *             properties:
 *               from_sub_category_id: { type: string }
 *               to_sub_category_id: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: Некоректні дані
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Target category not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/category:
 *   post:
 *     tags: [Admin Categories]
 *     summary: Створити категорію
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               id: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: Already exists / Name required
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/category/{id}:
 *   put:
 *     tags: [Admin Categories]
 *     summary: Оновити категорію
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *   delete:
 *     tags: [Admin Categories]
 *     summary: Видалити категорію
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/subcategory:
 *   post:
 *     tags: [Admin Categories]
 *     summary: Створити підкатегорію
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, parentId]
 *             properties:
 *               name: { type: string }
 *               parentId: { type: string }
 *               id: { type: string, nullable: true }
 *               picture: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: Already exists / required fields
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Parent not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/categories/subcategory/{id}:
 *   put:
 *     tags: [Admin Categories]
 *     summary: Оновити підкатегорію
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *   delete:
 *     tags: [Admin Categories]
 *     summary: Видалити підкатегорію
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 */

/**
 * @swagger
 * /admin/import/url:
 *   post:
 *     tags: [Admin Import]
 *     summary: Імпорт з URL (create/update ImportSource + import)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [xmlUrl]
 *             properties:
 *               xmlUrl: { type: string }
 *               supplierPrefix: { type: string, default: "DEFAULT" }
 *               supplierName: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: xmlUrl is required
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       500:
 *         description: Import error
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/file:
 *   post:
 *     tags: [Admin Import]
 *     summary: Імпорт з файлу (multipart/form-data)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               supplierPrefix:
 *                 type: string
 *                 nullable: true
 *               supplierName:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: No file uploaded / validation
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/sources:
 *   get:
 *     tags: [Admin Import]
 *     summary: Список джерел імпорту
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 sources:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ImportSource' }
 *
 * /admin/import/sources/{id}:
 *   put:
 *     tags: [Admin Import]
 *     summary: Оновити джерело (name/url/isActive)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplierName: { type: string, nullable: true }
 *               sourceUrl: { type: string, nullable: true }
 *               isActive: { type: boolean, nullable: true }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Source not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/sources/{id}/file:
 *   put:
 *     tags: [Admin Import]
 *     summary: Оновити файл джерела (multipart/form-data)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: File required
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Source not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/sources/{id}:
 *   delete:
 *     tags: [Admin Import]
 *     summary: Видалити джерело
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Source not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/sources/{id}/run:
 *   post:
 *     tags: [Admin Import]
 *     summary: Запустити імпорт конкретного джерела
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: Source is inactive / File not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Source not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/run-all:
 *   post:
 *     tags: [Admin Import]
 *     summary: Запустити всі активні імпорти
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/mappings/{supplier}:
 *   get:
 *     tags: [Admin Import]
 *     summary: Отримати мапінги постачальника
 *     parameters:
 *       - in: path
 *         name: supplier
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/mapping:
 *   post:
 *     tags: [Admin Import]
 *     summary: Створити/оновити мапінг категорії
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierPrefix, externalCategoryId, internalCategoryId]
 *             properties:
 *               supplierPrefix: { type: string }
 *               externalCategoryId: { type: string }
 *               internalCategoryId: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       400:
 *         description: Required fields
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/mapping/{id}:
 *   put:
 *     tags: [Admin Import]
 *     summary: Оновити мапінг (internalCategoryId)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [internalCategoryId]
 *             properties:
 *               internalCategoryId: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Mapping not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *   delete:
 *     tags: [Admin Import]
 *     summary: Видалити мапінг
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *       404:
 *         description: Mapping not found
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/mappings/{supplier}:
 *   delete:
 *     tags: [Admin Import]
 *     summary: Очистити мапінги постачальника
 *     parameters:
 *       - in: path
 *         name: supplier
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/unmapped/{supplierPrefix}:
 *   get:
 *     tags: [Admin Import]
 *     summary: Немаповані категорії постачальника + можливі targets
 *     parameters:
 *       - in: path
 *         name: supplierPrefix
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/stats/{supplierPrefix}:
 *   get:
 *     tags: [Admin Import]
 *     summary: Статистика мапінгу постачальника
 *     parameters:
 *       - in: path
 *         name: supplierPrefix
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/import/targets:
 *   get:
 *     tags: [Admin Import]
 *     summary: Список доступних internal subcategories для мапінгу
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 */

/**
 * @swagger
 * /admin/filters/active:
 *   get:
 *     tags: [Admin Filters]
 *     summary: Активні фільтри по всіх товарах в наявності
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/filters/subcategory/{subcategoryId}:
 *   get:
 *     tags: [Admin Filters]
 *     summary: Фільтри підкатегорії (cache або calculated)
 *     parameters:
 *       - in: path
 *         name: subcategoryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/filters/recalc/{subcategoryId}:
 *   post:
 *     tags: [Admin Filters]
 *     summary: Перерахувати фільтри підкатегорії
 *     parameters:
 *       - in: path
 *         name: subcategoryId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 */

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     tags: [Admin Reviews]
 *     summary: Список відгуків (пагінація)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Review' }
 *                 total: { type: integer }
 *                 pages: { type: integer }
 *
 * /admin/reviews/responses:
 *   get:
 *     tags: [Admin Reviews]
 *     summary: Список відповідей на відгуки (пагінація)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema: { type: object }
 *
 * /admin/reviews/product/{productId}:
 *   get:
 *     tags: [Admin Reviews]
 *     summary: Відгуки по товару
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Review' }
 *
 * /admin/reviews/{reviewId}:
 *   delete:
 *     tags: [Admin Reviews]
 *     summary: Видалити відгук
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *
 * /admin/reviews/response/{responseId}:
 *   delete:
 *     tags: [Admin Reviews]
 *     summary: Видалити відповідь на відгук
 *     parameters:
 *       - in: path
 *         name: responseId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 */