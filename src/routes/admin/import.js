const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const ImportService = require('../../services/importService');
const {
    getMappingsForSupplier,
    updateMapping,
    clearMappingsForSupplier
} = require('../../services/autoMappingService');
const { SubCategory, Category, CategoryMapping, ImportSource, Product, Pictures, Parameter } = require('../../db');

const SOURCES_DIR = path.join(__dirname, '../../../sources');
if (!fs.existsSync(SOURCES_DIR)) {
    fs.mkdirSync(SOURCES_DIR, { recursive: true });
}

const upload = multer({
    dest: path.join(__dirname, '../../../temp'),
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.xml')) cb(null, true);
        else cb(new Error('Only XML files allowed'), false);
    },
    limits: { fileSize: 100 * 1024 * 1024 }
});

// === ДОПОМІЖНІ ФУНКЦІЇ ===

async function getSupplierPrefixes() {
    const sources = await ImportSource.findAll({
        attributes: ['supplier_prefix'],
        raw: true
    });

    const fromSources = sources
        .map(s => String(s.supplier_prefix || '').trim().toUpperCase())
        .filter(Boolean);

    if (fromSources.length > 0) {
        return Array.from(new Set(fromSources));
    }

    const products = await Product.findAll({
        attributes: ['supplier_prefix'],
        where: { supplier_prefix: { [Op.ne]: null } },
        group: ['supplier_prefix'],
        raw: true
    });

    const fromProducts = products
        .map(p => String(p.supplier_prefix || '').trim().toUpperCase())
        .filter(Boolean);

    return Array.from(new Set(fromProducts));
}

async function buildInternalSubCategoryWhere() {
    const prefixes = await getSupplierPrefixes();
    const conditions = prefixes.map(prefix => ({
        sub_category_id: { [Op.notLike]: `${prefix}_%` }
    }));

    if (conditions.length === 0) return {};
    return { [Op.and]: conditions };
}

// Видалити всі дані постачальника
async function deleteSupplierData(supplierPrefix, options = {}) {
    const {
        deleteProducts = true,
        deleteCategories = true,
        deleteMappings = false
    } = options;

    const result = {
        products: 0,
        pictures: 0,
        parameters: 0,
        categories: 0,
        subCategories: 0,
        mappings: 0
    };

    if (deleteProducts) {
        // Рахуємо товари
        result.products = await Product.count({
            where: { supplier_prefix: supplierPrefix }
        });

        if (result.products > 0) {
            // Отримуємо ID товарів
            const productIds = await Product.findAll({
                where: { supplier_prefix: supplierPrefix },
                attributes: ['product_id'],
                raw: true
            }).then(rows => rows.map(r => r.product_id));

            // Видаляємо картинки
            if (Pictures) {
                try {
                    result.pictures = await Pictures.destroy({
                        where: { product_id: { [Op.in]: productIds } }
                    });
                } catch (e) {
                    console.log('Pictures delete error:', e.message);
                }
            }

            // Видаляємо параметри
            if (Parameter) {
                try {
                    result.parameters = await Parameter.destroy({
                        where: { product_id: { [Op.in]: productIds } }
                    });
                } catch (e) {
                    console.log('Parameter delete error:', e.message);
                }
            }

            // Видаляємо товари
            await Product.destroy({
                where: { supplier_prefix: supplierPrefix }
            });
        }
    }

    if (deleteCategories) {
        // Видаляємо підкатегорії постачальника
        result.subCategories = await SubCategory.destroy({
            where: { sub_category_id: { [Op.like]: `${supplierPrefix}_%` } }
        });

        // Видаляємо категорії постачальника
        result.categories = await Category.destroy({
            where: { id: { [Op.like]: `${supplierPrefix}_%` } }
        });
    }

    if (deleteMappings && CategoryMapping) {
        result.mappings = await CategoryMapping.destroy({
            where: { supplier_prefix: supplierPrefix }
        });
    }

    return result;
}

// ============================================
// === ОСНОВНІ РОУТИ ІМПОРТУ ===
// ============================================

// POST /api/admin/import/url
router.post('/url', async (req, res) => {
    try {
        const { xmlUrl, supplierPrefix = 'DEFAULT', supplierName } = req.body;

        if (!xmlUrl) {
            return res.status(400).json({ success: false, error: 'xmlUrl is required' });
        }

        const prefix = String(supplierPrefix).toUpperCase().trim() || 'DEFAULT';

        let [source, created] = await ImportSource.findOrCreate({
            where: { supplier_prefix: prefix },
            defaults: {
                supplier_prefix: prefix,
                supplier_name: supplierName || prefix,
                source_type: 'url',
                source_url: xmlUrl
            }
        });

        if (!created && source.source_url !== xmlUrl) {
            source.source_url = xmlUrl;
            source.source_type = 'url';
            if (source.source_filename) {
                const oldPath = path.join(SOURCES_DIR, source.source_filename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                source.source_filename = null;
            }
        }

        const result = await ImportService.importFromFeed(xmlUrl, { supplierPrefix: prefix });

        source.last_import_at = new Date();
        source.last_import_stats = {
            categories: result.categories,
            products: result.products,
            filtersUpdated: result.filtersUpdated
        };
        await source.save();

        res.json({
            success: true,
            sourceCreated: created,
            source: {
                id: source.id,
                supplierPrefix: source.supplier_prefix,
                supplierName: source.supplier_name,
                sourceType: source.source_type,
                lastImportAt: source.last_import_at
            },
            result
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/import/file
router.post('/file', upload.single('file'), async (req, res) => {
    const tempFilePath = req.file?.path;

    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const supplierPrefix = String(req.body.supplierPrefix || 'DEFAULT').toUpperCase().trim() || 'DEFAULT';
        const supplierName = req.body.supplierName || supplierPrefix;
        const filename = `${supplierPrefix}.xml`;
        const destPath = path.join(SOURCES_DIR, filename);

        let [source, created] = await ImportSource.findOrCreate({
            where: { supplier_prefix: supplierPrefix },
            defaults: {
                supplier_prefix: supplierPrefix,
                supplier_name: supplierName,
                source_type: 'file',
                source_filename: filename
            }
        });

        if (!created) {
            source.source_type = 'file';
            source.source_filename = filename;
            source.source_url = null;
        }

        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        fs.renameSync(tempFilePath, destPath);

        const result = await ImportService.importFromFile(destPath, { supplierPrefix });

        source.last_import_at = new Date();
        source.last_import_stats = {
            categories: result.categories,
            products: result.products,
            filtersUpdated: result.filtersUpdated
        };
        await source.save();

        res.json({
            success: true,
            sourceCreated: created,
            filename: req.file.originalname,
            source: {
                id: source.id,
                supplierPrefix: source.supplier_prefix,
                supplierName: source.supplier_name,
                sourceType: source.source_type,
                lastImportAt: source.last_import_at
            },
            result
        });
    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error('Import error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// === УПРАВЛІННЯ ДЖЕРЕЛАМИ ===
// ============================================

// GET /api/admin/import/sources
router.get('/sources', async (req, res) => {
    try {
        const sources = await ImportSource.findAll({
            order: [['supplier_name', 'ASC']]
        });

        // Додаємо кількість товарів для кожного джерела
        const sourcesWithCounts = await Promise.all(sources.map(async (s) => {
            const productCount = await Product.count({
                where: { supplier_prefix: s.supplier_prefix }
            });

            return {
                id: s.id,
                supplierPrefix: s.supplier_prefix,
                supplierName: s.supplier_name,
                sourceType: s.source_type,
                sourceUrl: s.source_url,
                sourceFilename: s.source_filename,
                lastImportAt: s.last_import_at,
                lastImportStats: s.last_import_stats,
                isActive: s.is_active,
                productCount
            };
        }));

        res.json({
            success: true,
            sources: sourcesWithCounts
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/import/sources/:id
router.put('/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { supplierName, sourceUrl, isActive } = req.body;

        const source = await ImportSource.findByPk(id);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Source not found' });
        }

        if (supplierName) source.supplier_name = supplierName;
        if (sourceUrl) {
            source.source_type = 'url';
            source.source_url = sourceUrl;
            if (source.source_filename) {
                const oldPath = path.join(SOURCES_DIR, source.source_filename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                source.source_filename = null;
            }
        }
        if (typeof isActive === 'boolean') source.is_active = isActive;

        await source.save();

        res.json({
            success: true,
            message: 'Source updated',
            source: {
                id: source.id,
                supplierPrefix: source.supplier_prefix,
                supplierName: source.supplier_name,
                sourceType: source.source_type,
                sourceUrl: source.source_url,
                isActive: source.is_active
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/admin/import/sources/:id/file
router.put('/sources/:id/file', upload.single('file'), async (req, res) => {
    const tempFilePath = req.file?.path;

    try {
        const { id } = req.params;

        const source = await ImportSource.findByPk(id);
        if (!source) {
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            return res.status(404).json({ success: false, error: 'Source not found' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'File required' });
        }

        if (source.source_filename) {
            const oldPath = path.join(SOURCES_DIR, source.source_filename);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const filename = `${source.supplier_prefix}.xml`;
        const destPath = path.join(SOURCES_DIR, filename);
        fs.renameSync(tempFilePath, destPath);

        source.source_type = 'file';
        source.source_filename = filename;
        source.source_url = null;
        await source.save();

        res.json({
            success: true,
            message: 'File updated',
            source: {
                id: source.id,
                supplierPrefix: source.supplier_prefix,
                sourceType: source.source_type,
                sourceFilename: source.source_filename
            }
        });
    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/admin/import/sources/:id
router.delete('/sources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteProducts = false } = req.query;

        const source = await ImportSource.findByPk(id);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Source not found' });
        }

        let deleted = {};

        // Якщо потрібно видалити товари
        if (deleteProducts === 'true' || deleteProducts === true) {
            deleted = await deleteSupplierData(source.supplier_prefix, {
                deleteProducts: true,
                deleteCategories: true,
                deleteMappings: true
            });
        }

        // Видаляємо файл
        if (source.source_filename) {
            const filePath = path.join(SOURCES_DIR, source.source_filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await source.destroy();

        res.json({
            success: true,
            message: 'Source deleted',
            deleted
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// === ЗАПУСК ІМПОРТУ ===
// ============================================

// POST /api/admin/import/sources/:id/run
router.post('/sources/:id/run', async (req, res) => {
    try {
        const { id } = req.params;

        const source = await ImportSource.findByPk(id);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Source not found' });
        }

        if (!source.is_active) {
            return res.status(400).json({ success: false, error: 'Source is inactive' });
        }

        let result;

        if (source.source_type === 'url') {
            result = await ImportService.importFromFeed(source.source_url, {
                supplierPrefix: source.supplier_prefix
            });
        } else {
            const filePath = path.join(SOURCES_DIR, source.source_filename);
            if (!fs.existsSync(filePath)) {
                return res.status(400).json({ success: false, error: 'File not found' });
            }
            result = await ImportService.importFromFile(filePath, {
                supplierPrefix: source.supplier_prefix
            });
        }

        source.last_import_at = new Date();
        source.last_import_stats = {
            categories: result.categories,
            products: result.products,
            filtersUpdated: result.filtersUpdated
        };
        await source.save();

        res.json({
            success: true,
            source: {
                id: source.id,
                supplierPrefix: source.supplier_prefix,
                lastImportAt: source.last_import_at
            },
            result
        });
    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/import/run-all
router.post('/run-all', async (req, res) => {
    try {
        const sources = await ImportSource.findAll({
            where: { is_active: true }
        });

        const results = [];

        for (const source of sources) {
            try {
                let result;

                if (source.source_type === 'url') {
                    result = await ImportService.importFromFeed(source.source_url, {
                        supplierPrefix: source.supplier_prefix
                    });
                } else {
                    const filePath = path.join(SOURCES_DIR, source.source_filename);
                    if (!fs.existsSync(filePath)) {
                        results.push({
                            supplier: source.supplier_prefix,
                            success: false,
                            error: 'File not found'
                        });
                        continue;
                    }
                    result = await ImportService.importFromFile(filePath, {
                        supplierPrefix: source.supplier_prefix
                    });
                }

                source.last_import_at = new Date();
                source.last_import_stats = {
                    categories: result.categories,
                    products: result.products,
                    filtersUpdated: result.filtersUpdated
                };
                await source.save();

                results.push({
                    supplier: source.supplier_prefix,
                    success: true,
                    products: result.products
                });
            } catch (error) {
                results.push({
                    supplier: source.supplier_prefix,
                    success: false,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            totalSources: sources.length,
            results
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// === ВИДАЛЕННЯ ТА ПЕРЕІМПОРТ ===
// ============================================

// DELETE /api/admin/import/sources/:id/products
router.delete('/sources/:id/products', async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteCategories = true } = req.query;

        const source = await ImportSource.findByPk(id);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Source not found' });
        }

        const deleted = await deleteSupplierData(source.supplier_prefix, {
            deleteProducts: true,
            deleteCategories: deleteCategories === 'true' || deleteCategories === true,
            deleteMappings: false
        });

        res.json({
            success: true,
            message: `Deleted all products for ${source.supplier_prefix}`,
            supplier: source.supplier_prefix,
            deleted
        });
    } catch (error) {
        console.error('Delete products error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/import/sources/:id/reimport
router.post('/sources/:id/reimport', async (req, res) => {
    try {
        const { id } = req.params;

        const source = await ImportSource.findByPk(id);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Source not found' });
        }

        // 1. Видаляємо всі товари та категорії постачальника
        const deleted = await deleteSupplierData(source.supplier_prefix, {
            deleteProducts: true,
            deleteCategories: true,
            deleteMappings: false
        });

        // 2. Імпортуємо заново
        let result;

        if (source.source_type === 'url') {
            if (!source.source_url) {
                return res.status(400).json({ success: false, error: 'No URL configured' });
            }
            result = await ImportService.importFromFeed(source.source_url, {
                supplierPrefix: source.supplier_prefix
            });
        } else {
            const filePath = path.join(SOURCES_DIR, source.source_filename);
            if (!fs.existsSync(filePath)) {
                return res.status(400).json({ success: false, error: 'File not found' });
            }
            result = await ImportService.importFromFile(filePath, {
                supplierPrefix: source.supplier_prefix
            });
        }

        // 3. Оновлюємо статистику
        source.last_import_at = new Date();
        source.last_import_stats = {
            categories: result.categories,
            products: result.products,
            filtersUpdated: result.filtersUpdated,
            reimport: true,
            deletedBefore: deleted
        };
        await source.save();

        res.json({
            success: true,
            message: `Reimported ${source.supplier_prefix}`,
            deleted,
            imported: result,
            source: {
                id: source.id,
                supplierPrefix: source.supplier_prefix,
                lastImportAt: source.last_import_at
            }
        });
    } catch (error) {
        console.error('Reimport error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/admin/import/sources/:id/clean-reimport
router.post('/sources/:id/clean-reimport', async (req, res) => {
    try {
        const { id } = req.params;

        const source = await ImportSource.findByPk(id);
        if (!source) {
            return res.status(404).json({ success: false, error: 'Source not found' });
        }

        // 1. Видаляємо ВСЕ включаючи маппінги
        const deleted = await deleteSupplierData(source.supplier_prefix, {
            deleteProducts: true,
            deleteCategories: true,
            deleteMappings: true
        });

        // 2. Імпортуємо заново
        let result;

        if (source.source_type === 'url') {
            if (!source.source_url) {
                return res.status(400).json({ success: false, error: 'No URL configured' });
            }
            result = await ImportService.importFromFeed(source.source_url, {
                supplierPrefix: source.supplier_prefix
            });
        } else {
            const filePath = path.join(SOURCES_DIR, source.source_filename);
            if (!fs.existsSync(filePath)) {
                return res.status(400).json({ success: false, error: 'File not found' });
            }
            result = await ImportService.importFromFile(filePath, {
                supplierPrefix: source.supplier_prefix
            });
        }

        // 3. Оновлюємо статистику
        source.last_import_at = new Date();
        source.last_import_stats = {
            categories: result.categories,
            products: result.products,
            filtersUpdated: result.filtersUpdated,
            cleanReimport: true,
            deletedBefore: deleted
        };
        await source.save();

        res.json({
            success: true,
            message: `Clean reimported ${source.supplier_prefix}`,
            deleted,
            imported: result,
            source: {
                id: source.id,
                supplierPrefix: source.supplier_prefix,
                lastImportAt: source.last_import_at
            }
        });
    } catch (error) {
        console.error('Clean reimport error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// === МАППІНГ КАТЕГОРІЙ ===
// ============================================

router.get('/mappings/:supplier', async (req, res) => {
    try {
        const mappings = await getMappingsForSupplier(req.params.supplier);
        res.json({ success: true, mappings });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/mapping', async (req, res) => {
    try {
        const { supplierPrefix, externalCategoryId, internalCategoryId } = req.body;

        if (!supplierPrefix || !externalCategoryId || !internalCategoryId) {
            return res.status(400).json({
                success: false,
                error: 'supplierPrefix, externalCategoryId, internalCategoryId required'
            });
        }

        const result = await updateMapping(
            String(supplierPrefix).toUpperCase().trim(),
            externalCategoryId,
            internalCategoryId
        );
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/mapping/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { internalCategoryId } = req.body;

        if (!internalCategoryId) {
            return res.status(400).json({
                success: false,
                error: 'internalCategoryId required'
            });
        }

        const [updated] = await CategoryMapping.update(
            { internal_sub_category_id: internalCategoryId },
            { where: { id: id } }
        );

        if (updated === 0) {
            return res.status(404).json({ success: false, error: 'Mapping not found' });
        }

        res.json({ success: true, message: 'Mapping updated', id, internalCategoryId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/mapping/:id', async (req, res) => {
    try {
        const deleted = await CategoryMapping.destroy({ where: { id: req.params.id } });
        if (deleted === 0) {
            return res.status(404).json({ success: false, error: 'Mapping not found' });
        }
        res.json({ success: true, message: 'Mapping deleted' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/mappings/:supplier', async (req, res) => {
    try {
        const deleted = await clearMappingsForSupplier(req.params.supplier);
        res.json({ success: true, deleted });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/unmapped/:supplierPrefix', async (req, res) => {
    try {
        const { supplierPrefix } = req.params;
        const normalizedPrefix = String(supplierPrefix).toUpperCase().trim();

        const unmapped = await CategoryMapping.findAll({
            where: {
                supplier_prefix: normalizedPrefix,
                internal_sub_category_id: null
            },
            order: [['external_category_name', 'ASC']],
            raw: true
        });

        const internalWhere = await buildInternalSubCategoryWhere();

        const subCategories = await SubCategory.findAll({
            where: internalWhere,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['category_name']
            }],
            order: [['sub_category_name', 'ASC']]
        });

        res.json({
            success: true,
            supplier: normalizedPrefix,
            count: unmapped.length,
            unmapped: unmapped.map(m => ({
                id: m.id,
                externalId: m.external_category_id,
                externalName: m.external_category_name,
                parentName: m.parent_category_name || null
            })),
            targets: subCategories.map(sc => ({
                id: sc.sub_category_id,
                name: sc.sub_category_name,
                parentName: sc.category?.category_name || null
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/stats/:supplierPrefix', async (req, res) => {
    try {
        const { supplierPrefix } = req.params;
        const normalizedPrefix = String(supplierPrefix).toUpperCase().trim();

        const total = await CategoryMapping.count({
            where: { supplier_prefix: normalizedPrefix }
        });

        const mapped = await CategoryMapping.count({
            where: {
                supplier_prefix: normalizedPrefix,
                internal_sub_category_id: { [Op.ne]: null }
            }
        });

        const productCount = await Product.count({
            where: { supplier_prefix: normalizedPrefix }
        });

        res.json({
            success: true,
            supplier: normalizedPrefix,
            stats: {
                total,
                mapped,
                unmapped: total - mapped,
                percent: total > 0 ? Math.round((mapped / total) * 100) : 0,
                productCount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/targets', async (req, res) => {
    try {
        const internalWhere = await buildInternalSubCategoryWhere();

        const categories = await SubCategory.findAll({
            where: internalWhere,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['category_name']
            }],
            order: [['sub_category_name', 'ASC']]
        });

        res.json({
            success: true,
            categories: categories.map(c => ({
                id: c.sub_category_id,
                name: c.sub_category_name,
                parentId: c.parent_id,
                parentName: c.category?.category_name || null
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
