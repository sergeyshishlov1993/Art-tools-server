// const { Router } = require('express');
// const router = Router();
// const { Op } = require('sequelize');
// const { Product, Parameter } = require('../../db');
//
// const BLACKLIST_SLUGS = [
//     'riven-zvukovogo-tysku',
//     'riven-zvukovoyi-potuzhnosti',
//     'robocha-temperatura',
//     'klas-zakhystu',
//     'klas-izolyatsiyi',
//     'regulyuvannya-shvydkosti',
//     'chastota-strumu',
//     'syla-strumu',
//     'nominalnyy-strum',
//     'vaga',
//     'dovzhyna',
//     'dovzhyna-leza',
//     'dovzhyna-lez',
//     'vkhidna-napruga',
//     'vykhidna-napruga',
//     'napruga-zhyvlennya',
//     'zhyvlennya',
//     'dzherelo-zhyvlennya',
//     'maksymalna-syla-vsmoktuvannya',
//     'maksymalnyy-potik-povitrya',
//     'obyem-pylozbirnyka',
//     'potik-povitrya',
//     'svitlovyy-potik',
//     'kilkist-svitlodiodiv',
//     'robochyy-tysk',
//     'shvydkist',
//     'shvydkist-obertannya',
//     'shvydkist-obertiv',
//     'shvydkist-kholostogo-khodu',
//     'diametr-sverdlinnya',
//     'diametr-sverdlinnya-v-betoni',
//     'diametr-sverlinnya-v-betoni',
//     'maksymalnyy-diametr-sverdlinnya-derevo',
//     'maksymalnyy-diametr-sverdlinnya-metal',
//     'regulyuvannya-polozhennya-golovy',
//     'zakhyst-vid-zvorotnogo-udaru-kickback-control',
//     'funktsiyi',
//     'funktsiya-pulse',
//     'glybyna-obrobky',
//     'diametr-nozhiv',
//     'diametr-lopatey',
//     'diametr-shtangy',
//     'diametr-shlifuvalnoyi-platformy',
//     'kilkist-rezhymiv',
//     'kilkist-rezhymiv-zusyllya',
//     'patron',
//     'korpus',
//     'material',
//     'typ',
//     'obyem-baka',
//     'obyem-dvyguna'
// ];
//
// const SLUG_SYNONYMS = {
//     'napruga-akumulyatora': 'napruga',
//     'yemkist-akumulyatora': 'yemnist-akumulyatora',
//     'krutnyy-moment': 'maksymalnyy-krutnyy-moment',
//     'oberty': 'kilkist-obertiv',
//     'dvygun': 'typ-dvyguna',
//     'revers': 'nayavnist-reversu'
// };
//
// const CANONICAL_NAMES = {
//     'napruga': 'Напруга',
//     'yemnist-akumulyatora': 'Ємність акумулятора',
//     'maksymalnyy-krutnyy-moment': 'Максимальний крутний момент',
//     'kilkist-obertiv': 'Кількість обертів',
//     'typ-dvyguna': 'Тип двигуна',
//     'nayavnist-reversu': 'Наявність реверсу'
// };
//
// function decodeHtmlEntities(value) {
//     return String(value || '')
//         .replace(/&nbsp;/gi, ' ')
//         .replace(/&times;/gi, '×')
//         .replace(/&deg;/gi, '°')
//         .replace(/&rdquo;/gi, '"')
//         .replace(/&ldquo;/gi, '"')
//         .replace(/&quot;/gi, '"')
//         .replace(/&amp;/gi, '&');
// }
//
// function normalizeAttributeValueName(valueName) {
//     let value = decodeHtmlEntities(valueName)
//         .replace(/\u00A0/g, ' ')
//         .replace(/\s+/g, ' ')
//         .trim();
//
//     value = value.replace(/^(Вся комплектація|вся комплектація)\s*[-–—]\s*/i, '');
//     value = value.replace(/^нагрівача\s*[-–—]\s*/i, '');
//
//     if (value.includes(' - ') && value.length > 30) {
//         value = value.split(' - ')[0].trim();
//     }
//
//     const voltageMatch = value.match(/^(\d+(?:\.\d+)?)\s*В/i);
//     if (voltageMatch) {
//         return `${voltageMatch[1]}В`;
//     }
//
//     const capacityMatch = value.match(/^(\d+(?:\.\d+)?)\s*(А\/г|Аг|А\/ч|Ач)/i);
//     if (capacityMatch) {
//         const num = parseFloat(capacityMatch[1]);
//         return `${Number.isInteger(num) ? num : num}Аг`;
//     }
//
//     value = value
//         .replace(/(\d)\s+(Аг|В|Вт|Нм|мм)/gi, '$1$2')
//         .replace(/(\d),(\d)/g, '$1.$2')
//         .trim();
//
//     if (value.endsWith('.')) value = value.slice(0, -1).trim();
//
//     return value;
// }
//
// function normalizeSlug(slug) {
//     return SLUG_SYNONYMS[slug] || slug;
// }
//
// function normalizeValueSlug(valueSlug, attrSlug) {
//     if (attrSlug === 'napruga') {
//         const match = valueSlug.match(/^(\d+)/);
//         if (match) return `${match[1]}-v`;
//     }
//
//     if (attrSlug === 'yemnist-akumulyatora') {
//         const match = valueSlug.match(/^(\d+)/);
//         if (match) return `${match[1]}-ag`;
//     }
//
//     return valueSlug;
// }
//
// function pickBetterDisplayValue(currentValue, nextValue) {
//     const current = String(currentValue || '').trim();
//     const next = String(nextValue || '').trim();
//     if (!current) return next;
//     if (!next) return current;
//     if (next.length < current.length) return next;
//     return current;
// }
//
// function isBlacklistedSlug(slug) {
//     return BLACKLIST_SLUGS.includes(slug);
// }
//
// router.get('/', async (req, res) => {
//     try {
//         // Витягуємо sale та bestseller окремо!
//         const {
//             brand,
//             category,
//             sub_category,
//             price_min,
//             price_max,
//             sale,        // <-- ДОДАНО
//             bestseller,  // <-- ДОДАНО
//             ...attrFilters
//         } = req.query;
//
//         const attrKeys = Object.keys(attrFilters).filter(k => !['page', 'limit', 'sort'].includes(k));
//
//         let allowedProductIds = null;
//
//         if (attrKeys.length > 0) {
//             for (const attrSlug of attrKeys) {
//                 const attrValues = String(attrFilters[attrSlug] || '').split(',').filter(Boolean);
//
//                 const params = await Parameter.findAll({
//                     where: {
//                         slug: attrSlug,
//                         param_value_slug: { [Op.in]: attrValues }
//                     },
//                     attributes: ['product_id'],
//                     raw: true
//                 });
//
//                 const ids = params.map(p => p.product_id);
//
//                 if (allowedProductIds === null) {
//                     allowedProductIds = new Set(ids);
//                 } else {
//                     const idsSet = new Set(ids);
//                     allowedProductIds = new Set([...allowedProductIds].filter(id => idsSet.has(id)));
//                 }
//             }
//
//             if (allowedProductIds && allowedProductIds.size === 0) {
//                 return res.json(emptyResponse(req.query));
//             }
//         }
//
//         const commonParams = [];
//         const whereParts = ["pr.available = 'true'"];
//
//         if (allowedProductIds !== null) {
//             const idsArray = Array.from(allowedProductIds);
//             if (idsArray.length > 0) {
//                 whereParts.push(`AND pr.product_id IN (${idsArray.map(() => '?').join(',')})`);
//                 commonParams.push(...idsArray);
//             }
//         }
//
//         const subCategoryIds = String(sub_category || '').split(',').map(s => s.trim()).filter(Boolean);
//
//         if (subCategoryIds.length > 0) {
//             if (subCategoryIds.length === 1) {
//                 whereParts.push(`AND pr.sub_category_id = ?`);
//                 commonParams.push(subCategoryIds[0]);
//             } else {
//                 whereParts.push(`AND pr.sub_category_id IN (${subCategoryIds.map(() => '?').join(',')})`);
//                 commonParams.push(...subCategoryIds);
//             }
//         } else if (category) {
//             whereParts.push(`AND sc.parent_id = ?`);
//             commonParams.push(category);
//         }
//
//         // ========== СПЕЦІАЛЬНІ ФІЛЬТРИ (SALE, BESTSELLER) ==========
//         if (sale === 'true') {
//             whereParts.push(`AND pr.sale = 'true'`);
//         }
//
//         if (bestseller === 'true') {
//             whereParts.push(`AND pr.bestseller = 'true'`);
//         }
//
//         // Ціна - НЕ включаємо в базовий where для розрахунку діапазону
//         let priceWherePart = "";
//         const priceParams = [];
//
//         if (price_min) {
//             priceWherePart += ` AND CAST(pr.price AS DECIMAL) >= ?`;
//             priceParams.push(parseFloat(price_min));
//         }
//         if (price_max) {
//             priceWherePart += ` AND CAST(pr.price AS DECIMAL) <= ?`;
//             priceParams.push(parseFloat(price_max));
//         }
//
//         let brandWherePart = "";
//         const brandParams = [];
//
//         if (brand) {
//             const brands = String(brand).split(',').filter(Boolean);
//             brandWherePart = ` AND pr.brand IN (${brands.map(() => '?').join(',')})`;
//             brandParams.push(...brands);
//         }
//
//         const baseWhere = whereParts.join(' ');
//
//         // Для цін - без фільтра по ціні (щоб показати повний діапазон)
//         const whereForPrice = baseWhere + brandWherePart;
//         const paramsForPrice = [...commonParams, ...brandParams];
//
//         // Повний where з ціною - для всіх інших запитів
//         const fullWhere = baseWhere + brandWherePart + priceWherePart;
//         const fullParams = [...commonParams, ...brandParams, ...priceParams];
//
//         // ========== ПІДКАТЕГОРІЇ ==========
//         let subcategoriesData = [];
//
//         if (category) {
//             const [subcats] = await Product.sequelize.query(`
//                 SELECT
//                     sc.sub_category_id as slug,
//                     sc.sub_category_name as name,
//                     COUNT(DISTINCT pr.product_id) as count
//                 FROM products pr
//                 INNER JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//                 WHERE pr.available = 'true'
//                   AND sc.parent_id = ?
//                 GROUP BY sc.sub_category_id, sc.sub_category_name
//                 HAVING COUNT(DISTINCT pr.product_id) > 0
//                 ORDER BY count DESC, sc.sub_category_name ASC
//             `, { replacements: [category] });
//
//             subcategoriesData = subcats;
//         }
//
//         // ========== БРЕНДИ ==========
//         const [brandsData] = await Product.sequelize.query(`
//             SELECT
//                 pr.brand,
//                 COUNT(DISTINCT pr.product_id) as count,
//                 MIN(CAST(pr.price AS DECIMAL)) as min_price,
//                 MAX(CAST(pr.price AS DECIMAL)) as max_price
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             WHERE ${baseWhere} AND pr.brand IS NOT NULL AND pr.brand != ''
//             GROUP BY pr.brand
//             ORDER BY pr.brand
//         `, { replacements: commonParams });
//
//         // ========== ЦІНА (без фільтра по ціні!) ==========
//         const [priceRange] = await Product.sequelize.query(`
//             SELECT
//                 MIN(CAST(pr.price AS DECIMAL)) as min,
//                 MAX(CAST(pr.price AS DECIMAL)) as max
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             WHERE ${whereForPrice}
//         `, { replacements: paramsForPrice });
//
//         // ========== АТРИБУТИ ==========
//         const [attributesData] = await Product.sequelize.query(`
//             SELECT
//                 param.slug as attr_slug,
//                 param.parameter_name as attr_name,
//                 param.param_value_slug as value_slug,
//                 param.parameter_value as value_name,
//                 COUNT(DISTINCT pr.product_id) as count
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             INNER JOIN parameter param ON param.product_id = pr.product_id
//             WHERE ${fullWhere}
//               AND param.slug IS NOT NULL
//               AND param.slug != ''
//               AND param.param_value_slug IS NOT NULL
//             GROUP BY param.slug, param.parameter_name, param.param_value_slug, param.parameter_value
//             HAVING COUNT(DISTINCT pr.product_id) > 0
//             ORDER BY param.parameter_name, count DESC
//         `, { replacements: fullParams });
//
//         const attributesGrouped = {};
//         const valueMapsByAttrSlug = {};
//
//         for (const attr of attributesData) {
//             const rawSlug = attr.attr_slug;
//             const valueSlug = attr.value_slug;
//             if (!rawSlug || !valueSlug) continue;
//
//             if (isBlacklistedSlug(rawSlug)) continue;
//
//             const attrSlug = normalizeSlug(rawSlug);
//
//             if (isBlacklistedSlug(attrSlug)) continue;
//
//             const attrName = CANONICAL_NAMES[attrSlug] || attr.attr_name;
//
//             if (!attributesGrouped[attrSlug]) {
//                 attributesGrouped[attrSlug] = {
//                     slug: attrSlug,
//                     name: attrName,
//                     values: []
//                 };
//                 valueMapsByAttrSlug[attrSlug] = new Map();
//             }
//
//             const map = valueMapsByAttrSlug[attrSlug];
//
//             const normalizedValueSlug = normalizeValueSlug(valueSlug, attrSlug);
//             const existing = map.get(normalizedValueSlug);
//
//             const normalizedValueName = normalizeAttributeValueName(attr.value_name);
//
//             if (normalizedValueName.length > 50) continue;
//
//             if (existing) {
//                 existing.count += +attr.count;
//                 existing.name = pickBetterDisplayValue(existing.name, normalizedValueName);
//                 continue;
//             }
//
//             const valueItem = {
//                 slug: normalizedValueSlug,
//                 name: normalizedValueName,
//                 count: +attr.count
//             };
//
//             attributesGrouped[attrSlug].values.push(valueItem);
//             map.set(normalizedValueSlug, valueItem);
//         }
//
//         const filteredAttributes = Object.values(attributesGrouped)
//             .filter(attr => attr.values.length >= 2)
//             .map(attr => ({
//                 ...attr,
//                 values: attr.values
//                     .sort((a, b) => b.count - a.count)
//                     .slice(0, 15)
//             }));
//
//         // ========== СПЕЦІАЛЬНІ (рахуємо БЕЗ фільтра sale/bestseller) ==========
//         // Використовуємо базовий where без sale/bestseller для підрахунку
//         const whereForSpecial = whereParts
//             .filter(p => !p.includes("pr.sale") && !p.includes("pr.bestseller"))
//             .join(' ') + brandWherePart + priceWherePart;
//         const paramsForSpecial = [...commonParams, ...brandParams, ...priceParams];
//
//         const [specialData] = await Product.sequelize.query(`
//             SELECT
//                 COUNT(CASE WHEN pr.sale = 'true' THEN 1 END) as sale,
//                 COUNT(CASE WHEN pr.bestseller = 'true' THEN 1 END) as bestseller
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             WHERE ${whereForSpecial}
//         `, { replacements: paramsForSpecial });
//
//         // ========== ЗАГАЛЬНА КІЛЬКІСТЬ ==========
//         const [totalCount] = await Product.sequelize.query(`
//             SELECT COUNT(DISTINCT pr.product_id) as total
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             WHERE ${fullWhere}
//         `, { replacements: fullParams });
//
//         // ========== ВІДПОВІДЬ ==========
//         res.json({
//             success: true,
//             total_products: +totalCount[0]?.total || 0,
//             applied_filters: {
//                 brand: brand ? String(brand).split(',') : null,
//                 category: category || null,
//                 sub_category: subCategoryIds.length > 0 ? subCategoryIds : null,
//                 price_min: price_min ? +price_min : null,
//                 price_max: price_max ? +price_max : null,
//                 sale: sale === 'true' || null,
//                 bestseller: bestseller === 'true' || null,
//                 attributes: attrKeys.length > 0 ? attrFilters : null
//             },
//             filters: {
//                 subcategories: subcategoriesData.map(s => ({
//                     slug: s.slug,
//                     name: s.name,
//                     count: +s.count
//                 })),
//                 brands: brandsData.map(b => ({
//                     name: b.brand,
//                     count: +b.count,
//                     min_price: +b.min_price,
//                     max_price: +b.max_price
//                 })),
//                 price: {
//                     min: +priceRange[0]?.min || 0,
//                     max: +priceRange[0]?.max || 0
//                 },
//                 attributes: filteredAttributes,
//                 special: {
//                     sale: +specialData[0]?.sale || 0,
//                     bestseller: +specialData[0]?.bestseller || 0
//                 }
//             }
//         });
//     } catch (error) {
//         console.error('Filters error:', error);
//         res.status(500).json({ error: error.message });
//     }
// });
//
// function emptyResponse(query) {
//     return {
//         success: true,
//         total_products: 0,
//         applied_filters: query,
//         filters: {
//             subcategories: [],
//             brands: [],
//             price: { min: 0, max: 0 },
//             attributes: [],
//             special: { sale: 0, bestseller: 0 }
//         }
//     };
// }
//
// module.exports = router;


const { Router } = require('express');
const router = Router();
const { Op } = require('sequelize');
const { Product, Parameter } = require('../../db');

const BLACKLIST_SLUGS = [
    'riven-zvukovogo-tysku',
    'riven-zvukovoyi-potuzhnosti',
    'robocha-temperatura',
    'klas-zakhystu',
    'klas-izolyatsiyi',
    'regulyuvannya-shvydkosti',
    'chastota-strumu',
    'syla-strumu',
    'nominalnyy-strum',
    'vaga',
    'dovzhyna',
    'dovzhyna-leza',
    'dovzhyna-lez',
    'vkhidna-napruga',
    'vykhidna-napruga',
    'napruga-zhyvlennya',
    'zhyvlennya',
    'dzherelo-zhyvlennya',
    'maksymalna-syla-vsmoktuvannya',
    'maksymalnyy-potik-povitrya',
    'obyem-pylozbirnyka',
    'potik-povitrya',
    'svitlovyy-potik',
    'kilkist-svitlodiodiv',
    'robochyy-tysk',
    'shvydkist',
    'shvydkist-obertannya',
    'shvydkist-obertiv',
    'shvydkist-kholostogo-khodu',
    'diametr-sverdlinnya',
    'diametr-sverdlinnya-v-betoni',
    'diametr-sverlinnya-v-betoni',
    'maksymalnyy-diametr-sverdlinnya-derevo',
    'maksymalnyy-diametr-sverdlinnya-metal',
    'regulyuvannya-polozhennya-golovy',
    'zakhyst-vid-zvorotnogo-udaru-kickback-control',
    'funktsiyi',
    'funktsiya-pulse',
    'glybyna-obrobky',
    'diametr-nozhiv',
    'diametr-lopatey',
    'diametr-shtangy',
    'diametr-shlifuvalnoyi-platformy',
    'kilkist-rezhymiv',
    'kilkist-rezhymiv-zusyllya',
    'patron',
    'korpus',
    'material',
    'typ',
    'obyem-baka',
    'obyem-dvyguna'
];

const SLUG_SYNONYMS = {
    'napruga-akumulyatora': 'napruga',
    'yemkist-akumulyatora': 'yemnist-akumulyatora',
    'krutnyy-moment': 'maksymalnyy-krutnyy-moment',
    'oberty': 'kilkist-obertiv',
    'dvygun': 'typ-dvyguna',
    'revers': 'nayavnist-reversu'
};

const CANONICAL_NAMES = {
    'napruga': 'Напруга',
    'yemnist-akumulyatora': 'Ємність акумулятора',
    'maksymalnyy-krutnyy-moment': 'Максимальний крутний момент',
    'kilkist-obertiv': 'Кількість обертів',
    'typ-dvyguna': 'Тип двигуна',
    'nayavnist-reversu': 'Наявність реверсу'
};

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&times;/gi, '×')
        .replace(/&deg;/gi, '°')
        .replace(/&rdquo;/gi, '"')
        .replace(/&ldquo;/gi, '"')
        .replace(/&quot;/gi, '"')
        .replace(/&amp;/gi, '&');
}

function normalizeAttributeValueName(valueName) {
    let value = decodeHtmlEntities(valueName)
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    value = value.replace(/^(Вся комплектація|вся комплектація)\s*[-–—]\s*/i, '');
    value = value.replace(/^нагрівача\s*[-–—]\s*/i, '');

    if (value.includes(' - ') && value.length > 30) {
        value = value.split(' - ')[0].trim();
    }

    const voltageMatch = value.match(/^(\d+(?:\.\d+)?)\s*В/i);
    if (voltageMatch) {
        return `${voltageMatch[1]}В`;
    }

    const capacityMatch = value.match(/^(\d+(?:\.\d+)?)\s*(А\/г|Аг|А\/ч|Ач)/i);
    if (capacityMatch) {
        const num = parseFloat(capacityMatch[1]);
        return `${Number.isInteger(num) ? num : num}Аг`;
    }

    value = value
        .replace(/(\d)\s+(Аг|В|Вт|Нм|мм)/gi, '$1$2')
        .replace(/(\d),(\d)/g, '$1.$2')
        .trim();

    if (value.endsWith('.')) value = value.slice(0, -1).trim();

    return value;
}

function normalizeSlug(slug) {
    return SLUG_SYNONYMS[slug] || slug;
}

function normalizeValueSlug(valueSlug, attrSlug) {
    if (attrSlug === 'napruga') {
        const match = valueSlug.match(/^(\d+)/);
        if (match) return `${match[1]}-v`;
    }

    if (attrSlug === 'yemnist-akumulyatora') {
        const match = valueSlug.match(/^(\d+)/);
        if (match) return `${match[1]}-ag`;
    }

    return valueSlug;
}

function pickBetterDisplayValue(currentValue, nextValue) {
    const current = String(currentValue || '').trim();
    const next = String(nextValue || '').trim();
    if (!current) return next;
    if (!next) return current;
    if (next.length < current.length) return next;
    return current;
}

function isBlacklistedSlug(slug) {
    return BLACKLIST_SLUGS.includes(slug);
}

router.get('/', async (req, res) => {
    try {
        const {
            brand,
            category,
            sub_category,
            price_min,
            price_max,
            sale,
            bestseller,
            ...attrFilters
        } = req.query;

        const attrKeys = Object.keys(attrFilters).filter(k => !['page', 'limit', 'sort'].includes(k));

        let allowedProductIds = null;

        if (attrKeys.length > 0) {
            for (const attrSlug of attrKeys) {
                const attrValues = String(attrFilters[attrSlug] || '').split(',').filter(Boolean);

                const params = await Parameter.findAll({
                    where: {
                        slug: attrSlug,
                        param_value_slug: { [Op.in]: attrValues }
                    },
                    attributes: ['product_id'],
                    raw: true
                });

                const ids = params.map(p => p.product_id);

                if (allowedProductIds === null) {
                    allowedProductIds = new Set(ids);
                } else {
                    const idsSet = new Set(ids);
                    allowedProductIds = new Set([...allowedProductIds].filter(id => idsSet.has(id)));
                }
            }

            if (allowedProductIds && allowedProductIds.size === 0) {
                return res.json(emptyResponse(req.query));
            }
        }

        const commonParams = [];
        const whereParts = ["pr.available = 'true'"];

        if (allowedProductIds !== null) {
            const idsArray = Array.from(allowedProductIds);
            if (idsArray.length > 0) {
                whereParts.push(`AND pr.product_id IN (${idsArray.map(() => '?').join(',')})`);
                commonParams.push(...idsArray);
            }
        }

        const subCategoryIds = String(sub_category || '').split(',').map(s => s.trim()).filter(Boolean);

        if (subCategoryIds.length > 0) {
            if (subCategoryIds.length === 1) {
                whereParts.push(`AND pr.sub_category_id = ?`);
                commonParams.push(subCategoryIds[0]);
            } else {
                whereParts.push(`AND pr.sub_category_id IN (${subCategoryIds.map(() => '?').join(',')})`);
                commonParams.push(...subCategoryIds);
            }
        } else if (category) {
            whereParts.push(`AND sc.parent_id = ?`);
            commonParams.push(category);
        }

        // Спеціальні фільтри
        if (sale === 'true') {
            whereParts.push(`AND pr.sale = 'true'`);
        }

        if (bestseller === 'true') {
            whereParts.push(`AND pr.bestseller = 'true'`);
        }

        // Ціна - НЕ включаємо в базовий where для розрахунку діапазону
        let priceWherePart = "";
        const priceParams = [];

        if (price_min) {
            priceWherePart += ` AND CAST(pr.price AS DECIMAL) >= ?`;
            priceParams.push(parseFloat(price_min));
        }
        if (price_max) {
            priceWherePart += ` AND CAST(pr.price AS DECIMAL) <= ?`;
            priceParams.push(parseFloat(price_max));
        }

        let brandWherePart = "";
        const brandParams = [];

        if (brand) {
            const brands = String(brand).split(',').filter(Boolean);
            brandWherePart = ` AND pr.brand IN (${brands.map(() => '?').join(',')})`;
            brandParams.push(...brands);
        }

        const baseWhere = whereParts.join(' ');

        // Для цін - без фільтра по ціні
        const whereForPrice = baseWhere + brandWherePart;
        const paramsForPrice = [...commonParams, ...brandParams];

        // Повний where з ціною
        const fullWhere = baseWhere + brandWherePart + priceWherePart;
        const fullParams = [...commonParams, ...brandParams, ...priceParams];

        // ========== КАТЕГОРІЇ (НОВЕ!) ==========
        let categoriesData = [];

        // Якщо є sale або bestseller фільтр - показуємо категорії де є такі товари
        if (sale === 'true' || bestseller === 'true') {
            const categoryWhereParts = ["pr.available = 'true'"];
            const categoryParams = [];

            if (sale === 'true') {
                categoryWhereParts.push(`AND pr.sale = 'true'`);
            }
            if (bestseller === 'true') {
                categoryWhereParts.push(`AND pr.bestseller = 'true'`);
            }

            const [cats] = await Product.sequelize.query(`
                SELECT 
                    c.id as slug,
                    c.category_name as name,
                    COUNT(DISTINCT pr.product_id) as count
                FROM products pr
                INNER JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
                INNER JOIN category c ON c.id = sc.parent_id
                WHERE ${categoryWhereParts.join(' ')}
                GROUP BY c.id, c.category_name
                HAVING COUNT(DISTINCT pr.product_id) > 0
                ORDER BY count DESC, c.category_name ASC
            `, { replacements: categoryParams });

            categoriesData = cats;
        }

        // ========== ПІДКАТЕГОРІЇ ==========
        let subcategoriesData = [];

        if (category) {
            // Якщо вибрана категорія - показуємо її підкатегорії
            const subcatWhereParts = ["pr.available = 'true'", "AND sc.parent_id = ?"];
            const subcatParams = [category];

            if (sale === 'true') {
                subcatWhereParts.push(`AND pr.sale = 'true'`);
            }
            if (bestseller === 'true') {
                subcatWhereParts.push(`AND pr.bestseller = 'true'`);
            }

            const [subcats] = await Product.sequelize.query(`
                SELECT 
                    sc.sub_category_id as slug,
                    sc.sub_category_name as name,
                    COUNT(DISTINCT pr.product_id) as count
                FROM products pr
                INNER JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
                WHERE ${subcatWhereParts.join(' ')}
                GROUP BY sc.sub_category_id, sc.sub_category_name
                HAVING COUNT(DISTINCT pr.product_id) > 0
                ORDER BY count DESC, sc.sub_category_name ASC
            `, { replacements: subcatParams });

            subcategoriesData = subcats;
        } else if (sale === 'true' || bestseller === 'true') {
            const subcatWhereParts = ["pr.available = 'true'"];

            if (sale === 'true') {
                subcatWhereParts.push(`AND pr.sale = 'true'`);
            }
            if (bestseller === 'true') {
                subcatWhereParts.push(`AND pr.bestseller = 'true'`);
            }

            // ВИПРАВЛЕНО: замінено c.category_id на c.id у трьох місцях (SELECT, JOIN, GROUP BY)
            const [subcats] = await Product.sequelize.query(`
                SELECT 
                    sc.sub_category_id as slug,
                    sc.sub_category_name as name,
                    c.id as parent_slug,              -- БУЛО: c.category_id
                    c.category_name as parent_name,
                    COUNT(DISTINCT pr.product_id) as count
                FROM products pr
                INNER JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
                INNER JOIN category c ON c.id = sc.parent_id  -- БУЛО: c.category_id
                WHERE ${subcatWhereParts.join(' ')}
                GROUP BY sc.sub_category_id, sc.sub_category_name, c.id, c.category_name -- БУЛО: c.category_id
                HAVING COUNT(DISTINCT pr.product_id) > 0
                ORDER BY c.category_name ASC, count DESC, sc.sub_category_name ASC
            `, { replacements: [] });

            subcategoriesData = subcats;
        }

        // ========== БРЕНДИ ==========
        const [brandsData] = await Product.sequelize.query(`
            SELECT 
                pr.brand,
                COUNT(DISTINCT pr.product_id) as count,
                MIN(CAST(pr.price AS DECIMAL)) as min_price,
                MAX(CAST(pr.price AS DECIMAL)) as max_price
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            WHERE ${baseWhere} AND pr.brand IS NOT NULL AND pr.brand != ''
            GROUP BY pr.brand
            ORDER BY pr.brand
        `, { replacements: commonParams });

        // ========== ЦІНА ==========
        const [priceRange] = await Product.sequelize.query(`
            SELECT 
                MIN(CAST(pr.price AS DECIMAL)) as min,
                MAX(CAST(pr.price AS DECIMAL)) as max
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            WHERE ${whereForPrice}
        `, { replacements: paramsForPrice });

        // ========== АТРИБУТИ ==========
        const [attributesData] = await Product.sequelize.query(`
            SELECT 
                param.slug as attr_slug,
                param.parameter_name as attr_name,
                param.param_value_slug as value_slug,
                param.parameter_value as value_name,
                COUNT(DISTINCT pr.product_id) as count
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            INNER JOIN parameter param ON param.product_id = pr.product_id
            WHERE ${fullWhere}
              AND param.slug IS NOT NULL 
              AND param.slug != ''
              AND param.param_value_slug IS NOT NULL
            GROUP BY param.slug, param.parameter_name, param.param_value_slug, param.parameter_value
            HAVING COUNT(DISTINCT pr.product_id) > 0
            ORDER BY param.parameter_name, count DESC
        `, { replacements: fullParams });

        const attributesGrouped = {};
        const valueMapsByAttrSlug = {};

        for (const attr of attributesData) {
            const rawSlug = attr.attr_slug;
            const valueSlug = attr.value_slug;
            if (!rawSlug || !valueSlug) continue;

            if (isBlacklistedSlug(rawSlug)) continue;

            const attrSlug = normalizeSlug(rawSlug);

            if (isBlacklistedSlug(attrSlug)) continue;

            const attrName = CANONICAL_NAMES[attrSlug] || attr.attr_name;

            if (!attributesGrouped[attrSlug]) {
                attributesGrouped[attrSlug] = {
                    slug: attrSlug,
                    name: attrName,
                    values: []
                };
                valueMapsByAttrSlug[attrSlug] = new Map();
            }

            const map = valueMapsByAttrSlug[attrSlug];

            const normalizedValueSlug = normalizeValueSlug(valueSlug, attrSlug);
            const existing = map.get(normalizedValueSlug);

            const normalizedValueName = normalizeAttributeValueName(attr.value_name);

            if (normalizedValueName.length > 50) continue;

            if (existing) {
                existing.count += +attr.count;
                existing.name = pickBetterDisplayValue(existing.name, normalizedValueName);
                continue;
            }

            const valueItem = {
                slug: normalizedValueSlug,
                name: normalizedValueName,
                count: +attr.count
            };

            attributesGrouped[attrSlug].values.push(valueItem);
            map.set(normalizedValueSlug, valueItem);
        }

        const filteredAttributes = Object.values(attributesGrouped)
            .filter(attr => attr.values.length >= 2)
            .map(attr => ({
                ...attr,
                values: attr.values
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 15)
            }));

        // ========== СПЕЦІАЛЬНІ ==========
        const whereForSpecial = whereParts
            .filter(p => !p.includes("pr.sale") && !p.includes("pr.bestseller"))
            .join(' ') + brandWherePart + priceWherePart;
        const paramsForSpecial = [...commonParams, ...brandParams, ...priceParams];

        const [specialData] = await Product.sequelize.query(`
            SELECT 
                COUNT(CASE WHEN pr.sale = 'true' THEN 1 END) as sale,
                COUNT(CASE WHEN pr.bestseller = 'true' THEN 1 END) as bestseller
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            WHERE ${whereForSpecial}
        `, { replacements: paramsForSpecial });

        // ========== ЗАГАЛЬНА КІЛЬКІСТЬ ==========
        const [totalCount] = await Product.sequelize.query(`
            SELECT COUNT(DISTINCT pr.product_id) as total
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            WHERE ${fullWhere}
        `, { replacements: fullParams });

        // ========== ВІДПОВІДЬ ==========
        res.json({
            success: true,
            total_products: +totalCount[0]?.total || 0,
            applied_filters: {
                brand: brand ? String(brand).split(',') : null,
                category: category || null,
                sub_category: subCategoryIds.length > 0 ? subCategoryIds : null,
                price_min: price_min ? +price_min : null,
                price_max: price_max ? +price_max : null,
                sale: sale === 'true' || null,
                bestseller: bestseller === 'true' || null,
                attributes: attrKeys.length > 0 ? attrFilters : null
            },
            filters: {
                // НОВЕ: categories
                categories: categoriesData.map(c => ({
                    slug: c.slug,
                    name: c.name,
                    count: +c.count
                })),
                subcategories: subcategoriesData.map(s => ({
                    slug: s.slug,
                    name: s.name,
                    count: +s.count,
                    // Додаємо parent info якщо є
                    ...(s.parent_slug && {
                        parent_slug: s.parent_slug,
                        parent_name: s.parent_name
                    })
                })),
                brands: brandsData.map(b => ({
                    name: b.brand,
                    count: +b.count,
                    min_price: +b.min_price,
                    max_price: +b.max_price
                })),
                price: {
                    min: +priceRange[0]?.min || 0,
                    max: +priceRange[0]?.max || 0
                },
                attributes: filteredAttributes,
                special: {
                    sale: +specialData[0]?.sale || 0,
                    bestseller: +specialData[0]?.bestseller || 0
                }
            }
        });
    } catch (error) {
        console.error('Filters error:', error);
        res.status(500).json({ error: error.message });
    }
});

function emptyResponse(query) {
    return {
        success: true,
        total_products: 0,
        applied_filters: query,
        filters: {
            categories: [],
            subcategories: [],
            brands: [],
            price: { min: 0, max: 0 },
            attributes: [],
            special: { sale: 0, bestseller: 0 }
        }
    };
}

module.exports = router;
