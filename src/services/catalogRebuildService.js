const fs = require('fs');
const path = require('path');
const {
    Category,
    CategoryFilter,
    CategoryMapping,
    ImportSource,
    Parameter,
    Picture,
    Product,
    Review,
    ReviewResponse,
    Sequelize,
    SubCategory,
    sequelize
} = require('../db');
const ImportService = require('./importService');
const FilterService = require('./filterService');
const { reconcileFallbackProducts } = require('./autoMappingService');
const catalogueSeeder = require('../../seeders/init-catalogue');

const DEFAULT_SOURCES_DIR = path.join(__dirname, '../../sources');

async function countCatalogueRows() {
    const [
        categories,
        subCategories,
        products,
        pictures,
        parameters,
        mappings,
        filters,
        reviews,
        reviewResponses
    ] = await Promise.all([
        Category.count(),
        SubCategory.count(),
        Product.count(),
        Picture.count(),
        Parameter.count(),
        CategoryMapping.count(),
        CategoryFilter.count(),
        Review.count(),
        ReviewResponse.count()
    ]);

    return {
        categories,
        subCategories,
        products,
        pictures,
        parameters,
        mappings,
        filters,
        reviews,
        reviewResponses
    };
}

function getSourceLocation(source, sourcesDir) {
    if (source.source_type === 'url') {
        if (!source.source_url) throw new Error(`${source.supplier_prefix}: source URL is missing`);
        return { type: 'url', value: source.source_url };
    }

    if (!source.source_filename) {
        throw new Error(`${source.supplier_prefix}: source filename is missing`);
    }

    const filePath = path.join(sourcesDir, source.source_filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`${source.supplier_prefix}: XML file not found at ${filePath}`);
    }

    return { type: 'file', value: filePath };
}

async function getPreparedSources(sourcesDir = DEFAULT_SOURCES_DIR) {
    const sources = await ImportSource.findAll({
        where: { is_active: true },
        order: [['id', 'ASC']]
    });

    if (sources.length === 0) {
        throw new Error('No active import sources configured');
    }

    return sources.map(source => ({
        source,
        location: getSourceLocation(source, sourcesDir)
    }));
}

async function clearAndSeedCatalogue() {
    const deleted = await countCatalogueRows();

    await sequelize.transaction(async transaction => {
        const destroyOptions = { where: {}, transaction };

        // Some supplier image URLs are longer than the legacy VARCHAR(255).
        // Keep this here as well as in the migration so a rebuild is self-contained.
        await sequelize.getQueryInterface().changeColumn('pictures', 'pictures_name', {
            type: Sequelize.TEXT,
            allowNull: true
        }, { transaction });

        await ReviewResponse.destroy(destroyOptions);
        await Review.destroy(destroyOptions);
        await Picture.destroy(destroyOptions);
        await Parameter.destroy(destroyOptions);
        await Product.destroy(destroyOptions);
        await CategoryFilter.destroy(destroyOptions);
        await CategoryMapping.destroy(destroyOptions);
        await SubCategory.destroy(destroyOptions);
        await Category.destroy(destroyOptions);

        await catalogueSeeder.up(sequelize.getQueryInterface(), { transaction });
    });

    return deleted;
}

async function importPreparedSource(prepared) {
    const { source, location } = prepared;
    const options = { supplierPrefix: source.supplier_prefix };
    const result = location.type === 'url'
        ? await ImportService.importFromFeed(location.value, options)
        : await ImportService.importFromFile(location.value, options);

    source.last_import_at = new Date();
    source.last_import_stats = {
        categories: result.categories,
        products: result.products,
        filtersUpdated: result.filtersUpdated,
        fullRebuild: true
    };
    await source.save();

    return {
        supplier: source.supplier_prefix,
        success: true,
        products: result.products,
        categories: result.categories,
        categoryCreation: result.categoryCreation,
        fallbackAudit: result.fallbackAudit
    };
}

async function rebuildCatalogue(options = {}) {
    const sourcesDir = options.sourcesDir || DEFAULT_SOURCES_DIR;

    // Validate every source before the destructive step starts.
    const preparedSources = await getPreparedSources(sourcesDir);
    const deleted = await clearAndSeedCatalogue();
    const results = [];

    for (const prepared of preparedSources) {
        try {
            results.push(await importPreparedSource(prepared));
        } catch (error) {
            results.push({
                supplier: prepared.source.supplier_prefix,
                success: false,
                error: error.message
            });
        }
    }

    const failed = results.filter(result => !result.success);
    const globalFallbackAudit = await reconcileFallbackProducts(null);
    for (const categoryId of Object.keys(globalFallbackAudit.movedByCategory)) {
        await FilterService.recalcForCategory(categoryId);
    }
    const after = await countCatalogueRows();

    return {
        success: failed.length === 0,
        deleted,
        after,
        totalSources: preparedSources.length,
        failedSources: failed.length,
        globalFallbackAudit,
        results
    };
}

module.exports = {
    DEFAULT_SOURCES_DIR,
    clearAndSeedCatalogue,
    countCatalogueRows,
    getPreparedSources,
    rebuildCatalogue
};
