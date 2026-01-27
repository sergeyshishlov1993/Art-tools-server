const { Router } = require('express');
const router = Router();

const authRoutes = require('./auth');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const importRoutes = require('./import');
const filtersRoutes = require('./filters');
const reviewsRoutes = require('./reviews');

// Auth
router.use('/login', authRoutes);

// Products
router.use('/products', productsRoutes);

// Categories
router.use('/categories', categoriesRoutes);

// Import
router.use('/import', importRoutes);

// Filters
router.use('/filters', filtersRoutes);

// Reviews
router.use('/reviews', reviewsRoutes);

// Health check
router.get('/', (req, res) => {
    res.json({ message: 'Admin API' });
});

module.exports = router;
