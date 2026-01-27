const { Router } = require('express');
const router = Router();
const { Product, CategoryFilter } = require('../../db');
const FilterService = require('../../services/filterService');

// GET /admin/filters/active
router.get('/active', async (req, res) => {
    try {
        const [brands] = await Product.sequelize.query(`
            SELECT brand, COUNT(DISTINCT product_id) as c, 
                   MIN(CAST(price AS DECIMAL)) as min, 
                   MAX(CAST(price AS DECIMAL)) as max
            FROM products 
            WHERE available='true' AND brand > '' 
            GROUP BY brand 
            ORDER BY brand
        `);

        const [prices] = await Product.sequelize.query(`
            SELECT MIN(CAST(price AS DECIMAL)) as min, 
                   MAX(CAST(price AS DECIMAL)) as max 
            FROM products 
            WHERE available='true'
        `);

        const [special] = await Product.sequelize.query(`
            SELECT 
                COUNT(CASE WHEN sale='true' THEN 1 END) as sale,
                COUNT(CASE WHEN bestseller='true' THEN 1 END) as best,
                COUNT(CASE WHEN discount > 0 THEN 1 END) as disc 
            FROM products 
            WHERE available='true'
        `);

        res.json({
            success: true,
            filters: {
                brands: brands.map(b => ({
                    name: b.brand,
                    count: +b.c,
                    min: +b.min,
                    max: +b.max
                })),
                price: {
                    min: +prices[0]?.min || 0,
                    max: +prices[0]?.max || 0
                },
                special: {
                    sale: +special[0]?.sale,
                    bestseller: +special[0]?.best,
                    with_discount: +special[0]?.disc
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/filters/subcategory/:subcategoryId
router.get('/subcategory/:subcategoryId', async (req, res) => {
    const { subcategoryId } = req.params;

    try {
        // Спочатку шукаємо в кеші
        let cache = await CategoryFilter.findOne({
            where: { sub_category_id: subcategoryId }
        });

        if (cache) {
            return res.json({
                success: true,
                filters: cache.filters_data,
                source: 'cache'
            });
        }

        // Якщо кешу немає - рахуємо
        const count = await Product.count({
            where: { sub_category_id: subcategoryId }
        });

        if (count === 0) {
            return res.json({
                success: true,
                filters: null,
                message: 'Empty category'
            });
        }

        await FilterService.recalcForCategory(subcategoryId);

        cache = await CategoryFilter.findOne({
            where: { sub_category_id: subcategoryId }
        });

        res.json({
            success: true,
            filters: cache?.filters_data,
            source: 'calculated'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admin/filters/recalc/:subcategoryId
router.post('/recalc/:subcategoryId', async (req, res) => {
    try {
        await FilterService.recalcForCategory(req.params.subcategoryId);
        res.json({ success: true, message: 'Filters recalculated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
