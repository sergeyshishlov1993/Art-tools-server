const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Order, OrderItem } = require('../../db');

// Константи статусів
const STATUSES = {
    NEW: 'new',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUND: 'refund',
    RETURNED: 'returned'
};

const VALID_STATUSES = Object.values(STATUSES);
const NEGATIVE_STATUSES = [STATUSES.CANCELLED, STATUSES.REFUND, STATUSES.RETURNED];
const SUCCESS_STATUSES = [STATUSES.DELIVERED, STATUSES.COMPLETED];
const IN_PROGRESS_STATUSES = [STATUSES.PROCESSING, STATUSES.SHIPPED];

// GET /api/admin/orders/count-new
router.get('/count-new', async (req, res) => {
    try {
        const count = await Order.count({
            where: { status: STATUSES.NEW }  // 'new' замість 'Новий'
        });
        res.json({ count });
    } catch (error) {
        console.error('Count new error:', error);
        res.status(500).json({ message: 'Помилка сервера', count: 0 });
    }
});

// GET /api/admin/orders/all-orders
router.get('/all-orders', async (req, res) => {
    const { page = 1, limit = 20, search = '', status = '', source = '', year, month } = req.query;

    try {
        const where = {};

        if (String(search).trim()) {
            const searchTerm = String(search).trim();
            where[Op.or] = [
                { phone: { [Op.iLike]: `%${searchTerm}%` } },
                { name: { [Op.iLike]: `%${searchTerm}%` } },
                { order_number: { [Op.iLike]: `%${searchTerm}%` } },
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

        if (String(source).trim()) {
            where.source = String(source).trim();
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

// GET /api/admin/orders/stats
router.get('/stats', async (req, res) => {
    const { year, month, source } = req.query;

    try {
        let periodWhere = {};

        if (year && month) {
            const periodStart = new Date(Number(year), Number(month) - 1, 1);
            const periodEnd = new Date(Number(year), Number(month), 1);
            periodWhere.createdAt = { [Op.gte]: periodStart, [Op.lt]: periodEnd };
        }

        if (source) {
            periodWhere.source = source;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const getStats = async (additionalWhere = {}) => {
            const result = await Order.findOne({
                attributes: [
                    [Order.sequelize.fn('COUNT', Order.sequelize.col('order_id')), 'count'],
                    [Order.sequelize.fn('SUM', Order.sequelize.cast(Order.sequelize.col('total_price'), 'DECIMAL')), 'total']
                ],
                where: { ...periodWhere, ...additionalWhere },
                raw: true
            });
            return {
                count: parseInt(result?.count) || 0,
                sum: parseFloat(result?.total) || 0
            };
        };

        const total = await getStats();
        const pending = await getStats({ status: STATUSES.NEW });
        const inProgress = await getStats({ status: { [Op.in]: IN_PROGRESS_STATUSES } });
        const completed = await getStats({ status: { [Op.in]: SUCCESS_STATUSES } });
        const cancelled = await getStats({ status: STATUSES.CANCELLED });
        const refund = await getStats({ status: STATUSES.REFUND });
        const returned = await getStats({ status: STATUSES.RETURNED });

        const allRefunds = {
            count: cancelled.count + refund.count + returned.count,
            sum: cancelled.sum + refund.sum + returned.sum
        };

        const confirmed = {
            count: inProgress.count + completed.count,
            sum: inProgress.sum + completed.sum
        };

        const netProfit = completed.sum;
        const conversionRate = total.count > 0 ? ((completed.count / total.count) * 100).toFixed(1) : 0;
        const cancelRate = total.count > 0 ? ((allRefunds.count / total.count) * 100).toFixed(1) : 0;

        const byStatus = await Order.findAll({
            attributes: [
                'status',
                [Order.sequelize.fn('COUNT', Order.sequelize.col('order_id')), 'count'],
                [Order.sequelize.fn('SUM', Order.sequelize.cast(Order.sequelize.col('total_price'), 'DECIMAL')), 'total']
            ],
            where: periodWhere,
            group: ['status'],
            raw: true
        });

        const bySource = await Order.findAll({
            attributes: [
                'source',
                [Order.sequelize.fn('COUNT', Order.sequelize.col('order_id')), 'count'],
                [Order.sequelize.fn('SUM', Order.sequelize.cast(Order.sequelize.col('total_price'), 'DECIMAL')), 'total']
            ],
            where: { ...periodWhere, status: { [Op.notIn]: NEGATIVE_STATUSES } },
            group: ['source'],
            raw: true
        });

        const getTimeStats = async (dateWhere) => {
            const result = await Order.findOne({
                attributes: [
                    [Order.sequelize.fn('COUNT', Order.sequelize.col('order_id')), 'count'],
                    [Order.sequelize.fn('SUM', Order.sequelize.cast(Order.sequelize.col('total_price'), 'DECIMAL')), 'total']
                ],
                where: { ...dateWhere, status: { [Op.notIn]: NEGATIVE_STATUSES } },
                raw: true
            });
            return {
                count: parseInt(result?.count) || 0,
                total: parseFloat(result?.total) || 0
            };
        };

        const todayStats = await getTimeStats({ createdAt: { [Op.gte]: today } });

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStats = await getTimeStats({
            createdAt: { [Op.gte]: yesterday, [Op.lt]: today }
        });

        const weekStart = new Date(today);
        const dayOfWeek = weekStart.getDay();
        weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const thisWeekStats = await getTimeStats({ createdAt: { [Op.gte]: weekStart } });

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthStats = await getTimeStats({ createdAt: { [Op.gte]: monthStart } });

        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStats = await getTimeStats({
            createdAt: { [Op.gte]: lastMonthStart, [Op.lt]: lastMonthEnd }
        });

        const allTimeStats = await getTimeStats({});

        res.json({
            period: {
                total,
                pending,
                inProgress,
                confirmed,
                completed,
                cancelled,
                refund,
                returned,
                allRefunds,
                netProfit,
                conversionRate: parseFloat(conversionRate),
                cancelRate: parseFloat(cancelRate)
            },
            byStatus,
            bySource,
            today: todayStats,
            yesterday: yesterdayStats,
            thisWeek: thisWeekStats,
            thisMonth: thisMonthStats,
            lastMonth: lastMonthStats,
            allTime: allTimeStats
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /api/admin/orders/change-status/:id
router.put('/change-status/:id', async (req, res) => {
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'Вкажіть статус' });
    }

    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            message: 'Невірний статус',
            validStatuses: VALID_STATUSES
        });
    }

    try {
        const [updated] = await Order.update(
            { status },
            {
                where: {
                    [Op.or]: [
                        { order_id: req.params.id },
                        { order_number: req.params.id }
                    ]
                }
            }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        res.json({ message: 'Статус змінено', status });
    } catch (error) {
        console.error('Change status error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE /api/admin/orders/delete/:id
router.delete('/delete/:id', async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                [Op.or]: [
                    { order_id: req.params.id },
                    { order_number: req.params.id }
                ]
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Замовлення не знайдено' });
        }

        await OrderItem.destroy({ where: { order_id: order.order_id } });
        await order.destroy();

        res.json({ message: 'Замовлення видалено' });
    } catch (error) {
        console.error('Delete order error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /api/admin/orders/delete/:parentId/:itemId
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
            { total_price: parseFloat(totalPrice) || 0 },
            { where: { order_id: req.params.parentId } }
        );

        res.json({ message: 'Товар видалено' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /api/admin/orders/:id
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findOne({
            where: {
                [Op.or]: [
                    { order_id: req.params.id },
                    { order_number: req.params.id }
                ]
            },
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

module.exports = router;
