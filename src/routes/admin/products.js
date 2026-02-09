const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Product, Picture, Parameter, SubCategory, Category, Order } = require('../../db');
const cache = require('../../utils/cache');

// GET all products
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const search = req.query.search || '';
        const category = req.query.category || '';
        const sub_category = req.query.sub_category || '';
        const brand = req.query.brand || '';
        const available = req.query.available || '';
        const sale = req.query.sale || '';
        const bestseller = req.query.bestseller || '';
        const sort = req.query.sort || 'newest';

        const where = {};

        // Пошук
        if (search) {
            where[Op.or] = [
                { product_name: { [Op.iLike]: `%${search}%` } },
                { product_id: { [Op.iLike]: `%${search}%` } },
                { brand: { [Op.iLike]: `%${search}%` } }
            ];
        }

        // Фільтр по бренду
        if (brand) {
            where.brand = brand;
        }

        // Фільтр по категорії
        if (sub_category) {
            where.sub_category_id = sub_category;
        } else if (category) {
            const subCats = await SubCategory.findAll({
                where: { parent_id: category },
                attributes: ['sub_category_id'],
                raw: true
            });
            const ids = subCats.map(sc => sc.sub_category_id);
            if (ids.length > 0) {
                where.sub_category_id = { [Op.in]: ids };
            }
        }

        if (available) where.available = available;
        if (sale === 'true') where.sale = 'true';
        if (bestseller === 'true') where.bestseller = 'true';

        // Сортування
        let order = [['createdAt', 'DESC']];
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
            case 'newest':
            default:
                order = [['createdAt', 'DESC']];
        }

        const { count, rows } = await Product.findAndCountAll({
            where,
            include: [
                { model: Picture, as: 'pictures', attributes: ['id', 'pictures_name'] },
                { model: Parameter, as: 'params' },
                {
                    model: SubCategory,
                    as: 'subCategory',
                    include: [{ model: Category, as: 'category' }]
                }
            ],
            limit,
            offset,
            order,
            distinct: true
        });

        res.json({
            products: rows,
            pagination: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error('GET products error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({
            where: {
                [Op.or]: [
                    { product_id: req.params.id },
                    { slug: req.params.id }
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
        console.error('GET product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST create product
router.post('/', async (req, res) => {
    try {
        const { pictures, parameters, ...productData } = req.body;

        console.log('📥 Creating product with parameters:', parameters);

        if (!productData.product_id) {
            productData.product_id = `CUSTOM_${Date.now()}`;
        }

        if (!productData.slug && productData.product_name) {
            productData.slug = String(productData.product_name)
                    .toLowerCase()
                    .replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
                    .replace(/^-|-$/g, '')
                + '-' + productData.product_id.toLowerCase();
        }

        productData.custom_product = true;

        const product = await Product.create(productData);

        // Додаємо фото
        if (pictures && pictures.length > 0) {
            await Picture.bulkCreate(pictures.map(url => ({
                product_id: product.product_id,
                pictures_name: url
            })));
        }

        // Додаємо параметри
        if (parameters && parameters.length > 0) {
            await Parameter.bulkCreate(parameters.map(param => ({
                product_id: product.product_id,
                parameter_name: param.name,
                parameter_value: param.value,
                slug: param.name.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '-'),
                param_value_slug: param.value.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
            })));
            console.log('✅ Parameters created:', parameters.length);
        }

        const fullProduct = await Product.findByPk(product.product_id, {
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

        await cache.invalidateProducts();

        res.status(201).json({ product: fullProduct, message: 'Created' });
    } catch (error) {
        console.error('❌ Create product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { parameters, ...productData } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.update(productData);

        // Оновлюємо параметри
        if (parameters !== undefined) {
            await Parameter.destroy({ where: { product_id: id } });

            if (parameters.length > 0) {
                await Parameter.bulkCreate(parameters.map(param => ({
                    product_id: id,
                    parameter_name: param.name,
                    parameter_value: param.value,
                    slug: param.name.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '-'),
                    param_value_slug: param.value.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '-')
                })));
            }
        }

        const fullProduct = await Product.findByPk(id, {
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

        await cache.invalidateProducts();

        res.json({ product: fullProduct, message: 'Updated' });
    } catch (error) {
        console.error('❌ Update product error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await Picture.destroy({ where: { product_id: id } });
        await Parameter.destroy({ where: { product_id: id } });
        await product.destroy();

        await cache.invalidateProducts();

        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT discount
router.put('/:id/discount', async (req, res) => {
    try {
        const { id } = req.params;
        const { discount, sale_price } = req.body;

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await product.update({ discount, sale_price });

        const fullProduct = await Product.findByPk(id, {
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

        await cache.invalidateProducts();

        res.json({ product: fullProduct, message: 'Discount updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST add pictures
router.post('/:id/pictures', async (req, res) => {
    try {
        const { id } = req.params;
        const { pictures, urls } = req.body;  // підтримуємо обидва варіанти

        const product = await Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const picUrls = pictures || urls || [];

        if (picUrls.length > 0) {
            await Picture.bulkCreate(picUrls.map(url => ({
                product_id: id,
                pictures_name: url
            })));
        }

        await cache.invalidateProducts();

        res.json({ message: 'Pictures added' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE picture
router.delete('/:id/pictures/:pictureId', async (req, res) => {
    try {
        const { pictureId } = req.params;

        await Picture.destroy({ where: { id: pictureId } });

        await cache.invalidateProducts();

        res.json({ message: 'Picture deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
