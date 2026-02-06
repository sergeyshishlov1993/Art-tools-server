const { Router } = require('express');
const router = Router();
const { SliderImage } = require('../../db');

router.get('/', async (req, res) => {
    try {
        const slider = await SliderImage.findAll({ order: [['id', 'ASC']] });
        res.json({ success: true, slider });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { id, linkImg } = req.body;

        if (!linkImg) {
            return res.status(400).json({ success: false, error: 'linkImg is required' });
        }

        const slider = await SliderImage.create({
            id: id,
            name: linkImg
        });

        res.json({ success: true, slider });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deleted = await SliderImage.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ success: false, error: 'Slide not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;