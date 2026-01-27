const { Router } = require('express');
const router = Router();
const NovaPoshtaService = require('../../services/novaPoshtaService');

// GET /nova-poshta/cities
router.get('/cities', async (req, res) => {
    try {
        const data = await NovaPoshtaService.getCities();
        res.json({ message: 'Успішно', data });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// POST /nova-poshta/citi
router.post('/citi', async (req, res) => {
    try {
        const { city, cityRef } = req.body;

        const cityData = await NovaPoshtaService.searchCities(city);
        const warehouses = await NovaPoshtaService.getWarehouses(cityRef);

        res.json({
            message: 'Успішно',
            city: cityData,
            warehouses
        });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// POST /nova-poshta/citi/warehouses
router.post('/citi/warehouses', async (req, res) => {
    try {
        const { city, numberWarehouses, type } = req.body;
        const warehouses = await NovaPoshtaService.getWarehouses(city, numberWarehouses, type);

        res.json({ message: 'Успішно', warehouses });
    } catch (error) {
        console.error('Помилка:', error);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;
