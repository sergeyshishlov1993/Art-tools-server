const { Router } = require('express');
const { Op, Sequelize } = require('sequelize');
const router = Router();
const {
    Product, Picture, Parameter, Review, ReviewResponse
} = require('../../db');
const { generateSlug } = require('../../utils/slugify');

// GET /admin/products - список з фільтрами
router.get('/', async (req, res) => {
    try {
        const {
            page = 1, limit = 20, search = '', sub_category,
            price_min, price_max, brands, special, attributes
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { available: 'true' };

        if (sub_category && sub_category !== 'undefined') {
            where.sub_category_id = sub_category;
        }
        if (search.trim()) {
            where.product_name = { [Op.iLike]: `%${search.trim()}%` };
        }
        if (price_min || price_max) {
            where.price = {};
            if (price_min) where.price[Op.gte] = +price_min;
            if (price_max) where.price[Op.lte] = +price_max;
        }
        if (brands) {
            const list = Array.isArray(brands) ? brands : [brands];
            if (list.length) where.brand = { [Op.in]: list };
        }
        if (special) {
            const list = Array.isArray(special) ? special : [special];
            if (list.includes('sale')) where.sale = 'true';
            if (list.includes('bestseller')) where.bestseller = 'true';
            if (list.includes('discount')) where.discount = { [Op.gt]: 0 };
        }
        if (attributes) {
            try {
                const attrs = JSON.parse(attributes);
                for (const [slugKey, values] of Object.entries(attrs)) {
                    if (values?.length > 0) {
                        where[Op.and] = (where[Op.and] || []).concat(
                            Sequelize.literal(`
                                EXISTS (
                                    SELECT 1 FROM parameter p 
                                    WHERE p.product_id = "Product".product_id 
                                    AND p.slug = '${slugKey}' 
                                    AND p.parameter_value IN (${values.map(v => `'${v}'`).join(',')})
                                )
                            `)
                        );
                    }
                }
            } catch (e) {}
        }

        const products = await Product.findAndCountAll({
            distinct: true,
            where,
            include: [{ model: Picture, as: 'pictures', limit: 1 }],
            offset,
            limit: parseInt(limit),
            order: [['price', 'ASC']]
        });

        res.json({
            products: products.rows,
            total: products.count,
            pages: Math.ceil(products.count / limit)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/products/:id
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { product_id: req.params.id },
            include: [
                { model: Picture, as: 'pictures' },
                { model: Parameter, as: 'params' },
                {
                    model: Review,
                    as: 'reviews',
                    include: [{ model: ReviewResponse, as: 'responses' }]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Not found' });
        }
        res.json({ product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/products/by-slug/:slug
router.get('/by-slug/:slug', async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { slug: req.params.slug },
            include: [
                { model: Picture, as: 'pictures' },
                { model: Parameter, as: 'params' },
                {
                    model: Review,
                    as: 'reviews',
                    include: [{ model: ReviewResponse, as: 'responses' }]
                }
            ]
        });

        if (!product) {
            return res.status(404).json({ message: 'Not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admin/products/add
router.post('/add', async (req, res) => {
    try {
        const { id: product_id, product_name, pictures, parameters, ...data } = req.body;
        const slug = generateSlug(product_name, product_id);

        await Product.create({
            product_id,
            slug,
            product_name,
            sub_category_id: data.sub_category_id,
            product_description: data.product_description,
            price: data.price,
            available: data.available,
            custom_product: true,
            brand: data.brand
        });

        if (pictures) {
            const pics = (Array.isArray(pictures) ? pictures : [pictures])
                .map(p => ({ product_id, pictures_name: p }));
            await Picture.bulkCreate(pics);
        }

        if (parameters) {
            const params = (Array.isArray(parameters) ? parameters : [parameters])
                .map(p => ({ product_id, parameter_name: p.name, parameter_value: p.value }));
            await Parameter.bulkCreate(params);
        }

        res.json({ message: 'Created', product_id, slug });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /admin/products/update/:id
router.put('/update/:id', async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.product_name) {
            data.slug = generateSlug(data.product_name, req.params.id);
        }

        const [count] = await Product.update(data, {
            where: { product_id: req.params.id }
        });

        count > 0
            ? res.json({ message: 'Updated' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /admin/products/update-discount/:id
router.put('/update-discount/:id', async (req, res) => {
    try {
        const [count] = await Product.update(req.body, {
            where: { product_id: req.params.id }
        });

        count > 0
            ? res.json({ message: 'Discount updated' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const count = await Product.destroy({
            where: { product_id: req.params.id }
        });

        count > 0
            ? res.json({ message: 'Deleted' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/products/destroy-by-brand
router.delete('/destroy-by-brand', async (req, res) => {
    try {
        if (!req.query.brand) {
            return res.status(400).json({ message: 'No brand' });
        }

        const count = await Product.destroy({
            where: { brand: req.query.brand }
        });
        res.json({ message: `Deleted ${count} products` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/products/:id/picture/:pictureId
router.delete('/:id/picture/:pictureId', async (req, res) => {
    try {
        const count = await Picture.destroy({
            where: { id: req.params.pictureId }
        });

        count > 0
            ? res.json({ message: 'Picture deleted' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === SLUGS ===

// POST /admin/products/generate-slugs
router.post('/generate-slugs', async (req, res) => {
    try {
        const products = await Product.findAll({
            where: { [Op.or]: [{ slug: null }, { slug: '' }] },
            raw: true
        });

        let updated = 0;
        for (const p of products) {
            const slug = generateSlug(p.product_name, p.product_id);
            if (slug) {
                await Product.update({ slug }, { where: { product_id: p.product_id } });
                updated++;
            }
        }

        res.json({ success: true, updated });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admin/products/check-slug
router.post('/check-slug', async (req, res) => {
    try {
        const { slug, product_id } = req.body;
        const where = { slug };
        if (product_id) where.product_id = { [Op.ne]: product_id };

        const exists = await Product.findOne({ where });
        res.json({ success: true, available: !exists });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /admin/products/regenerate-slug/:productId
router.put('/regenerate-slug/:productId', async (req, res) => {
    try {
        const product = await Product.findByPk(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Not found' });
        }

        const newSlug = generateSlug(product.product_name, product.product_id);
        await product.update({ slug: newSlug });

        res.json({ success: true, new_slug: newSlug });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
