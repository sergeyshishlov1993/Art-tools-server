// // const { Router } = require('express');
// // const router = Router();
// // const { Product } = require('../../db');
// // const ImportService = require('../../services/importService');
// //
// // // POST /admin/import/xml - повний імпорт
// // router.post('/xml', async (req, res) => {
// //     try {
// //         const { xmlUrl, supplierPrefix } = req.body;
// //
// //         if (!xmlUrl) {
// //             return res.status(400).json({ message: 'No URL provided' });
// //         }
// //
// //         await Product.sequelize.sync();
// //         console.log(`[API] Start import from ${xmlUrl}`);
// //
// //         const result = await ImportService.importFromFeed(xmlUrl, {
// //             supplierPrefix: supplierPrefix || 'DEFAULT',
// //             updateExisting: true,
// //             preserveSlugs: true
// //         });
// //
// //         res.json({ message: 'Import completed', ...result });
// //     } catch (error) {
// //         console.error('[API] Import error:', error);
// //         res.status(500).json({ message: 'Import failed', error: error.message });
// //     }
// // });
// //
// // // POST /admin/import/categories - тільки категорії
// // router.post('/categories', async (req, res) => {
// //     try {
// //         const { xmlUrl, supplierPrefix } = req.body;
// //
// //         if (!xmlUrl) {
// //             return res.status(400).json({ message: 'No URL provided' });
// //         }
// //
// //         const stats = await ImportService.syncCategoriesFromFeed(
// //             xmlUrl,
// //             supplierPrefix || 'DEFAULT'
// //         );
// //
// //         res.json({ message: 'Categories synced', stats });
// //     } catch (error) {
// //         console.error('[API] Sync error:', error);
// //         res.status(500).json({ error: error.message });
// //     }
// // });
// //
// // module.exports = router;
//
//
// const { Router } = require('express');
// const router = Router();
// const { Product } = require('../../db');
// const ImportService = require('../../services/importService');
// const { mapProductsAfterImport } = require('../../services/autoMappingService');
//
// // POST /admin/import/xml - повний імпорт + автомаппінг
// router.post('/xml', async (req, res) => {
//     try {
//         const { xmlUrl, supplierPrefix } = req.body;
//
//         if (!xmlUrl) {
//             return res.status(400).json({ message: 'No URL provided' });
//         }
//
//         const prefix = supplierPrefix || 'DEFAULT';
//
//         await Product.sequelize.sync();
//         console.log(`[API] Start import from ${xmlUrl}`);
//
//         // 1. Імпорт товарів
//         const importResult = await ImportService.importFromFeed(xmlUrl, {
//             supplierPrefix: prefix,
//             updateExisting: true,
//             preserveSlugs: true
//         });
//
//         console.log(`[API] Import done: ${importResult.created} created, ${importResult.updated} updated`);
//
//         // 2. Автоматичний маппінг категорій
//         console.log(`[API] Starting auto-mapping...`);
//         const mappingResult = await mapProductsAfterImport(prefix);
//
//         res.json({
//             message: 'Import completed',
//             import: importResult,
//             mapping: mappingResult
//         });
//     } catch (error) {
//         console.error('[API] Import error:', error);
//         res.status(500).json({ message: 'Import failed', error: error.message });
//     }
// });
//
// // POST /admin/import/categories
// router.post('/categories', async (req, res) => {
//     try {
//         const { xmlUrl, supplierPrefix } = req.body;
//
//         if (!xmlUrl) {
//             return res.status(400).json({ message: 'No URL provided' });
//         }
//
//         const stats = await ImportService.syncCategoriesFromFeed(
//             xmlUrl,
//             supplierPrefix || 'DEFAULT'
//         );
//
//         res.json({ message: 'Categories synced', stats });
//     } catch (error) {
//         console.error('[API] Sync error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });
//
// module.exports = router;

const express = require('express');
const router = express.Router();
const ImportService = require('../../services/importService');
const { mapProductsAfterImport } = require('../../services/autoMappingService');
const { cleanupEmptySupplierCategories } = require('../../services/cleanupService');

// POST /admin/import/xml
router.post('/xml', async (req, res) => {
    try {
        const { xmlUrl, supplierPrefix = 'DEFAULT' } = req.body;

        if (!xmlUrl) {
            return res.status(400).json({ error: 'xmlUrl is required' });
        }

        console.log(`\n${'='.repeat(50)}`);
        console.log(`📦 ІМПОРТ: ${xmlUrl}`);
        console.log(`${'='.repeat(50)}\n`);

        // 1. Імпорт (використовуємо ImportService.importFromFeed)
        const importResult = await ImportService.importFromFeed(xmlUrl, { supplierPrefix });
        console.log(`\n✅ Імпорт завершено: ${importResult.created} створено, ${importResult.updated} оновлено`);

        // 2. Автомаппінг
        console.log(`\n🔄 Запуск автомаппінгу...`);
        const mappingResult = await mapProductsAfterImport(supplierPrefix);
        console.log(`✅ Маппінг завершено: ${mappingResult.mapped} товарів`);

        // 3. Очистка пустих категорій
        console.log(`\n🧹 Очистка пустих категорій...`);
        const cleanupResult = await cleanupEmptySupplierCategories(supplierPrefix);

        console.log(`\n${'='.repeat(50)}`);
        console.log(`✅ ВСЕ ГОТОВО!`);
        console.log(`${'='.repeat(50)}\n`);

        res.json({
            message: 'Import completed',
            import: importResult,
            mapping: mappingResult,
            cleanup: cleanupResult
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
