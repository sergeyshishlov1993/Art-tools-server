const { Router } = require('express');
const router = Router();
const { Review, ReviewResponse } = require('../../db');

// GET /admin/reviews
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const data = await Review.findAndCountAll({
            distinct: true,
            include: [{ model: ReviewResponse, as: 'responses' }],
            offset: (page - 1) * limit,
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            reviews: data.rows,
            total: data.count,
            pages: Math.ceil(data.count / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/reviews/responses
router.get('/responses', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const data = await ReviewResponse.findAndCountAll({
            distinct: true,
            offset: (page - 1) * limit,
            limit: parseInt(limit),
            order: [['createdAt', 'DESC']]
        });

        res.json({
            responses: data.rows,
            total: data.count,
            pages: Math.ceil(data.count / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { product_id: req.params.productId },
            include: [{ model: ReviewResponse, as: 'responses' }]
        });

        res.json({ reviews });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/reviews/:reviewId
router.delete('/:reviewId', async (req, res) => {
    try {
        await Review.destroy({ where: { review_id: req.params.reviewId } });
        res.json({ message: 'Review deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/reviews/response/:responseId
router.delete('/response/:responseId', async (req, res) => {
    try {
        await ReviewResponse.destroy({
            where: { response_id: req.params.responseId }
        });
        res.json({ message: 'Response deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
