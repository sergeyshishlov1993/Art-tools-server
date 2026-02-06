const { Router } = require('express');
const router = Router();
const { Feedback } = require('../../db');

router.post('/', async (req, res) => {
    try {
        await Feedback.create({
            name: req.body.name,
            phone: req.body.phone
        });

        res.json({ message: 'Заявка успішно створена' });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;