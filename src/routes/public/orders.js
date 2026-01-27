const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Order, OrderItem } = require('../../db');
const telegramService = require('../../services/telegramService');

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
            qwery
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
            products: orders.map((item, i) => `${i + 1}. ${item.orderName}`).join('\n'),
            name, secondName, phone, city, payment, warehouses,
            courierAddress: courierDeliveryAddress,
            totalPrice
        });

        res.json({ message: 'Замовлення успішно додано' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /order/all-orders
router.get('/all-orders', async (req, res) => {
    const { page = 1, limit = 10, search = '', status = '', year, month } = req.query;

    try {
        const where = {};

        if (search.trim()) {
            where.phone = { [Op.iLike]: `%${search.trim()}%` };
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
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /order/change-status/:id
router.put('/change-status/:id', async (req, res) => {
    const { status } = req.query;

    try {
        await Order.update({ status }, { where: { order_id: req.params.id } });
        res.json({ message: 'Статус змінено' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE /order/delete/:id
router.delete('/delete/:id', async (req, res) => {
    try {
        await Order.destroy({ where: { order_id: req.params.id } });
        res.json({ message: 'Замовлення видалено' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /order/delete/:parentId/:itemId
router.put('/delete/:parentId/:itemId', async (req, res) => {
    const { totalPrice } = req.query;

    try {
        await OrderItem.destroy({ where: { item_id: req.params.itemId } });
        await Order.update(
            { total_price: totalPrice },
            { where: { order_id: req.params.parentId } }
        );
        res.json({ message: 'Товар видалено' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
