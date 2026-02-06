const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Order, OrderItem } = require('../../db');

router.get('/all-orders', async (req, res) => {
    const { page = 1, limit = 10, search = '', status = '', year, month } = req.query;

    try {
        const where = {};

        if (String(search).trim()) {
            where[Op.or] = [
                { phone: { [Op.iLike]: `%${String(search).trim()}%` } },
                { name: { [Op.iLike]: `%${String(search).trim()}%` } },
                { order_id: { [Op.iLike]: `%${String(search).trim()}%` } }
            ];
        }

        if (year && month) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 1);
            where.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
        }

        if (String(status).trim()) {
            where.status = String(status).trim();
        }

        const orders = await Order.findAndCountAll({
            distinct: true,
            where,
            include: [{ model: OrderItem, as: 'items' }],
            offset: (Number(page) - 1) * Number(limit),
            limit: parseInt(limit, 10),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            message: orders.count ? 'Замовлення знайдено' : 'Нічого не знайдено',
            notFound: !orders.count,
            orders: orders.rows,
            totalItems: orders.count,
            totalPages: Math.ceil(orders.count / Number(limit)),
            currentPage: parseInt(page, 10)
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

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