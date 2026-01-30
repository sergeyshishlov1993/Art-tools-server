// const { Router } = require('express');
// const router = Router();
// const { Op } = require('sequelize');
// const { Product, Parameter } = require('../../db');
//
// function normalizeAttributeValueName(valueName) {
//     let value = String(valueName || '')
//         .replace(/\u00A0/g, ' ')
//         .replace(/\s+/g, ' ')
//         .replace(/(\d)[\s\u00A0](?=\d{3}(\D|$))/g, '$1')
//         .replace(/\s*[-–—]\s*/g, ' - ')
//         .replace(/(\d)\s+(Аг|В|Вт|Нм|мм)/gi, '$1$2')
//         .replace(/(\d),(\d)/g, '$1.$2')
//         .trim();
//
//     if (value.endsWith('.')) value = value.slice(0, -1).trim();
//     return value;
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
// router.get('/', async (req, res) => {
//     try {
//         const { brand, category, sub_category, price_min, price_max, ...attrFilters } = req.query;
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
//                 whereParts.push(`AND pr.product_id IN (${idsArray.join(',')})`);
//             }
//         }
//
//         if (sub_category) {
//             whereParts.push(`AND pr.sub_category_id = ?`);
//             commonParams.push(sub_category);
//         } else if (category) {
//             whereParts.push(`AND sc.parent_id = ?`);
//             commonParams.push(category);
//         }
//
//         if (price_min) {
//             whereParts.push(`AND CAST(pr.price AS DECIMAL) >= ?`);
//             commonParams.push(parseFloat(price_min));
//         }
//         if (price_max) {
//             whereParts.push(`AND CAST(pr.price AS DECIMAL) <= ?`);
//             commonParams.push(parseFloat(price_max));
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
//         const fullWhere = baseWhere + brandWherePart;
//         const fullParams = [...commonParams, ...brandParams];
//
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
//         const [categoriesData] = await Product.sequelize.query(`
//             SELECT
//                 c.id as category_id,
//                 c.category_name,
//                 COUNT(DISTINCT pr.product_id) as count
//             FROM products pr
//             INNER JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             INNER JOIN category c ON c.id = sc.parent_id
//             WHERE ${fullWhere}
//               AND c.id NOT LIKE 'DEFAULT%'
//               AND c.id NOT LIKE 'PROCRAFT%'
//             GROUP BY c.id, c.category_name
//             HAVING COUNT(DISTINCT pr.product_id) > 0
//             ORDER BY c.category_name
//         `, { replacements: fullParams });
//
//         let subcategoriesData = [];
//         if (category) {
//             const [subCats] = await Product.sequelize.query(`
//                 SELECT
//                     sc.sub_category_id,
//                     sc.sub_category_name,
//                     COUNT(DISTINCT pr.product_id) as count
//                 FROM products pr
//                 INNER JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//                 WHERE ${fullWhere}
//                 GROUP BY sc.sub_category_id, sc.sub_category_name
//                 HAVING COUNT(DISTINCT pr.product_id) > 0
//                 ORDER BY sc.sub_category_name
//             `, { replacements: fullParams });
//             subcategoriesData = subCats;
//         }
//
//         const [priceRange] = await Product.sequelize.query(`
//             SELECT
//                 MIN(CAST(pr.price AS DECIMAL)) as min,
//                 MAX(CAST(pr.price AS DECIMAL)) as max
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             WHERE ${fullWhere}
//         `, { replacements: fullParams });
//
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
//             const attrSlug = attr.attr_slug;
//             const valueSlug = attr.value_slug;
//             if (!attrSlug || !valueSlug) continue;
//
//             if (!attributesGrouped[attrSlug]) {
//                 attributesGrouped[attrSlug] = {
//                     slug: attrSlug,
//                     name: attr.attr_name,
//                     values: []
//                 };
//                 valueMapsByAttrSlug[attrSlug] = new Map();
//             }
//
//             const map = valueMapsByAttrSlug[attrSlug];
//             const existing = map.get(valueSlug);
//
//             const normalizedValueName = normalizeAttributeValueName(attr.value_name);
//
//             if (existing) {
//                 existing.count += +attr.count;
//                 existing.name = pickBetterDisplayValue(existing.name, normalizedValueName);
//                 continue;
//             }
//
//             const valueItem = {
//                 slug: valueSlug,
//                 name: normalizedValueName,
//                 count: +attr.count
//             };
//
//             attributesGrouped[attrSlug].values.push(valueItem);
//             map.set(valueSlug, valueItem);
//         }
//
//         const [specialData] = await Product.sequelize.query(`
//             SELECT
//                 COUNT(CASE WHEN pr.sale = 'true' THEN 1 END) as sale,
//                 COUNT(CASE WHEN pr.bestseller = 'true' THEN 1 END) as bestseller,
//                 COUNT(CASE WHEN pr.discount > 0 THEN 1 END) as with_discount
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             WHERE ${fullWhere}
//         `, { replacements: fullParams });
//
//         const [totalCount] = await Product.sequelize.query(`
//             SELECT COUNT(DISTINCT pr.product_id) as total
//             FROM products pr
//             LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
//             WHERE ${fullWhere}
//         `, { replacements: fullParams });
//
//         res.json({
//             success: true,
//             total_products: +totalCount[0]?.total || 0,
//             applied_filters: {
//                 brand: brand ? String(brand).split(',') : null,
//                 category: category || null,
//                 sub_category: sub_category || null,
//                 price_min: price_min ? +price_min : null,
//                 price_max: price_max ? +price_max : null,
//                 attributes: attrKeys.length > 0 ? attrFilters : null
//             },
//             filters: {
//                 brands: brandsData.map(b => ({
//                     name: b.brand,
//                     count: +b.count,
//                     min_price: +b.min_price,
//                     max_price: +b.max_price
//                 })),
//                 categories: categoriesData.map(c => ({
//                     id: c.category_id,
//                     name: c.category_name,
//                     count: +c.count
//                 })),
//                 subcategories: subcategoriesData.map(sc => ({
//                     id: sc.sub_category_id,
//                     name: sc.sub_category_name,
//                     count: +sc.count
//                 })),
//                 price: {
//                     min: +priceRange[0]?.min || 0,
//                     max: +priceRange[0]?.max || 0
//                 },
//                 attributes: Object.values(attributesGrouped),
//                 special: {
//                     sale: +specialData[0]?.sale || 0,
//                     bestseller: +specialData[0]?.bestseller || 0,
//                     with_discount: +specialData[0]?.with_discount || 0
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
//             brands: [],
//             categories: [],
//             subcategories: [],
//             price: { min: 0, max: 0 },
//             attributes: [],
//             special: { sale: 0, bestseller: 0, with_discount: 0 }
//         }
//     };
// }
//
// module.exports = router;

const { Router } = require('express');
const router = Router();
const { Op } = require('sequelize');
const { Product, Parameter } = require('../../db');

function normalizeAttributeValueName(valueName) {
    let value = String(valueName || '')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/(\d)[\s\u00A0](?=\d{3}(\D|$))/g, '$1')
        .replace(/\s*[-–—]\s*/g, ' - ')
        .replace(/(\d)\s+(Аг|В|Вт|Нм|мм)/gi, '$1$2')
        .replace(/(\d),(\d)/g, '$1.$2')
        .trim();

    if (value.endsWith('.')) value = value.slice(0, -1).trim();
    return value;
}

function pickBetterDisplayValue(currentValue, nextValue) {
    const current = String(currentValue || '').trim();
    const next = String(nextValue || '').trim();
    if (!current) return next;
    if (!next) return current;
    if (next.length < current.length) return next;
    return current;
}

router.get('/', async (req, res) => {
    try {
        const { brand, category, sub_category, price_min, price_max, ...attrFilters } = req.query;

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
                whereParts.push(`AND pr.product_id IN (${idsArray.join(',')})`);
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

        if (price_min) {
            whereParts.push(`AND CAST(pr.price AS DECIMAL) >= ?`);
            commonParams.push(parseFloat(price_min));
        }
        if (price_max) {
            whereParts.push(`AND CAST(pr.price AS DECIMAL) <= ?`);
            commonParams.push(parseFloat(price_max));
        }

        let brandWherePart = "";
        const brandParams = [];

        if (brand) {
            const brands = String(brand).split(',').filter(Boolean);
            brandWherePart = ` AND pr.brand IN (${brands.map(() => '?').join(',')})`;
            brandParams.push(...brands);
        }

        const baseWhere = whereParts.join(' ');
        const fullWhere = baseWhere + brandWherePart;
        const fullParams = [...commonParams, ...brandParams];

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

        const [priceRange] = await Product.sequelize.query(`
            SELECT 
                MIN(CAST(pr.price AS DECIMAL)) as min,
                MAX(CAST(pr.price AS DECIMAL)) as max
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            WHERE ${fullWhere}
        `, { replacements: fullParams });

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
            const attrSlug = attr.attr_slug;
            const valueSlug = attr.value_slug;
            if (!attrSlug || !valueSlug) continue;

            if (!attributesGrouped[attrSlug]) {
                attributesGrouped[attrSlug] = {
                    slug: attrSlug,
                    name: attr.attr_name,
                    values: []
                };
                valueMapsByAttrSlug[attrSlug] = new Map();
            }

            const map = valueMapsByAttrSlug[attrSlug];
            const existing = map.get(valueSlug);

            const normalizedValueName = normalizeAttributeValueName(attr.value_name);

            if (existing) {
                existing.count += +attr.count;
                existing.name = pickBetterDisplayValue(existing.name, normalizedValueName);
                continue;
            }

            const valueItem = {
                slug: valueSlug,
                name: normalizedValueName,
                count: +attr.count
            };

            attributesGrouped[attrSlug].values.push(valueItem);
            map.set(valueSlug, valueItem);
        }

        const [specialData] = await Product.sequelize.query(`
            SELECT 
                COUNT(CASE WHEN pr.sale = 'true' THEN 1 END) as sale,
                COUNT(CASE WHEN pr.bestseller = 'true' THEN 1 END) as bestseller,
                COUNT(CASE WHEN pr.discount > 0 THEN 1 END) as with_discount
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            WHERE ${fullWhere}
        `, { replacements: fullParams });

        const [totalCount] = await Product.sequelize.query(`
            SELECT COUNT(DISTINCT pr.product_id) as total
            FROM products pr
            LEFT JOIN sub_category sc ON sc.sub_category_id = pr.sub_category_id
            WHERE ${fullWhere}
        `, { replacements: fullParams });

        res.json({
            success: true,
            total_products: +totalCount[0]?.total || 0,
            applied_filters: {
                brand: brand ? String(brand).split(',') : null,
                category: category || null,
                sub_category: subCategoryIds.length > 0 ? subCategoryIds : null,
                price_min: price_min ? +price_min : null,
                price_max: price_max ? +price_max : null,
                attributes: attrKeys.length > 0 ? attrFilters : null
            },
            filters: {
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
                attributes: Object.values(attributesGrouped),
                special: {
                    sale: +specialData[0]?.sale || 0,
                    bestseller: +specialData[0]?.bestseller || 0,
                    with_discount: +specialData[0]?.with_discount || 0
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
            brands: [],
            price: { min: 0, max: 0 },
            attributes: [],
            special: { sale: 0, bestseller: 0, with_discount: 0 }
        }
    };
}

module.exports = router;