const { Product, CategoryFilter } = require('../db');
const { generateFilterSlug } = require('../utils/slugify');

const KEY_MAP = {
    "Двигун": "Тип двигуна",
    "Ємність батареї": "Ємність акумулятора",
    "Номінальна напруга": "Напруга акумулятора",
    "Число оборотів холостого ходу": "Оберти"
};

const BLACKLIST = [
    "Інструкція", "Инструкция",
    "Рівень звукового", "Уровень звукового",
    "Рівень вібрації", "Уровень вибрации",
    "Клас безпеки", "Класс безопасности",
    "Клас захисту", "Класс защиты",
    "Рівень захисту", "Уровень защиты",
    "Вага", "Вес",
    "Біта", "Бита",
    "Додаткова рукоять", "Дополнительная рукоятка",
    "Зарядний пристрій", "Зарядное устройство",
    "Кейс",
    "Гарантія", "Гарантия", "Гарантия",
    "Діаметр свердління", "Диаметр сверления",
    "Розміри", "Размеры"
];

function normalizeParameterName(parameterName) {
    const trimmedName = String(parameterName || '').trim();
    if (!trimmedName) return '';
    return KEY_MAP[trimmedName] || trimmedName;
}

function isBlacklistedParameterName(parameterName) {
    const name = String(parameterName || '');
    return BLACKLIST.some(bad => name.includes(bad));
}

function normalizeParameterValue(parameterValue) {
    let value = String(parameterValue || '')
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

class FilterService {
    static async recalcForCategory(subCategoryId) {
        try {
            const [brands] = await Product.sequelize.query(
                `SELECT brand, COUNT(DISTINCT product_id) as c 
                 FROM products 
                 WHERE available='true' AND sub_category_id=:subCategoryId AND brand > '' 
                 GROUP BY brand ORDER BY brand`,
                { replacements: { subCategoryId } }
            );

            const [prices] = await Product.sequelize.query(
                `SELECT MIN(CAST(price AS DECIMAL)) as min, MAX(CAST(price AS DECIMAL)) as max 
                 FROM products 
                 WHERE available='true' AND sub_category_id=:subCategoryId`,
                { replacements: { subCategoryId } }
            );

            const [special] = await Product.sequelize.query(
                `SELECT 
                    COUNT(CASE WHEN sale='true' THEN 1 END) as sale, 
                    COUNT(CASE WHEN bestseller='true' THEN 1 END) as best, 
                    COUNT(CASE WHEN discount > 0 THEN 1 END) as disc 
                 FROM products 
                 WHERE available='true' AND sub_category_id=:subCategoryId`,
                { replacements: { subCategoryId } }
            );

            const [params] = await Product.sequelize.query(
                `SELECT p.parameter_name, p.slug, p.parameter_value, p.param_value_slug, COUNT(DISTINCT p.product_id) as count
                 FROM parameter p
                 INNER JOIN products prod ON prod.product_id = p.product_id
                 WHERE prod.available = 'true' AND prod.sub_category_id = :subCategoryId
                 GROUP BY p.parameter_name, p.slug, p.parameter_value, p.param_value_slug
                 ORDER BY count DESC`,
                { replacements: { subCategoryId } }
            );

            const groupedParams = this._groupParams(params);

            await CategoryFilter.upsert({
                sub_category_id: subCategoryId,
                filters_data: {
                    brands: brands.map(b => ({ name: b.brand, count: +b.c })),
                    price: { min: +prices[0]?.min || 0, max: +prices[0]?.max || 0 },
                    special: {
                        sale: +special[0]?.sale,
                        bestseller: +special[0]?.best,
                        with_discount: +special[0]?.disc
                    },
                    attributes: groupedParams
                }
            });

            console.log(`[FilterService] Saved for ${subCategoryId}`);
        } catch (error) {
            console.error(`[FilterService] Error:`, error.message);
            throw error;
        }
    }

    static _groupParams(params) {
        const groupedParams = {};

        for (const row of params) {
            const rawName = row.parameter_name;
            if (isBlacklistedParameterName(rawName)) continue;

            const name = normalizeParameterName(rawName);
            const slug = generateFilterSlug(name);
            if (!slug) continue;

            const value = normalizeParameterValue(row.parameter_value);
            if (!value) continue;

            const valueSlug = row.param_value_slug || generateFilterSlug(value);
            if (!valueSlug) continue;

            if (!groupedParams[slug]) {
                groupedParams[slug] = {
                    title: name,
                    slug: slug,
                    options: [],
                    _optionsBySlug: new Map()
                };
            }

            const group = groupedParams[slug];
            const existing = group._optionsBySlug.get(valueSlug);

            if (existing) {
                existing.count += parseInt(row.count, 10);
                existing.value = pickBetterDisplayValue(existing.value, value);
                continue;
            }

            if (group.options.length >= 15) continue;

            const option = {
                value: value,
                value_slug: valueSlug,
                count: parseInt(row.count, 10)
            };

            group.options.push(option);
            group._optionsBySlug.set(valueSlug, option);
        }

        for (const key of Object.keys(groupedParams)) {
            delete groupedParams[key]._optionsBySlug;
        }

        return groupedParams;
    }
}

module.exports = FilterService;