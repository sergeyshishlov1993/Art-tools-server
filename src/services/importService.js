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
    cleaner: 'Cleaner'
};

const normalizeBrand = (brand) => {
    if (!brand) return null;
    const key = String(brand).toLowerCase().trim();
    return BRAND_MAP[key] || String(brand).trim();
};

const ALLOWED_PARAMETER_BASES = new Map([
    ['potuzhnist', 'Потужність'],
    ['napruga', 'Напруга'],
    ['napruga-akumulyatora', 'Напруга акумулятора'],
    ['yemnist-akumulyatora', 'Ємність акумулятора'],
    ['yemkist-akumulyatora', 'Ємність акумулятора'],
    ['krutnyy-moment', 'Крутний момент'],
    ['kilkist-obertiv', 'Кількість обертів'],
    ['kilkist-obertiv-kholostogo-khodu', 'Кількість обертів холостого ходу'],
    ['chastota-udariv', 'Частота ударів'],
    ['shvydkist', 'Швидкість'],
    ['shvydkist-obertannya', 'Швидкість обертання'],
    ['shvydkist-obertiv', 'Швидкість обертів'],
    ['shvydkist-kholostogo-khodu', 'Швидкість холостого ходу'],
    ['vaga', 'Вага'],
    ['diametr-dyska', 'Діаметр диска'],
    ['diametr-patrona', 'Діаметр патрона'],
    ['typ-akumulyatora', 'Тип акумулятора'],
    ['typ-dvyguna', 'Тип двигуна'],
    ['dzherelo-zhyvlennya', 'Джерело живлення'],
    ['zhyvlennya', 'Живлення'],
    ['potik-povitrya', 'Потік повітря'],
    ['svitlovyy-potik', 'Світловий потік'],
    ['riven-zvukovogo-tysku', 'Рівень звукового тиску'],
    ['riven-zvukovoyi-potuzhnosti', 'Рівень звукової потужності'],
    ['syla-udaru', 'Сила удару'],
    ['syla-strumu', 'Сила струму'],
    ['chastota-strumu', 'Частота струму'],
    ['nominalnyy-strum', 'Номінальний струм'],
    ['vkhidna-napruga', 'Вхідна напруга'],
    ['vykhidna-napruga', 'Вихідна напруга'],
    ['napruga-zhyvlennya', 'Напруга живлення'],
    ['material', 'Матеріал'],
    ['korpus', 'Корпус'],
    ['klas-zakhystu', 'Клас захисту'],
    ['klas-izolyatsiyi', 'Клас ізоляції'],
    ['plavnyy-pusk', 'Плавний пуск'],
    ['revers', 'Реверс'],
    ['nayavnist-reversu', 'Наявність реверсу'],
    ['regulyuvannya-obertiv', 'Регулювання обертів'],
    ['regulyuvannya-shvydkosti', 'Регулювання швидкості'],
    ['regulyuvannya-polozhennya-golovy', 'Регулювання положення голови'],
    ['robocha-temperatura', 'Робоча температура'],
    ['robochyy-tysk', 'Робочий тиск'],
    ['obyem-baka', "Обʼєм бака"],
    ['obyem-dvyguna', "Об'єм двигуна"],
    ['obyem-pylozbirnyka', "Об'єм пилозбірника"],
    ['dovzhyna', 'Довжина'],
    ['dovzhyna-leza', 'Довжина леза'],
    ['dovzhyna-lez', 'Довжина лез'],
    ['dovzhyna-shyny', 'Довжина шини'],
    ['diametr-nozhiv', 'Діаметр ножів'],
    ['diametr-lopatey', 'Діаметр лопатей'],
    ['diametr-shtangy', 'Діаметр штанги'],
    ['diametr-shlifuvalnoyi-platformy', 'Діаметр шліфувальної платформи'],
    ['diametr-sverdlinnya', 'Діаметр свердління'],
    ['diametr-sverdlinnya-v-betoni', 'Діаметр свердління в бетоні'],
    ['diametr-sverlinnya-v-betoni', 'Діаметр сверління в бетоні'],
    ['glybyna-obrobky', 'Глибина обробки'],
    ['maksymalna-syla-vsmoktuvannya', 'Максимальна сила всмоктування'],
    ['maksymalnyy-potik-povitrya', 'Максимальний потік повітря'],
    ['maksymalnyy-diametr-gilok', 'Максимальний діаметр гілок'],
    ['maksymalnyy-diametr-rizannya', 'Максимальний діаметр різання'],
    ['maksymalnyy-diametr-sverdlinnya-derevo', 'Максимальний діаметр свердління (дерево)'],
    ['maksymalnyy-diametr-sverdlinnya-metal', 'Максимальний діаметр свердління (метал)'],
    ['maksymalnyy-krutnyy-moment', 'Максимальний крутний момент'],
    ['kilkist-rezhymiv', 'Кількість режимів'],
    ['kilkist-rezhymiv-zusyllya', 'Кількість режимів зусилля'],
    ['kilkist-shvydkostey', 'Кількість швидкостей'],
    ['kilkist-udariv', 'Кількість ударів'],
    ['kilkist-svitlodiodiv', 'Кількість світлодіодів'],
    ['dvygun', 'Двигун'],
    ['oberty', 'Оберти'],
    ['patron', 'Патрон'],
    ['typ', 'Тип'],
    ['funktsiyi', 'Функції'],
    ['funktsiya-udaru', 'Функція удару'],
    ['funktsiya-pulse', 'Функція Pulse'],
    ['zakhyst-vid-zvorotnogo-udaru-kickback-control', 'Захист від зворотного удару (Kickback Control)'],
    ['vantazhopidyomnist', 'Вантажопідйомність']
]);

const PARAMETER_SYNONYMS = new Map([
    ['dvygun', 'typ-dvyguna'],
    ['typ-dvyguna', 'typ-dvyguna'],
    ['typ-motoru', 'typ-dvyguna'],
    ['motor', 'typ-dvyguna'],

    ['napruga', 'napruga'],
    ['napruga-akumulyatora', 'napruga'],
    ['nominalna-napruga', 'napruga'],
    ['robocha-napruga', 'napruga'],

    ['yemnist-akumulyatora', 'yemnist-akumulyatora'],
    ['yemkist-akumulyatora', 'yemnist-akumulyatora'],
    ['emnist-akumulyatora', 'yemnist-akumulyatora'],
    ['battery-capacity', 'yemnist-akumulyatora'],

    ['krutnyy-moment', 'maksymalnyy-krutnyy-moment'],
    ['moment-krutinnya', 'maksymalnyy-krutnyy-moment'],
    ['maks-krutnyy-moment', 'maksymalnyy-krutnyy-moment'],
    ['maksymalnyy-krutnyy-moment', 'maksymalnyy-krutnyy-moment'],

    ['oberty', 'kilkist-obertiv'],
    ['kilkist-obertiv', 'kilkist-obertiv'],
    ['oberty-holostogo-hodu', 'kilkist-obertiv-kholostogo-khodu'],
    ['kilkist-obertiv-kholostogo-khodu', 'kilkist-obertiv-kholostogo-khodu'],

    ['vaga', 'vaga'],
    ['vaga-netto', 'vaga'],
    ['vaga-brutto', 'vaga'],
    ['weight', 'vaga'],

    ['diametr-dyska', 'diametr-dyska'],
    ['diametr-dysku', 'diametr-dyska'],
    ['diametr-patrona', 'diametr-patrona'],
    ['diametr-sverdlinnya', null],

    ['shvydkist', 'shvydkist-obertannya'],
    ['shvydkist-obertannya', 'shvydkist-obertannya'],
    ['regulyuvannya-shvydkosti', 'regulyuvannya-shvydkosti'],

    ['revers', 'nayavnist-reversu'],
    ['nayavnist-reversu', 'nayavnist-reversu'],
    ['funktsiya-udaru', 'funktsiya-udaru'],
    ['udar', 'funktsiya-udaru'],

    ['aksesuary', null],
    ['komplektatsiya', null],
    ['garantiya', null],
    ['instruktsiya', null]
]);

const normalizeTextValue = (value) => {
    const raw = String(value ?? '');
    const cleaned = raw
        .replace(/&nbsp;/g, ' ')
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

    const withoutTrailingComment = cleaned.replace(
        /\s*[–—-]\s*[^0-9a-zа-яіїєё%°"'\)\]]{0,3}.*$/iu,
        (match) => match
    );
    if (!withoutTrailingComment) return cleaned;
    return cleaned;
};

const isGarbageValue = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return true;
    if (text.length < 1) return true;
    if (text.length > 255) return true;
    if (/^\d{18,}$/.test(text)) return true;
    return false;
};

function extractParamsFromHtml(html) {
    const params = [];
    if (!html) return params;

    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let match = null;

    while ((match = liRegex.exec(html)) !== null) {
        let content = match[1].replace(/<[^>]+>/g, '').trim();
        content = content.replace(/&nbsp;/g, ' ').replace(/&middot;/g, '').replace(/\s+/g, ' ');

        const separatorIndex = content.indexOf(':');
        if (separatorIndex > 0) {
            const name = content.substring(0, separatorIndex).trim();
            const value = content.substring(separatorIndex + 1).trim();
            if (name && value) params.push({ name, value });
        }
    }

    return params;
}

function canonicalizeParameterNameToSlug(parameterName) {
    const rawSlug = generateFilterSlug(parameterName);
    const mapped = PARAMETER_SYNONYMS.has(rawSlug) ? PARAMETER_SYNONYMS.get(rawSlug) : rawSlug;
    if (!mapped) return null;
    if (!ALLOWED_PARAMETER_BASES.has(mapped)) return null;
    return mapped;
}

function splitMultiNumericWithUnit(value) {
    const text = String(value ?? '').trim();
    if (!text) return [];
    if (!/[\/;]/.test(text)) return [text];

    const unitMatch = text.match(/[^\d\s.,\/;]+$/u);
    const unit = unitMatch ? unitMatch[0] : '';
    const numbers = text.match(/\d+(?:[.,]\d+)?/g) || [];

    if (!unit) return [text];
    if (numbers.length < 2) return [text];
    if (!/^[\d\s.,\/;]+[^\d\s.,\/;]+$/u.test(text)) return [text];

    const unique = [];
    const seen = new Set();

    for (const rawNumber of numbers) {
        const normalizedNumber = String(rawNumber).replace(',', '.').trim();
        const item = `${normalizedNumber}${unit}`.replace(/\s+/g, ' ').trim();
        const key = item.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        unique.push(item);
    }

    return unique.length > 0 ? unique : [text];
}

function buildParameterEntriesFromNameValue(parameterName, parameterValue) {
    const canonicalSlug = canonicalizeParameterNameToSlug(parameterName);
    if (!canonicalSlug) return [];

    const canonicalName = ALLOWED_PARAMETER_BASES.get(canonicalSlug);
    if (!canonicalName) return [];

    const normalizedValue = normalizeTextValue(parameterValue);
    if (isGarbageValue(normalizedValue)) return [];

    const valueCandidates = splitMultiNumericWithUnit(normalizedValue);

    const result = [];
    for (const candidate of valueCandidates) {
        const valueText = normalizeTextValue(candidate);
        if (isGarbageValue(valueText)) continue;

        result.push({
            canonicalSlug,
            parameter_name: canonicalName,
            parameter_value: valueText.substring(0, 255),
            slug: generateFilterSlug(canonicalName),
            param_value_slug: generateFilterSlug(valueText)
        });
    }

    return result;
}

async function getSupplierPrefixes() {
    const sources = await ImportSource.findAll({
        attributes: ['supplier_prefix'],
        raw: true
    });

    const prefixes = sources
        .map(s => String(s.supplier_prefix || '').trim().toUpperCase())
        .filter(Boolean);

    if (prefixes.length > 0) return Array.from(new Set(prefixes));

    const products = await Product.findAll({
        attributes: ['supplier_prefix'],
        where: { supplier_prefix: { [Op.ne]: null } },
        group: ['supplier_prefix'],
        raw: true
    });

    return Array.from(
        new Set(
            products
                .map(p => String(p.supplier_prefix || '').trim().toUpperCase())
                .filter(Boolean)
        )
    );
}

class ImportService {
    static async importFromFeed(url, options) {
        const effectiveOptions = options || {};
        console.log(`📥 Завантаження XML з ${url}...`);

        const response = await axios.get(url, {
            timeout: 300000,
            maxContentLength: 100 * 1024 * 1024
        });

        return this.processXML(response.data, effectiveOptions);
    }

    static async importFromFile(filePath, options) {
        const effectiveOptions = options || {};
        const xmlData = fs.readFileSync(filePath, 'utf-8');
        return this.processXML(xmlData, effectiveOptions);
    }

    static async processXML(xmlData, options) {
        const effectiveOptions = options || {};
        const supplierPrefix = String(effectiveOptions.supplierPrefix || 'DEFAULT').toUpperCase().trim() || 'DEFAULT';

        const parser = new xml2js.Parser({
            explicitArray: false,
            mergeAttrs: true
        });

        const result = await parser.parseStringPromise(xmlData);
        const root = result.yml_catalog || result.price || result;
        const shop = root.shop || root;

        const rawCategories = this._extractCategories(shop);
        const mappingResult = await mapCategoriesFromXML(supplierPrefix, rawCategories);

        const rawProducts = this._extractProducts(shop);
        const importStats = await this._importProducts(rawProducts, supplierPrefix);

        const affectedCategories = await this._getAffectedCategories(supplierPrefix);
        for (const catId of affectedCategories) {
            await FilterService.recalcForCategory(catId);
        }

        return {
            supplier: supplierPrefix,
            categories: {
                total: rawCategories.length,
                mapped: mappingResult.mapped.length,
                existing: mappingResult.existing.length,
                unmapped: mappingResult.unmapped.length,
                unmappedList: mappingResult.unmapped
            },
            products: importStats,
            filtersUpdated: affectedCategories.length
        };
    }

    static _extractCategories(shop) {
        const categories = [];
        const rawCats = shop && shop.categories && shop.categories.category ? shop.categories.category : [];
        const catsArray = Array.isArray(rawCats) ? rawCats : [rawCats];

        catsArray.forEach((cat) => {
            if (!cat) return;
            if (typeof cat === 'string') return;

            const id = cat.id || (cat.$ && cat.$.id) || (cat._attributes && cat._attributes.id);
            const name = cat._ || cat['#text'] || cat.name;
            const parentId =
                cat.parentId || (cat.$ && cat.$.parentId) || (cat._attributes && cat._attributes.parentId) || null;

            if (id && name && typeof name === 'string') {
                categories.push({
                    id: String(id),
                    name: name.trim(),
                    parentId: parentId ? String(parentId) : null
                });
            }
        });

        return categories;
    }

    static _extractProducts(shop) {
        const offers = shop && shop.offers && shop.offers.offer ? shop.offers.offer : [];
        return Array.isArray(offers) ? offers : [offers];
    }

    static async _importProducts(products, supplierPrefix) {
        const stats = {
            total: products.length,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: []
        };

        for (const offer of products) {
            try {
                const externalId = offer && (offer.id || (offer.$ && offer.$.id));
                const categoryId = offer && (offer.categoryId || offer.category_id);

                if (!externalId) {
                    stats.skipped += 1;
                    continue;
                }

                const hasName = offer && (offer.name || offer.model || offer.title);
                if (!hasName) {
                    stats.skipped += 1;
                    continue;
                }

                let internalCategoryId = null;
                if (categoryId) {
                    internalCategoryId = await getInternalCategoryForProduct(supplierPrefix, String(categoryId));
                }

                if (!internalCategoryId) {
                    stats.skipped += 1;
                    continue;
                }

                const productData = this._parseProduct(offer, supplierPrefix, internalCategoryId);
                const productId = `${supplierPrefix}_${externalId}`;

                const upsertResult = await Product.upsert({
                    product_id: productId,
                    ...productData
                });

                const created = Array.isArray(upsertResult) ? Boolean(upsertResult[1]) : false;

                if (created) stats.created += 1;
                else stats.updated += 1;

                await this._saveParameters(productId, offer);
                await this._savePictures(productId, offer);
            } catch (error) {
                stats.errors.push({
                    productId: offer && offer.id ? String(offer.id) : 'unknown',
                    error: error && error.message ? String(error.message) : 'unknown error'
                });
            }
        }

        return stats;
    }

    static _parseProduct(offer, supplierPrefix, internalCategoryId) {
        const name =
            offer.name ||
            offer.model ||
            offer.title ||
            offer._ ||
            `${offer.typePrefix || ''} ${offer.vendor || ''} ${offer.model || ''}`.trim() ||
            `Product_${offer.id || (offer.$ && offer.$.id) || 'unknown'}`;

        const price = parseFloat(offer.price) || 0;
        const oldPrice = parseFloat(offer.oldprice || offer.price_old || offer.old_price) || null;

        let rawBrand = offer.vendor || offer.brand || '';

        if (!rawBrand && offer.param) {
            const params = Array.isArray(offer.param) ? offer.param : [offer.param];
            const brandParam = params.find((p) => {
                const paramName = String((p && (p.name || (p.$ && p.$.name))) || '').toLowerCase();
                return paramName.includes('бренд') || paramName.includes('виробник') || paramName.includes('производитель');
            });
            if (brandParam) {
                rawBrand = brandParam._ || brandParam.value || brandParam['#text'] || '';
            }
        }

        const brand = normalizeBrand(rawBrand) || normalizeBrand(supplierPrefix) || supplierPrefix;
        const discount = oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
        const finalName = name || `Product_${offer.id || 'unknown'}`;

        return {
            xml_id: String(offer.id || (offer.$ && offer.$.id) || ''),
            supplier_prefix: supplierPrefix,
            product_name: finalName,
            slug: generateSlug(finalName),
            product_description: offer.description || '',
            price: price,
            sale_price: oldPrice || 0,
            discount: discount,
            brand: brand,
            available: offer.available !== 'false' ? 'true' : 'false',
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

            const offerParams = offer.param || [];
            const offerParamsArray = Array.isArray(offerParams) ? offerParams : [offerParams];

            for (const param of offerParamsArray) {
                if (!param) continue;

                const nameRaw = param.name || (param.$ && param.$.name) || '';
                const valueRaw = param._ || param.value || param['#text'] || '';

                const nameString = String(nameRaw ?? '').trim();
                if (!nameString) continue;

                const entries = buildParameterEntriesFromNameValue(nameString, valueRaw);
                if (entries.length === 0) continue;

                for (const entry of entries) {
                    const key = `${entry.canonicalSlug}::${entry.param_value_slug}`;
                    finalParamsByKey.set(key, {
                        parameter_name: entry.parameter_name,
                        parameter_value: entry.parameter_value,
                        slug: entry.slug,
                        param_value_slug: entry.param_value_slug
                    });
                }
            }

            if (finalParamsByKey.size === 0) {
                const extracted = parseDescriptionSpecs(offer.description || '');

                for (const item of extracted) {
                    const nameString = String(item.name ?? '').trim();
                    if (!nameString) continue;

                    const entries = buildParameterEntriesFromNameValue(nameString, item.value);
                    if (entries.length === 0) continue;

                    for (const entry of entries) {
                        const key = `${entry.canonicalSlug}::${entry.param_value_slug}`;
                        finalParamsByKey.set(key, {
                            parameter_name: entry.parameter_name,
                            parameter_value: entry.parameter_value,
                            slug: entry.slug,
                            param_value_slug: entry.param_value_slug
                        });
                    }
                }

                if (finalParamsByKey.size === 0) {
                    const extractedLegacy = extractParamsFromHtml(offer.description || '');
                    for (const item of extractedLegacy) {
                        const nameString = String(item.name ?? '').trim();
                        if (!nameString) continue;

                        const entries = buildParameterEntriesFromNameValue(nameString, item.value);
                        if (entries.length === 0) continue;

                        for (const entry of entries) {
                            const key = `${entry.canonicalSlug}::${entry.param_value_slug}`;
                            finalParamsByKey.set(key, {
                                parameter_name: entry.parameter_name,
                                parameter_value: entry.parameter_value,
                                slug: entry.slug,
                                param_value_slug: entry.param_value_slug
                            });
                        }
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
        }
    }

    static async _savePictures(productId, offer) {
        try {
            await Picture.destroy({ where: { product_id: productId } });

            const pictures = offer.picture || [];
            const picsArray = Array.isArray(pictures) ? pictures : [pictures];

            for (const pic of picsArray) {
                if (!pic) continue;

                const url = typeof pic === 'string' ? pic : pic._ || pic.url || pic['#text'];

                if (url) {
                    await Picture.create({
                        product_id: productId,
                        pictures_name: url
                    });
                }
            }
        } catch (e) {
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

        const ids = supplierProducts
            .map(r => String(r.sub_category_id || '').trim())
            .filter(Boolean);

        if (ids.length === 0) return [];

        const internalIds = ids.filter(id => {
            const upper = id.toUpperCase();
            return !normalizedPrefixes.some(prefix => upper.startsWith(`${prefix}_`));
        });

        return Array.from(new Set(internalIds));
    }
}

module.exports = ImportService;