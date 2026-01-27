const { Router } = require('express');
const router = Router();
const { Op } = require('sequelize');
const { Product, Picture, Parameter, SubCategory, Category, CategoryFilter } = require('../../db');

// GET /products
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            limit,
            offset,
            include: [{ model: Picture, as: 'pictures' }],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            products: rows,
            pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /products/sub-category/:id
router.get('/sub-category/:subCategoryId', async (req, res) => {
    try {
        const { subCategoryId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Отримуємо параметри фільтрації
        const { minPrice, maxPrice, brand, sale, bestseller, discount, sort, ...attrFilters } = req.query;

        // Будуємо WHERE умову
        const where = { sub_category_id: subCategoryId };

        // Фільтр по ціні
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
        }

        // Фільтр по бренду (може бути масив)
        if (brand) {
            const brands = Array.isArray(brand) ? brand : brand.split(',');
            where.brand = { [Op.in]: brands };
        }

        // Фільтр по акції
        if (sale === 'true') {
            where.sale = 'true';
        }

        // Фільтр по бестселеру
        if (bestseller === 'true') {
            where.bestseller = 'true';
        }

        // Фільтр по знижці
        if (discount === 'true') {
            where.discount = { [Op.gt]: 0 };
        }

        // Сортування
        let order = [['createdAt', 'DESC']];
        if (sort) {
            switch (sort) {
                case 'price_asc':
                    order = [['price', 'ASC']];
                    break;
                case 'price_desc':
                    order = [['price', 'DESC']];
                    break;
                case 'name_asc':
                    order = [['product_name', 'ASC']];
                    break;
                case 'name_desc':
                    order = [['product_name', 'DESC']];
                    break;
                case 'newest':
                    order = [['createdAt', 'DESC']];
                    break;
            }
        }

        // Базовий запит
        let queryOptions = {
            where,
            limit,
            offset,
            include: [
                { model: Picture, as: 'pictures' },
                { model: Parameter, as: 'params' }
            ],
            order,
            distinct: true
        };

        // Фільтрація по атрибутах (параметрах товару)
        // Приклад: ?dvygun=Безщітковий&napruga=20В
        const attrKeys = Object.keys(attrFilters).filter(k =>
            !['page', 'limit'].includes(k)
        );

        let productIds = null;

        if (attrKeys.length > 0) {
            // Знаходимо product_id які мають всі потрібні атрибути
            for (const attrSlug of attrKeys) {
                const attrValues = Array.isArray(attrFilters[attrSlug])
                    ? attrFilters[attrSlug]
                    : attrFilters[attrSlug].split(',');

                const params = await Parameter.findAll({
                    where: {
                        param_slug: attrSlug,
                        param_value: { [Op.in]: attrValues }
                    },
                    attributes: ['product_id'],
                    raw: true
                });

                const ids = params.map(p => p.product_id);

                if (productIds === null) {
                    productIds = new Set(ids);
                } else {
                    productIds = new Set([...productIds].filter(id => ids.includes(id)));
                }
            }

            // Додаємо фільтр по product_id
            if (productIds !== null) {
                where.product_id = { [Op.in]: [...productIds] };
            }
        }

        const { count, rows } = await Product.findAndCountAll(queryOptions);

        // Отримуємо фільтри для категорії
        const filters = await CategoryFilter.findOne({
            where: { sub_category_id: subCategoryId }
        });

        res.json({
            products: rows,
            filters: filters?.filters_data || null,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            },
            applied_filters: {
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
                brand: brand || null,
                sale: sale || null,
                bestseller: bestseller || null,
                discount: discount || null,
                sort: sort || null,
                attributes: attrKeys.length > 0 ? attrFilters : null
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /products/:slug
router.get('/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { slug: req.params.slug },
            include: [
                { model: Picture, as: 'pictures' },
                { model: Parameter, as: 'params' }
            ]
        });

        if (!product) return res.status(404).json({ message: 'Not found' });
        res.json({ product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
