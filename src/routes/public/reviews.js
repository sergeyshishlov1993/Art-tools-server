const { Router } = require('express');
const router = Router();
const { Op } = require('sequelize');
const { Review, ReviewResponse, Product } = require('../../db');

router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findOne({
            where: {
                [Op.or]: [{ product_id: productId }, { slug: productId }]
            },
            attributes: ['product_id']
        });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const reviews = await Review.findAll({
            where: { product_id: product.product_id },
            include: [{ model: ReviewResponse, as: 'responses' }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ success: true, product_id: product.product_id, reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { author_name, author_email, rating, comment } = req.body;

        if (!rating || Number(rating) < 1 || Number(rating) > 5) {
            return res.status(400).json({ success: false, error: 'rating must be 1..5' });
        }

        const commentText = String(comment || '').trim();
        if (!commentText) {
            return res.status(400).json({ success: false, error: 'comment required' });
        }

        const product = await Product.findOne({
            where: {
                [Op.or]: [{ product_id: productId }, { slug: productId }]
            },
            attributes: ['product_id']
        });

        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        const review = await Review.create({
            product_id: product.product_id,
            author_name: author_name ? String(author_name).trim() : null,
            author_email: author_email ? String(author_email).trim() : null,
            rating: Number(rating),
            comment: commentText
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;