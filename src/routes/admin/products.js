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

function parsePageLimit(query) {
    const pageRaw = typeof query.page === 'string' ? query.page : '';
    const limitRaw = typeof query.limit === 'string' ? query.limit : '';
    const page = Math.max(parseInt(pageRaw || '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(limitRaw || '20', 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
}

function normalizeBrands(brandQueryValue) {
    if (!brandQueryValue) return null;

    if (Array.isArray(brandQueryValue)) {
        const value = brandQueryValue.map(String).map(s => s.trim()).filter(Boolean);
        return value.length > 0 ? value : null;
    }

    const asString = String(brandQueryValue);
    const value = asString.split(',').map(s => s.trim()).filter(Boolean);
    return value.length > 0 ? value : null;
}

function parseNumberOrNull(value) {
    if (value === null || value === undefined) return null;
    const parsed = Number.parseFloat(String(value));
    if (Number.isNaN(parsed)) return null;
    return parsed;
}

// GET /admin/products
router.get('/', async (req, res) => {
    try {
        const { page, limit, offset } = parsePageLimit(req.query);

        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const subCategory = typeof req.query.sub_category === 'string' ? req.query.sub_category.trim() : '';
        const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
        const sale = typeof req.query.sale === 'string' ? req.query.sale : '';
        const bestseller = typeof req.query.bestseller === 'string' ? req.query.bestseller : '';
        const available = typeof req.query.available === 'string' ? req.query.available : '';
        const sort = typeof req.query.sort === 'string' ? req.query.sort : '';
        const priceMin = parseNumberOrNull(req.query.price_min);
        const priceMax = parseNumberOrNull(req.query.price_max);
        const brands = normalizeBrands(req.query.brand);

        const where = {};

        if (search) {
            where[Op.or] = [
                { product_name: { [Op.iLike]: `%${search}%` } },
                { product_id: { [Op.iLike]: `%${search}%` } },
                { brand: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (subCategory) {
            where.sub_category_id = subCategory;
        } else if (category) {
            const subCats = await SubCategory.findAll({
                where: { category_id: category },
                attributes: ['sub_category_id'],
                raw: true
            });
            const ids = subCats.map(sc => sc.sub_category_id).filter(Boolean);
            where.sub_category_id = ids.length > 0 ? { [Op.in]: ids } : { [Op.in]: [] };
        }

        if (brands) {
            where.brand = { [Op.in]: brands };
        }

        if (priceMin !== null || priceMax !== null) {
            const andParts = [];

            if (priceMin !== null) {
                andParts.push(
                    Sequelize.literal(`CAST(price AS DECIMAL) >= ${priceMin}`)
                );
            }
            if (priceMax !== null) {
                andParts.push(
                    Sequelize.literal(`CAST(price AS DECIMAL) <= ${priceMax}`)
                );
            }

            if (andParts.length > 0) {
                where[Op.and] = andParts;
            }
        }

        if (sale === 'true') where.sale = 'true';
        if (bestseller === 'true') where.bestseller = 'true';
        if (available === 'true') where.available = 'true';
        if (available === 'false') where.available = 'false';

        const sortMap = {
            price_asc: [[Sequelize.literal('CAST(price AS DECIMAL)'), 'ASC']],
            price_desc: [[Sequelize.literal('CAST(price AS DECIMAL)'), 'DESC']],
            name_asc: [['product_name', 'ASC']],
            newest: [['createdAt', 'DESC']]
        };
        const order = Object.prototype.hasOwnProperty.call(sortMap, sort) ? sortMap[sort] : [['createdAt', 'DESC']];

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
            data.slug = String(data.product_name)
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