const { Router } = require('express');
const { Op } = require('sequelize');
const router = Router();
const { Product, Category, SubCategory, CategoryMapping } = require('../../db');

const slugify = (text) => text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

// GET /admin/categories/overview
router.get('/overview', async (req, res) => {
    try {
        const [myCategories] = await Product.sequelize.query(`
            SELECT 
                c.id as category_id,
                c.category_name,
                COUNT(DISTINCT sc.sub_category_id) as subcategories_count
            FROM category c
            LEFT JOIN sub_category sc ON sc.parent_id = c.id
            WHERE c.id NOT LIKE 'DEFAULT%' AND c.id NOT LIKE 'PROCRAFT%'
            GROUP BY c.id, c.category_name
            ORDER BY c.category_name
        `);

        const [productStats] = await Product.sequelize.query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(CASE WHEN sub_category_id NOT LIKE 'DEFAULT%' AND sub_category_id NOT LIKE 'PROCRAFT%' THEN 1 END) as mapped_products,
                COUNT(CASE WHEN sub_category_id LIKE 'DEFAULT%' OR sub_category_id LIKE 'PROCRAFT%' THEN 1 END) as unmapped_products
            FROM products
        `);

        res.json({
            success: true,
            my: { categories: myCategories },
            stats: {
                total: +productStats[0].total_products,
                mapped: +productStats[0].mapped_products,
                unmapped: +productStats[0].unmapped_products,
                percent_mapped: ((+productStats[0].mapped_products / +productStats[0].total_products) * 100).toFixed(1) + '%'
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/categories/my-catalogue
router.get('/my-catalogue', async (req, res) => {
    try {
        const [categories] = await Product.sequelize.query(`
            SELECT 
                c.id,
                c.category_name,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', sc.sub_category_id,
                            'name', sc.sub_category_name,
                            'picture', sc.pictures,
                            'products_count', COALESCE(p.cnt, 0)
                        ) ORDER BY sc.sub_category_name
                    ) FILTER (WHERE sc.sub_category_id IS NOT NULL),
                    '[]'
                ) as subcategories,
                COALESCE(SUM(p.cnt), 0) as total_products
            FROM category c
            LEFT JOIN sub_category sc ON sc.parent_id = c.id
            LEFT JOIN (
                SELECT sub_category_id, COUNT(*) as cnt 
                FROM products 
                GROUP BY sub_category_id
            ) p ON p.sub_category_id = sc.sub_category_id
            WHERE c.id NOT LIKE 'DEFAULT%' AND c.id NOT LIKE 'PROCRAFT%'
            GROUP BY c.id, c.category_name
            ORDER BY c.category_name
        `);

        res.json({
            success: true,
            total_categories: categories.length,
            total_products: categories.reduce((sum, c) => sum + (+c.total_products || 0), 0),
            categories
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/categories/active
router.get('/active', async (req, res) => {
    try {
        const [subCats] = await Product.sequelize.query(`
            SELECT DISTINCT 
                sc.sub_category_id, 
                sc.sub_category_name, 
                sc.parent_id, 
                COUNT(p.product_id) as product_count
            FROM sub_category sc
            INNER JOIN products p ON p.sub_category_id = sc.sub_category_id
            WHERE p.available = 'true'
            GROUP BY sc.sub_category_id, sc.sub_category_name, sc.parent_id
            HAVING COUNT(p.product_id) > 0
        `);

        const parentIds = [...new Set(subCats.map(sc => sc.parent_id).filter(Boolean))];
        const cats = parentIds.length
            ? await Category.findAll({ where: { id: parentIds }, raw: true })
            : [];

        res.json({ success: true, categories: cats, subcategories: subCats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/categories/sub-category
router.get('/sub-category', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
        const category = await Category.findAll();
        const subCategory = await SubCategory.findAndCountAll({
            distinct: true,
            offset: (page - 1) * limit,
            limit: parseInt(limit)
        });

        res.json({
            category,
            subCategory: subCategory.rows,
            total: subCategory.count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /admin/categories/unmapped
// GET /admin/categories/unmapped
router.get('/unmapped', async (req, res) => {
    try {
        // Знаходимо всі підкатегорії постачальників
        const supplierSubCats = await SubCategory.findAll({
            where: {
                [Op.or]: [
                    { sub_category_id: { [Op.like]: 'DEFAULT_%' } },
                    { sub_category_id: { [Op.like]: 'PROCRAFT_%' } }
                ]
            },
            raw: true
        });

        const result = [];
        for (const subCat of supplierSubCats) {
            const productCount = await Product.count({
                where: { sub_category_id: subCat.sub_category_id }
            });

            if (productCount > 0) {
                result.push({
                    supplier_sub_category_id: subCat.sub_category_id,
                    supplier_sub_category_name: subCat.sub_category_name,
                    product_count: productCount
                });
            }
        }

        result.sort((a, b) => b.product_count - a.product_count);

        const [mySubCategories] = await Product.sequelize.query(`
            SELECT 
                sc.sub_category_id as id,
                sc.sub_category_name as name,
                c.category_name as parent_name
            FROM sub_category sc
            LEFT JOIN category c ON c.id = sc.parent_id
            WHERE sc.sub_category_id NOT LIKE 'DEFAULT_%'
              AND sc.sub_category_id NOT LIKE 'PROCRAFT_%'
            ORDER BY c.category_name, sc.sub_category_name
        `);

        res.json({
            total_unmapped: result.length,
            total_products: result.reduce((sum, r) => sum + r.product_count, 0),
            categories: result,
            my_categories: mySubCategories
        });

    } catch (error) {
        console.error('Unmapped categories error:', error);
        res.status(500).json({ error: error.message });
    }
});


// POST /admin/categories/map
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
            {
                sub_category_id: to_sub_category_id,
                is_manual_category: true
            },
            { where: { sub_category_id: from_sub_category_id } }
        );

        if (updatedCount > 0) {
            await SubCategory.destroy({
                where: { sub_category_id: from_sub_category_id }
            });

            const parentMatch = from_sub_category_id.match(/^([A-Z]+)_/);
            if (parentMatch) {
                const prefix = parentMatch[1];
                const parentId = from_sub_category_id.replace('_SUBCAT_', '_CAT_').replace('_ROOT', '');

                const siblingCount = await SubCategory.count({
                    where: { parent_id: { [Op.like]: `${prefix}_CAT_%` } }
                });

                if (siblingCount === 0) {
                    await Category.destroy({
                        where: { id: { [Op.like]: `${prefix}_CAT_%` } }
                    });
                }
            }
        }

        const FilterService = require('../../services/filterService');
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

// POST /admin/categories/category
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

// PUT /admin/categories/category/:id
router.put('/category/:id', async (req, res) => {
    try {
        const [updated] = await Category.update(
            { category_name: req.body.name },
            { where: { id: req.params.id } }
        );

        updated
            ? res.json({ message: 'Updated' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/categories/category/:id
router.delete('/category/:id', async (req, res) => {
    try {
        const deleted = await Category.destroy({ where: { id: req.params.id } });

        deleted
            ? res.json({ message: 'Deleted' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /admin/categories/subcategory
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

// PUT /admin/categories/subcategory/:id
router.put('/subcategory/:id', async (req, res) => {
    try {
        const [updated] = await SubCategory.update(req.body, {
            where: { sub_category_id: req.params.id }
        });

        updated
            ? res.json({ message: 'Updated' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /admin/categories/subcategory/:id
router.delete('/subcategory/:id', async (req, res) => {
    try {
        const deleted = await SubCategory.destroy({
            where: { sub_category_id: req.params.id }
        });

        deleted
            ? res.json({ message: 'Deleted' })
            : res.status(404).json({ message: 'Not found' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
