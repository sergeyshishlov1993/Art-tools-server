const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { Product, Picture, Parameter, SubCategory, Category } = require('../../db');
const cache = require('../../utils/cache');

const LIST_ATTRS = [
    'product_id', 'slug', 'product_name', 'brand',
    'price', 'sale_price', 'discount', 'available',
    'bestseller', 'sale', 'sub_category_id', 'custom_product',
    'createdAt', 'updatedAt'
];

// GET /admin/products
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const offset = (page - 1) * limit;

        const { search, sub_category, category, brand, sale, bestseller, available, sort, price_min, price_max } = req.query;
        const where = {};

        if (search) {
            where[Op.or] = [
                { product_name: { [Op.iLike]: `%${search}%` } },
                { product_id: { [Op.iLike]: `%${search}%` } },
                { brand: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (sub_category) {
            where.sub_category_id = sub_category;
        } else if (category) {
            const subCats = await SubCategory.findAll({
                where: { category_id: category },
                attributes: ['sub_category_id']
            });
            where.sub_category_id = { [Op.in]: subCats.map(sc => sc.sub_category_id) };
        }

        if (brand) {
            const brands = Array.isArray(brand) ? brand : brand.split(',');
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

        if (sale === 'true') where.sale = 'true';
        if (bestseller === 'true') where.bestseller = 'true';
        if (available === 'true') where.available = 'true';
        if (available === 'false') where.available = 'false';

        const sortMap = {
            'price_asc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'ASC']],
            'price_desc': [[Sequelize.literal('CAST(price AS DECIMAL)'), 'DESC']],
            'name_asc': [['product_name', 'ASC']],
            'newest': [['createdAt', 'DESC']]
        };
        const order = sortMap[sort] || [['createdAt', 'DESC']];

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
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/products/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findOne({
            where: {
                [Op.or]: [
                    { product_id: id },
                    { slug: id }
                ]
            },
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

        res.json({ product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admin/products
router.post('/', async (req, res) => {
    try {
        const data = req.body;

        if (!data.product_id) {
            data.product_id = `CUSTOM_${Date.now()}`;
        }

        if (!data.slug && data.product_name) {
            data.slug = data.product_name
                .toLowerCase()
                .replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
                .replace(/^-|-$/g, '');
        }

        data.custom_product = true;
        const product = await Product.create(data);
        await cache.invalidateProducts();

        res.status(201).json({ product, message: 'Created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /admin/products/:id
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.update(req.body);
        await cache.invalidateProducts();
        await cache.del(`product:${product.slug}`);

        res.json({ product, message: 'Updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const slug = product.slug;
        await product.destroy();
        await cache.invalidateProducts();
        await cache.del(`product:${slug}`);

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /admin/products/:id/discount
router.put('/:id/discount', async (req, res) => {
    try {
        const { id } = req.params;
        const { discount, sale_price } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.update({ discount, sale_price });
        await cache.invalidateProducts();

        res.json({ product, message: 'Discount updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admin/products/:id/pictures
router.post('/:id/pictures', async (req, res) => {
    try {
        const { id } = req.params;
        const { pictures } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const pics = (Array.isArray(pictures) ? pictures : [pictures])
            .map(url => ({ product_id: id, pictures_name: url }));

        await Picture.bulkCreate(pics);
        await cache.del(`product:${product.slug}`);

        res.json({ message: 'Pictures added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/products/:id/pictures/:pictureId
router.delete('/:id/pictures/:pictureId', async (req, res) => {
    try {
        const { pictureId } = req.params;

        const deleted = await Picture.destroy({
            where: { id: pictureId }
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Picture not found' });
        }

        res.json({ message: 'Picture deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
