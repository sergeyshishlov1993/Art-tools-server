
const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Order, OrderItem, Product, Picture } = require('../../db');
const telegramService = require('../../services/telegramService');
router.post('/quick-buy', async (req, res) => {
    const { name, phone, slug, quantity = 1 } = req.body;

    // Валідація
    if (!name || !phone || !slug) {
        return res.status(400).json({
            message: 'Вкажіть ім\'я, телефон та товар'
        });
    }

    // Валідація телефону
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({
            message: 'Невірний формат телефону'
        });
    }

    try {
        // Знаходимо товар по slug або product_id
        const product = await Product.findOne({
            where: {
                [Op.or]: [
                    { slug: slug },
                    { product_id: slug }
                ]
            },
            include: [{
                model: Picture,
                as: 'pictures',
                attributes: ['pictures_name'],
                limit: 1
            }]
        });

        if (!product) {
            return res.status(404).json({
                message: 'Товар не знайдено'
            });
        }

        // Перевіряємо наявність
        if (product.available !== 'true') {
            return res.status(400).json({
                message: 'Товар недоступний для замовлення'
            });
        }

        // Розраховуємо ціну
        const price = parseFloat(product.price);
        const discount = product.discount || 0;
        const finalPrice = discount > 0
            ? price - (price * discount / 100)
            : price;
        const totalPrice = finalPrice * quantity;

        // Отримуємо картинку
        const productImg = product.pictures?.[0]?.pictures_name || null;

        // Створюємо замовлення (order_id генерується автоматично через defaultValue)
        const order = await Order.create({
            name,
            second_name: '',
            phone,
            payment_method: 'Не вказано',
            city: 'Не вказано',
            postal_office: 'Не вказано',
            total_price: totalPrice.toString(),
            courier_delivery_address: '',
            qwery: 'quick-buy',
            status: 'new'
        });

        // Створюємо позицію замовлення
        await OrderItem.create({
            order_id: order.order_id,
            order_name: product.product_name,
            count: quantity,
            product_id: product.product_id,
            product_img: productImg,
            price: price,
            discount: discount,
            discounted_product: discount > 0 ? finalPrice : null
        });

        // Відправляємо в Telegram
        telegramService.sendQuickBuyNotification({
            orderId: order.order_id,
            productName: product.product_name,
            productId: product.product_id,
            quantity,
            price: finalPrice,
            totalPrice,
            name,
            phone
        });

        res.json({
            message: 'Замовлення створено! Ми зв\'яжемось з вами найближчим часом.',
            order_id: order.order_id,
            product: {
                name: product.product_name,
                price: finalPrice,
                quantity,
                total: totalPrice
            }
        });

    } catch (error) {
        console.error('Quick buy error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// POST /order/add-order
router.post('/add-order', async (req, res) => {
    const {
        order_id, name, secondName, phone, payment,
        city, warehouses, totalPrice, orders,
        courierDeliveryAddress, qwery
    } = req.body;

    try {
        await Order.create({
            order_id,
            name,
            second_name: secondName,
            phone,
            payment_method: payment,
            city,
            postal_office: warehouses,
            total_price: totalPrice,
            courier_delivery_address: courierDeliveryAddress,
            qwery,
            status: 'new'
        });

        for (const item of orders) {
            await OrderItem.create({
                order_id,
                order_name: item.orderName,
                count: item.count,
                product_id: item.product_id,
                product_img: item.img,
                price: item.price,
                discount: item.discount,
                discounted_product: item.discountProduct
            });
        }

        // Telegram notification
        telegramService.sendOrderNotification({
            orderId: order_id,
            products: orders.map((item, i) => `${i + 1}. ${item.orderName} (${item.count} шт.)`).join('\n'),
            name,
            secondName,
            phone,
            city,
            payment,
            warehouses,
            courierAddress: courierDeliveryAddress,
            totalPrice
        });

        res.json({ message: 'Замовлення успішно додано', order_id });
    } catch (error) {
        console.error('Add order error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /order/all-orders - Всі замовлення
router.get('/all-orders', async (req, res) => {
    const { page = 1, limit = 10, search = '', status = '', year, month } = req.query;

    try {
        const where = {};

        if (search.trim()) {
            where[Op.or] = [
                { phone: { [Op.iLike]: `%${search.trim()}%` } },
                { name: { [Op.iLike]: `%${search.trim()}%` } },
                { order_id: { [Op.iLike]: `%${search.trim()}%` } }
            ];
        }

        if (year && month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1);
            where.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
        }

        if (status.trim()) {
            where.status = status.trim();
        }

        const orders = await Order.findAndCountAll({
            distinct: true,
            where,
            include: [{ model: OrderItem, as: 'items' }],
            offset: (page - 1) * limit,
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            message: orders.count ? 'Замовлення знайдено' : 'Нічого не знайдено',
            notFound: !orders.count,
            orders: orders.rows,
            totalItems: orders.count,
            totalPages: Math.ceil(orders.count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /order/:id - Отримати одне замовлення
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { order_id: req.params.id },
            include: [{ model: OrderItem, as: 'items' }]
        });

        if (!order) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /order/change-status/:id - Змінити статус
router.put('/change-status/:id', async (req, res) => {
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'Вкажіть статус' });
    }

    try {
        const [updated] = await Order.update(
            { status },
            { where: { order_id: req.params.id } }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        res.json({ message: 'Статус змінено' });
    } catch (error) {
        console.error('Change status error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE /order/delete/:id - Видалити замовлення
router.delete('/delete/:id', async (req, res) => {
    try {
        await OrderItem.destroy({ where: { order_id: req.params.id } });

        const deleted = await Order.destroy({
            where: { order_id: req.params.id }
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        res.json({ message: 'Замовлення видалено' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /order/delete/:parentId/:itemId - Видалити товар із замовлення
router.put('/delete/:parentId/:itemId', async (req, res) => {
    const { totalPrice } = req.query;

    try {
        const deleted = await OrderItem.destroy({
            where: { item_id: req.params.itemId }
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Товар не знайдено' });
        }

        await Order.update(
            { total_price: totalPrice },
            { where: { order_id: req.params.parentId } }
        );

        res.json({ message: 'Товар видалено' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
