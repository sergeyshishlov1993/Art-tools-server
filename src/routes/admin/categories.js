const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Product, Category, SubCategory } = require('../../db');

const FilterService = require('../../services/filterService');

const slugify = (text) => text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

// === ДОПОМІЖНІ ФУНКЦІЇ ===

async function getSupplierPrefixes() {
    const [results] = await Product.sequelize.query(`
        SELECT DISTINCT supplier_prefix 
        FROM products 
        WHERE supplier_prefix IS NOT NULL
    `);
    return results.map(r => r.supplier_prefix);
}

async function buildSupplierCategoryCondition() {
    const prefixes = await getSupplierPrefixes();
    const conditions = ["sub_category_id LIKE 'DEFAULT_%'"];
    for (const prefix of prefixes) {
        conditions.push(`sub_category_id LIKE '${prefix}_%'`);
    }
    return conditions.join(' OR ');
}

async function buildMyCategoryCondition() {
    const prefixes = await getSupplierPrefixes();
    const conditions = ["sub_category_id NOT LIKE 'DEFAULT_%'"];
    for (const prefix of prefixes) {
        conditions.push(`sub_category_id NOT LIKE '${prefix}_%'`);
    }
    return conditions.join(' AND ');
}

// ========================================
// === СТАТИЧНІ GET РОУТИ (ПЕРШИМИ!) ===
// ========================================

router.get('/overview', async (req, res) => {
    try {
        const myCondition = await buildMyCategoryCondition();
        const [myCategories] = await Product.sequelize.query(`
            SELECT 
                c.id as category_id,
                c.category_name,
                COUNT(DISTINCT sc.sub_category_id) as subcategories_count
            FROM category c
            LEFT JOIN sub_category sc ON sc.parent_id = c.id
            WHERE ${myCondition.replace(/sub_category_id/g, 'c.id')}
            GROUP BY c.id, c.category_name
            ORDER BY c.category_name
        `);

        const supplierCondition = await buildSupplierCategoryCondition();
        const [productStats] = await Product.sequelize.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN NOT (${supplierCondition}) THEN 1 END) as mapped_products,
                COUNT(CASE WHEN ${supplierCondition} THEN 1 END) as unmapped_products
            FROM products
        `);

        const total = +productStats[0].total_products || 1;
        const mapped = +productStats[0].mapped_products || 0;

        res.json({
            success: true,
            my: { categories: myCategories },
            stats: {
                total,
                mapped,
                unmapped: +productStats[0].unmapped_products || 0,
                percent_mapped: ((mapped / total) * 100).toFixed(1) + '%'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/unmapped', async (req, res) => {
    try {
        const supplierCondition = await buildSupplierCategoryCondition();
        const myCondition = await buildMyCategoryCondition();

        const [supplierSubCats] = await Product.sequelize.query(`
            SELECT 
                sc.sub_category_id as supplier_sub_category_id,
                sc.sub_category_name as supplier_sub_category_name,
                COUNT(p.product_id) as product_count
            FROM sub_category sc
            INNER JOIN products p ON p.sub_category_id = sc.sub_category_id
            WHERE ${supplierCondition.replace(/sub_category_id/g, 'sc.sub_category_id')}
            GROUP BY sc.sub_category_id, sc.sub_category_name
            HAVING COUNT(p.product_id) > 0
            ORDER BY COUNT(p.product_id) DESC
        `);

        const [mySubCategories] = await Product.sequelize.query(`
            SELECT 
                sc.sub_category_id as id,
                sc.sub_category_name as name,
                c.category_name as parent_name
            FROM sub_category sc
            LEFT JOIN category c ON c.id = sc.parent_id
            WHERE ${myCondition.replace(/sub_category_id/g, 'sc.sub_category_id')}
            ORDER BY c.category_name, sc.sub_category_name
        `);

        const totalProducts = supplierSubCats.reduce((sum, r) => sum + (+r.product_count || 0), 0);

        res.json({
            total_unmapped: supplierSubCats.length,
            total_products: totalProducts,
            categories: supplierSubCats,
            my_categories: mySubCategories
        });
    } catch (error) {
        console.error('Unmapped categories error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/mapped', async (req, res) => {
    try {
        const myCondition = await buildMyCategoryCondition();

        const [mappedCategories] = await Product.sequelize.query(`
            SELECT 
                sc.sub_category_id,
                sc.sub_category_name,
                c.id as category_id,
                c.category_name,
                COUNT(p.product_id) as product_count
            FROM sub_category sc
            LEFT JOIN category c ON c.id = sc.parent_id
            LEFT JOIN products p ON p.sub_category_id = sc.sub_category_id
            WHERE ${myCondition.replace(/sub_category_id/g, 'sc.sub_category_id')}
            GROUP BY sc.sub_category_id, sc.sub_category_name, c.id, c.category_name
            ORDER BY c.category_name, sc.sub_category_name
        `);

        res.json({
            success: true,
            categories: mappedCategories
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/suppliers', async (req, res) => {
    try {
        const [suppliers] = await Product.sequelize.query(`
            SELECT 
                supplier_prefix,
                COUNT(*) as product_count
            FROM products
            WHERE supplier_prefix IS NOT NULL
            GROUP BY supplier_prefix
            ORDER BY supplier_prefix
        `);

        res.json({
            success: true,
            suppliers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// === POST РОУТИ ===
// ========================================

router.post('/map', async (req, res) => {
    try {
        const { from_sub_category_id, to_sub_category_id } = req.body;

        if (!from_sub_category_id || !to_sub_category_id) {
            return res.status(400).json({
                error: 'from_sub_category_id and to_sub_category_id required'
            });
        }

        const targetCat = await SubCategory.findByPk(to_sub_category_id);
        if (!targetCat) {
            return res.status(404).json({ error: 'Target category not found' });
        }

        const [updatedCount] = await Product.update(
            { sub_category_id: to_sub_category_id, is_manual_category: true },
            { where: { sub_category_id: from_sub_category_id } }
        );

        if (updatedCount > 0) {
            await SubCategory.destroy({ where: { sub_category_id: from_sub_category_id } });
        }

        await FilterService.recalcForCategory(to_sub_category_id);

        res.json({
            success: true,
            message: 'Mapping saved',
            moved_products: updatedCount,
            from: from_sub_category_id,
            to: to_sub_category_id
        });
    } catch (error) {
        console.error('Map category error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/remap', async (req, res) => {
    try {
        const { from_sub_category_id, to_sub_category_id, product_ids } = req.body;

        if (!to_sub_category_id) {
            return res.status(400).json({ error: 'to_sub_category_id required' });
        }

        const targetCat = await SubCategory.findByPk(to_sub_category_id);
        if (!targetCat) {
            return res.status(404).json({ error: 'Target category not found' });
        }

        let whereClause = {};

        if (product_ids && Array.isArray(product_ids) && product_ids.length > 0) {
            whereClause = { product_id: { [Op.in]: product_ids } };
        } else if (from_sub_category_id) {
            whereClause = { sub_category_id: from_sub_category_id };
        } else {
            return res.status(400).json({
                error: 'Either from_sub_category_id or product_ids required'
            });
        }

        const [updatedCount] = await Product.update(
            { sub_category_id: to_sub_category_id, is_manual_category: true },
            { where: whereClause }
        );

        await FilterService.recalcForCategory(to_sub_category_id);
        if (from_sub_category_id) {
            await FilterService.recalcForCategory(from_sub_category_id);
        }

        res.json({
            success: true,
            message: 'Products remapped',
            moved_products: updatedCount,
            from: from_sub_category_id || 'specific products',
            to: to_sub_category_id
        });
    } catch (error) {
        console.error('Remap error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/category', async (req, res) => {
    try {
        const { name, id } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Name required' });
        }

        const catId = id || slugify(name);
        const [cat, created] = await Category.findOrCreate({
            where: { id: catId },
            defaults: { category_name: name }
        });

        if (!created) {
            return res.status(400).json({ message: 'Already exists', id: catId });
        }

        res.json({ success: true, category: cat });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/subcategory', async (req, res) => {
    try {
        const { name, parentId, id, picture } = req.body;

        if (!name || !parentId) {
            return res.status(400).json({ message: 'Name and parentId required' });
        }

        const parent = await Category.findByPk(parentId);
        if (!parent) {
            return res.status(404).json({ message: 'Parent not found' });
        }

        const subId = id || slugify(name);
        const [sub, created] = await SubCategory.findOrCreate({
            where: { sub_category_id: subId },
            defaults: {
                sub_category_name: name,
                parent_id: parentId,
                pictures: picture || null
            }
        });

        if (!created) {
            return res.status(400).json({ message: 'Already exists', id: subId });
        }

        res.json({ success: true, subCategory: sub });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// === PUT/DELETE РОУТИ ===
// ========================================

router.put('/category/:id', async (req, res) => {
    try {
        const [updated] = await Category.update(
            { category_name: req.body.name },
            { where: { id: req.params.id } }
        );
        updated ? res.json({ message: 'Updated' }) : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/category/:id', async (req, res) => {
    try {
        const deleted = await Category.destroy({ where: { id: req.params.id } });
        deleted ? res.json({ message: 'Deleted' }) : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/subcategory/:id', async (req, res) => {
    try {
        const [updated] = await SubCategory.update(req.body, {
            where: { sub_category_id: req.params.id }
        });
        updated ? res.json({ message: 'Updated' }) : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/subcategory/:id', async (req, res) => {
    try {
        const deleted = await SubCategory.destroy({
            where: { sub_category_id: req.params.id }
        });
        deleted ? res.json({ message: 'Deleted' }) : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// === ДИНАМІЧНИЙ РОУТ (ОСТАННІЙ!) ===
// ========================================

router.get('/:subCategoryId/products', async (req, res) => {
    try {
        const { subCategoryId } = req.params;
        const { page = 1, limit = 50, search } = req.query;

        const whereClause = { sub_category_id: subCategoryId };

        if (search && search.trim()) {
            whereClause[Op.or] = [
                { product_name: { [Op.iLike]: `%${search}%` } },
                { product_id: { [Op.iLike]: `%${search}%` } },
                { brand: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Product.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['product_name', 'ASC']],
            attributes: ['product_id', 'product_name', 'price', 'supplier_prefix', 'is_manual_category', 'available', 'brand']
        });

        res.json({
            success: true,
            total: count,
            page: parseInt(page),
            pages: Math.ceil(count / parseInt(limit)),
            products: rows.map(p => ({
                product_id: p.product_id,
                name: p.product_name,
                price: p.price,
                supplier_prefix: p.supplier_prefix,
                is_manual_category: p.is_manual_category,
                available: p.available,
                brand: p.brand
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
