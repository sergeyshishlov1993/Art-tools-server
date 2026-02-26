const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Expense, Order } = require('../../db');

const VALID_TYPES = ['delivery', 'advertising', 'other'];
const NEGATIVE_STATUSES = ['cancelled', 'refund', 'returned'];

// GET /api/admin/expenses?year=2025&month=6
router.get('/', async (req, res) => {
    const { year, month } = req.query;

    try {
        const where = {};

        if (year && month) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 1);
            where.date = { [Op.gte]: startDate, [Op.lt]: endDate };
        }

        const expenses = await Expense.findAll({
            where,
            order: [['date', 'DESC']],
        });

        res.json({ expenses });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /api/admin/expenses/summary?year=2025&month=6
router.get('/summary', async (req, res) => {
    const { year, month } = req.query;

    try {
        const expenseWhere = {};
        const orderWhere = { status: { [Op.notIn]: NEGATIVE_STATUSES } };

        if (year && month) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 1);
            expenseWhere.date = { [Op.gte]: startDate, [Op.lt]: endDate };
            orderWhere.createdAt = { [Op.gte]: startDate, [Op.lt]: endDate };
        }

        const byType = await Expense.findAll({
            attributes: [
                'type',
                [Expense.sequelize.fn('SUM', Expense.sequelize.cast(Expense.sequelize.col('amount'), 'DECIMAL')), 'total'],
                [Expense.sequelize.fn('COUNT', Expense.sequelize.col('id')), 'count'],
            ],
            where: expenseWhere,
            group: ['type'],
            raw: true,
        });

        const totalExpenses = byType.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

        const revenueResult = await Order.findOne({
            attributes: [
                [Order.sequelize.fn('SUM', Order.sequelize.cast(Order.sequelize.col('total_price'), 'DECIMAL')), 'total'],
            ],
            where: orderWhere,
            raw: true,
        });

        const revenue = parseFloat(revenueResult?.total) || 0;
        const netProfit = revenue - totalExpenses;

        const byTypeMap = {};
        for (const row of byType) {
            byTypeMap[row.type] = {
                total: parseFloat(row.total) || 0,
                count: parseInt(row.count) || 0,
            };
        }

        res.json({
            revenue,
            totalExpenses,
            netProfit,
            margin: revenue > 0 ? parseFloat(((netProfit / revenue) * 100).toFixed(1)) : 0,
            byType: byTypeMap,
        });
    } catch (error) {
        console.error('Expenses summary error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// POST /api/admin/expenses
router.post('/', async (req, res) => {
    const { type, amount, description, date } = req.body;

    if (!type || !amount || !date) {
        return res.status(400).json({ message: 'type, amount та date обовʼязкові' });
    }

    if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ message: 'Невірний тип', validTypes: VALID_TYPES });
    }

    try {
        const expense = await Expense.create({
            type,
            amount: parseFloat(amount),
            description: description || null,
            date,
        });

        res.status(201).json({ message: 'Витрату додано', expense });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /api/admin/expenses/:id
router.put('/:id', async (req, res) => {
    const { type, amount, description, date } = req.body;

    try {
        const expense = await Expense.findByPk(req.params.id);

        if (!expense) {
            return res.status(404).json({ message: 'Витрату не знайдено' });
        }

        if (type && !VALID_TYPES.includes(type)) {
            return res.status(400).json({ message: 'Невірний тип' });
        }

        await expense.update({
            ...(type && { type }),
            ...(amount !== undefined && { amount: parseFloat(amount) }),
            ...(description !== undefined && { description }),
            ...(date && { date }),
        });

        res.json({ message: 'Витрату оновлено', expense });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE /api/admin/expenses/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Expense.destroy({ where: { id: req.params.id } });

        if (!deleted) {
            return res.status(404).json({ message: 'Витрату не знайдено' });
        }

        res.json({ message: 'Витрату видалено' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;