const axios = require('axios');
const xml2js = require('xml2js');
const {
    Product,
    Category,
    SubCategory,
    Picture,
    Parameter,
    CategoryMapping
} = require('../db');
const { generateSlug, generateFilterSlug } = require('../utils/slugify');
const FilterService = require('./filterService');

class ImportService {
    /**
     * Парсинг XML з URL
     */
    static async parseXMLFromURL(xmlUrl) {
        try {
            const response = await axios.get(xmlUrl, {
                responseType: 'text',
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 120000
            });

            const parser = new xml2js.Parser({
                explicitArray: false,
                ignoreAttrs: false,
                mergeAttrs: true
            });

            const result = await parser.parseStringPromise(response.data);
            if (!result.yml_catalog?.shop) {
                throw new Error('Invalid YML format');
            }

            const shop = result.yml_catalog.shop;

            // Parse categories
            const rawCats = shop.categories?.category
                ? (Array.isArray(shop.categories.category)
                    ? shop.categories.category
                    : [shop.categories.category])
                : [];

            const categoriesMap = new Map();
            rawCats.forEach(cat => {
                categoriesMap.set(cat.id, {
                    id: cat.id,
                    name: cat._ || cat.name || `Cat-${cat.id}`,
                    parentId: cat.parentId || null,
                    picture: cat.image || null
                });
            });

            // Parse offers
            const rawOffers = shop.offers?.offer
                ? (Array.isArray(shop.offers.offer)
                    ? shop.offers.offer
                    : [shop.offers.offer])
                : [];

            const formattedOffers = rawOffers.map(offer => ({
                id: offer.id || offer['$']?.id,
                name: offer.name || `${offer.typePrefix || ''} ${offer.model || ''}`.trim(),
                description: offer.description || '',
                price: parseFloat(offer.price) || 0,
                categoryId: offer.categoryId,
                pictures: Array.isArray(offer.picture)
                    ? offer.picture
                    : (offer.picture ? [offer.picture] : []),
                vendor: offer.vendor || null,
                available: offer.available === 'false' ? 'false' : 'true',
                params: offer.param
                    ? (Array.isArray(offer.param) ? offer.param : [offer.param]).map(p => ({
                        name: p.name || p['$']?.name || 'Характеристика',
                        value: p._ || p.value || ''
                    }))
                    : []
            })).filter(o => o.id);

            return { formattedOffers, categoriesMap };
        } catch (error) {
            console.error('[Import] Parse error:', error.message);
            throw error;
        }
    }

    /**
     * Фільтрувати тільки використані категорії
     */
    static filterUsedCategories(categoriesMap, offers) {
        const usedIds = new Set();

        for (const offer of offers) {
            if (offer.categoryId) {
                let currentId = offer.categoryId;
                while (currentId && !usedIds.has(currentId)) {
                    usedIds.add(currentId);
                    const cat = categoriesMap.get(currentId);
                    currentId = cat ? cat.parentId : null;
                }
            }
        }

        const filteredMap = new Map();
        for (const [id, data] of categoriesMap) {
            if (usedIds.has(id)) {
                filteredMap.set(id, data);
            }
        }

        return filteredMap;
    }

    /**
     * Синхронізація категорій в БД
     */
    static async syncCategories(categoriesMap, supplierPrefix) {
        const transaction = await Category.sequelize.transaction();
        const stats = { roots: 0, subs: 0 };

        try {
            // Create root categories
            for (const [id, data] of categoriesMap) {
                const isRoot = !data.parentId || !categoriesMap.has(data.parentId);
                if (isRoot) {
                    const dbId = `${supplierPrefix}_CAT_${id}`;
                    await Category.upsert({
                        id: dbId,
                        category_name: data.name
                    }, { transaction });
                    stats.roots++;
                }
            }

            // Create subcategories
            for (const [id, data] of categoriesMap) {
                const isRoot = !data.parentId || !categoriesMap.has(data.parentId);

                if (isRoot) {
                    const parentDbId = `${supplierPrefix}_CAT_${id}`;
                    const subDbId = `${supplierPrefix}_SUBCAT_ROOT_${id}`;
                    await SubCategory.upsert({
                        sub_category_id: subDbId,
                        sub_category_name: data.name,
                        parent_id: parentDbId,
                        pictures: data.picture
                    }, { transaction });
                    stats.subs++;
                } else {
                    const parentDbId = `${supplierPrefix}_CAT_${data.parentId}`;
                    const subDbId = `${supplierPrefix}_SUBCAT_${id}`;
                    try {
                        await SubCategory.upsert({
                            sub_category_id: subDbId,
                            sub_category_name: data.name,
                            parent_id: parentDbId,
                            pictures: data.picture
                        }, { transaction });
                        stats.subs++;
                    } catch (e) {
                        // Skip if parent doesn't exist
                    }
                }
            }

            await transaction.commit();
            return stats;
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Головна функція імпорту товарів
     */
    static async importFromFeed(xmlUrl, options = {}) {
        const {
            supplierPrefix = 'DEFAULT',
            updateExisting = true,
            preserveSlugs = true
        } = options;

        const stats = { created: 0, updated: 0, errors: [] };
        const touchedCategories = new Set();

        try {
            const { formattedOffers, categoriesMap: fullCategoriesMap } =
                await this.parseXMLFromURL(xmlUrl);

            if (!formattedOffers.length) {
                return { message: 'No products found', ...stats };
            }

            // Sync categories
            const activeCategoriesMap = this.filterUsedCategories(
                fullCategoriesMap,
                formattedOffers
            );
            await this.syncCategories(activeCategoriesMap, supplierPrefix);

            // Load mappings
            const mappingsDB = await CategoryMapping.findAll({
                where: { supplier_prefix: supplierPrefix },
                raw: true
            });
            const mappingsMap = new Map();
            mappingsDB.forEach(m => {
                mappingsMap.set(String(m.external_category_id), m.internal_sub_category_id);
            });

            // Process offers
            for (const offer of formattedOffers) {
                try {
                    await this._processOffer(offer, {
                        supplierPrefix,
                        updateExisting,
                        preserveSlugs,
                        activeCategoriesMap,
                        mappingsMap,
                        stats,
                        touchedCategories
                    });
                } catch (err) {
                    stats.errors.push({ id: offer.id, msg: err.message });
                }
            }

            // Recalculate filters
            console.log(`[Import] Recalculating filters for ${touchedCategories.size} categories...`);
            for (const subCatId of touchedCategories) {
                await FilterService.recalcForCategory(subCatId);
            }

            console.log(`[Import] Done. Created: ${stats.created}, Updated: ${stats.updated}`);
            return stats;

        } catch (error) {
            console.error('[Import] Critical Error:', error);
            throw error;
        }
    }

    /**
     * Обробка одного товару
     */
    static async _processOffer(offer, ctx) {
        const {
            supplierPrefix,
            updateExisting,
            preserveSlugs,
            activeCategoriesMap,
            mappingsMap,
            stats,
            touchedCategories
        } = ctx;

        const xmlId = String(offer.id);
        const productId = `${supplierPrefix}_${xmlId}`;

        // Find existing product
        let product = await Product.findOne({
            where: { xml_id: xmlId, supplier_prefix: supplierPrefix }
        });
        if (!product) {
            product = await Product.findByPk(productId);
        }

        // Generate slug
        const slug = (product && preserveSlugs && product.slug)
            ? product.slug
            : generateSlug(offer.name, productId);

        // Determine category
        let mappedCategoryId = null;
        if (offer.categoryId && mappingsMap.has(String(offer.categoryId))) {
            mappedCategoryId = mappingsMap.get(String(offer.categoryId));
        }

        let feedSubCategoryId = null;
        if (offer.categoryId && activeCategoriesMap.has(offer.categoryId)) {
            const catData = activeCategoriesMap.get(offer.categoryId);
            const isRoot = !catData.parentId || !activeCategoriesMap.has(catData.parentId);
            feedSubCategoryId = isRoot
                ? `${supplierPrefix}_SUBCAT_ROOT_${offer.categoryId}`
                : `${supplierPrefix}_SUBCAT_${offer.categoryId}`;
        }

        let finalSubCategoryId = feedSubCategoryId;
        let isManual = false;

        if (product?.is_manual_category) {
            finalSubCategoryId = product.sub_category_id;
            isManual = true;
        } else if (mappedCategoryId) {
            finalSubCategoryId = mappedCategoryId;
            isManual = true;
        }

        if (finalSubCategoryId) {
            touchedCategories.add(finalSubCategoryId);
        }

        // Prepare product data
        const productData = {
            product_id: productId,
            xml_id: xmlId,
            supplier_prefix: supplierPrefix,
            slug,
            sub_category_id: finalSubCategoryId,
            is_manual_category: isManual,
            product_name: offer.name,
            product_description: offer.description,
            price: offer.price,
            available: offer.available,
            brand: offer.vendor || supplierPrefix,
            bestseller: product?.bestseller || 'false',
            sale: product?.sale || 'false',
            sale_price: product?.sale_price || 0,
            discount: product?.discount || 0,
            custom_product: false
        };

        // Create or update product
        if (product && updateExisting) {
            await product.update(productData);
            stats.updated++;
        } else if (!product) {
            await Product.create(productData);
            stats.created++;
        }

        // Sync pictures
        if (offer.pictures.length) {
            await Picture.destroy({ where: { product_id: productId } });
            await Picture.bulkCreate(
                offer.pictures.map(url => ({
                    product_id: productId,
                    pictures_name: url
                }))
            );
        }

        // Sync parameters
        if (offer.params.length) {
            await Parameter.destroy({ where: { product_id: productId } });
            await Parameter.bulkCreate(
                offer.params.map(p => ({
                    product_id: productId,
                    parameter_name: p.name,
                    slug: generateFilterSlug(p.name),
                    parameter_value: String(p.value).substring(0, 255)
                }))
            );
        }
    }

    /**
     * Синхронізувати тільки категорії
     */
    static async syncCategoriesFromFeed(xmlUrl, supplierPrefix = 'DEFAULT') {
        try {
            console.log(`[Import] Loading categories from: ${xmlUrl}`);
            const { categoriesMap } = await this.parseXMLFromURL(xmlUrl);
            const stats = await this.syncCategories(categoriesMap, supplierPrefix);
            console.log(`[Import] Categories synced. Roots: ${stats.roots}, Subs: ${stats.subs}`);
            return stats;
        } catch (error) {
            console.error('[Import] Sync error:', error.message);
            throw error;
        }
    }
}

module.exports = ImportService;
