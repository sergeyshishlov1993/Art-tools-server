const { Router } = require('express');
const router = Router();
const { Feedback } = require('../../db');
const { Op } = require('sequelize');

router.get('/all', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const feedback = await Feedback.findAndCountAll({
            distinct: true,
            offset: (page - 1) * limit,
            limit: parseInt(limit, 10),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            message: 'Зворотній зв\'язок',
            feedback: feedback.rows,
            totalItems: feedback.count,
            totalPages: Math.ceil(feedback.count / Number(limit)),
            currentPage: parseInt(page, 10)
        });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

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

router.delete('/delete/:id', async (req, res) => {
    try {
        await Feedback.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Успішно видалено' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

router.get('/count-new', async (req, res) => {
    try {
        const count = await Feedback.count({
            where: {
                status: { [Op.or]: [null, '', 'Новий'] }
            }
        })
        res.json({ count })
    } catch (error) {
        console.error('Помилка:', error)
        res.status(500).json({ message: 'Помилка сервера' })
    }
})

module.exports = router;