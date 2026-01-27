const { Router } = require('express');
const router = Router();
const ProductService = require('../../services/productService');

// GET /home - головна сторінка (bestsellers + sale)
router.get('/', async (req, res) => {
    try {
        const bestsellers = await ProductService.getByStatus('bestseller');
        const sale = await ProductService.getByStatus('sale', 8);

        res.json({
            message: 'Успішно завантажено',
            bestsellers,
            sale
        });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /home/sale
router.get('/sale', async (req, res) => {
    try {
        const sale = await ProductService.getByStatus('sale');
        res.json({ message: 'Акційні товари', sale });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// GET /home/bestsellers
router.get('/bestsellers', async (req, res) => {
    try {
        const bestsellers = await ProductService.getByStatus('bestseller');
        res.json({ message: 'Хіт продаж', bestsellers });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
