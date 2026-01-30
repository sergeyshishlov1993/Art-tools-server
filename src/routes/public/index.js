const { Router } = require('express');
const router = Router();

const homeRoutes = require('./home');
const feedbackRoutes = require('./feedback');
const sliderRoutes = require('./slider');
const ordersRoutes = require('./orders');
const novaPoshtaRoutes = require('./novaPoshta');
const productsRoutes = require('./products');
const filtersRoutes = require('./filters');
const categoryRoutes = require('./categories');

router.use('/home', homeRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/slider', sliderRoutes);
router.use('/order', ordersRoutes);
router.use('/nova-poshta', novaPoshtaRoutes);
router.use('/products', productsRoutes);
router.use('/filters', filtersRoutes);
router.use('/category', categoryRoutes)

module.exports = router;
