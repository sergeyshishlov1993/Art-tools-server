const { Category, SubCategory, Product } = require('../db');
const { Op } = require('sequelize');

async function cleanupEmptySupplierCategories(supplierPrefix = 'DEFAULT') {

    const stats = {
        deletedSubCategories: 0,
        deletedCategories: 0
    };

    try {
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

        const categories = await Category.findAll({
            where: {
                id: { [Op.like]: `${supplierPrefix}_%` }
            },
            raw: true
        });

        for (const cat of categories) {
            const subCount = await SubCategory.count({
                where: { parent_id: cat.id }
            });

            if (subCount === 0) {
                await Category.destroy({
                    where: { id: cat.id }
                });
                stats.deletedCategories++;
            }
        }

        return stats;

    } catch (error) {
        console.error('[Cleanup] Помилка:', error);
        throw error;
    }
}

module.exports = {
    cleanupEmptySupplierCategories
};
