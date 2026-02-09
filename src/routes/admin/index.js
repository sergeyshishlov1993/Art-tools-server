const { Router } = require('express');
const router = Router();

const authRoutes = require('./auth');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const importRoutes = require('./import');
const filtersRoutes = require('./filters');
const reviewsRoutes = require('./reviews');
const ordersRoutes = require('./orders');
const feedbacksRoutes = require('./feedback');
const slidersRoutes = require('./slider');
const trackingRoutes = require('./trackingRoutes');

router.use('/login', authRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/import', importRoutes);
router.use('/filters', filtersRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/orders', ordersRoutes);
router.use('/feedback', feedbacksRoutes);
router.use('/sliders', slidersRoutes);
router.use('/tracking', trackingRoutes)
router.get('/', (req, res) => {
    res.json({ message: 'Admin API' });
});

module.exports = router;
