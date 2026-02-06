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

module.exports = router;