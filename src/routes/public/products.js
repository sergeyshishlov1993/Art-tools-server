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
        const where = { sub_category_id: subCategoryId, available: 'true' };

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
            const brands = Array.isArray(brand) ? brand : String(brand).split(',');
            where.brand = { [Op.in]: brands };
        }

        if (sale === 'true') where.sale = 'true';
        if (bestseller === 'true') where.bestseller = 'true';
        if (discount === 'true') where.discount = { [Op.gt]: 0 };

        // ВИПРАВЛЕНО: Сортування
        const sortMap = {
            'price-asc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'ASC']],
            'price_asc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'ASC']],
            'price-desc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'DESC']],
            'price_desc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'DESC']],
            'name_asc': [['product_name', 'ASC']],
            'new': [['createdAt', 'DESC']],
            'newest': [['createdAt', 'DESC']],
            'popular': [
                [Sequelize.literal("CASE WHEN bestseller = 'true' THEN 0 ELSE 1 END"), 'ASC'],
                [Sequelize.literal("CASE WHEN sale = 'true' THEN 0 ELSE 1 END"), 'ASC'],
                ['createdAt', 'DESC']
            ]
        };
        const order = sortMap[sort] || sortMap['popular'];

        const attrKeys = Object.keys(attrFilters).filter((key) => !['page', 'limit'].includes(key));

        if (attrKeys.length > 0) {
            let productIds = null;

            for (const attrSlug of attrKeys) {
                const attrValueRaw = attrFilters[attrSlug];
                const attrValues = Array.isArray(attrValueRaw)
                    ? attrValueRaw
                    : String(attrValueRaw || '').split(',').filter(Boolean);

                const params = await Parameter.findAll({
                    where: {
                        slug: attrSlug,
                        param_value_slug: { [Op.in]: attrValues }
                    },
                    attributes: ['product_id'],
                    raw: true
                });

                const ids = params.map((p) => p.product_id);
                if (productIds === null) {
                    productIds = new Set(ids);
                } else {
                    const idsSet = new Set(ids);
                    productIds = new Set([...productIds].filter((id) => idsSet.has(id)));
                }
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
            where: { parent_id: categoryId },
            attributes: ['sub_category_id']
        });

        const subCategoryIds = subCategories.map((sc) => sc.sub_category_id);

        const { count, rows } = await Product.findAndCountAll({
            where: { sub_category_id: { [Op.in]: subCategoryIds }, available: 'true' },
            attributes: LIST_ATTRS,
            include: [{
                model: Picture,
                as: 'pictures',
                attributes: ['pictures_name'],
                limit: 1
            }],
            limit,
            offset,
            order: [
                [Sequelize.literal("CASE WHEN bestseller = 'true' THEN 0 ELSE 1 END"), 'ASC'],
                ['createdAt', 'DESC']
            ],
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

// GET /products - головний ендпоінт з фільтрами
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const {
            category,
            sub_category,
            brand,
            price_min,
            price_max,
            sale,
            bestseller,
            with_discount,
            sort,
            search,  // <-- ДОДАНО
            ...attrFilters
        } = req.query;

        const where = { available: 'true' };

        // ========== ПОШУК ========== //
        if (search) {
            const searchTerm = String(search).trim();
            if (searchTerm) {
                where[Op.or] = [
                    { product_name: { [Op.iLike]: `%${searchTerm}%` } },
                    { brand: { [Op.iLike]: `%${searchTerm}%` } },
                    { product_id: { [Op.iLike]: `%${searchTerm}%` } }
                ];
            }
        }

        // Фільтр по категорії
        if (sub_category) {
            const subCategories = String(sub_category).split(',').filter(Boolean);
            where.sub_category_id = { [Op.in]: subCategories };
        } else if (category) {
            const subCategories = await SubCategory.findAll({
                where: { parent_id: category },
                attributes: ['sub_category_id'],
                raw: true
            });
            const subCategoryIds = subCategories.map(sc => sc.sub_category_id);
            if (subCategoryIds.length > 0) {
                where.sub_category_id = { [Op.in]: subCategoryIds };
            }
        }

        // Фільтр по бренду
        if (brand) {
            const brands = String(brand).split(',').filter(Boolean);
            where.brand = { [Op.in]: brands };
        }

        // Фільтр по ціні
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

        // Спеціальні фільтри
        if (sale === 'true') where.sale = 'true';
        if (bestseller === 'true') where.bestseller = 'true';
        if (with_discount === 'true') where.discount = { [Op.gt]: 0 };

        // Фільтр по атрибутах
        const attrKeys = Object.keys(attrFilters).filter(key => !['page', 'limit'].includes(key));

        if (attrKeys.length > 0) {
            let productIds = null;

            for (const attrSlug of attrKeys) {
                const attrValues = String(attrFilters[attrSlug] || '').split(',').filter(Boolean);

                const params = await Parameter.findAll({
                    where: {
                        slug: attrSlug,
                        param_value_slug: { [Op.in]: attrValues }
                    },
                    attributes: ['product_id'],
                    raw: true
                });

                const ids = params.map(p => p.product_id);

                if (productIds === null) {
                    productIds = new Set(ids);
                } else {
                    const idsSet = new Set(ids);
                    productIds = new Set([...productIds].filter(id => idsSet.has(id)));
                }
            }

            if (productIds !== null && productIds.size > 0) {
                where.product_id = { [Op.in]: [...productIds] };
            } else if (productIds !== null) {
                return res.json({
                    products: [],
                    pagination: { page, limit, total: 0, pages: 0 }
                });
            }
        }

        // Сортування (для пошуку - по релевантності)
        let order;
        if (search && !sort) {
            // При пошуку сортуємо по релевантності (точне співпадіння першим)
            const searchTerm = String(search).trim();
            order = [
                [Sequelize.literal(`CASE WHEN product_name ILIKE '${searchTerm}%' THEN 0 WHEN product_name ILIKE '%${searchTerm}%' THEN 1 ELSE 2 END`), 'ASC'],
                [Sequelize.literal("CASE WHEN bestseller = 'true' THEN 0 ELSE 1 END"), 'ASC'],
                ['createdAt', 'DESC']
            ];
        } else {
            const sortMap = {
                'price-asc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'ASC']],
                'price-desc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'DESC']],
                'new': [['createdAt', 'DESC']],
                'popular': [
                    [Sequelize.literal("CASE WHEN bestseller = 'true' THEN 0 ELSE 1 END"), 'ASC'],
                    [Sequelize.literal("CASE WHEN sale = 'true' THEN 0 ELSE 1 END"), 'ASC'],
                    ['createdAt', 'DESC']
                ]
            };
            order = sortMap[sort] || sortMap['popular'];
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

        res.json({
            products: rows,
            pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
        });
    } catch (error) {
        console.error('Products error:', error);
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
            where: { slug, available: 'true' },
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
