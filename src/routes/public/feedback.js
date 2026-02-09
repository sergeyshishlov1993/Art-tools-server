const { Router } = require('express');
const router = Router();
const { Feedback } = require('../../db');
const socketService = require('../../services/socketService');

router.post('/', async (req, res) => {
    try {
        const feedback = await Feedback.create({
            name: req.body.name,
            phone: req.body.phone,
            status: 'Новий'
        });

        socketService.notifyNewFeedback(feedback);

        res.json({ message: 'Заявка успішно створена' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
