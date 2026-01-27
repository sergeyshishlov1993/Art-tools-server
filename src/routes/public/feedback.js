const { Router } = require('express');
const router = Router();
const { Feedback } = require('../../db');

// POST /feedback - створити заявку
router.post('/', async (req, res) => {
    try {
        const newFeedback = await Feedback.create({
            name: req.body.name,
            phone: req.body.phone
        });

        console.log('Нова заявка:', newFeedback);
        res.json({ message: 'Заявка успішно створена' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /feedback/all - всі заявки (admin)
router.get('/all', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const feedback = await Feedback.findAndCountAll({
            distinct: true,
            offset: (page - 1) * limit,
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            message: 'Зворотній зв\'язок',
            feedback: feedback.rows,
            totalItems: feedback.count,
            totalPages: Math.ceil(feedback.count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// PUT /feedback/change-status/:id
router.put('/change-status/:id', async (req, res) => {
    try {
        await Feedback.update(
            { status: 'Виконано' },
            { where: { id: req.params.id } }
        );
        res.json({ message: 'Статус змінено' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE /feedback/delete/:id
router.delete('/delete/:id', async (req, res) => {
    try {
        await Feedback.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Успішно видалено' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
