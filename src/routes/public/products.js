const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { Product, Picture, Parameter, CategoryFilter, SubCategory, Category } = require('../../db');
const cache = require('../../utils/cache');

const LIST_ATTRS = [
    'product_id', 'slug', 'product_name', 'brand',
    'price', 'sale_price', 'discount', 'available',
    'bestseller', 'sale', 'sub_category_id'
];

// GET /products/sub-category/:subCategoryId
router.get('/sub-category/:subCategoryId', async (req, res) => {
    try {
        const { subCategoryId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const cacheKey = `products:${subCategoryId}:${JSON.stringify(req.query)}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(cached);

        const { price_min, price_max, brand, sale, bestseller, discount, sort, ...attrFilters } = req.query;
        const where = { sub_category_id: subCategoryId };

        // Фільтр по ціні (price як string - потрібен CAST)
        if (price_min || price_max) {
            where[Op.and] = where[Op.and] || [];
            if (price_min) {
                where[Op.and].push(
                    Sequelize.literal(`CAST(price AS DECIMAL) >= ${parseFloat(price_min)}`)
                );
            }
            if (price_max) {
                where[Op.and].push(
                    Sequelize.literal(`CAST(price AS DECIMAL) <= ${parseFloat(price_max)}`)
                );
            }
        }

        if (brand) {
            const brands = Array.isArray(brand) ? brand : brand.split(',');
            where.brand = { [Op.in]: brands };
        }

        if (sale === 'true') where.sale = 'true';
        if (bestseller === 'true') where.bestseller = 'true';
        if (discount === 'true') where.discount = { [Op.gt]: 0 };

        const sortMap = {
            'price_asc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'ASC']],
            'price_desc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'DESC']],
            'name_asc': [['product_name', 'ASC']],
            'newest': [['createdAt', 'DESC']]
        };
        const order = sortMap[sort] || [['createdAt', 'DESC']];

        // Фільтрація по атрибутах
        const attrKeys = Object.keys(attrFilters).filter(k =>
            !['page', 'limit'].includes(k)
        );

        if (attrKeys.length > 0) {
            let productIds = null;

            for (const attrSlug of attrKeys) {
                const attrValues = Array.isArray(attrFilters[attrSlug])
                    ? attrFilters[attrSlug]
                    : attrFilters[attrSlug].split(',');

                const params = await Parameter.findAll({
                    where: {
                        slug: attrSlug,
                        param_value_slug: { [Op.in]: attrValues }
                    },
                    attributes: ['product_id'],
                    raw: true
                });

                const ids = params.map(p => p.product_id);
                productIds = productIds === null
                    ? new Set(ids)
                    : new Set([...productIds].filter(id => ids.includes(id)));
            }

            if (productIds !== null && productIds.size > 0) {
                where.product_id = { [Op.in]: [...productIds] };
            } else if (productIds !== null) {
                return res.json({
                    products: [],
                    filters: null,
                    pagination: { page, limit, total: 0, pages: 0 }
                });
            }
        }

        const { count, rows } = await Product.findAndCountAll({
            where,
            attributes: LIST_ATTRS,
            include: [{
                model: Picture,
                as: 'pictures',
                attributes: ['pictures_name'],
                limit: 1
            }],
            limit,
            offset,
            order,
            distinct: true
        });

        // Фільтри з кешу
        const filtersCacheKey = `filters:${subCategoryId}`;
        let filters = await cache.get(filtersCacheKey);

        if (!filters) {
            const categoryFilters = await CategoryFilter.findOne({
                where: { sub_category_id: subCategoryId },
                attributes: ['filters_data']
            });
            filters = categoryFilters?.filters_data || null;
            if (filters) await cache.set(filtersCacheKey, filters, 3600);
        }

        const response = {
            products: rows,
            filters,
            pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
        };

        await cache.set(cacheKey, response, 300);
        res.json(response);
    } catch (error) {
        console.error('Products error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /products/category/:categoryId
router.get('/category/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const cacheKey = `products:cat:${categoryId}:${page}:${limit}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(cached);

        const subCategories = await SubCategory.findAll({
            where: { category_id: categoryId },
            attributes: ['sub_category_id']
        });

        const subCategoryIds = subCategories.map(sc => sc.sub_category_id);

        const { count, rows } = await Product.findAndCountAll({
            where: { sub_category_id: { [Op.in]: subCategoryIds } },
            attributes: LIST_ATTRS,
            include: [{
                model: Picture,
                as: 'pictures',
                attributes: ['pictures_name'],
                limit: 1
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true
        });

        const response = {
            products: rows,
            pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
        };

        await cache.set(cacheKey, response, 300);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const { count, rows } = await Product.findAndCountAll({
            attributes: LIST_ATTRS,
            include: [{
                model: Picture,
                as: 'pictures',
                attributes: ['pictures_name'],
                limit: 1
            }],
            limit,
            offset,
            order: [['createdAt', 'DESC']],
            distinct: true
        });

        res.json({
            products: rows,
            pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /products/:slug - один продукт
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const cacheKey = `product:${slug}`;
        const cached = await cache.get(cacheKey);
        if (cached) return res.json(cached);

        const product = await Product.findOne({
            where: { slug },
            include: [
                { model: Picture, as: 'pictures' },
                { model: Parameter, as: 'params' },
                {
                    model: SubCategory,
                    as: 'subCategory',
                    include: [{ model: Category, as: 'category' }]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const response = { product };
        await cache.set(cacheKey, response, 600);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
