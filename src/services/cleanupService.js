const { Category, SubCategory, Product } = require('../db');
const { Op } = require('sequelize');

async function cleanupEmptySupplierCategories(supplierPrefix = 'DEFAULT') {
    console.log(`🧹 [Cleanup] Очистка пустих ${supplierPrefix}_ категорій...`);

    const stats = {
        deletedSubCategories: 0,
        deletedCategories: 0
    };

    try {
        // 1. Знаходимо підкатегорії без товарів
        const subCategories = await SubCategory.findAll({
            where: {
                sub_category_id: { [Op.like]: `${supplierPrefix}_%` }
            },
            raw: true
        });

        for (const subCat of subCategories) {
            const productCount = await Product.count({
                where: { sub_category_id: subCat.sub_category_id }
            });

            if (productCount === 0) {
                await SubCategory.destroy({
                    where: { sub_category_id: subCat.sub_category_id }
                });
                stats.deletedSubCategories++;
            }
        }

        // 2. Знаходимо категорії без підкатегорій
        const categories = await Category.findAll({
            where: {
                id: { [Op.like]: `${supplierPrefix}_%` }  // <-- ВИПРАВЛЕНО: id замість category_id
            },
            raw: true
        });

        for (const cat of categories) {
            const subCount = await SubCategory.count({
                where: { parent_id: cat.id }  // <-- ВИПРАВЛЕНО: cat.id замість cat.category_id
            });

            if (subCount === 0) {
                await Category.destroy({
                    where: { id: cat.id }  // <-- ВИПРАВЛЕНО
                });
                stats.deletedCategories++;
            }
        }

        console.log(`✅ [Cleanup] Видалено: ${stats.deletedSubCategories} підкатегорій, ${stats.deletedCategories} категорій`);
        return stats;

    } catch (error) {
        console.error('[Cleanup] Помилка:', error);
        throw error;
    }
}

module.exports = {
    cleanupEmptySupplierCategories
};
