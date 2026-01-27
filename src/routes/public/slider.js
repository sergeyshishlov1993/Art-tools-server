const { Router } = require('express');
const router = Router();
const { SliderImage } = require('../../db');

// GET /slider
router.get('/', async (req, res) => {
    try {
        const slider = await SliderImage.findAll();
        res.json({ message: 'Слайдер', slider });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// POST /slider/add
router.post('/add', async (req, res) => {
    const { id, linkImg } = req.body;

    try {
        const slider = await SliderImage.create({
            id: id,
            name: linkImg
        });

        res.json({ message: 'Картинку додано', slider });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// DELETE /slider/:id
router.delete('/:id', async (req, res) => {
    try {
        await SliderImage.destroy({ where: { id: req.params.id } });
        res.json({ message: `Видалено слайд ${req.params.id}` });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
