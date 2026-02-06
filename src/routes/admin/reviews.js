const { Router } = require('express');
const router = Router();
const { Review, ReviewResponse, Product } = require('../../db');

// GET /admin/reviews?page=1&limit=10
router.get('/', async (req, res) => {
    try {
        const page = Number.parseInt(String(req.query.page || '1'), 10) || 1;
        const limitRaw = Number.parseInt(String(req.query.limit || '10'), 10) || 10;
        const limit = Math.min(Math.max(limitRaw, 1), 100);
        const offset = (page - 1) * limit;

        const data = await Review.findAndCountAll({
            distinct: true,
            include: [
                { model: ReviewResponse, as: 'responses' },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['product_id', 'product_name', 'slug', 'price', 'main_image']
                }
            ],
            offset,
            limit,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            reviews: data.rows,
            pagination: {
                page,
                limit,
                total: data.count,
                pages: Math.ceil(data.count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error.message || error) });
    }
});

// GET /admin/reviews/responses?page=1&limit=10
router.get('/responses', async (req, res) => {
    try {
        const page = Number.parseInt(String(req.query.page || '1'), 10) || 1;
        const limitRaw = Number.parseInt(String(req.query.limit || '10'), 10) || 10;
        const limit = Math.min(Math.max(limitRaw, 1), 100);
        const offset = (page - 1) * limit;

        const data = await ReviewResponse.findAndCountAll({
            distinct: true,
            include: [
                {
                    model: Review,
                    as: 'review',
                    include: [
                        {
                            model: Product,
                            as: 'product',
                            attributes: ['product_id', 'product_name', 'slug', 'main_image']
                        }
                    ]
                }
            ],
            offset,
            limit,
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            responses: data.rows,
            pagination: {
                page,
                limit,
                total: data.count,
                pages: Math.ceil(data.count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error.message || error) });
    }
});

// GET /admin/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const reviews = await Review.findAll({
            where: { product_id: productId },
            include: [
                { model: ReviewResponse, as: 'responses' },
                {
                    model: Product,
                    as: 'product',
                    attributes: ['product_id', 'product_name', 'slug', 'price', 'main_image']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error.message || error) });
    }
});

// DELETE /admin/reviews/:reviewId
router.delete('/:reviewId', async (req, res) => {
    try {
        const { reviewId } = req.params;

        const deleted = await Review.destroy({ where: { review_id: reviewId } });

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Review not found' });
        }

        res.json({ success: true, message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error.message || error) });
    }
});

// DELETE /admin/reviews/response/:responseId
router.delete('/response/:responseId', async (req, res) => {
    try {
        const { responseId } = req.params;

        const deleted = await ReviewResponse.destroy({ where: { response_id: responseId } });

        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Response not found' });
        }

        res.json({ success: true, message: 'Response deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error.message || error) });
    }
});

module.exports = router;