const { Router } = require('express');
const router = Router();
const { Product, Parameter } = require('../../db');
const { Op } = require('sequelize');

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

function parseList(value) {
    return String(value || '')
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
}

router.get('/active', async (req, res) => {
    try {
        const [subcategories] = await Product.sequelize.query(`
            SELECT 
                sc.sub_category_id as id,
                sc.sub_category_name as name,
                sc.parent_id as category_id,
                COUNT(DISTINCT p.product_id) as products_count
            FROM sub_category sc
            INNER JOIN products p ON p.sub_category_id = sc.sub_category_id
            WHERE p.available = 'true'
              AND sc.parent_id IS NOT NULL
            GROUP BY sc.sub_category_id, sc.sub_category_name, sc.parent_id
            HAVING COUNT(DISTINCT p.product_id) > 0
            ORDER BY sc.sub_category_name
        `);

        const activeCategoryIds = [...new Set(subcategories.map(sc => sc.category_id).filter(Boolean))];

        const categories = activeCategoryIds.length === 0
            ? []
            : await Product.sequelize.query(`
                SELECT 
                    c.id as id,
                    c.category_name as name
                FROM category c
                WHERE c.id IN (${activeCategoryIds.map(() => '?').join(',')})
                ORDER BY c.category_name
            `, { replacements: activeCategoryIds }).then(r => r[0]);

        res.json({
            success: true,
            categories: categories.map(c => ({
                id: c.id,
                name: c.name
            })),
            subcategories: subcategories.map(sc => ({
                id: sc.id,
                name: sc.name,
                category_id: sc.category_id,
                products_count: +sc.products_count
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/sub-category/:id/filters', async (req, res) => {
    try {
        const subCategoryId = String(req.params.id || '').trim();
        if (!subCategoryId) {
            return res.status(400).json({ success: false, error: 'sub_category id required' });
        }

        const { brand, price_min, price_max, ...attrFilters } = req.query;

        const attrKeys = Object.keys(attrFilters).filter(k => !['page', 'limit', 'sort'].includes(k));

        let allowedProductIds = null;

        if (attrKeys.length > 0) {
            for (const attrSlug of attrKeys) {
                const attrValues = parseList(attrFilters[attrSlug]);

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
                return res.json(emptyFiltersResponse({ sub_category: subCategoryId, ...req.query }));
            }
        }

        const commonParams = [subCategoryId];
        const whereParts = ["pr.available = 'true'", "AND pr.sub_category_id = ?"];

        if (allowedProductIds !== null) {
            const idsArray = Array.from(allowedProductIds);
            if (idsArray.length > 0) {
                whereParts.push(`AND pr.product_id IN (${idsArray.join(',')})`);
            }
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
            const brands = parseList(brand);
            if (brands.length > 0) {
                brandWherePart = ` AND pr.brand IN (${brands.map(() => '?').join(',')})`;
                brandParams.push(...brands);
            }
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
            WHERE ${baseWhere} AND pr.brand IS NOT NULL AND pr.brand != ''
            GROUP BY pr.brand
            ORDER BY pr.brand
        `, { replacements: commonParams });

        const [priceRange] = await Product.sequelize.query(`
            SELECT 
                MIN(CAST(pr.price AS DECIMAL)) as min,
                MAX(CAST(pr.price AS DECIMAL)) as max
            FROM products pr
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
            WHERE ${fullWhere}
        `, { replacements: fullParams });

        const [totalCount] = await Product.sequelize.query(`
            SELECT COUNT(DISTINCT pr.product_id) as total
            FROM products pr
            WHERE ${fullWhere}
        `, { replacements: fullParams });

        res.json({
            success: true,
            total_products: +totalCount[0]?.total || 0,
            applied_filters: {
                sub_category: subCategoryId,
                brand: brand ? parseList(brand) : null,
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
        res.status(500).json({ success: false, error: error.message });
    }
});

function emptyFiltersResponse(query) {
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