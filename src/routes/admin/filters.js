const { Router } = require('express');
const router = Router();
const { Product, CategoryFilter } = require('../../db');
const FilterService = require('../../services/filterService');

// GET /admin/filters/subcategory/:subcategoryId
router.get('/subcategory/:subcategoryId', async (req, res) => {
    const { subcategoryId } = req.params;

    try {
        let cache = await CategoryFilter.findOne({
            where: { sub_category_id: subcategoryId }
        });

        if (!cache) {
            const count = await Product.count({
                where: { sub_category_id: subcategoryId }
            });

            if (count === 0) {
                return res.json({
                    success: true,
                    filters: null
                });
            }

            await FilterService.recalcForCategory(subcategoryId);

            cache = await CategoryFilter.findOne({
                where: { sub_category_id: subcategoryId }
            });
        }

        res.json({
            success: true,
            filters: cache?.filters_data || null
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admin/filters/recalc/:subcategoryId
router.post('/recalc/:subcategoryId', async (req, res) => {
    try {
        await FilterService.recalcForCategory(req.params.subcategoryId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;