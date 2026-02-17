const axios = require('axios');
const fs = require('fs');
const xml2js = require('xml2js');
const { Op } = require('sequelize');
const { Product, Parameter, Picture, ImportSource } = require('../db');
const { mapCategoriesFromXML, getInternalCategoryForProduct } = require('./autoMappingService');
const FilterService = require('./filterService');
const { generateSlug, generateFilterSlug } = require('../utils/slugify');
const { parseDescriptionSpecs } = require('./parsers/descriptionSpecsParser');

const BRAND_MAP = {
    grosser: 'Grosser',
    grasser: 'Grosser',
    procraft: 'Procraft',
    cleaner: 'Cleaner',
    'profi-tec': 'PROFI-TEC',
    profitec: 'PROFI-TEC'
};

const normalizeBrand = (brand) => {
    if (!brand) return null;
    const key = String(brand).toLowerCase().trim().replace(/[\s-]+/g, '-');
    return BRAND_MAP[key] || String(brand).trim();
};

const RSS_TAG_TO_PARAM_MAP = {
    'potuzhnist': 'Потужність',
    'potuzhnist-dvyguna': 'Потужність',
    'power': 'Потужність',
    'moshchnost': 'Потужність',
    'napruga': 'Напруга',
    'voltage': 'Напруга',
    'napryazhenie': 'Напруга',
    'maksymalnyj-tysk': 'Робочий тиск',
    'robochyj-tysk': 'Робочий тиск',
    'tysk': 'Робочий тиск',
    'davlenie': 'Робочий тиск',
    'produktyvnist': 'Продуктивність',
    'proizvoditelnost': 'Продуктивність',
    'yemnist': 'Ємність',
    'yemnist-baka': 'Ємність бака',
    'obyem-baka': 'Ємність бака',
    'emkost': 'Ємність',
    'vaga': 'Вага',
    'vaga-netto': 'Вага',
    'ves': 'Вага',
    'weight': 'Вага',
    'gabaryty': 'Габарити',
    'gabaryty-upakovky': 'Габарити',
    'razmery': 'Габарити',
    'oberty': 'Оберти',
    'kilkist-obertiv': 'Оберти',
    'chastota-obertannya': 'Оберти',
    'diametr': 'Діаметр',
    'diametr-dyska': 'Діаметр диска',
    'dovzhyna': 'Довжина',
    'dovzhyna-shyny': 'Довжина шини',
    'dlina': 'Довжина'
};

const IGNORED_RSS_TAGS = new Set([
    'g:id', 'g:title', 'g:description', 'g:link', 'g:image_link',
    'g:availability', 'g:price', 'g:sale_price', 'g:product_type',
    'g:condition', 'g:additional_image_link', 'g:checkout_link_template',
    'g:identifier_exists', 'g:google_product_category',
    'id', 'title', 'description', 'link', 'image_link',
    'Article', 'Language', 'Vendor', 'priceCurrency', 'priceOpt',
    'price-regular', 'garantiya', 'garantija'
]);

const ALLOWED_PARAMETER_BASES = new Map([
    ['potuzhnist', 'Потужність'],
    ['napruga', 'Напруга'],
    ['napruga-akumulyatora', 'Напруга акумулятора'],
    ['yemnist-akumulyatora', 'Ємність акумулятора'],
    ['yemkist-akumulyatora', 'Ємність акумулятора'],
    ['krutnyy-moment', 'Крутний момент'],
    ['kilkist-obertiv', 'Кількість обертів'],
    ['oberty', 'Оберти'],
    ['chastota-udariv', 'Частота ударів'],
    ['shvydkist', 'Швидкість'],
    ['vaga', 'Вага'],
    ['diametr-dyska', 'Діаметр диска'],
    ['diametr-patrona', 'Діаметр патрона'],
    ['typ-akumulyatora', 'Тип акумулятора'],
    ['typ-dvyguna', 'Тип двигуна'],
    ['dzherelo-zhyvlennya', 'Джерело живлення'],
    ['potik-povitrya', 'Потік повітря'],
    ['robochyy-tysk', 'Робочий тиск'],
    ['produktyvnist', 'Продуктивність'],
    ['obyem-baka', 'Ємність бака'],
    ['dovzhyna', 'Довжина'],
    ['dovzhyna-shyny', 'Довжина шини'],
    ['diametr', 'Діаметр'],
    ['gabaryty', 'Габарити'],
    ['maksymalnyy-krutnyy-moment', 'Максимальний крутний момент'],
    ['kilkist-shvydkostey', 'Кількість швидкостей'],
    ['revers', 'Реверс'],
    ['plavnyy-pusk', 'Плавний пуск']
]);

const PARAMETER_SYNONYMS = new Map([
    ['potuzhnist-dvyguna', 'potuzhnist'],
    ['power', 'potuzhnist'],
    ['moshchnost', 'potuzhnist'],
    ['maksymalnyj-tysk', 'robochyy-tysk'],
    ['robochyj-tysk', 'robochyy-tysk'],
    ['davlenie', 'robochyy-tysk'],
    ['proizvoditelnost', 'produktyvnist'],
    ['yemnist-baka', 'obyem-baka'],
    ['emkost', 'obyem-baka'],
    ['ves', 'vaga'],
    ['weight', 'vaga'],
    ['kilkist-obertiv', 'oberty'],
    ['chastota-obertannya', 'oberty'],
    ['gabaryty-upakovky', 'gabaryty'],
    ['razmery', 'gabaryty']
]);

function decodeHtmlEntitiesBasic(value) {
    const raw = String(value ?? '');
    return raw
        .replace(/&nbsp;/g, ' ')
        .replace(/&times;/g, '×')
        .replace(/&deg;/g, '°')
        .replace(/&middot;/g, '·')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&rdquo;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#34;/g, '"')
        .replace(/&#(\d+);/g, (m, n) => {
            const codePoint = Number(n);
            if (!Number.isFinite(codePoint) || codePoint < 0 || codePoint > 0x10ffff) return m;
            try { return String.fromCodePoint(codePoint); } catch { return m; }
        });
}

const normalizeTextValue = (value) => {
    const raw = String(value ?? '');
    return raw
        .replace(/&nbsp;/g, ' ')
        .replace(/&times;/g, '×')
        .replace(/&deg;/g, '°')
        .replace(/&middot;/g, ' ')
        .replace(/&mdash;/g, '—')
        .replace(/&ndash;/g, '–')
        .replace(/&rsquo;/g, "'")
        .replace(/&lsquo;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
};

const isGarbageValue = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return true;
    if (text.length < 1 || text.length > 255) return true;
    if (/^\d{18,}$/.test(text)) return true;
    return false;
};

function toArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function extractNumberFromText(value) {
    const text = String(value ?? '').trim();
    if (!text) return 0;
    const match = text.match(/-?\d+(?:[.,]\d+)?/);
    if (!match) return 0;
    const normalized = String(match[0]).replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeAvailability(value) {
    const text = String(value ?? '').toLowerCase().trim();
    if (['true', 'in stock', 'in_stock', 'instock', 'preorder', 'backorder'].includes(text)) return 'true';
    return 'false';
}

function canonicalizeParameterNameToSlug(parameterName) {
    const rawSlug = generateFilterSlug(parameterName);
    const mapped = PARAMETER_SYNONYMS.get(rawSlug) || rawSlug;
    if (!mapped) return null;
    if (!ALLOWED_PARAMETER_BASES.has(mapped)) return null;
    return mapped;
}

function buildParameterEntriesFromNameValue(parameterName, parameterValue) {
    const canonicalSlug = canonicalizeParameterNameToSlug(parameterName);
    if (!canonicalSlug) return [];

    const canonicalName = ALLOWED_PARAMETER_BASES.get(canonicalSlug);
    if (!canonicalName) return [];

    const normalizedValue = normalizeTextValue(parameterValue);
    if (isGarbageValue(normalizedValue)) return [];

    return [{
        canonicalSlug,
        parameter_name: canonicalName,
        parameter_value: normalizedValue.substring(0, 255),
        slug: generateFilterSlug(canonicalName),
        param_value_slug: generateFilterSlug(normalizedValue)
    }];
}

function buildUniqueProductSlug(productName, supplierPrefix, xmlId) {
    const baseSlug = generateSlug(productName);
    const suffixSlug = generateFilterSlug(`${supplierPrefix}-${xmlId}`);
    const combined = `${baseSlug}-${suffixSlug}`.replace(/-+/g, '-').trim();
    return combined.length > 500 ? combined.slice(0, 500) : combined;
}

async function getSupplierPrefixes() {
    const sources = await ImportSource.findAll({ attributes: ['supplier_prefix'], raw: true });
    const prefixes = sources.map(s => String(s.supplier_prefix || '').trim().toUpperCase()).filter(Boolean);

    if (prefixes.length > 0) return Array.from(new Set(prefixes));

    const products = await Product.findAll({
        attributes: ['supplier_prefix'],
        where: { supplier_prefix: { [Op.ne]: null } },
        group: ['supplier_prefix'],
        raw: true
    });

    return Array.from(new Set(
        products.map(p => String(p.supplier_prefix || '').trim().toUpperCase()).filter(Boolean)
    ));
}

function pickExternalCategoryIdFromRssItem(item) {
    const productType = item?.['g:product_type'] || item?.product_type;
    if (productType) {
        const decoded = decodeHtmlEntitiesBasic(String(productType).trim());
        const parts = decoded.split(/\s*>\s*/);
        return parts[parts.length - 1] || decoded;
    }

    const googleCategory = item?.['g:google_product_category'] || item?.google_product_category;
    if (googleCategory) return decodeHtmlEntitiesBasic(String(googleCategory).trim());

    return 'uncategorized';
}

function extractCustomParamsFromRssItem(item) {
    const params = [];
    if (!item || typeof item !== 'object') return params;

    for (const [key, value] of Object.entries(item)) {
        if (IGNORED_RSS_TAGS.has(key)) continue;
        if (key.startsWith('g:')) continue;
        if (!value) continue;

        const valueStr = String(value).trim();
        if (!valueStr || valueStr === 'no') continue;

        const tagSlug = key.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const mappedName = RSS_TAG_TO_PARAM_MAP[tagSlug];

        if (mappedName) {
            params.push({ name: mappedName, value: valueStr });
        }
    }

    return params;
}

function buildOfferFromRssItem(item, filterLanguage = 'UA') {
    const lang = item?.Language || item?.language || '';
    if (filterLanguage && lang && String(lang).toUpperCase() !== filterLanguage.toUpperCase()) {
        return null;
    }

    const xmlId = item?.['g:id'] || item?.id || '';
    const externalCategoryId = pickExternalCategoryIdFromRssItem(item);

    const title = decodeHtmlEntitiesBasic(item?.['g:title'] || item?.title || '');
    const description = decodeHtmlEntitiesBasic(item?.['g:description'] || item?.description || '');

    const brand = decodeHtmlEntitiesBasic(item?.Vendor || item?.vendor || item?.['g:brand'] || item?.brand || '');

    const currentPrice = item?.['g:price'] || item?.price || '';
    const regularPrice = item?.['price-regular'] || item?.oldprice || '';

    const availabilityText = item?.['g:availability'] || item?.availability || '';

    const pictures = [];
    const imageMain = item?.['g:image_link'] || item?.image_link;
    const additionalImages = item?.['g:additional_image_link'] || item?.additional_image_link;

    for (const url of toArray(imageMain)) {
        const u = decodeHtmlEntitiesBasic(String(url ?? '').trim());
        if (u) pictures.push(u);
    }
    for (const url of toArray(additionalImages)) {
        const u = decodeHtmlEntitiesBasic(String(url ?? '').trim());
        if (u) pictures.push(u);
    }

    const customParams = extractCustomParamsFromRssItem(item);

    return {
        id: decodeHtmlEntitiesBasic(String(xmlId ?? '').trim()),
        categoryId: externalCategoryId,
        name: title,
        title: title,
        description: description,
        vendor: brand,
        brand: brand,
        price: String(currentPrice).trim(),
        oldprice: String(regularPrice).trim(),
        available: normalizeAvailability(availabilityText),
        picture: pictures,
        param: customParams,
        _rawItem: item
    };
}


class ImportService {
    static async importFromFeed(url, options = {}) {
        console.log(`📥 Завантаження XML з ${url}...`);
        const response = await axios.get(url, {
            timeout: 300000,
            maxContentLength: 100 * 1024 * 1024
        });
        return this.processXML(response.data, options);
    }

    static async importFromFile(filePath, options = {}) {
        const xmlData = fs.readFileSync(filePath, 'utf-8');
        return this.processXML(xmlData, options);
    }

    static async processXML(xmlData, options = {}) {
        const supplierPrefix = String(options.supplierPrefix || 'DEFAULT').toUpperCase().trim() || 'DEFAULT';
        const filterLanguage = options.filterLanguage || 'UA';

        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true,
            tagNameProcessors: [],
            attrNameProcessors: []
        });

        const result = await parser.parseStringPromise(xmlData);

        const isRss = Boolean(result?.rss?.channel);
        const root = isRss ? result.rss : (result.yml_catalog || result.price || result);
        const shop = isRss ? result.rss.channel : (root.shop || root);

        console.log(`📄 Формат: ${isRss ? 'RSS/Google Shopping' : 'YML'}`);

        const rawCategories = isRss
            ? this._extractCategoriesFromRss(shop)
            : this._extractCategories(shop);

        const mappingResult = await mapCategoriesFromXML(supplierPrefix, rawCategories);

        const rawProducts = isRss
            ? this._extractProductsFromRss(shop, filterLanguage)
            : this._extractProducts(shop);

        console.log(`📦 Знайдено товарів: ${rawProducts.length}`);

        const importStats = await this._importProducts(rawProducts, supplierPrefix);

        const affectedCategories = await this._getAffectedCategories(supplierPrefix);
        for (const catId of affectedCategories) {
            await FilterService.recalcForCategory(catId);
        }

        return {
            supplier: supplierPrefix,
            categories: {
                total: rawCategories.length,
                mapped: mappingResult.mapped?.length || 0,
                existing: mappingResult.existing?.length || 0,
                unmapped: mappingResult.unmapped?.length || 0,
                unmappedList: mappingResult.unmapped || []
            },
            products: importStats,
            filtersUpdated: affectedCategories.length
        };
    }

    static _extractCategoriesFromRss(channel) {
        const categoriesMap = new Map();
        const itemsRaw = channel?.item || [];
        const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

        for (const item of items) {
            if (!item) continue;

            const lang = item?.Language || item?.language || '';
            if (lang && String(lang).toUpperCase() === 'RU') continue;

            const externalCategoryId = pickExternalCategoryIdFromRssItem(item);
            const key = String(externalCategoryId).trim();
            if (!key) continue;

            if (!categoriesMap.has(key)) {
                categoriesMap.set(key, {
                    id: key,
                    name: key,
                    parentId: null
                });
            }
        }

        if (categoriesMap.size === 0) {
            categoriesMap.set('uncategorized', { id: 'uncategorized', name: 'uncategorized', parentId: null });
        }

        console.log(`📂 Категорії з RSS: ${Array.from(categoriesMap.keys()).join(', ')}`);
        return Array.from(categoriesMap.values());
    }

    static _extractProductsFromRss(channel, filterLanguage = 'UA') {
        const itemsRaw = channel?.item || [];
        const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];

        const offers = [];
        for (const item of items) {
            if (!item) continue;
            const offer = buildOfferFromRssItem(item, filterLanguage);
            if (!offer || !offer.id) continue;
            offers.push(offer);
        }

        return offers;
    }

    static _extractCategories(shop) {
        const categories = [];
        const rawCats = shop?.categories?.category || [];
        const catsArray = Array.isArray(rawCats) ? rawCats : [rawCats];

        for (const cat of catsArray) {
            if (!cat || typeof cat === 'string') continue;

            const id = cat.id || cat.$?.id || cat._attributes?.id;
            const name = cat._ || cat['#text'] || cat.name;
            const parentId = cat.parentId || cat.$?.parentId || cat._attributes?.parentId || null;

            if (id && name && typeof name === 'string') {
                categories.push({
                    id: String(id),
                    name: name.trim(),
                    parentId: parentId ? String(parentId) : null
                });
            }
        }

        return categories;
    }

    static _extractProducts(shop) {
        const offers = shop?.offers?.offer || [];
        return Array.isArray(offers) ? offers : [offers];
    }

    static async _importProducts(products, supplierPrefix) {
        const stats = { total: products.length, created: 0, updated: 0, skipped: 0, errors: [] };

        for (const offer of products) {
            try {
                const externalId = offer?.id || offer?.$?.id;
                const categoryId = offer?.categoryId || offer?.category_id;

                if (!externalId) { stats.skipped++; continue; }

                const hasName = offer?.name || offer?.model || offer?.title;
                if (!hasName) { stats.skipped++; continue; }

                let internalCategoryId = null;
                if (categoryId) {
                    internalCategoryId = await getInternalCategoryForProduct(supplierPrefix, String(categoryId));
                }

                if (!internalCategoryId) { stats.skipped++; continue; }

                const productData = this._parseProduct(offer, supplierPrefix, internalCategoryId);
                const productId = `${supplierPrefix}_${externalId}`;

                const [, created] = await Product.upsert({ product_id: productId, ...productData });

                if (created) stats.created++;
                else stats.updated++;

                await this._saveParameters(productId, offer);
                await this._savePictures(productId, offer);
            } catch (error) {
                stats.errors.push({
                    productId: offer?.id || 'unknown',
                    error: error?.message || 'unknown error'
                });
            }
        }

        return stats;
    }

    static _parseProduct(offer, supplierPrefix, internalCategoryId) {
        const xmlId = String(offer.id || offer.$?.id || '');
        const name = offer.name || offer.model || offer.title || `Product_${xmlId || 'unknown'}`;

        const currentPrice = extractNumberFromText(offer.price);
        const regularPrice = offer.oldprice ? extractNumberFromText(offer.oldprice) : null;

        let rawBrand = offer.vendor || offer.brand || '';
        const brand = normalizeBrand(rawBrand) || normalizeBrand(supplierPrefix) || supplierPrefix;

        let finalPrice, finalSalePrice, discount;

        if (regularPrice && regularPrice > currentPrice) {
            finalPrice = regularPrice;
            finalSalePrice = currentPrice;
            discount = Math.round((1 - currentPrice / regularPrice) * 100);
        } else {
            finalPrice = currentPrice;
            finalSalePrice = 0;
            discount = 0;
        }

        const availableRaw = String(offer.available ?? '').trim();
        const isAvailable = availableRaw !== '' && availableRaw !== 'false';

        return {
            xml_id: xmlId,
            supplier_prefix: supplierPrefix,
            product_name: name,
            slug: buildUniqueProductSlug(name, supplierPrefix, xmlId),
            product_description: offer.description || '',
            price: finalPrice,
            sale_price: finalSalePrice,
            discount: discount,
            brand: brand,
            available: isAvailable ? 'true' : 'false',
            sub_category_id: internalCategoryId,
            sale: discount > 0 ? 'true' : 'false',
            bestseller: 'false',
            custom_product: false
        };
    }

    static async _saveParameters(productId, offer) {
        try {
            await Parameter.destroy({ where: { product_id: productId } });

            const finalParamsByKey = new Map();

            const offerParams = toArray(offer.param);
            for (const param of offerParams) {
                if (!param) continue;

                const nameRaw = param.name || param.$?.name || '';
                const valueRaw = param._ || param.value || param['#text'] || '';
                const nameString = String(nameRaw ?? '').trim();
                if (!nameString) continue;

                const entries = buildParameterEntriesFromNameValue(nameString, valueRaw);
                for (const entry of entries) {
                    const key = `${entry.canonicalSlug}::${entry.param_value_slug}`;
                    finalParamsByKey.set(key, entry);
                }
            }

            if (offer._rawItem && finalParamsByKey.size === 0) {
                const customParams = extractCustomParamsFromRssItem(offer._rawItem);
                for (const param of customParams) {
                    const entries = buildParameterEntriesFromNameValue(param.name, param.value);
                    for (const entry of entries) {
                        const key = `${entry.canonicalSlug}::${entry.param_value_slug}`;
                        finalParamsByKey.set(key, entry);
                    }
                }
            }

            if (finalParamsByKey.size === 0) {
                const extracted = parseDescriptionSpecs(offer.description || '');
                for (const item of extracted) {
                    const entries = buildParameterEntriesFromNameValue(item.name, item.value);
                    for (const entry of entries) {
                        const key = `${entry.canonicalSlug}::${entry.param_value_slug}`;
                        finalParamsByKey.set(key, entry);
                    }
                }
            }

            for (const entry of finalParamsByKey.values()) {
                await Parameter.create({
                    product_id: productId,
                    parameter_name: entry.parameter_name,
                    parameter_value: entry.parameter_value,
                    slug: entry.slug,
                    param_value_slug: entry.param_value_slug
                });
            }
        } catch (e) {
            console.error('Error saving parameters:', e.message);
        }
    }

    static async _savePictures(productId, offer) {
        try {
            await Picture.destroy({ where: { product_id: productId } });

            const pictures = toArray(offer.picture);
            for (const pic of pictures) {
                if (!pic) continue;
                const url = typeof pic === 'string' ? pic : pic._ || pic.url || pic['#text'];
                if (url) {
                    await Picture.create({ product_id: productId, pictures_name: url });
                }
            }
        } catch (e) {
            console.error('Error saving pictures:', e.message);
        }
    }

    static async _getAffectedCategories(supplierPrefix) {
        const prefixes = await getSupplierPrefixes();
        const normalizedPrefixes = prefixes.map(p => String(p).toUpperCase().trim()).filter(Boolean);

        const supplierProducts = await Product.findAll({
            attributes: ['sub_category_id'],
            where: {
                supplier_prefix: supplierPrefix,
                sub_category_id: { [Op.ne]: null }
            },
            group: ['sub_category_id'],
            raw: true
        });

        const ids = supplierProducts.map(r => String(r.sub_category_id || '').trim()).filter(Boolean);
        if (ids.length === 0) return [];

        const internalIds = ids.filter(id => {
            const upper = id.toUpperCase();
            return !normalizedPrefixes.some(prefix => upper.startsWith(`${prefix}_`));
        });

        return Array.from(new Set(internalIds));
    }
}

module.exports = ImportService;
